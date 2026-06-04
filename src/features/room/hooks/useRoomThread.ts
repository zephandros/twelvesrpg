import { useEffect, useState } from 'react'
import { subscribeThread } from '../lib/thread'
import type { ThreadItem } from '../types'

/** Suscribe al hilo de chat (RTDB) de la sala. */
export function useRoomThread(roomId: string | undefined): ThreadItem[] {
  const [items, setItems] = useState<ThreadItem[]>([])

  useEffect(() => {
    if (!roomId) {
      setItems([])
      return
    }
    return subscribeThread(roomId, setItems)
  }, [roomId])

  return items
}
