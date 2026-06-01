import {
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Quaternion,
  Scene,
  Vector3,
} from '@babylonjs/core'
import { DICE_CONFIG, THROW_CONFIG } from './diceConfig'
import { computeTargetQ, D12_INRADIUS } from './d12Normals'
import type { DieSimParams, Keyframe, RollResult } from './types'

// ---------------------------------------------------------------------------
// Sim params builder
// ---------------------------------------------------------------------------

function rnd(a: number, b: number): number {
  return a + Math.random() * (b - a)
}

function randomQuaternion(): Quaternion {
  const u1 = Math.random(), u2 = Math.random(), u3 = Math.random()
  const sq1 = Math.sqrt(1 - u1), sq2 = Math.sqrt(u1)
  return new Quaternion(
    sq1 * Math.sin(2 * Math.PI * u2),
    sq1 * Math.cos(2 * Math.PI * u2),
    sq2 * Math.sin(2 * Math.PI * u3),
    sq2 * Math.cos(2 * Math.PI * u3),
  )
}

/**
 * Construye los parámetros de lanzamiento de ambos dados a partir del resultado
 * pre-calculado. Todos los ajustes de "fuerza"/comportamiento viven en
 * THROW_CONFIG (ver diceConfig.ts), aquí solo se aplican.
 *
 * @param result  Resultado ya decidido (cara que debe quedar arriba en cada dado).
 * @param sWorld  Lado del área de juego en unidades de mundo (escala el tiro).
 */
export function buildSimParams(result: RollResult, sWorld: number): [DieSimParams, DieSimParams] {
  // Borde del cuadrado de juego y dispersión lateral del punto de aparición.
  const half = sWorld / 2
  const spread = sWorld * THROW_CONFIG.SPREAD_FACTOR

  // Valores derivados de los factores (ver THROW_CONFIG para qué hace cada uno).
  const spawnY = sWorld * THROW_CONFIG.SPAWN_HEIGHT_FACTOR   // altura de caída
  const spawnZ = half + THROW_CONFIG.SPAWN_EDGE_MARGIN       // justo fuera de la pared
  const throwSpeed = sWorld * THROW_CONFIG.THROW_SPEED_FACTOR // empuje hacia el centro
  const downSpeed = sWorld * THROW_CONFIG.DOWN_SPEED_FACTOR   // empuje hacia el suelo
  const sideJitter = THROW_CONFIG.SIDE_SPEED_JITTER          // desvío lateral aleatorio
  const spin = THROW_CONFIG.SPIN_MAX                         // giro máx por eje

  // Orientación inicial totalmente aleatoria de cada dado.
  const makeRot = () => {
    const q = randomQuaternion()
    return { x: q.x, y: q.y, z: q.z, w: q.w }
  }

  // Giro aleatorio fuerte en los tres ejes (±spin rad/s).
  const makeSpin = () => ({ x: rnd(-spin, spin), y: rnd(-spin, spin), z: rnd(-spin, spin) })

  // Die 1: aparece en el lado +Z y se lanza hacia -Z (hacia el centro).
  const die1: DieSimParams = {
    spawnPosition: { x: rnd(-spread, spread), y: spawnY, z: spawnZ },
    linearVelocity: { x: rnd(-sideJitter, sideJitter), y: -downSpeed, z: -throwSpeed },
    angularVelocity: makeSpin(),
    initialRotation: makeRot(),
    targetFace: result.die1,
  }

  // Die 2: aparece en el lado -Z (opuesto) y se lanza hacia +Z (hacia el centro).
  const die2: DieSimParams = {
    spawnPosition: { x: rnd(-spread, spread), y: spawnY, z: -spawnZ },
    linearVelocity: { x: rnd(-sideJitter, sideJitter), y: -downSpeed, z: throwSpeed },
    angularVelocity: makeSpin(),
    initialRotation: makeRot(),
    targetFace: result.die2,
  }

  return [die1, die2]
}

// ---------------------------------------------------------------------------
// Simulation area — floor + 4 walls, disposed after each run
// ---------------------------------------------------------------------------

interface SimArea {
  meshes: Mesh[]
  aggregates: PhysicsAggregate[]
}

function createSimArea(scene: Scene, sWorld: number): SimArea {
  const opts = { mass: 0, restitution: 0.35, friction: 0.55 }
  const half = sWorld / 2
  const wallH = sWorld * 1.5
  const wallT = 0.1
  const meshes: Mesh[] = []
  const aggregates: PhysicsAggregate[] = []

  function addBox(name: string, w: number, h: number, d: number, x: number, y: number, z: number) {
    const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene)
    m.position.set(x, y, z)
    m.isVisible = false
    aggregates.push(new PhysicsAggregate(m, PhysicsShapeType.BOX, opts, scene))
    meshes.push(m)
  }

  const floorT = 0.05
  addBox('simFloor', sWorld * 4, floorT, sWorld * 4, 0, -floorT / 2, 0)
  addBox('wallN', sWorld * 4, wallH, wallT, 0, wallH / 2, half + wallT / 2)
  addBox('wallS', sWorld * 4, wallH, wallT, 0, wallH / 2, -(half + wallT / 2))
  addBox('wallE', wallT, wallH, sWorld * 4, half + wallT / 2, wallH / 2, 0)
  addBox('wallW', wallT, wallH, sWorld * 4, -(half + wallT / 2), wallH / 2, 0)

  return { meshes, aggregates }
}

function disposeSimArea(area: SimArea) {
  area.aggregates.forEach(a => a.dispose())
  area.meshes.forEach(m => m.dispose())
}

// ---------------------------------------------------------------------------
// Per-die state during simulation
// ---------------------------------------------------------------------------

interface DieState {
  keyframes: Keyframe[]
  settleCount: number
  settled: boolean
  correcting: boolean
  correctionDone: boolean
  correctionStart: number
  correctionStartQ: Quaternion | null
  correctionStartY: number
  correctionTargetQ: Quaternion | null
  agg: PhysicsAggregate | null
}

// ---------------------------------------------------------------------------
// Main simulation runner
// ---------------------------------------------------------------------------

export function runSimulation(
  scene: Scene,
  meshes: [Mesh, Mesh],
  params: [DieSimParams, DieSimParams],
  sWorld: number,
  onComplete: (keyframes: [Keyframe[], Keyframe[]]) => void,
): () => void {
  let cancelled = false
  let completed = false
  const simStart = Date.now()
  let lastKfTime = simStart - DICE_CONFIG.KEYFRAME_INTERVAL_MS

  const area = createSimArea(scene, sWorld)

  const state: [DieState, DieState] = [0, 1].map(() => ({
    keyframes: [] as Keyframe[],
    settleCount: 0,
    settled: false,
    correcting: false,
    correctionDone: false,
    correctionStart: 0,
    correctionStartQ: null,
    correctionStartY: 0,
    correctionTargetQ: null,
    agg: null as PhysicsAggregate | null,
  })) as [DieState, DieState]

  // Position meshes and attach physics
  for (let i = 0; i < 2; i++) {
    const mesh = meshes[i]
    const p = params[i]
    mesh.isVisible = true
    mesh.visibility = 1
    mesh.position.set(p.spawnPosition.x, p.spawnPosition.y, p.spawnPosition.z)
    mesh.rotationQuaternion = new Quaternion(
      p.initialRotation.x, p.initialRotation.y,
      p.initialRotation.z, p.initialRotation.w,
    )

    const agg = new PhysicsAggregate(mesh, PhysicsShapeType.CONVEX_HULL, {
      mass: 1, restitution: 0.4, friction: 0.3,
    }, scene)
    agg.body.setLinearVelocity(
      new Vector3(p.linearVelocity.x, p.linearVelocity.y, p.linearVelocity.z)
    )
    agg.body.setAngularVelocity(
      new Vector3(p.angularVelocity.x, p.angularVelocity.y, p.angularVelocity.z)
    )
    state[i].agg = agg
  }

  const linVel = new Vector3()
  const angVel = new Vector3()

  const observer = scene.onBeforeRenderObservable.add(() => {
    if (cancelled || completed) return

    const now = Date.now()
    const elapsed = now - simStart
    const forceComplete = elapsed >= DICE_CONFIG.MAX_SIM_DURATION_MS

    // Record keyframe at ~30fps
    if (now - lastKfTime >= DICE_CONFIG.KEYFRAME_INTERVAL_MS) {
      lastKfTime = now
      for (let i = 0; i < 2; i++) {
        const mesh = meshes[i]
        const q = mesh.rotationQuaternion!
        state[i].keyframes.push({
          t: elapsed,
          px: mesh.position.x, py: mesh.position.y, pz: mesh.position.z,
          qx: q.x, qy: q.y, qz: q.z, qw: q.w,
        })
      }
    }

    for (let i = 0; i < 2; i++) {
      const s = state[i]
      if (s.correctionDone) continue

      if (s.correcting) {
        const corrT = Math.min(1, (now - s.correctionStart) / DICE_CONFIG.CORRECTION_DURATION_MS)
        const eased = 1 - Math.pow(1 - corrT, 2)
        meshes[i].rotationQuaternion = Quaternion.Slerp(s.correctionStartQ!, s.correctionTargetQ!, eased)
        meshes[i].position.y = s.correctionStartY + (D12_INRADIUS - s.correctionStartY) * eased

        if (corrT >= 1) {
          meshes[i].rotationQuaternion = s.correctionTargetQ!.clone()
          const q = meshes[i].rotationQuaternion
          state[i].keyframes.push({
            t: now - simStart,
            px: meshes[i].position.x, py: meshes[i].position.y, pz: meshes[i].position.z,
            qx: q.x, qy: q.y, qz: q.z, qw: q.w,
          })
          s.correctionDone = true
        }
        continue
      }

      // Velocity-based settle detection
      if (!s.settled) {
        s.agg!.body.getLinearVelocityToRef(linVel)
        s.agg!.body.getAngularVelocityToRef(angVel)
        const moving = linVel.length() >= DICE_CONFIG.SETTLE_THRESHOLD
          || angVel.length() >= DICE_CONFIG.SETTLE_THRESHOLD

        if (!moving || forceComplete) {
          s.settleCount++
          if (s.settleCount >= DICE_CONFIG.SETTLE_FRAMES || forceComplete) {
            s.settled = true
            // Dispose physics so correction slerp isn't overridden
            s.agg!.dispose()
            s.agg = null
            s.correcting = true
            s.correctionStart = now
            s.correctionStartQ = meshes[i].rotationQuaternion!.clone()
            s.correctionStartY = meshes[i].position.y
            s.correctionTargetQ = computeTargetQ(params[i].targetFace)
          }
        } else {
          s.settleCount = 0
        }
      }
    }

    if (state[0].correctionDone && state[1].correctionDone) {
      completed = true
      cleanup()
      onComplete([state[0].keyframes, state[1].keyframes])
    }
  })

  function cleanup() {
    scene.onBeforeRenderObservable.remove(observer)
    state.forEach(s => { if (s.agg) { s.agg.dispose(); s.agg = null } })
    disposeSimArea(area)
  }

  return () => {
    if (completed) return
    cancelled = true
    cleanup()
    meshes.forEach(m => { m.isVisible = false })
  }
}
