/* Plantilla por defecto de una hoja de personaje.
   Los nombres de atributos son términos del sistema Twelves (datos, no UI
   traducible). Las etiquetas de sección sí se traducen vía locale. */
import type { Character } from './types'

/** Atributos del sistema, en el orden de visualización de la hoja. */
export const ATTRIBUTE_KEYS = [
  'Movilidad',
  'Percepción',
  'Coordinación',
  'Deducción',
  'Físico',
  'Influencia',
] as const

export const MAX_HEARTS = 3
export const MAX_LUCK = 4
export const MAX_STRESS = 12

export function defaultCharacter(name: string): Character {
  return {
    name,
    bloodline: '',
    background: '',
    attributes: Object.fromEntries(ATTRIBUTE_KEYS.map((k) => [k, 0])),
    skills: [],
    hearts: Array(MAX_HEARTS).fill(true),
    luck: Array(MAX_LUCK).fill(true),
    stress: Array(MAX_STRESS).fill(false),
    notes: [],
  }
}
