import { useEffect } from 'react'
import { ref, onValue } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import { useTheme, type Ambiance } from '@/contexts/ThemeContext'

const VALID_AMBIANCES: Ambiance[] = ['default', 'sunset', 'morning', 'night', 'neon', 'phosphor']

/**
 * Fase 2: suscribe a la ambientación de una sala en Realtime DB
 * y la aplica globalmente. Solo el Narrador puede escribirla;
 * todos los jugadores la leen.
 *
 * Usar dentro de la vista de Sala (Room.tsx).
 */
export function useRoomAmbiance(sessionId: string | undefined) {
  const { setAmbiance } = useTheme()

  useEffect(() => {
    if (!sessionId) return

    const ambianceRef = ref(rtdb, `sessions/${sessionId}/ambiance`)
    const unsub = onValue(ambianceRef, (snap) => {
      const value = snap.val() as string | null
      if (value && VALID_AMBIANCES.includes(value as Ambiance)) {
        setAmbiance(value as Ambiance)
      } else {
        setAmbiance('default')
      }
    })

    return () => {
      unsub()
      setAmbiance('default') // restaurar al salir de la sala
    }
  }, [sessionId, setAmbiance])
}
