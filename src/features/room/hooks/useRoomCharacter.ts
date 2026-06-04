import { useEffect, useState } from 'react'
import { subscribeCharacter } from '../lib/roomData'
import type { Character } from '../types'

/** Suscribe a la hoja del jugador en Firestore. No la crea automáticamente:
 *  el jugador arranca sin personaje (ver estado vacío + "Crear personaje").
 *  `loading` distingue "cargando" de "sin hoja". */
export function useRoomCharacter(
  roomId: string | undefined,
  uid: string | undefined,
): { character: Character | null; loading: boolean } {
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId || !uid) {
      setCharacter(null)
      setLoading(false)
      return
    }
    setLoading(true)
    return subscribeCharacter(roomId, uid, (c) => {
      setCharacter(c)
      setLoading(false)
    })
  }, [roomId, uid])

  return { character, loading }
}
