import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { useTheme, type Ambiance } from '@/contexts/ThemeContext'
import { getFirebaseErrorKey } from '@/lib/firebaseError'

const VALID_AMBIANCES: Ambiance[] = ['default', 'sunset', 'morning', 'night', 'neon', 'phosphor']

/**
 * Fase 2: suscribe a la ambientación de una sala en Realtime DB
 * y la aplica globalmente. Solo el Narrador puede escribirla;
 * todos los jugadores la leen.
 *
 * Usar dentro de la vista de Sala (Room.tsx).
 */
export function useRoomAmbiance(sessionId: string | undefined): { errorKey: string | null } {
  const { setAmbiance } = useTheme()
  const [errorKey, setErrorKey] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return

    const ambianceRef = ref(rtdb, `sessions/${sessionId}/ambiance`)
    const unsub = onValue(
      ambianceRef,
      (snap) => {
        setErrorKey(null)
        const value = snap.val() as string | null
        if (value && VALID_AMBIANCES.includes(value as Ambiance)) {
          setAmbiance(value as Ambiance)
        } else {
          setAmbiance('default')
        }
      },
      (err) => {
        setErrorKey(getFirebaseErrorKey(err))
      },
    )

    return () => {
      unsub()
      setAmbiance('default') // restaurar al salir de la sala
    }
  }, [sessionId, setAmbiance])

  return { errorKey }
}
