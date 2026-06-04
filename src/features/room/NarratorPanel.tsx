import { useState, type ReactNode } from 'react'
import { Dices, Image as ImageIcon, Package, Store, Swords, Drama, Zap, Plus, X } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import { addNpc, addResource, deleteNpc, deleteResource } from './lib/roomData'
import { Eyebrow, SecTitle, PillButton } from './ui'
import type { LootEntry, Npc, PlayerCharacter, RoomResource, StateIcon } from './types'

export interface NarratorActions {
  dmRequest: (attr: string) => void
  dmImage: (resource: RoomResource) => void
  dmState: (label: string, icon: StateIcon) => void
  speakNpc: (name: string) => void
  createLoot: (payload: { shop: boolean; title: string; items: LootEntry[] }) => void
  onRoll: () => void
  flash: (key: string) => void
}

interface NarratorPanelProps {
  roomId: string
  npcs: Npc[]
  resources: RoomResource[]
  characters: PlayerCharacter[]
  memberCount: number
  actions: NarratorActions
  withHeader?: boolean
}

type Tab = 'events' | 'npcs' | 'resources' | 'players' | 'dice'

const tabBase = 'shrink-0 text-[11px] font-semibold tracking-[0.03em] px-3.5 py-2 rounded-[10px] whitespace-nowrap transition-colors'

function parseLootLines(text: string, shop: boolean): LootEntry[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      if (shop) {
        const m = line.match(/^(.*?)\s+(\d+)$/)
        return m ? { ico: '◈', name: m[1].trim(), price: parseInt(m[2], 10) } : { ico: '◈', name: line }
      }
      const m = line.match(/^(.*?)\s+x(\d+)$/i)
      return m ? { ico: '◆', name: m[1].trim(), qty: parseInt(m[2], 10) } : { ico: '◆', name: line, qty: 1 }
    })
}

export default function NarratorPanel({
  roomId,
  npcs,
  resources,
  characters,
  memberCount,
  actions,
  withHeader = false,
}: NarratorPanelProps) {
  const { t } = useLocale()
  const [tab, setTab] = useState<Tab>('events')
  const tabs: { id: Tab; label: string }[] = [
    { id: 'events', label: t('ntabEvents') },
    { id: 'npcs', label: t('ntabNpcs') },
    { id: 'resources', label: t('ntabResources') },
    { id: 'players', label: t('ntabPlayers') },
    { id: 'dice', label: t('ntabDice') },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-surface">
      {withHeader && (
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border shrink-0">
          <div>
            <Eyebrow className="mb-0.5">{t('panelNarrator')}</Eyebrow>
            <div className="text-[16px] font-semibold tracking-tight">{t('panelControl')}</div>
          </div>
        </div>
      )}

      <div className="flex gap-1 px-3 py-2.5 border-b border-border overflow-x-auto no-scrollbar shrink-0">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            className={`${tabBase} ${tab === tb.id ? 'bg-ink text-surface' : 'text-ink-faint hover:bg-surface-2'}`}
            onClick={() => setTab(tb.id)}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-5">
        {tab === 'events' && <EventsTab actions={actions} goResources={() => setTab('resources')} />}
        {tab === 'npcs' && <NpcsTab roomId={roomId} npcs={npcs} actions={actions} />}
        {tab === 'resources' && <ResourcesTab roomId={roomId} resources={resources} actions={actions} />}
        {tab === 'players' && <PlayersTab characters={characters} memberCount={memberCount} flash={actions.flash} />}
        {tab === 'dice' && <DiceTab actions={actions} />}
      </div>
    </div>
  )
}

/* ---------- Eventos ---------- */
function ActionBtn({ icon, title, desc, onClick }: { icon: ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="border border-border rounded-[14px] p-3.5 bg-surface flex flex-col gap-2 text-left hover:border-ink hover:shadow-sm active:scale-95 transition"
    >
      <span className="text-ink">{icon}</span>
      <span className="text-[13px] font-semibold">{title}</span>
      <span className="text-[11px] leading-snug text-ink-faint">{desc}</span>
    </button>
  )
}

function EventsTab({ actions, goResources }: { actions: NarratorActions; goResources: () => void }) {
  const { t } = useLocale()
  const [lootShop, setLootShop] = useState<boolean | null>(null)

  return (
    <>
      <SecTitle>{t('secLaunchEvent')}</SecTitle>
      <div className="grid grid-cols-2 gap-2.5">
        <ActionBtn icon={<Dices size={20} />} title={t('actRequestT')} desc={t('actRequestD')} onClick={() => actions.dmRequest(t('attribute'))} />
        <ActionBtn icon={<ImageIcon size={20} />} title={t('actImageT')} desc={t('actImageD')} onClick={goResources} />
        <ActionBtn icon={<Package size={20} />} title={t('actLootT')} desc={t('actLootD')} onClick={() => setLootShop(false)} />
        <ActionBtn icon={<Store size={20} />} title={t('actShopT')} desc={t('actShopD')} onClick={() => setLootShop(true)} />
      </div>

      {lootShop !== null && (
        <LootForm
          shop={lootShop}
          onCancel={() => setLootShop(null)}
          onSubmit={(payload) => {
            actions.createLoot(payload)
            setLootShop(null)
          }}
        />
      )}

      <SecTitle>{t('secGameState')}</SecTitle>
      <div className="flex gap-2">
        <PillButton variant="dark" className="flex-1" onClick={() => actions.dmState(t('stateCombat'), 'swords')}>
          <Swords size={14} /> {t('btnCombat')}
        </PillButton>
        <PillButton className="flex-1" onClick={() => actions.dmState(t('stateRol'), 'mask')}>
          <Drama size={14} /> {t('btnRol')}
        </PillButton>
        <PillButton className="flex-1" onClick={() => actions.dmState(t('stateSequence'), 'bolt')}>
          <Zap size={14} /> {t('btnSequence')}
        </PillButton>
      </div>
    </>
  )
}

/* ---------- NPCs ---------- */
function NpcsTab({ roomId, npcs, actions }: { roomId: string; npcs: Npc[]; actions: NarratorActions }) {
  const { t } = useLocale()
  const [showForm, setShowForm] = useState(false)
  const people = npcs.filter((n) => n.kind === 'npc')
  const enemies = npcs.filter((n) => n.kind === 'enemy')

  return (
    <>
      <SecTitle>{t('secNpcs')}</SecTitle>
      {people.length === 0 && <p className="text-[12px] text-ink-faint">{t('npcEmpty')}</p>}
      {people.map((n) => (
        <ListRow
          key={n.id}
          av={<Drama size={15} />}
          npc
          name={n.name}
          meta={n.description}
          onDelete={() => deleteNpc(roomId, n.id).catch(console.error)}
        >
          <PillButton sm onClick={() => actions.speakNpc(n.name)}>
            {t('btnInterpret')}
          </PillButton>
        </ListRow>
      ))}

      <SecTitle>{t('secEnemies')}</SecTitle>
      {enemies.length === 0 && <p className="text-[12px] text-ink-faint">{t('enemyEmpty')}</p>}
      {enemies.map((n) => (
        <ListRow
          key={n.id}
          av="🗡"
          name={n.name}
          meta={n.description}
          onDelete={() => deleteNpc(roomId, n.id).catch(console.error)}
        >
          <PillButton sm variant="dark" onClick={() => actions.dmState(t('stateCombat'), 'swords')}>
            {t('btnAttack')}
          </PillButton>
        </ListRow>
      ))}

      {showForm ? (
        <NpcForm
          onCancel={() => setShowForm(false)}
          onSubmit={(npc) => {
            addNpc(roomId, npc).catch(console.error)
            actions.flash('toastNpcCreated')
            setShowForm(false)
          }}
        />
      ) : (
        <PillButton full onClick={() => setShowForm(true)}>
          <Plus size={14} /> {t('createNpc')}
        </PillButton>
      )}
    </>
  )
}

/* ---------- Recursos ---------- */
function ResourcesTab({ roomId, resources, actions }: { roomId: string; resources: RoomResource[]; actions: NarratorActions }) {
  const { t } = useLocale()
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      <SecTitle>{t('secResources')}</SecTitle>
      <div className="grid grid-cols-2 gap-2.5">
        {resources.map((r) => (
          <div key={r.id} className="relative group">
            <button
              onClick={() => actions.dmImage(r)}
              className="w-full rounded-xl overflow-hidden border border-border aspect-[4/3] relative flex items-end hover:shadow-sm transition"
            >
              {r.imageUrl ? (
                <img src={r.imageUrl} alt={r.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <span className="absolute inset-0 striped" />
              )}
              <span className="relative w-full px-2 py-1.5 text-[10px] font-medium text-ink-light bg-gradient-to-t from-white/90 to-transparent text-left">
                {r.title}
              </span>
            </button>
            <button
              onClick={() => deleteResource(roomId, r.id).catch(console.error)}
              className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-ink/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              aria-label={t('formCancel')}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl border border-dashed border-border aspect-[4/3] flex items-center justify-center text-ink-faint hover:border-ink hover:text-ink transition"
          aria-label={t('uploadResource')}
        >
          <Plus size={20} />
        </button>
      </div>
      {resources.length === 0 && <p className="text-[11px] text-ink-faint">{t('resourcesEmpty')}</p>}
      <p className="text-[11px] text-ink-faint">{t('resourcesHint')}</p>

      {showForm && (
        <ResourceForm
          onCancel={() => setShowForm(false)}
          onSubmit={(res) => {
            addResource(roomId, res).catch(console.error)
            actions.flash('toastResourceAdded')
            setShowForm(false)
          }}
        />
      )}
    </>
  )
}

/* ---------- Jugadores ---------- */
function PlayersTab({ characters, memberCount, flash }: { characters: PlayerCharacter[]; memberCount: number; flash: (k: string) => void }) {
  const { t } = useLocale()
  return (
    <>
      <SecTitle>
        {t('ntabPlayers')} · {memberCount}
      </SecTitle>
      {characters.length === 0 && <p className="text-[12px] text-ink-faint">{t('playersEmpty')}</p>}
      {characters.map((c) => (
        <ListRow key={c.uid} av={(c.name?.[0] ?? '?').toUpperCase()} name={c.name} meta={[c.bloodline, c.background].filter(Boolean).join(' · ')}>
          <div className="flex flex-col items-end gap-1.5">
            <PillButton sm onClick={() => flash('toastSheetSoon')}>
              {t('viewSheet')}
            </PillButton>
          </div>
        </ListRow>
      ))}
    </>
  )
}

/* ---------- Dados ---------- */
function DiceTab({ actions }: { actions: NarratorActions }) {
  const { t } = useLocale()
  return (
    <>
      <SecTitle>{t('secQuickRoll')}</SecTitle>
      <PillButton variant="dark" full onClick={actions.onRoll}>
        <Dices size={14} /> {t('btnRollDie')}
      </PillButton>
      <PillButton full onClick={() => actions.flash('toastSecretRoll')}>
        <Dices size={14} /> {t('secretRoll')}
      </PillButton>
    </>
  )
}

/* ---------- Fila de lista reutilizable ---------- */
function ListRow({
  av,
  npc,
  name,
  meta,
  children,
  onDelete,
}: {
  av: ReactNode
  npc?: boolean
  name: string
  meta?: string
  children?: ReactNode
  onDelete?: () => void
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0">
      <div className={`w-[34px] h-[34px] rounded-[9px] shrink-0 flex items-center justify-center text-[12px] font-semibold ${npc ? 'border-[1.5px] border-ink text-ink' : 'bg-surface-2 border border-border text-ink-light'}`}>
        {av}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold truncate">{name}</div>
        {meta && <div className="text-[11px] text-ink-faint truncate">{meta}</div>}
      </div>
      {children}
      {onDelete && (
        <button onClick={onDelete} className="text-ink-faint hover:text-ink shrink-0" aria-label="delete">
          <X size={15} />
        </button>
      )}
    </div>
  )
}

/* ---------- Formularios inline ---------- */
const inputCls = 'w-full rounded-[11px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-ink transition'
const formWrap = 'flex flex-col gap-2.5 p-3.5 rounded-[14px] border border-border bg-surface-2'

function NpcForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (npc: Omit<Npc, 'id'>) => void }) {
  const { t } = useLocale()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kind, setKind] = useState<'npc' | 'enemy'>('npc')
  return (
    <div className={formWrap}>
      <input className={inputCls} placeholder={t('formName')} value={name} onChange={(e) => setName(e.target.value)} />
      <input className={inputCls} placeholder={t('formDescription')} value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex gap-2">
        <button className={`flex-1 rounded-[11px] py-2 text-[12px] font-semibold border transition ${kind === 'npc' ? 'bg-ink text-surface border-ink' : 'border-border text-ink-light'}`} onClick={() => setKind('npc')}>
          {t('formKindNpc')}
        </button>
        <button className={`flex-1 rounded-[11px] py-2 text-[12px] font-semibold border transition ${kind === 'enemy' ? 'bg-ink text-surface border-ink' : 'border-border text-ink-light'}`} onClick={() => setKind('enemy')}>
          {t('formKindEnemy')}
        </button>
      </div>
      <div className="flex gap-2">
        <PillButton className="flex-1" onClick={onCancel}>
          {t('formCancel')}
        </PillButton>
        <PillButton variant="dark" className="flex-1" disabled={!name.trim()} onClick={() => onSubmit({ name: name.trim(), description: description.trim(), kind })}>
          {t('formAdd')}
        </PillButton>
      </div>
    </div>
  )
}

function ResourceForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (res: Omit<RoomResource, 'id'>) => void }) {
  const { t } = useLocale()
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  return (
    <div className={formWrap}>
      <input className={inputCls} placeholder={t('formTitle')} value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className={inputCls} placeholder={t('formCaption')} value={caption} onChange={(e) => setCaption(e.target.value)} />
      <input className={inputCls} placeholder={t('formImageUrl')} value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
      <div className="flex gap-2">
        <PillButton className="flex-1" onClick={onCancel}>
          {t('formCancel')}
        </PillButton>
        <PillButton
          variant="dark"
          className="flex-1"
          disabled={!title.trim()}
          onClick={() => onSubmit({ title: title.trim(), caption: caption.trim() || t('expandLabel'), ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}) })}
        >
          {t('formAdd')}
        </PillButton>
      </div>
    </div>
  )
}

function LootForm({ shop, onCancel, onSubmit }: { shop: boolean; onCancel: () => void; onSubmit: (p: { shop: boolean; title: string; items: LootEntry[] }) => void }) {
  const { t } = useLocale()
  const [title, setTitle] = useState('')
  const [items, setItems] = useState('')
  return (
    <div className={formWrap}>
      <input className={inputCls} placeholder={t('formTitle')} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        rows={3}
        className={`${inputCls} resize-none`}
        placeholder={`${t('formItems')} — ${shop ? t('formItemsHintShop') : t('formItemsHintLoot')}`}
        value={items}
        onChange={(e) => setItems(e.target.value)}
      />
      <div className="flex gap-2">
        <PillButton className="flex-1" onClick={onCancel}>
          {t('formCancel')}
        </PillButton>
        <PillButton
          variant="dark"
          className="flex-1"
          disabled={!items.trim()}
          onClick={() => onSubmit({ shop, title: title.trim() || (shop ? t('shopDefaultTitle') : t('lootDefaultTitle')), items: parseLootLines(items, shop) })}
        >
          {t('formAdd')}
        </PillButton>
      </div>
    </div>
  )
}
