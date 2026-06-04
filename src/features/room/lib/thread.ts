/* Acceso al hilo de chat en Realtime Database: sessions/{roomId}/thread.
   El hilo es la fuente de verdad de la conversación (mensajes, narración,
   tiradas, imágenes, botín, solicitudes y divisores de estado). */
import { ref, push, update, onValue } from 'firebase/database'
import { rtdb } from '@/lib/firebase'
import type { NewThreadItem, ThreadItem } from '../types'

function threadRef(roomId: string) {
  return ref(rtdb, `sessions/${roomId}/thread`)
}

export function pushThreadItem(roomId: string, item: NewThreadItem): Promise<void> {
  return push(threadRef(roomId), item).then(() => undefined)
}

export function updateThreadItem(
  roomId: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  return update(ref(rtdb, `sessions/${roomId}/thread/${id}`), patch)
}

export function subscribeThread(
  roomId: string,
  callback: (items: ThreadItem[]) => void,
): () => void {
  return onValue(threadRef(roomId), (snap) => {
    const val = snap.val() as Record<string, Omit<ThreadItem, 'id'>> | null
    if (!val) {
      callback([])
      return
    }
    const items = Object.entries(val)
      .map(([id, v]) => ({ id, ...v }) as ThreadItem)
      .sort((a, b) => a.ts - b.ts)
    callback(items)
  })
}
