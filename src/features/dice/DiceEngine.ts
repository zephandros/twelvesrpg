import HavokPhysics from '@babylonjs/havok'
import {
  ArcRotateCamera,
  Color3,
  Color4,
  DynamicTexture,
  Engine,
  HavokPlugin,
  HemisphericLight,
  Mesh,
  PBRMaterial,
  Scene,
  Vector3,
  VertexData,
} from '@babylonjs/core'
import { DICE_CONFIG } from './diceConfig'
import { faceBasis, FACE_NUMBER } from './d12Normals'

export interface DiceEngineContext {
  engine: Engine
  scene: Scene
  dieMat: PBRMaterial
  die1: Mesh
  die2: Mesh
  getSWorld: () => number
  dispose: () => void
}

function getSWorld(): number {
  return Math.min(window.innerWidth, window.innerHeight) / DICE_CONFIG.PIXEL_SCALE
}

// ---------------------------------------------------------------------------
// Dodecahedron geometry — 12 pentagonal faces, UV-mapped to a 4×3 atlas
// ---------------------------------------------------------------------------

function buildDodecahedron(scale: number): VertexData {
  const FILL = 0.78
  const U_RAD = FILL * 0.5 / 4
  const V_RAD = FILL * 0.5 / 3

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const faces = faceBasis(scale)

  for (let fi = 0; fi < faces.length; fi++) {
    // Esta cara geométrica muestra el número FACE_NUMBER[fi]; su celda en el
    // atlas (numerado 1..12 por celda) es FACE_NUMBER[fi]-1.
    const cell = FACE_NUMBER[fi] - 1
    const col = cell % 4
    const row = Math.floor(cell / 4)
    const cu = (col + 0.5) / 4
    const cv = 1 - (row + 0.5) / 3

    const { center, normal, tangent, bitangent, points } = faces[fi]
    const fcx = center.x, fcy = center.y, fcz = center.z
    const nx = normal.x, ny = normal.y, nz = normal.z
    const tx = tangent.x, ty = tangent.y, tz = tangent.z
    const bx = bitangent.x, by = bitangent.y, bz = bitangent.z

    let maxR = 0
    for (const p of points) {
      const lx = (p[0]-fcx)*tx + (p[1]-fcy)*ty + (p[2]-fcz)*tz
      const ly = (p[0]-fcx)*bx + (p[1]-fcy)*by + (p[2]-fcz)*bz
      maxR = Math.max(maxR, Math.sqrt(lx*lx + ly*ly))
    }

    const base = positions.length / 3
    for (const p of points) {
      positions.push(p[0], p[1], p[2])
      normals.push(nx, ny, nz)
      const lx = ((p[0]-fcx)*tx + (p[1]-fcy)*ty + (p[2]-fcz)*tz) / maxR
      const ly = ((p[0]-fcx)*bx + (p[1]-fcy)*by + (p[2]-fcz)*bz) / maxR
      // Eje U invertido (cu - lx): la geometría es right-handed y Babylon es
      // left-handed, lo que reflejaba la textura. El espejo horizontal aquí deja
      // los números legibles; el eje V (vertical) ya queda correcto.
      uvs.push(cu - lx * U_RAD, cv + ly * V_RAD)
    }

    indices.push(base, base+1, base+2)
    indices.push(base, base+2, base+3)
    indices.push(base, base+3, base+4)
  }

  const vd = new VertexData()
  vd.positions = positions
  vd.normals = normals
  vd.uvs = uvs
  vd.indices = indices
  return vd
}

// ---------------------------------------------------------------------------
// Atlas texture — white background, black numbers (1–12), 4×3 grid
// ---------------------------------------------------------------------------

function buildAtlas(scene: Scene): DynamicTexture {
  const CW = 128, CH = 128
  const tex = new DynamicTexture('diceAtlas', { width: CW * 4, height: CH * 3 }, scene)
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, CW * 4, CH * 3)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = 0; i < 12; i++) {
    const cx = (i % 4) * CW + CW / 2
    const cy = Math.floor(i / 4) * CH + CH / 2

    ctx.beginPath()
    ctx.arc(cx, cy, 46, 0, Math.PI * 2)
    ctx.fillStyle = '#f0f0f0'
    ctx.fill()

    ctx.fillStyle = '#111111'
    ctx.font = 'bold 54px system-ui, sans-serif'
    ctx.fillText(String(i + 1), cx, cy)
  }

  tex.update()
  return tex
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export async function createDiceEngine(canvas: HTMLCanvasElement): Promise<DiceEngineContext> {
  const engine = new Engine(canvas, true, { alpha: true, preserveDrawingBuffer: true })
  const scene = new Scene(engine)
  scene.clearColor = new Color4(0, 0, 0, 0)

  // Physics
  const havokInstance = await HavokPhysics()
  const havokPlugin = new HavokPlugin(true, havokInstance)
  scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin)

  // Camera — near-top-down (Roll20 style): mostly above with a slight tilt
  const sW = getSWorld()
  const camera = new ArcRotateCamera('cam', 0, 0, 0, Vector3.Zero(), scene)
  camera.setPosition(new Vector3(0, sW * DICE_CONFIG.CAMERA_HEIGHT_FACTOR, sW * DICE_CONFIG.CAMERA_Z_FACTOR))
  camera.setTarget(Vector3.Zero())
  camera.fov = (DICE_CONFIG.CAMERA_FOV_DEG * Math.PI) / 180
  camera.inputs.clear()

  // Lights — iluminación uniforme sin sombras: el HemisphericLight ilumina por
  // igual desde arriba y desde abajo (groundColor blanco), así ninguna cara
  // queda oscura. Sin DirectionalLight para evitar el sombreado lateral.
  const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), scene)
  hemi.intensity = 1.0
  hemi.diffuse = new Color3(1, 1, 1)
  hemi.groundColor = new Color3(1, 1, 1)

  // PBR material
  const dieMat = new PBRMaterial('d12mat', scene)
  dieMat.roughness = 0.35
  dieMat.metallic = 0.0
  dieMat.albedoTexture = buildAtlas(scene)
  // La geometría se construye con winding right-handed; Babylon es left-handed
  // por defecto, así que sin esto el backface culling descartaría las caras
  // exteriores y se vería la cara OPUESTA (el resultado salía invertido).
  dieMat.backFaceCulling = false

  // Meshes — geometry applied once, reused across rolls
  const dodecVD = buildDodecahedron(DICE_CONFIG.D12_SIZE)

  function makeDie(name: string): Mesh {
    const mesh = new Mesh(name, scene)
    dodecVD.applyToMesh(mesh)
    mesh.material = dieMat
    mesh.isVisible = false
    return mesh
  }

  const die1 = makeDie('die1')
  const die2 = makeDie('die2')

  engine.runRenderLoop(() => scene.render())

  // Update camera on resize
  const onResize = () => {
    engine.resize()
    const s = getSWorld()
    camera.setPosition(new Vector3(0, s * DICE_CONFIG.CAMERA_HEIGHT_FACTOR, s * DICE_CONFIG.CAMERA_Z_FACTOR))
  }
  window.addEventListener('resize', onResize)

  return {
    engine,
    scene,
    dieMat,
    die1,
    die2,
    getSWorld,
    dispose: () => {
      window.removeEventListener('resize', onResize)
      engine.dispose()
    },
  }
}
