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
  Quaternion,
  Scene,
  Vector3,
  VertexData,
} from '@babylonjs/core'
import { DICE_CONFIG } from './diceConfig'
import { dieSize, faceBasis, FACE_NUMBER, topFaceIndex } from './d12Normals'
import { playAreaScale } from './DiceSimulation'

// A single die's visual surface: its mesh, own material/textures, and helpers to
// blank it (while rolling), paint the result number on the settled face, and
// recolor it when the theme/ambiance changes.
export interface DieVisual {
  mesh: Mesh
  /** Solid colour, no numbers — used while the die is rolling. */
  blank: () => void
  /** Paint `value` on the face currently on top, with an accent glow. */
  showResult: (value: number) => void
  /** Re-read theme colours and repaint body (+ number if shown). */
  applyColors: () => void
  /** (Re)build the edge outline; call after the mesh geometry changes. */
  refreshEdges: () => void
  dispose: () => void
}

export interface DiceEngineContext {
  engine: Engine
  scene: Scene
  dice: [DieVisual, DieVisual]
  getSWorld: () => number
  /** Recolor both dice from the current theme/ambiance CSS variables. */
  applyTheme: () => void
  dispose: () => void
}

function getSWorld(): number {
  return Math.min(window.innerWidth, window.innerHeight) / DICE_CONFIG.PIXEL_SCALE
}

// ---------------------------------------------------------------------------
// Theme colours — read live from the app's CSS custom properties so the dice
// match the current light/dark mode and ambiance.
// ---------------------------------------------------------------------------

interface ThemeColors {
  body: Color3    // die body (= --color-ink: contrasts the page background)
  letter: Color3  // number colour (= --color-surface: contrasts the die body)
  accent: Color3  // glow flash (= --color-accent)
}

function readCssColor(name: string, fallback: string): Color3 {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  try {
    return Color3.FromHexString(raw || fallback)
  } catch {
    return Color3.FromHexString(fallback)
  }
}

function readThemeColors(): ThemeColors {
  return {
    body: readCssColor('--color-ink', '#ffffff'),
    letter: readCssColor('--color-surface', '#111111'),
    accent: readCssColor('--color-accent', '#888888'),
  }
}

function hex(c: Color3): string {
  return c.toHexString()
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
// Atlas painting — 4×3 grid of 128px cells. The number for geometric face `fi`
// lives in cell (FACE_NUMBER[fi]-1). Textures start solid (no numbers) and a
// single cell is painted when the die settles.
// ---------------------------------------------------------------------------

const CELL = 128
const ATLAS_W = CELL * 4
const ATLAS_H = CELL * 3

function newAtlas(scene: Scene, name: string): DynamicTexture {
  return new DynamicTexture(name, { width: ATLAS_W, height: ATLAS_H }, scene)
}

// Fill the whole texture with one colour (or transparent black for emissive).
function fillSolid(tex: DynamicTexture, style: string): void {
  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D
  ctx.clearRect(0, 0, ATLAS_W, ATLAS_H)
  ctx.fillStyle = style
  ctx.fillRect(0, 0, ATLAS_W, ATLAS_H)
  tex.update()
}

// Paint `value` in the cell of geometric face `faceIndex`, over a background
// `bg` (pass null to keep transparent — used for the emissive glow layer).
function paintNumberCell(
  tex: DynamicTexture,
  faceIndex: number,
  value: number,
  textStyle: string,
  bg: string | null,
): void {
  const cell = FACE_NUMBER[faceIndex] - 1
  const col = cell % 4
  const row = Math.floor(cell / 4)
  const cx = col * CELL + CELL / 2
  const cy = row * CELL + CELL / 2

  const ctx = tex.getContext() as unknown as CanvasRenderingContext2D
  if (bg !== null) {
    ctx.fillStyle = bg
    ctx.fillRect(col * CELL, row * CELL, CELL, CELL)
  }
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = textStyle
  ctx.font = 'bold 54px system-ui, sans-serif'
  ctx.fillText(String(value), cx, cy)
  tex.update()
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

  // Each die owns its own material + textures so numbers/glow are independent.
  function makeDie(name: string): DieVisual {
    const mesh = new Mesh(name, scene)
    mesh.isVisible = false

    const albedo = newAtlas(scene, `${name}-albedo`)
    const emissive = newAtlas(scene, `${name}-emissive`)

    const mat = new PBRMaterial(`${name}-mat`, scene)
    mat.roughness = 0.35
    mat.metallic = 0.0
    mat.albedoTexture = albedo
    mat.emissiveTexture = emissive
    mat.emissiveColor = Color3.Black()
    // La geometría se construye con winding right-handed; Babylon es left-handed
    // por defecto, así que sin esto el backface culling descartaría las caras
    // exteriores y se vería la cara OPUESTA (el resultado salía invertido).
    mat.backFaceCulling = false
    mesh.material = mat

    let colors = readThemeColors()
    let currentValue: number | null = null  // number painted on the settled face
    let currentFace: number | null = null   // geometric face index it's painted on
    let glowObs: ReturnType<typeof scene.onBeforeRenderObservable.add> | null = null

    function stopGlow(): void {
      if (glowObs) { scene.onBeforeRenderObservable.remove(glowObs); glowObs = null }
    }

    // Outline edges between faces, coloured with the contrast (letter) colour so
    // they stand out against the die body. Babylon draws only "border" edges:
    // our per-face duplicated vertices make the pentagon outlines borders while
    // the internal fan diagonals (same normal) are skipped.
    function applyEdgeColor(): void {
      mesh.edgesColor = new Color4(colors.letter.r, colors.letter.g, colors.letter.b, 1)
    }
    function refreshEdges(): void {
      mesh.disableEdgesRendering()
      mesh.enableEdgesRendering()
      mesh.edgesWidth = DICE_CONFIG.EDGE_WIDTH
      applyEdgeColor()
    }

    function paintNumber(): void {
      if (currentValue === null || currentFace === null) return
      // Albedo: number in the contrast (letter) colour over the body colour.
      paintNumberCell(albedo, currentFace, currentValue, hex(colors.letter), hex(colors.body))
      // Emissive: number in accent for the glow flash.
      fillSolid(emissive, '#000000')
      paintNumberCell(emissive, currentFace, currentValue, hex(colors.accent), null)
    }

    const die: DieVisual = {
      mesh,

      blank() {
        stopGlow()
        // Re-read theme colours live so each roll matches the current ambiance,
        // even if the React theme effect hasn't fired (e.g. ambiance set
        // outside the normal flow).
        colors = readThemeColors()
        currentValue = null
        currentFace = null
        fillSolid(albedo, hex(colors.body))
        fillSolid(emissive, '#000000')
        mat.emissiveColor = Color3.Black()
        applyEdgeColor()
      },

      showResult(value) {
        stopGlow()
        colors = readThemeColors()  // live colours for the painted number
        currentValue = value
        currentFace = topFaceIndex(mesh.rotationQuaternion ?? Quaternion.Identity())
        paintNumber()

        // Flash: emissive intensity goes from full → 0 over GLOW_DURATION_MS,
        // leaving just the contrast-coloured number on the albedo.
        const start = Date.now()
        glowObs = scene.onBeforeRenderObservable.add(() => {
          const t = Math.min(1, (Date.now() - start) / DICE_CONFIG.GLOW_DURATION_MS)
          const k = 1 - t
          mat.emissiveColor = new Color3(k, k, k)
          if (t >= 1) stopGlow()
        })
      },

      applyColors() {
        colors = readThemeColors()
        if (currentValue !== null) {
          paintNumber()
        } else {
          fillSolid(albedo, hex(colors.body))
        }
        applyEdgeColor()
      },

      refreshEdges,

      dispose() {
        stopGlow()
        mesh.disableEdgesRendering()
        albedo.dispose()
        emissive.dispose()
        mat.dispose()
        mesh.dispose()
      },
    }

    return die
  }

  const dice: [DieVisual, DieVisual] = [makeDie('die1'), makeDie('die2')]

  // (Re)bakes the dodecahedron geometry at size = sWorld * D12_SIZE_FACTOR onto
  // both dice. Baking real vertex positions (instead of mesh.scaling) keeps the
  // Havok convex hull exact.
  function rebuildDice(): void {
    // El tamaño del dado escala con la CAJA (no con la pantalla): así en
    // widescreen el dado queda proporcional al cuadro acotado y no lo atraviesa.
    const vd = buildDodecahedron(dieSize(playAreaScale(scene, getSWorld())))
    vd.applyToMesh(dice[0].mesh)
    vd.applyToMesh(dice[1].mesh)
    // Edges are tied to the geometry; rebuild them after re-baking vertices.
    dice.forEach(d => d.refreshEdges())
  }
  rebuildDice()
  dice.forEach(d => d.blank())

  engine.runRenderLoop(() => scene.render())

  // Update camera + die size on resize
  const onResize = () => {
    engine.resize()
    const s = getSWorld()
    camera.setPosition(new Vector3(0, s * DICE_CONFIG.CAMERA_HEIGHT_FACTOR, s * DICE_CONFIG.CAMERA_Z_FACTOR))
    rebuildDice()
  }
  window.addEventListener('resize', onResize)

  return {
    engine,
    scene,
    dice,
    getSWorld,
    applyTheme: () => dice.forEach(d => d.applyColors()),
    dispose: () => {
      window.removeEventListener('resize', onResize)
      dice.forEach(d => d.dispose())
      engine.dispose()
    },
  }
}
