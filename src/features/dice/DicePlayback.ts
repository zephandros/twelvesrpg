import { Mesh, Quaternion, Scene } from '@babylonjs/core'
import type { Keyframe } from './types'

export function startPlayback(
  scene: Scene,
  meshes: [Mesh, Mesh],
  kfPairs: [Keyframe[], Keyframe[]],
  onComplete: () => void,
): () => void {
  let done = false
  const startTime = Date.now()

  // Place dice at first keyframe immediately
  for (let i = 0; i < 2; i++) {
    const kfs = kfPairs[i]
    if (!kfs.length) continue
    const kf = kfs[0]
    meshes[i].isVisible = true
    meshes[i].visibility = 1
    meshes[i].position.set(kf.px, kf.py, kf.pz)
    meshes[i].rotationQuaternion = new Quaternion(kf.qx, kf.qy, kf.qz, kf.qw)
  }

  const maxT = Math.max(
    kfPairs[0].at(-1)?.t ?? 0,
    kfPairs[1].at(-1)?.t ?? 0,
  )

  const observer = scene.onBeforeRenderObservable.add(() => {
    if (done) return

    const elapsed = Date.now() - startTime

    for (let i = 0; i < 2; i++) {
      const kfs = kfPairs[i]
      if (!kfs.length) continue
      const last = kfs[kfs.length - 1]

      if (elapsed >= last.t) {
        meshes[i].position.set(last.px, last.py, last.pz)
        meshes[i].rotationQuaternion = new Quaternion(last.qx, last.qy, last.qz, last.qw)
        continue
      }

      // Binary search for surrounding keyframes
      let lo = 0, hi = kfs.length - 1
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1
        if (kfs[mid].t <= elapsed) lo = mid; else hi = mid
      }
      const prev = kfs[lo], next = kfs[hi]
      const t = (elapsed - prev.t) / (next.t - prev.t)

      meshes[i].position.set(
        prev.px + (next.px - prev.px) * t,
        prev.py + (next.py - prev.py) * t,
        prev.pz + (next.pz - prev.pz) * t,
      )
      meshes[i].rotationQuaternion = Quaternion.Slerp(
        new Quaternion(prev.qx, prev.qy, prev.qz, prev.qw),
        new Quaternion(next.qx, next.qy, next.qz, next.qw),
        t,
      )
    }

    if (elapsed >= maxT) {
      done = true
      scene.onBeforeRenderObservable.remove(observer)
      onComplete()
    }
  })

  return () => {
    if (done) return
    done = true
    scene.onBeforeRenderObservable.remove(observer)
    meshes.forEach(m => { m.isVisible = false })
  }
}
