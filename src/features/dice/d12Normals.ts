import { Quaternion, Vector3 } from '@babylonjs/core'
import { DICE_CONFIG, SCREEN_UP_GROUND } from './diceConfig'

// ---------------------------------------------------------------------------
// Shared dodecahedron face basis — single source of truth for geometry,
// face normals and "digit-up" directions. buildDodecahedron consumes this so
// the orientation used for face correction matches the baked UV exactly.
// ---------------------------------------------------------------------------

export interface FaceBasis {
  center: Vector3
  normal: Vector3
  tangent: Vector3
  bitangent: Vector3
  points: [number, number, number][]  // possibly reversed for outward winding
}

const PHI = (1 + Math.sqrt(5)) / 2
const INV = 1 / PHI

const V: [number, number, number][] = [
  [-1,-1,-1], [-1,-1, 1], [-1, 1,-1], [-1, 1, 1],
  [ 1,-1,-1], [ 1,-1, 1], [ 1, 1,-1], [ 1, 1, 1],
  [ 0,-INV,-PHI], [ 0,-INV, PHI],
  [ 0, INV,-PHI], [ 0, INV, PHI],
  [-INV,-PHI, 0], [-INV, PHI, 0],
  [ INV,-PHI, 0], [ INV, PHI, 0],
  [-PHI, 0,-INV], [-PHI, 0, INV],
  [ PHI, 0,-INV], [ PHI, 0, INV],
]

const FACES = [
  [0,  8,  4, 14, 12],
  [0,  8, 10,  2, 16],
  [0, 12,  1, 17, 16],
  [1,  9, 11,  3, 17],
  [1,  9,  5, 14, 12],
  [2, 10,  6, 15, 13],
  [3, 11,  7, 15, 13],
  [7, 15,  6, 18, 19],
  [7, 11,  9,  5, 19],
  [4, 18,  6, 10,  8],
  [4, 14,  5, 19, 18],
  [2, 13,  3, 17, 16],
]

// Returns per-face basis for a dodecahedron whose raw vertices are normalised
// to the unit sphere then multiplied by `scale` (circumradius = scale).
export function faceBasis(scale: number): FaceBasis[] {
  const S = scale / Math.sqrt(3)

  return FACES.map((fi) => {
    const pts = fi.map(i => V[i].map(c => c * S) as [number, number, number])

    const fcx = pts.reduce((s, p) => s + p[0], 0) / 5
    const fcy = pts.reduce((s, p) => s + p[1], 0) / 5
    const fcz = pts.reduce((s, p) => s + p[2], 0) / 5

    const e1 = [pts[1][0]-pts[0][0], pts[1][1]-pts[0][1], pts[1][2]-pts[0][2]]
    const e2 = [pts[2][0]-pts[0][0], pts[2][1]-pts[0][1], pts[2][2]-pts[0][2]]
    let nx = e1[1]*e2[2] - e1[2]*e2[1]
    let ny = e1[2]*e2[0] - e1[0]*e2[2]
    let nz = e1[0]*e2[1] - e1[1]*e2[0]
    const nLen = Math.sqrt(nx*nx + ny*ny + nz*nz)
    nx /= nLen; ny /= nLen; nz /= nLen

    // Ensure outward-facing normal (same reverse rule as buildDodecahedron)
    if (nx*fcx + ny*fcy + nz*fcz < 0) {
      nx = -nx; ny = -ny; nz = -nz
      pts.reverse()
    }

    // Tangent toward (possibly reversed) first vertex; bitangent = n × t
    const dx0 = pts[0][0]-fcx, dy0 = pts[0][1]-fcy, dz0 = pts[0][2]-fcz
    const tLen = Math.sqrt(dx0*dx0 + dy0*dy0 + dz0*dz0)
    const tx = dx0/tLen, ty = dy0/tLen, tz = dz0/tLen
    const bx = ny*tz - nz*ty, by = nz*tx - nx*tz, bz = nx*ty - ny*tx

    return {
      center: new Vector3(fcx, fcy, fcz),
      normal: new Vector3(nx, ny, nz),
      tangent: new Vector3(tx, ty, tz),
      bitangent: new Vector3(bx, by, bz),
      points: pts,
    }
  })
}

// Unit-scale basis drives the normal/up tables (scale-independent directions).
const UNIT_BASIS = faceBasis(1)

// Face normals in local space — index i corresponds to face number i+1.
export const DODEC_FACE_NORMALS: Vector3[] = UNIT_BASIS.map(b => b.normal)

// "Digit-up" direction in local space — the on-face direction the printed
// number considers as up, matching the baked UV bitangent. Index i → face i+1.
export const DODEC_FACE_UP: Vector3[] = UNIT_BASIS.map(b => b.bitangent)

// Inradius (centro→cara) de un dado de tamaño 1. El inradius real escala lineal
// con el tamaño del dado.
export const D12_UNIT_INRADIUS = UNIT_BASIS[0].center.length()

// Tamaño del dado (circumradio en unidades de mundo) para un área dada.
export function dieSize(sWorld: number): number {
  return sWorld * DICE_CONFIG.D12_SIZE_FACTOR
}

// Altura de reposo del dado (su inradius) para un área dada, usada para asentarlo
// plano sobre el suelo.
export function dieRestY(sWorld: number): number {
  return D12_UNIT_INRADIUS * dieSize(sWorld)
}

// Medio-lado del muro de juego: un cuadrado centrado, separado del borde de la
// ventana (sWorld/2) por un margen proporcional al tamaño del dado. Los dados
// rebotan dentro de este cuadrado y se mantienen centrados en pantalla.
export function wallHalfExtent(sWorld: number): number {
  const margin = dieSize(sWorld) * DICE_CONFIG.WALL_MARGIN_DIE_FACTOR
  return Math.max(dieSize(sWorld), sWorld / 2 - margin)
}

// ---------------------------------------------------------------------------
// d12 face numbering (real-die layout)
// ---------------------------------------------------------------------------

// Número impreso en cada cara geométrica (índice = cara, valor = 1..12).
// Derivado de la geometría para que el dado se comporte como un d12 real:
//   - caras opuestas suman 13 (1-12, 2-11, 3-10, 4-9, 5-8, 6-7)
//   - los vecinos de la cara "1" en orden cíclico son 4, 6, 5, 10, 2
// Generado por scripts/d12-label.mjs. Si la disposición sale "espejada"
// respecto a un dado físico, invertir la secuencia [4,6,5,10,2] en ese script.
export const FACE_NUMBER = [1, 5, 6, 3, 4, 9, 12, 7, 8, 10, 2, 11] as const

// Inverso: NUMBER_FACE[n] = índice de la cara geométrica que muestra el número n.
export const NUMBER_FACE: number[] = (() => {
  const m = new Array(13).fill(-1)
  FACE_NUMBER.forEach((num, fi) => { m[num] = fi })
  return m
})()

// ---------------------------------------------------------------------------
// Face-up orientation
// ---------------------------------------------------------------------------

// Returns the quaternion that places geometric face `fi` pointing toward +Y,
// with that face's printed number upright toward the top of the screen.
export function computeTargetQForFace(fi: number): Quaternion {
  const localN = DODEC_FACE_NORMALS[fi]
  const up = Vector3.Up()
  const dot = Math.max(-1, Math.min(1, Vector3.Dot(localN, up)))
  const angle = Math.acos(dot)

  let align: Quaternion
  if (angle < 0.001) {
    align = Quaternion.Identity()
  } else if (angle > Math.PI - 0.001) {
    const perp = Math.abs(localN.x) < 0.9
      ? Vector3.Cross(localN, Vector3.Right()).normalize()
      : Vector3.Cross(localN, Vector3.Forward()).normalize()
    align = Quaternion.RotationAxis(perp, Math.PI)
  } else {
    align = Quaternion.RotationAxis(Vector3.Cross(localN, up).normalize(), angle)
  }

  // After align, the face normal is +Y, so the rotated digit-up vector lies in
  // the XZ plane. Yaw around +Y so it points toward the screen-up ground dir.
  const upWorld = DODEC_FACE_UP[fi].applyRotationQuaternion(align)
  const cur = Math.atan2(upWorld.x, upWorld.z)            // angle from +Z toward +X
  const target = Math.atan2(SCREEN_UP_GROUND.x, SCREEN_UP_GROUND.z)
  const yaw = Quaternion.RotationAxis(up, target - cur)

  return yaw.multiply(align)
}

// Given the die's current rotation, returns the geometric face index whose
// world normal points most upward (the face currently facing the camera).
export function topFaceIndex(q: Quaternion): number {
  const up = Vector3.Up()
  let best = 0
  let maxDot = -Infinity
  for (let fi = 0; fi < DODEC_FACE_NORMALS.length; fi++) {
    const wn = DODEC_FACE_NORMALS[fi].applyRotationQuaternion(q)
    const d = Vector3.Dot(wn, up)
    if (d > maxDot) { maxDot = d; best = fi }
  }
  return best
}

// Snap-to-nearest-face: aligns the die to whichever face is already on top,
// flattening it cleanly without forcing a specific number.
export function computeSettleQ(currentQ: Quaternion): Quaternion {
  return computeTargetQForFace(topFaceIndex(currentQ))
}
