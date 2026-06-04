import { useEffect, useState } from 'react'
import { subscribeNpcs, subscribeResources, subscribeCharacters } from '../lib/roomData'
import type { Npc, PlayerCharacter, RoomResource } from '../types'

/** NPCs, recursos y personajes de los jugadores (para el panel del Narrador).
 *  Solo se suscribe cuando enabled (rol Narrador). */
export function useNarratorData(
  roomId: string | undefined,
  enabled: boolean,
): { npcs: Npc[]; resources: RoomResource[]; characters: PlayerCharacter[] } {
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [resources, setResources] = useState<RoomResource[]>([])
  const [characters, setCharacters] = useState<PlayerCharacter[]>([])

  useEffect(() => {
    if (!roomId || !enabled) {
      setNpcs([])
      setResources([])
      setCharacters([])
      return
    }
    const unsubs = [
      subscribeNpcs(roomId, setNpcs),
      subscribeResources(roomId, setResources),
      subscribeCharacters(roomId, setCharacters),
    ]
    return () => unsubs.forEach((u) => u())
  }, [roomId, enabled])

  return { npcs, resources, characters }
}
