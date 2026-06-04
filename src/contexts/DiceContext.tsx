import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { pushRoll, subscribeToRolls, type DiceRoll } from '@/lib/diceSync'

interface DiceContextValue {
  sessionId: string | null
  setSessionId: (id: string | null) => void
  /** Genera y lanza una tirada de 2×d12. Devuelve los valores generados
   *  (para que el llamante escriba la tarjeta en el hilo) o null si está
   *  bloqueada (sin sesión/usuario o en cooldown). */
  roll: () => [number, number] | null
  isRolling: boolean
  lastRoll: DiceRoll | null
  recentRolls: DiceRoll[]
  settled: boolean
  setSettled: (v: boolean) => void
}

const DiceContext = createContext<DiceContextValue | null>(null)

const ROLL_COOLDOWN_MS = 4500
const MAX_RECENT = 5

export function DiceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [sessionId, setSessionIdState] = useState<string | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null)
  const [recentRolls, setRecentRolls] = useState<DiceRoll[]>([])
  const [settled, setSettled] = useState(true)
  const mountedAtRef = useRef(0)
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setSessionId = useCallback((id: string | null) => {
    setSessionIdState(id)
    setLastRoll(null)
    setRecentRolls([])
    setSettled(true)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    mountedAtRef.current = Date.now()

    return subscribeToRolls(sessionId, (rollData) => {
      setRecentRolls((prev) => [rollData, ...prev].slice(0, MAX_RECENT))
      // Only animate rolls that arrive after this subscription started
      if (rollData.timestamp >= mountedAtRef.current - 500) {
        setSettled(false)
        setLastRoll(rollData)
      }
    })
  }, [sessionId])

  const roll = useCallback((): [number, number] | null => {
    if (!sessionId || !user || isRolling) return null

    const values: [number, number] = [
      Math.ceil(Math.random() * 12),
      Math.ceil(Math.random() * 12),
    ]

    setIsRolling(true)
    pushRoll(sessionId, {
      playerId: user.uid,
      playerName: user.displayName ?? user.email ?? '?',
      values,
      timestamp: Date.now(),
    }).catch(console.error)

    cooldownRef.current = setTimeout(() => setIsRolling(false), ROLL_COOLDOWN_MS)
    return values
  }, [sessionId, user, isRolling])

  useEffect(() => () => {
    if (cooldownRef.current) clearTimeout(cooldownRef.current)
  }, [])

  return (
    <DiceContext.Provider value={{ sessionId, setSessionId, roll, isRolling, lastRoll, recentRolls, settled, setSettled }}>
      {children}
    </DiceContext.Provider>
  )
}

export function useDice(): DiceContextValue {
  const ctx = useContext(DiceContext)
  if (!ctx) throw new Error('useDice must be used within DiceProvider')
  return ctx
}
