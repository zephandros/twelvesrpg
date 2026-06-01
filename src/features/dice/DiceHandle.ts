import type { Keyframe } from './types'

export interface DiceSceneHandle {
  simulate: (result: [number, number]) => void
  replay: (keyframes: [Keyframe[], Keyframe[]]) => void
  onSimulateComplete: ((keyframes: [Keyframe[], Keyframe[]]) => void) | null
  onAnimationEnd: (() => void) | null
  dispose: () => void
}
