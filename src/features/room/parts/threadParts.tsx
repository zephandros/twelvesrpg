import { Dices, Image as ImageIcon, Maximize2, Swords, Drama, Zap, Package, Store, MessageCircle } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import { fmtTime } from '../format'
import { resultLabelKey } from '../diceResult'
import { PillButton } from '../ui'
import type { DiceItem, ImageItem, LootItem, MsgItem, NarrationItem, RequestItem, StateIcon, StateItem } from '../types'

const ICON_SIZE = 15

function StateIconView({ icon, size = 13 }: { icon: StateIcon; size?: number }) {
  if (icon === 'mask') return <Drama size={size} />
  if (icon === 'bolt') return <Zap size={size} />
  return <Swords size={size} />
}

/* separador de jornada */
export function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mx-0.5 mt-3.5 mb-2">
      <span className="flex-1 h-px bg-border" />
      <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">{label}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  )
}

/* narración / ambientación (centrada, cursiva) */
export function Narration({ item }: { item: NarrationItem }) {
  return (
    <div className="text-[13.5px] leading-relaxed text-ink-light italic text-center px-3.5 py-2.5 my-1">
      {item.body}
    </div>
  )
}

/* divisor de estado (combate / rol / secuencia) */
export function StateDivider({ item }: { item: StateItem }) {
  return (
    <div className="flex items-center justify-center gap-2.5 my-3 px-1">
      <span className="flex-1 h-px bg-ink/15" />
      <span className="flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.16em] uppercase text-ink">
        <StateIconView icon={item.icon} />
        {item.label}
      </span>
      <span className="flex-1 h-px bg-ink/15" />
    </div>
  )
}

/* mensaje de diálogo */
export function Msg({ item, mine }: { item: MsgItem; mine: boolean }) {
  const { t } = useLocale()
  const isNpc = item.variant === 'npc'
  const initial = (item.authorName?.[0] ?? '?').toUpperCase()
  const roleTag =
    item.variant === 'npc'
      ? { cls: 'bg-surface text-ink border border-ink', label: t('roleNpc') }
      : item.variant === 'aside'
        ? { cls: 'bg-surface-2 text-ink-light', label: t('roleAside') }
        : null

  return (
    <div className={`flex gap-2.5 py-1.5 px-0.5 ${mine ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-[38px] h-[38px] rounded-[11px] shrink-0 flex items-center justify-center text-[13px] font-semibold ${
          isNpc
            ? 'border-[1.5px] border-ink text-ink bg-surface'
            : mine
              ? 'bg-ink text-surface border border-ink'
              : 'bg-surface-2 border border-border text-ink-light'
        }`}
      >
        {isNpc ? <Drama size={17} /> : initial}
      </div>
      <div className={`flex-1 min-w-0 ${mine ? 'flex flex-col items-end' : ''}`}>
        <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
          <span className="text-[13px] font-semibold text-ink">{item.authorName}</span>
          {roleTag && (
            <span className={`text-[8px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded ${roleTag.cls}`}>
              {roleTag.label}
            </span>
          )}
          <span className="text-[10.5px] text-ink-faint">{fmtTime(item.ts)}</span>
        </div>
        {item.variant === 'whisper' ? (
          <div className="flex items-center gap-1.5 text-[13px] leading-snug text-accent italic">
            <MessageCircle size={13} className="shrink-0" />
            <span>{item.body}</span>
          </div>
        ) : (
          <div
            className={`text-[14px] leading-[1.55] text-ink ${
              mine
                ? 'bg-surface-2 border border-border px-3 py-2 rounded-[15px_15px_5px_15px] max-w-[82%] w-fit text-left'
                : ''
            }`}
          >
            {item.body}
          </div>
        )}
      </div>
    </div>
  )
}

/* cabecera de tarjeta de evento */
function EventHead({ icon, kind, title, accent = false }: { icon: React.ReactNode; kind: string; title?: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border">
      <span className={accent ? 'text-accent' : 'text-ink'}>{icon}</span>
      <span className="text-[9px] font-bold tracking-[0.14em] uppercase text-ink-faint">{kind}</span>
      {title && <span className="ml-auto text-[12px] font-semibold text-ink">{title}</span>}
    </div>
  )
}

const eventCard = 'rounded-[14px] border border-border bg-surface overflow-hidden anim-msg-in'

/* tarjeta de tirada (2×d12) */
export function DiceCard({ item, mine }: { item: DiceItem; mine: boolean }) {
  const { t } = useLocale()
  const tagCls =
    item.result === 'crit'
      ? 'bg-accent text-surface'
      : item.result === 'ok'
        ? 'bg-ink text-surface'
        : 'bg-surface text-ink border border-border'
  const modStr = item.mod > 0 ? `+${item.mod}` : item.mod < 0 ? `−${Math.abs(item.mod)}` : ''

  return (
    <div className={`${eventCard} max-w-[460px] ${mine ? 'ml-auto' : 'mr-auto'}`}>
      <EventHead icon={<Dices size={ICON_SIZE} />} kind={`${t('rollKind')} · ${item.attr}`} title={item.authorName} />
      <div className="flex items-center gap-4 p-4">
        <div className="flex gap-2 shrink-0">
          {item.values.map((v, i) => (
            <div
              key={i}
              className="w-11 h-11 rounded-xl border-[1.5px] border-ink flex items-center justify-center text-lg font-bold text-ink"
            >
              {v}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium text-ink-light">
            2d12 {modStr} <span className="text-ink-faint">= {item.total}</span>
          </div>
          <div className="text-[11px] text-ink-faint mt-0.5">
            {t('diceWord')} {item.values[0]} + {item.values[1]}
            {modStr ? ` ${modStr} ${t('modifierWord')}` : ''}
          </div>
          <div className="mt-2">
            <span className={`inline-flex items-center text-[9px] font-bold tracking-[0.12em] uppercase px-2 py-1 rounded-md ${tagCls}`}>
              {t(resultLabelKey(item.result))}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[30px] leading-none font-bold text-ink tabular-nums">{item.total}</div>
          <div className="text-[8px] font-semibold tracking-[0.14em] uppercase text-ink-faint">{t('diceTotal')}</div>
        </div>
      </div>
    </div>
  )
}

/* tarjeta de botín / tienda */
export function LootCard({ item, onTake }: { item: LootItem; onTake: () => void }) {
  const { t } = useLocale()
  return (
    <div className={`${eventCard} max-w-[460px] mr-auto`}>
      <EventHead
        icon={item.shop ? <Store size={ICON_SIZE} /> : <Package size={ICON_SIZE} />}
        kind={item.shop ? t('shopKind') : t('lootKind')}
        title={item.title}
      />
      <div className="px-2 py-2">
        {item.items.length === 0 && <div className="px-2 py-3 text-[12px] text-ink-faint">{t('lootEmpty')}</div>}
        {item.items.map((it, i) => (
          <div key={i} className={`flex items-center gap-3 px-2 py-2.5 rounded-lg ${i > 0 ? 'border-t border-border' : ''}`}>
            <div className="w-[30px] h-[30px] rounded-lg bg-surface-2 border border-border flex items-center justify-center text-sm shrink-0">
              {it.ico}
            </div>
            <div className="flex-1 text-[13px] font-medium text-ink">{it.name}</div>
            {it.qty != null && <div className="text-[12px] font-semibold text-ink-faint">×{it.qty}</div>}
            {it.price != null && (
              <div className="text-[12px] font-semibold text-ink flex items-center gap-1">
                {it.price} <span className="text-accent">◈</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 px-3 py-2.5 border-t border-border">
        <PillButton variant="dark" sm className="flex-1" disabled={item.taken} onClick={onTake}>
          {item.taken ? t('takenOk') : item.shop ? t('buyAction') : t('takeAll')}
        </PillButton>
      </div>
    </div>
  )
}

/* evento imagen (abre lightbox) */
export function ImageEvent({ item, onOpen }: { item: ImageItem; onOpen: () => void }) {
  const { t } = useLocale()
  return (
    <div className="my-1.5 max-w-[480px] mr-auto anim-msg-in">
      <div
        onClick={onOpen}
        className="relative rounded-[14px] overflow-hidden border border-border aspect-[16/10] flex items-center justify-center cursor-pointer hover:brightness-95 transition"
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 striped flex flex-col items-center justify-center gap-2 text-ink-faint">
            <ImageIcon size={22} />
            <span className="text-[10px] font-medium tracking-[0.12em] uppercase">{item.title}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 py-2 text-white text-[11px] font-medium bg-gradient-to-t from-black/55 to-transparent">
          <span>{item.caption}</span>
          <span className="flex items-center gap-1 opacity-90 text-[10px]">
            <Maximize2 size={12} />
            {t('expandLabel')}
          </span>
        </div>
      </div>
    </div>
  )
}

/* tirada solicitada por el Narrador */
export function RequestCard({
  item,
  canResolve,
  onResolve,
}: {
  item: RequestItem
  canResolve: boolean
  onResolve: () => void
}) {
  const { t } = useLocale()
  return (
    <div className={`${eventCard} max-w-[460px] mr-auto`}>
      <EventHead icon={<Dices size={ICON_SIZE} />} kind={t('requestKind')} title={item.attr} accent />
      {item.done ? (
        <div className="text-[11px] font-semibold text-ink-faint text-center py-3">{t('requestDone')}</div>
      ) : (
        <div className="px-3.5 py-3 border-t border-border">
          <div className="text-[12.5px] leading-relaxed text-ink-light mb-2.5">
            {t('requestBody')} <strong>{item.attr}</strong> (2d12).
          </div>
          {canResolve ? (
            <PillButton variant="dark" full onClick={onResolve}>
              <Dices size={14} /> {t('rollAction')}
            </PillButton>
          ) : (
            <div className="text-[11px] text-ink-faint text-center">{t('waitingPlayers')}</div>
          )}
        </div>
      )}
    </div>
  )
}
