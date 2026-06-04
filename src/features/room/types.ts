/* Tipos de dominio de la Sala (Room).
   El hilo de chat vive en RTDB; hojas/NPCs/recursos en Firestore. */

export type Role = 'player' | 'narrator'

export type RollResult = 'crit' | 'ok' | 'fail'

export type StateIcon = 'swords' | 'mask' | 'bolt'

/** Distributive Omit para uniones discriminadas. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

interface ThreadItemBase {
  id: string // push key, se rellena al leer
  authorId: string
  authorName: string
  ts: number
}

export interface MsgItem extends ThreadItemBase {
  type: 'msg'
  body: string
  /** normal = diálogo; whisper = susurro; aside = aparte; npc = el Narrador habla como NPC */
  variant: 'normal' | 'whisper' | 'aside' | 'npc'
}

export interface NarrationItem extends ThreadItemBase {
  type: 'narration'
  body: string
}

export interface StateItem extends ThreadItemBase {
  type: 'state'
  label: string
  icon: StateIcon
}

export interface DiceItem extends ThreadItemBase {
  type: 'dice'
  attr: string
  values: [number, number]
  mod: number
  total: number
  result: RollResult
}

export interface ImageItem extends ThreadItemBase {
  type: 'image'
  title: string
  caption: string
  imageUrl?: string
  body?: string
}

export interface LootEntry {
  ico: string
  name: string
  qty?: number
  price?: number
}

export interface LootItem extends ThreadItemBase {
  type: 'loot'
  shop?: boolean
  title: string
  items: LootEntry[]
  taken?: boolean
}

export interface RequestItem extends ThreadItemBase {
  type: 'request'
  attr: string
  done?: boolean
}

export type ThreadItem =
  | MsgItem
  | NarrationItem
  | StateItem
  | DiceItem
  | ImageItem
  | LootItem
  | RequestItem

export type NewThreadItem = DistributiveOmit<ThreadItem, 'id'>

/* ---------- Firestore ---------- */

export interface RoomDoc {
  id: string
  name: string
  description: string
  hostId: string
  code: string
  players: string[]
  maxPlayers?: number
}

export interface Skill {
  name: string
  bonus: number
}

export interface Character {
  name: string
  bloodline: string
  background: string
  attributes: Record<string, number>
  skills: Skill[]
  hearts: boolean[]
  luck: boolean[]
  stress: boolean[]
  notes: string[]
}

/** Character con su uid (al listar todos los personajes de una sala). */
export type PlayerCharacter = Character & { uid: string }

export interface Npc {
  id: string
  name: string
  description: string
  kind: 'npc' | 'enemy'
  hp?: boolean[]
}

export interface RoomResource {
  id: string
  title: string
  caption: string
  imageUrl?: string
}
