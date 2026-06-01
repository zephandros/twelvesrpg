export interface RollResult {
  die1: number
  die2: number
}

export interface DieSimParams {
  spawnPosition: { x: number; y: number; z: number }
  linearVelocity: { x: number; y: number; z: number }
  angularVelocity: { x: number; y: number; z: number }
  initialRotation: { x: number; y: number; z: number; w: number }
  targetFace: number
}

export interface Keyframe {
  t: number
  px: number; py: number; pz: number
  qx: number; qy: number; qz: number; qw: number
}

export interface RollEvent {
  result: RollResult
  params: [DieSimParams, DieSimParams]
  keyframes: [Keyframe[], Keyframe[]]
  timestamp: number
  hostId: string
}
