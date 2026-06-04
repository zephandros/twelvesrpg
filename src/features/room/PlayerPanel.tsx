import { useState } from 'react'
import { Dices, Plus, Pencil, X, UserPlus } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import { updateCharacter, saveCharacter } from './lib/roomData'
import { ATTRIBUTE_KEYS, MAX_HEARTS, MAX_LUCK, MAX_STRESS, defaultCharacter } from './characterConfig'
import { Eyebrow, SecTitle, PillButton } from './ui'
import type { Character } from './types'

interface PlayerPanelProps {
  roomId: string
  uid: string
  character: Character | null
  loading: boolean
  displayName: string
  onRoll: () => void
}

const tabBase = 'shrink-0 text-[11px] font-semibold tracking-[0.03em] px-3.5 py-2 rounded-[10px] whitespace-nowrap transition-colors'

export default function PlayerPanel({ roomId, uid, character, loading, displayName, onRoll }: PlayerPanelProps) {
  const { t } = useLocale()
  const [tab, setTab] = useState<'character' | 'notes'>('character')
  const [newNote, setNewNote] = useState('')
  const [draft, setDraft] = useState<Character | null>(null)
  const editing = draft !== null

  /* escrituras en vivo (estatus / notas), independientes del borrador */
  const save = (patch: Partial<Character>) => {
    if (character) updateCharacter(roomId, uid, patch).catch(console.error)
  }
  // normaliza a la longitud fija del sistema (tolera docs antiguos más cortos)
  const toggleHeart = (i: number) =>
    character && save({ hearts: fill(character.hearts, MAX_HEARTS, true).map((v, j) => (j === i ? !v : v)) })
  const toggleLuck = (i: number) =>
    character && save({ luck: fill(character.luck, MAX_LUCK, true).map((v, j) => (j === i ? !v : v)) })
  const toggleStress = (i: number) =>
    character && save({ stress: fill(character.stress, MAX_STRESS, false).map((v, j) => (j === i ? !v : v)) })

  const addNote = () => {
    if (!character) return
    const n = newNote.trim()
    if (!n) return
    save({ notes: [...character.notes, n] })
    setNewNote('')
  }
  const delNote = (i: number) => character && save({ notes: character.notes.filter((_, j) => j !== i) })

  /* borrador de edición */
  const beginEdit = () => character && setDraft({ ...character, attributes: { ...character.attributes } })
  const beginCreate = () => setDraft(defaultCharacter(displayName))
  const cancelDraft = () => setDraft(null)
  const saveDraft = () => {
    if (!draft) return
    saveCharacter(roomId, uid, draft).catch(console.error)
    setDraft(null)
  }
  const setDraftField = (patch: Partial<Character>) => setDraft((d) => (d ? { ...d, ...patch } : d))
  const setAttr = (key: string, raw: string) => {
    const n = raw === '' ? 0 : parseInt(raw, 10)
    setDraft((d) => (d ? { ...d, attributes: { ...d.attributes, [key]: Number.isNaN(n) ? 0 : n } } : d))
  }

  /* ---------- estados sin pestañas ---------- */
  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-ink-faint">{t('loading')}</div>
  }

  if (!character && !draft) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <p className="text-sm text-ink-light">{t('noCharacter')}</p>
        <PillButton variant="dark" onClick={beginCreate}>
          <UserPlus size={14} /> {t('createCharacter')}
        </PillButton>
      </div>
    )
  }

  if (draft && !character) {
    // formulario de creación (flujo enfocado, sin pestañas)
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-surface">
        <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
          <Eyebrow>{t('createCharacter')}</Eyebrow>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-5">
          <SheetEditFields draft={draft} setField={setDraftField} setAttr={setAttr} />
        </div>
        <EditFooter onCancel={cancelDraft} onSave={saveDraft} />
      </div>
    )
  }

  /* ---------- vista con pestañas (personaje existente) ---------- */
  const displayedName = editing && draft ? draft.name : character!.name

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface">
      {/* pestañas hasta arriba del panel */}
      <div className="flex gap-1 px-3 py-2.5 border-b border-border shrink-0">
        <button className={`${tabBase} ${tab === 'character' ? 'bg-ink text-surface' : 'text-ink-faint hover:bg-surface-2'}`} onClick={() => setTab('character')}>
          {t('ptabCharacter')}
        </button>
        <button className={`${tabBase} ${tab === 'notes' ? 'bg-ink text-surface' : 'text-ink-faint hover:bg-surface-2'}`} onClick={() => setTab('notes')}>
          {t('ptabNotes')}
        </button>
      </div>

      {tab === 'character' && !editing && (
        <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-border shrink-0">
          <div>
            <Eyebrow className="mb-0.5">{t('panelYourChar')}</Eyebrow>
            <div className="text-[16px] font-semibold tracking-tight">{displayedName}</div>
          </div>
          <button
            onClick={beginEdit}
            className="text-ink-faint hover:text-ink transition-colors flex items-center gap-1 text-[11px] font-semibold"
            aria-label={t('editAction')}
          >
            <Pencil size={13} /> {t('editAction')}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-5">
        {tab === 'character' ? (
          editing && draft ? (
            <SheetEditFields draft={draft} setField={setDraftField} setAttr={setAttr} />
          ) : (
            <SheetView
              character={character!}
              onToggleHeart={toggleHeart}
              onToggleLuck={toggleLuck}
              onToggleStress={toggleStress}
              onRoll={onRoll}
            />
          )
        ) : (
          <>
            <SecTitle>{t('notesSection')}</SecTitle>
            <div className="flex flex-col gap-3">
              {character!.notes.length === 0 && <div className="text-center text-ink-faint text-[13px] py-8">{t('noNotes')}</div>}
              {character!.notes.map((n, i) => (
                <div key={i} className="relative bg-surface-2 rounded-xl pl-4 pr-9 py-3 text-[13.5px] leading-relaxed">
                  {n}
                  <button onClick={() => delNote(i)} className="absolute top-2 right-2.5 text-ink-faint hover:text-ink" aria-label={t('formCancel')}>
                    <X size={15} />
                  </button>
                </div>
              ))}
              <textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    addNote()
                  }
                }}
                placeholder={t('newNotePlaceholder')}
                className="w-full rounded-xl border border-dashed border-border px-4 py-3 text-[13px] outline-none resize-none bg-surface focus:border-ink focus:border-solid transition"
              />
              <PillButton full onClick={addNote}>
                <Plus size={14} /> {t('addNote')}
              </PillButton>
            </div>
          </>
        )}
      </div>

      {tab === 'character' && editing && <EditFooter onCancel={cancelDraft} onSave={saveDraft} />}
    </div>
  )
}

/* normaliza un array de toggles a una longitud fija */
function fill(arr: boolean[] | undefined, len: number, def: boolean): boolean[] {
  return Array.from({ length: len }, (_, i) => arr?.[i] ?? def)
}

/* caja de estrés: rectángulo con esquinas superior-izq. e inferior-der. achaflanadas */
function StressGlyph({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 18 30" className="w-[16px] h-[28px]" aria-hidden>
      <path
        d="M7 2 L16 2 L16 23 L11 28 L2 28 L2 7 Z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* punto de suerte: estrella de 4 puntas (sparkle) con lados cóncavos */
function LuckGlyph({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden>
      <path
        d="M12 1 Q14.5 9.5 23 12 Q14.5 14.5 12 23 Q9.5 14.5 1 12 Q9.5 9.5 12 1 Z"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ---------- vista de la hoja en modo Normal ---------- */
function SheetView({
  character,
  onToggleHeart,
  onToggleLuck,
  onToggleStress,
  onRoll,
}: {
  character: Character
  onToggleHeart: (i: number) => void
  onToggleLuck: (i: number) => void
  onToggleStress: (i: number) => void
  onRoll: () => void
}) {
  const { t } = useLocale()
  const hearts = fill(character.hearts, MAX_HEARTS, true)
  const luck = fill(character.luck, MAX_LUCK, true)
  const stress = fill(character.stress, MAX_STRESS, false)
  return (
    <>
      <div className="grid grid-cols-2 gap-3.5">
        <ReadField label={t('fieldBloodline')} value={character.bloodline} />
        <ReadField label={t('fieldBackground')} value={character.background} />
      </div>

      <div className="flex flex-col gap-3">
        <SecTitle>{t('secAttributes')}</SecTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {ATTRIBUTE_KEYS.map((name) => (
            <div key={name} className="flex items-center justify-between bg-surface-2 rounded-[11px] px-3 py-2.5">
              <span className="text-[12px] font-semibold">{name}</span>
              <span className="text-[20px] font-bold tabular-nums">{character.attributes[name] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SecTitle>{t('secStatus')}</SecTitle>
        <div className="flex gap-7">
          <div className="flex flex-col gap-2.5">
            <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">{t('labelHealth')}</div>
            <div className="flex gap-1.5">
              {hearts.map((on, i) => (
                <button
                  key={i}
                  onClick={() => onToggleHeart(i)}
                  className={`w-[22px] h-[22px] rounded-full border-[1.5px] border-ink active:scale-[0.85] transition ${on ? 'bg-ink' : 'bg-transparent'}`}
                  aria-label={t('labelHealth')}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">{t('labelLuck')}</div>
            <div className="flex gap-1.5 text-accent">
              {luck.map((on, i) => (
                <button
                  key={i}
                  onClick={() => onToggleLuck(i)}
                  className={`active:scale-[0.85] transition ${on ? '' : 'opacity-30'}`}
                  aria-label={t('labelLuck')}
                >
                  <LuckGlyph on={on} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">{t('labelStress')}</div>
          <div className="flex gap-[3px] text-ink">
            {stress.map((on, i) => (
              <button
                key={i}
                onClick={() => onToggleStress(i)}
                className="shrink-0 active:scale-[0.85] transition"
                aria-label={t('labelStress')}
              >
                <StressGlyph on={on} />
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-ink-faint">{t('statusHint')}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <SecTitle>{t('secTalents')}</SecTitle>
        {character.skills.length === 0 ? (
          <p className="text-[12px] text-ink-faint py-1">{t('noTalents')}</p>
        ) : (
          character.skills.map((s, i) => (
            <div key={i} className={`flex items-center justify-between py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}>
              <span className="text-[13px] font-semibold">{s.name}</span>
              <span className="text-[12px] font-semibold text-ink-faint">{s.bonus >= 0 ? `+${s.bonus}` : s.bonus}</span>
            </div>
          ))
        )}
      </div>

      <PillButton variant="dark" full onClick={onRoll}>
        <Dices size={14} /> {t('btnRollDie')}
      </PillButton>
    </>
  )
}

/* ---------- campos editables de la hoja (modo Edición / creación) ---------- */
function SheetEditFields({
  draft,
  setField,
  setAttr,
}: {
  draft: Character
  setField: (patch: Partial<Character>) => void
  setAttr: (key: string, raw: string) => void
}) {
  const { t } = useLocale()
  return (
    <>
      <EditField label={t('fieldName')} value={draft.name} onChange={(v) => setField({ name: v })} />
      <div className="grid grid-cols-2 gap-3.5">
        <EditField label={t('fieldBloodline')} value={draft.bloodline} onChange={(v) => setField({ bloodline: v })} />
        <EditField label={t('fieldBackground')} value={draft.background} onChange={(v) => setField({ background: v })} />
      </div>

      <div className="flex flex-col gap-3">
        <SecTitle>{t('secAttributes')}</SecTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {ATTRIBUTE_KEYS.map((name) => (
            <div key={name} className="flex items-center justify-between bg-surface-2 rounded-[11px] pl-3 pr-1.5 py-1.5">
              <span className="text-[12px] font-semibold">{name}</span>
              <input
                type="number"
                value={draft.attributes[name] ?? 0}
                onChange={(e) => setAttr(name, e.target.value)}
                className="w-12 text-[18px] font-bold tabular-nums text-right bg-transparent outline-none rounded-md focus:bg-surface px-1"
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function EditFooter({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  const { t } = useLocale()
  return (
    <div className="flex gap-2 p-3 border-t border-border shrink-0">
      <PillButton className="flex-1" onClick={onCancel}>
        {t('formCancel')}
      </PillButton>
      <PillButton variant="dark" className="flex-1" onClick={onSave}>
        {t('saveButton')}
      </PillButton>
    </div>
  )
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">{label}</div>
      <div className="text-[15px] border-b border-border pb-1.5 min-h-[1.5em] text-ink">{value || '—'}</div>
    </div>
  )
}

function EditField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[15px] bg-transparent border-b border-border pb-1.5 outline-none focus:border-ink transition"
      />
    </div>
  )
}
