import { useEffect, useRef } from 'react'
import { useDice } from '@/contexts/DiceContext'
import { useAuth } from '@/hooks/useAuth'
import { pushCurrentRoll, subscribeToCurrentRoll } from '@/lib/diceSync'
import type { DiceEngineContext } from '@/features/dice/DiceEngine'
import { createDiceEngine } from '@/features/dice/DiceEngine'
import { buildSimParams, runSimulation } from '@/features/dice/DiceSimulation'
import { startPlayback } from '@/features/dice/DicePlayback'
import type { DiceSceneHandle } from '@/features/dice/DiceHandle'
import type { RollEvent } from '@/features/dice/types'

export default function DiceScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineCtxRef = useRef<DiceEngineContext | null>(null)
  const handleRef = useRef<DiceSceneHandle | null>(null)
  const cancelSimRef = useRef<(() => void) | null>(null)
  const lastRollRef = useRef(useDice().lastRoll)

  const { lastRoll, setSettled, sessionId, settled } = useDice()
  const { user } = useAuth()

  // Keep lastRoll ref fresh to avoid stale closures in callbacks
  useEffect(() => { lastRollRef.current = lastRoll }, [lastRoll])

  // Init scene once
  useEffect(() => {
    if (!canvasRef.current) return
    let disposed = false

    createDiceEngine(canvasRef.current).then((ctx) => {
      if (disposed) { ctx.dispose(); return }
      engineCtxRef.current = ctx

      const handle: DiceSceneHandle = {
        simulate(result) {
          cancelSimRef.current?.()

          const sWorld = ctx.getSWorld()
          const params = buildSimParams({ die1: result[0], die2: result[1] }, sWorld)

          cancelSimRef.current = runSimulation(
            ctx.scene,
            [ctx.die1, ctx.die2],
            params,
            sWorld,
            (keyframes) => {
              handle.onSimulateComplete?.(keyframes)
              handle.onAnimationEnd?.()
            },
          )
        },

        replay(keyframes) {
          cancelSimRef.current?.()
          cancelSimRef.current = startPlayback(
            ctx.scene,
            [ctx.die1, ctx.die2],
            keyframes,
            () => handle.onAnimationEnd?.(),
          )
        },

        hideDice() {
          ctx.die1.isVisible = false
          ctx.die2.isVisible = false
        },

        onSimulateComplete: null,
        onAnimationEnd: null,

        dispose() {
          cancelSimRef.current?.()
          ctx.dispose()
        },
      }

      handle.onAnimationEnd = () => setSettled(true)

      handleRef.current = handle
    })

    return () => {
      disposed = true
      handleRef.current?.dispose()
      handleRef.current = null
      engineCtxRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Host: new roll from this user → run physics simulation
  useEffect(() => {
    if (!lastRoll || !user || !handleRef.current) return
    if (lastRoll.playerId !== user.uid) return

    const handle = handleRef.current
    const roll = lastRoll

    handle.onSimulateComplete = async (keyframes) => {
      if (!sessionId) return
      const event: RollEvent = {
        result: { die1: roll.values[0], die2: roll.values[1] },
        params: buildSimParams(
          { die1: roll.values[0], die2: roll.values[1] },
          engineCtxRef.current?.getSWorld() ?? 6,
        ),
        keyframes,
        timestamp: Date.now(),
        hostId: user.uid,
      }
      await pushCurrentRoll(sessionId, event).catch(console.error)
    }

    setSettled(false)
    handle.simulate([roll.values[0], roll.values[1]])
  }, [lastRoll]) // eslint-disable-line react-hooks/exhaustive-deps

  // Dismiss settled dice on a click/tap anywhere. The canvas has
  // pointer-events:none so clicks reach the web below; a window listener still
  // catches them. Only active once the animation has finished (settled becomes
  // true via onAnimationEnd), so a click never interrupts a running animation.
  useEffect(() => {
    if (!settled) return
    const dismiss = () => handleRef.current?.hideDice()
    window.addEventListener('pointerdown', dismiss)
    return () => window.removeEventListener('pointerdown', dismiss)
  }, [settled])

  // Clients: receive currentRoll from Firebase → replay keyframes
  useEffect(() => {
    if (!sessionId || !user) return

    return subscribeToCurrentRoll(sessionId, (event) => {
      if (event.hostId === user.uid) return  // host already animated via simulate()
      if (!handleRef.current) return

      setSettled(false)
      handleRef.current.replay(event.keyframes)
    })
  }, [sessionId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    />
  )
}
