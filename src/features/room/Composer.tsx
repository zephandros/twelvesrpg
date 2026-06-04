import { type RefObject } from 'react'
import { Dices, MessageCircle, User, Image as ImageIcon, Package, Drama, Plus, Send, X } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import type { Role } from './types'

interface ComposerProps {
  role: Role
  value: string
  setValue: (v: string) => void
  onSend: () => void
  speakAsName: string | null
  onCancelSpeakAs: () => void
  inputRef: RefObject<HTMLInputElement | null>
  onAttach: () => void
  onRequest: () => void
  onImage: () => void
  onLoot: () => void
  onNpc: () => void
}

const chipBase =
  'shrink-0 inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full border bg-surface cursor-pointer transition-colors active:scale-95'
const chipDefault = `${chipBase} text-ink-light border-border hover:border-ink hover:text-ink`
const chipCmd = `${chipBase} text-accent border-accent/30 bg-accent/10 hover:border-accent`

export default function Composer({
  role,
  value,
  setValue,
  onSend,
  speakAsName,
  onCancelSpeakAs,
  inputRef,
  onAttach,
  onRequest,
  onImage,
  onLoot,
  onNpc,
}: ComposerProps) {
  const { t } = useLocale()
  const isCmd = value.trimStart().startsWith('/')
  const canSend = value.trim().length > 0

  const focusInput = () => inputRef.current?.focus()
  const setAndFocus = (v: string) => {
    setValue(v)
    setTimeout(focusInput, 0)
  }

  const placeholder = speakAsName
    ? `${t('composerNpcPrefix')} ${speakAsName}…`
    : role === 'narrator'
      ? t('composerNarrator')
      : t('composerPlayer')

  return (
    <div className="shrink-0">
      <div className="flex gap-2 px-3.5 pt-2.5 overflow-x-auto no-scrollbar">
        {role === 'narrator' ? (
          <>
            <button className={chipDefault} onClick={onRequest}>
              <Dices size={12} />
              {t('chipRequest')}
            </button>
            <button className={chipDefault} onClick={onImage}>
              <ImageIcon size={12} />
              {t('chipImage')}
            </button>
            <button className={chipDefault} onClick={onLoot}>
              <Package size={12} />
              {t('chipLoot')}
            </button>
            <button className={chipDefault} onClick={onNpc}>
              <Drama size={12} />
              {t('chipNpc')}
            </button>
          </>
        ) : (
          <>
            <button className={chipCmd} onClick={() => setAndFocus('/tirar +')}>
              <Dices size={12} />
              {t('chipRoll')}
            </button>
            <button className={chipCmd} onClick={() => setAndFocus('/susurrar ')}>
              <MessageCircle size={12} />
              {t('chipWhisper')}
            </button>
            <button className={chipDefault} onClick={focusInput}>
              <User size={12} />
              {t('chipAction')}
            </button>
          </>
        )}
      </div>

      {speakAsName && (
        <div className="flex items-center gap-2 px-3.5 py-2 mt-1 bg-accent/10 border-t border-border text-[11.5px] font-medium text-accent">
          <Drama size={14} />
          <span>
            {t('speakingAs')} <strong>{speakAsName}</strong>
          </span>
          <button className="ml-auto text-accent flex" onClick={onCancelSpeakAs} aria-label={t('formCancel')}>
            <X size={15} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2.5 px-3.5 pt-2.5 pb-4">
        <button
          onClick={onAttach}
          className="w-9 h-9 rounded-[11px] shrink-0 bg-surface-2 border border-border flex items-center justify-center text-ink-light active:scale-95 transition"
          aria-label={t('attachAction')}
        >
          <Plus size={18} />
        </button>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={placeholder}
          className={`flex-1 min-w-0 h-10 rounded-[13px] bg-surface-2 border border-border px-3.5 text-[13.5px] outline-none focus:border-ink focus:bg-surface transition-colors ${
            isCmd ? 'text-accent font-medium' : 'text-ink'
          }`}
        />
        <button
          onClick={onSend}
          disabled={!canSend}
          className="w-10 h-10 rounded-[13px] shrink-0 bg-ink text-surface flex items-center justify-center disabled:bg-surface-2 disabled:text-ink-faint active:scale-95 transition"
          aria-label={t('chipAction')}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
