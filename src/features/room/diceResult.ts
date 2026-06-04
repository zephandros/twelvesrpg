import type { RollResult } from './types'

/* Evaluación del resultado de una tirada de 2×d12 (el dado del sistema).
   TODO: confirmar estos umbrales contra las reglas reales de Twelves.
   Por ahora son un placeholder fácil de ajustar:
   - crit  → doble 12
   - éxito → total (con modificador) >= SUCCESS_THRESHOLD
   - fallo → en otro caso */
export const SUCCESS_THRESHOLD = 13

export function evaluateRoll(
  values: [number, number],
  mod = 0,
): { total: number; result: RollResult } {
  const total = values[0] + values[1] + mod
  let result: RollResult = 'fail'
  if (values[0] === 12 && values[1] === 12) result = 'crit'
  else if (total >= SUCCESS_THRESHOLD) result = 'ok'
  return { total, result }
}

export function resultLabelKey(result: RollResult): string {
  return result === 'crit' ? 'resultCrit' : result === 'ok' ? 'resultOk' : 'resultFail'
}
