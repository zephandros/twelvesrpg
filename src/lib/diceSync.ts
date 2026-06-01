import { ref, push, set, onChildAdded, onValue } from 'firebase/database'
import { rtdb } from './firebase'
import type { RollEvent } from '@/features/dice/types'

export interface DiceRoll {
  playerId: string
  playerName: string
  values: [number, number]
  timestamp: number
}

export function pushRoll(sessionId: string, roll: DiceRoll): Promise<void> {
  return push(ref(rtdb, `sessions/${sessionId}/rolls`), roll).then(() => undefined)
}

export function subscribeToRolls(
  sessionId: string,
  callback: (roll: DiceRoll) => void,
): () => void {
  const rollsRef = ref(rtdb, `sessions/${sessionId}/rolls`)
  return onChildAdded(rollsRef, (snapshot) => {
    const data = snapshot.val() as DiceRoll
    if (data) callback(data)
  })
}

export function pushCurrentRoll(sessionId: string, event: RollEvent): Promise<void> {
  return set(ref(rtdb, `sessions/${sessionId}/currentRoll`), event)
}

export function subscribeToCurrentRoll(
  sessionId: string,
  callback: (event: RollEvent) => void,
): () => void {
  const rollRef = ref(rtdb, `sessions/${sessionId}/currentRoll`)
  const unsub = onValue(rollRef, (snap) => {
    const data = snap.val() as RollEvent | null
    if (data) callback(data)
  })
  return unsub
}
