/* Acceso a los datos de la Sala en Firestore:
   - rooms/{roomId}                       → doc de sala (existente)
   - rooms/{roomId}/characters/{uid}      → hoja del jugador + notas
   - rooms/{roomId}/npcs/{id}             → NPCs y enemigos del Narrador
   - rooms/{roomId}/resources/{id}        → recursos/imágenes del Narrador */
import {
  doc,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Character, Npc, PlayerCharacter, RoomResource } from '../types'

/* ---------- Character ---------- */
function characterRef(roomId: string, uid: string) {
  return doc(db, 'rooms', roomId, 'characters', uid)
}

export function subscribeCharacter(
  roomId: string,
  uid: string,
  callback: (c: Character | null) => void,
): () => void {
  return onSnapshot(characterRef(roomId, uid), (snap) => {
    callback(snap.exists() ? (snap.data() as Character) : null)
  })
}

export function saveCharacter(roomId: string, uid: string, character: Character): Promise<void> {
  return setDoc(characterRef(roomId, uid), character, { merge: true })
}

export function updateCharacter(
  roomId: string,
  uid: string,
  patch: Partial<Character>,
): Promise<void> {
  return updateDoc(characterRef(roomId, uid), patch as DocumentData)
}

export function subscribeCharacters(
  roomId: string,
  callback: (characters: PlayerCharacter[]) => void,
): () => void {
  return onSnapshot(collection(db, 'rooms', roomId, 'characters'), (snap) => {
    callback(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Character) })))
  })
}

/* ---------- NPCs / enemigos ---------- */
export function subscribeNpcs(roomId: string, callback: (npcs: Npc[]) => void): () => void {
  return onSnapshot(collection(db, 'rooms', roomId, 'npcs'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Npc, 'id'>) })))
  })
}

export function addNpc(roomId: string, npc: Omit<Npc, 'id'>): Promise<unknown> {
  return addDoc(collection(db, 'rooms', roomId, 'npcs'), npc)
}

export function deleteNpc(roomId: string, id: string): Promise<void> {
  return deleteDoc(doc(db, 'rooms', roomId, 'npcs', id))
}

/* ---------- Recursos ---------- */
export function subscribeResources(
  roomId: string,
  callback: (resources: RoomResource[]) => void,
): () => void {
  return onSnapshot(collection(db, 'rooms', roomId, 'resources'), (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RoomResource, 'id'>) })))
  })
}

export function addResource(roomId: string, resource: Omit<RoomResource, 'id'>): Promise<unknown> {
  return addDoc(collection(db, 'rooms', roomId, 'resources'), resource)
}

export function deleteResource(roomId: string, id: string): Promise<void> {
  return deleteDoc(doc(db, 'rooms', roomId, 'resources', id))
}
