import type { Keyframe } from './types'

export interface DiceSceneHandle {
  simulate: (result: [number, number]) => void
  replay: (keyframes: [Keyframe[], Keyframe[]]) => void
  /** Hide the currently shown dice (used to dismiss them after settling). */
  hideDice: () => void
  onSimulateComplete: ((keyframes: [Keyframe[], Keyframe[]]) => void) | null
  onAnimationEnd: (() => void) | null
  dispose: () => void
}
