import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import type { Role, RoomDoc } from '../types'

/** Suscribe al doc de sala y deriva el rol del usuario actual:
 *  hostId === uid ⇒ Narrador; en otro caso Jugador. */
export function useRoom(roomId: string | undefined): {
  room: RoomDoc | null
  role: Role
  loading: boolean
} {
  const { user } = useAuth()
  const [room, setRoom] = useState<RoomDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) return
    setLoading(true)
    return onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      setRoom(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<RoomDoc, 'id'>) }) : null)
      setLoading(false)
    })
  }, [roomId])

  const role: Role = room && user && room.hostId === user.uid ? 'narrator' : 'player'
  return { room, role, loading }
}
