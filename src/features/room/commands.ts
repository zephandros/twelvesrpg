/* Parseo del input del composer. Los dados se estandarizan a 2×d12 (el dado
   del sistema), por lo que /tirar solo admite un modificador opcional [+N]. */

export type ParsedCommand =
  | { kind: 'empty' }
  | { kind: 'text'; text: string }
  | { kind: 'roll'; mod: number }
  | { kind: 'whisper'; text: string }
  | { kind: 'aside'; text: string }
  | { kind: 'error'; messageKey: string }

export function parseComposer(raw: string): ParsedCommand {
  const text = raw.trim()
  if (!text) return { kind: 'empty' }
  if (!text.startsWith('/')) return { kind: 'text', text }

  const sp = text.indexOf(' ')
  const cmd = (sp === -1 ? text.slice(1) : text.slice(1, sp)).toLowerCase()
  const rest = sp === -1 ? '' : text.slice(sp + 1).trim()

  if (cmd === 'tirar' || cmd === 'roll') {
    const m = rest.replace(/\s/g, '').match(/^([+-]\d+)?$/)
    if (!m) return { kind: 'error', messageKey: 'cmdRollInvalid' }
    return { kind: 'roll', mod: m[1] ? parseInt(m[1], 10) : 0 }
  }
  if (cmd === 'susurrar' || cmd === 'w') {
    if (!rest) return { kind: 'error', messageKey: 'cmdWhisperEmpty' }
    return { kind: 'whisper', text: rest }
  }
  if (cmd === 'aparte' || cmd === 'ooc') {
    if (!rest) return { kind: 'error', messageKey: 'cmdAsideEmpty' }
    return { kind: 'aside', text: rest }
  }
  return { kind: 'error', messageKey: 'cmdUnknown' }
}
