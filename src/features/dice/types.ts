export interface RollResult {
  die1: number
  die2: number
}

export interface DieSimParams {
  spawnPosition: { x: number; y: number; z: number }
  linearVelocity: { x: number; y: number; z: number }
  angularVelocity: { x: number; y: number; z: number }
  initialRotation: { x: number; y: number; z: number; w: number }
  /**
   * Vestigial: la física ya no se amaña hacia un número. Al asentar, el dado se
   * alinea a la cara que quedó arriba y el número del resultado se pinta sobre
   * ella. Se conserva el campo para no romper el formato de RollEvent en Firebase.
   */
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
