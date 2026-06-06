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
import { computeSettleQ, dieRestY, dieSize, wallHalfExtent } from './d12Normals'
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

// ---------------------------------------------------------------------------
// Play area — derived from the camera frustum, not a naive centered square
// ---------------------------------------------------------------------------

/**
 * Cuadro de juego sobre el suelo (y=0) en unidades de mundo. Es un CUADRADO
 * centrado en el origen, así que las cuatro paredes son simétricas.
 *   half  — medio-lado del cuadrado (paredes en ±half en X y en Z)
 * Se exponen halfX/nearZ/farZ para que createSimArea/buildSimParams sigan
 * tratándolo de forma genérica.
 */
export interface PlayArea {
  halfX: number
  nearZ: number
  farZ: number
}

/**
 * Rectángulo del suelo realmente visible por la cámara: proyecta las 4 esquinas
 * del frustum sobre el plano y=0. La cámara está inclinada y usa FOV vertical
 * fijo, así que lo visible es un trapecio que depende de altura, FOV y aspect.
 */
function visibleGroundRect(scene: Scene): { halfX: number; nearZ: number; farZ: number } | null {
  const cam = scene.activeCamera
  if (!cam) return null

  const eng = scene.getEngine()
  const aspect = eng.getRenderWidth() / Math.max(1, eng.getRenderHeight())

  // Base de cámara: forward hacia el objetivo (origen), más right y up de imagen.
  const P = cam.position
  const f = Vector3.Zero().subtract(P)
  if (f.lengthSquared() < 1e-6) return null
  f.normalize()
  let r = Vector3.Cross(new Vector3(0, 1, 0), f)
  if (r.lengthSquared() < 1e-6) r = new Vector3(1, 0, 0)
  r.normalize()
  const u = Vector3.Cross(f, r).normalize()

  // FOV vertical fijo (modo por defecto de ArcRotateCamera); el horizontal sale
  // del aspect ratio.
  const fov = (cam as { fov?: number }).fov ?? (DICE_CONFIG.CAMERA_FOV_DEG * Math.PI) / 180
  const tanV = Math.tan(fov / 2)
  const tanH = tanV * aspect

  let halfX = 0
  let nearZ = -Infinity
  let farZ = Infinity
  let hits = 0
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      // Dirección hacia la esquina del frustum e intersección con y=0.
      const d = f.add(r.scale(sx * tanH)).add(u.scale(sy * tanV))
      if (Math.abs(d.y) < 1e-6) continue
      const t = -P.y / d.y
      if (t <= 0) continue // esquina por encima del horizonte
      halfX = Math.max(halfX, Math.abs(P.x + t * d.x))
      const z = P.z + t * d.z
      nearZ = Math.max(nearZ, z)
      farZ = Math.min(farZ, z)
      hits++
    }
  }
  if (hits < 4 || !isFinite(nearZ) || !isFinite(farZ)) return null
  return { halfX, nearZ, farZ }
}

/**
 * Cuadro de juego: un CUADRADO centrado, fijo y acotado.
 *
 * - Se calcula el mayor cuadrado centrado que cabe dentro del área visible
 *   (con un pequeño margen, PLAY_AREA_FILL) → en móvil lo limita el ancho de la
 *   ventana, así que el cuadro llena la pantalla.
 * - Se limita a PLAY_AREA_MAX_PX píxeles (vía PIXEL_SCALE) → en widescreen el
 *   cuadro se fija a ese tamaño y queda centrado, sin crecer indefinidamente.
 *
 * Al ser centrado y caber dentro del trapecio visible, las cuatro paredes
 * quedan siempre dentro de cuadro (se acabó la pared cercana detrás de la cámara).
 */
export function computePlayArea(scene: Scene, sWorld: number): PlayArea {
  const rect = visibleGroundRect(scene)

  // Medio-lado centrado que cabe en el área visible, por eje (ancho = X,
  // alto = Z en pantalla). Sin cámara usable, caemos al cálculo simétrico previo.
  const fallbackHalf = wallHalfExtent(sWorld)
  let halfX = rect ? rect.halfX * DICE_CONFIG.PLAY_AREA_FILL : fallbackHalf
  let halfZ = rect ? Math.min(rect.nearZ, -rect.farZ) * DICE_CONFIG.PLAY_AREA_FILL : fallbackHalf

  // Topes independientes en píxeles (vía PIXEL_SCALE): ancho y alto.
  const maxHalfX = DICE_CONFIG.PLAY_AREA_MAX_W_PX / DICE_CONFIG.PIXEL_SCALE / 2
  const maxHalfZ = DICE_CONFIG.PLAY_AREA_MAX_H_PX / DICE_CONFIG.PIXEL_SCALE / 2
  halfX = Math.max(0, Math.min(halfX, maxHalfX))
  halfZ = Math.max(0, Math.min(halfZ, maxHalfZ))

  return { halfX, nearZ: halfZ, farZ: -halfZ }
}

/**
 * Escala característica del CUADRO de juego (su profundidad, eje Z = 2·halfZ),
 * NO el tamaño de pantalla. Todo lo de la física de los dados (tamaño del dado,
 * grosor de paredes, fuerza del tiro, altura de reposo) se escala con esto para
 * que sea proporcional a la caja: si la caja se acota (widescreen), los dados y
 * el tiro se acotan con ella → no la atraviesan. La cámara sí sigue con sWorld
 * (para que el cuadro se vea pequeño y centrado en pantallas grandes).
 */
export function playAreaScale(scene: Scene, sWorld: number): number {
  const { nearZ, farZ } = computePlayArea(scene, sWorld)
  return nearZ - farZ
}

/**
 * Construye los parámetros de lanzamiento de ambos dados a partir del resultado
 * pre-calculado. Todos los ajustes de "fuerza"/comportamiento viven en
 * THROW_CONFIG (ver diceConfig.ts), aquí solo se aplican.
 *
 * @param result  Resultado ya decidido (cara que debe quedar arriba en cada dado).
 * @param scene   Escena Babylon (para derivar el área de juego del frustum).
 * @param sWorld  Lado del área de juego en unidades de mundo (escala el tiro).
 */
export function buildSimParams(
  result: RollResult,
  scene: Scene,
  sWorld: number,
): [DieSimParams, DieSimParams] {
  // Área real visible: los dados aparecen dentro de estos bordes.
  const { halfX, nearZ, farZ } = computePlayArea(scene, sWorld)
  // Tiro/tamaño proporcionales a la CAJA (no a sWorld): así no la atraviesan
  // cuando la caja está acotada en pantallas grandes.
  const area = nearZ - farZ

  // Valores derivados de los factores (ver THROW_CONFIG para qué hace cada uno).
  const spawnY = area * THROW_CONFIG.SPAWN_HEIGHT_FACTOR   // altura de caída
  // Spawn con el radio completo del dado dentro del muro: si naciera pegado a la
  // pared, la física lo expulsaría hacia afuera. Lo metemos su tamaño + margen.
  const spawnInset = dieSize(area) + THROW_CONFIG.SPAWN_EDGE_MARGIN
  const spawnZNear = nearZ - spawnInset   // borde cercano (+Z)
  const spawnZFar = farZ + spawnInset     // borde lejano (-Z)
  // Dispersión lateral acotada para que el spawn no se salga por los lados X.
  const spread = Math.min(area * THROW_CONFIG.SPREAD_FACTOR, Math.max(0, halfX - spawnInset))
  const throwSpeed = area * THROW_CONFIG.THROW_SPEED_FACTOR // empuje hacia el centro
  const downSpeed = area * THROW_CONFIG.DOWN_SPEED_FACTOR   // empuje hacia el suelo
  const sideJitter = THROW_CONFIG.SIDE_SPEED_JITTER          // desvío lateral aleatorio
  const spin = THROW_CONFIG.SPIN_MAX                         // giro máx por eje

  // Orientación inicial totalmente aleatoria de cada dado.
  const makeRot = () => {
    const q = randomQuaternion()
    return { x: q.x, y: q.y, z: q.z, w: q.w }
  }

  // Giro aleatorio fuerte en los tres ejes (±spin rad/s).
  const makeSpin = () => ({ x: rnd(-spin, spin), y: rnd(-spin, spin), z: rnd(-spin, spin) })

  // Die 1: aparece en el borde cercano (+Z) y se lanza hacia -Z (hacia el centro).
  const die1: DieSimParams = {
    spawnPosition: { x: rnd(-spread, spread), y: spawnY, z: spawnZNear },
    linearVelocity: { x: rnd(-sideJitter, sideJitter), y: -downSpeed, z: -throwSpeed },
    angularVelocity: makeSpin(),
    initialRotation: makeRot(),
    targetFace: result.die1,
  }

  // Die 2: aparece en el borde lejano (-Z, opuesto) y se lanza hacia +Z (al centro).
  const die2: DieSimParams = {
    spawnPosition: { x: rnd(-spread, spread), y: spawnY, z: spawnZFar },
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
  // Muro alineado con el área realmente visible por la cámara (trapecio del
  // frustum proyectado al suelo), no un cuadrado fijo: así la pared cercana
  // queda dentro de cuadro y los lados llegan a los bordes de la ventana.
  const { halfX, nearZ, farZ } = computePlayArea(scene, sWorld)
  // Paredes proporcionales a la CAJA (no a sWorld), igual que los dados.
  const area = nearZ - farZ
  const wallH = area * 1.5
  // Paredes gruesas (≈2 dados): con paredes finas un dado rápido puede
  // atravesarlas en un solo paso de física (Havok no hace CCD por defecto).
  const wallT = dieSize(area) * 2
  const centerZ = (nearZ + farZ) / 2
  const spanX = halfX * 2 + wallT * 2  // largo de paredes N/S (cubren todo el ancho)
  const spanZ = (nearZ - farZ) + wallT * 2  // largo de paredes E/W (cubren todo el fondo)
  const meshes: Mesh[] = []
  const aggregates: PhysicsAggregate[] = []

  function addBox(name: string, w: number, h: number, d: number, x: number, y: number, z: number) {
    const m = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene)
    m.position.set(x, y, z)
    m.isVisible = false  // solo colisión; los muros no se dibujan
    aggregates.push(new PhysicsAggregate(m, PhysicsShapeType.BOX, opts, scene))
    meshes.push(m)
  }

  const floorT = 0.05
  addBox('simFloor', spanX, floorT, spanZ, 0, -floorT / 2, centerZ)
  // N: borde cercano (+Z, abajo en pantalla). S: borde lejano (-Z, arriba).
  addBox('wallN', spanX, wallH, wallT, 0, wallH / 2, nearZ + wallT / 2)
  addBox('wallS', spanX, wallH, wallT, 0, wallH / 2, farZ - wallT / 2)
  addBox('wallE', wallT, wallH, spanZ, halfX + wallT / 2, wallH / 2, centerZ)
  addBox('wallW', wallT, wallH, spanZ, -(halfX + wallT / 2), wallH / 2, centerZ)

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
  const restY = dieRestY(playAreaScale(scene, sWorld))   // reposo (inradius) según la caja

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
        meshes[i].position.y = s.correctionStartY + (restY - s.correctionStartY) * eased

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
            // Snap to whichever face already landed on top — la física ya no se
            // amaña hacia un número; el número se pinta luego en la cara visible.
            s.correctionTargetQ = computeSettleQ(meshes[i].rotationQuaternion!)
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
