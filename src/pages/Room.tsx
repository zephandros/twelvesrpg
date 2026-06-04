import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Swords, PanelRight } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import { useDice } from '@/contexts/DiceContext'
import { useAuth } from '@/hooks/useAuth'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useRoomAmbiance } from '@/hooks/useRoomAmbiance'
import { useRoom } from '@/features/room/hooks/useRoom'
import { useRoomThread } from '@/features/room/hooks/useRoomThread'
import { useRoomCharacter } from '@/features/room/hooks/useRoomCharacter'
import { useNarratorData } from '@/features/room/hooks/useNarratorData'
import { pushThreadItem, updateThreadItem } from '@/features/room/lib/thread'
import { parseComposer } from '@/features/room/commands'
import { evaluateRoll } from '@/features/room/diceResult'
import RoomBar from '@/features/room/RoomBar'
import Thread from '@/features/room/Thread'
import Composer from '@/features/room/Composer'
import Lightbox from '@/features/room/Lightbox'
import PlayerPanel from '@/features/room/PlayerPanel'
import NarratorPanel, { type NarratorActions } from '@/features/room/NarratorPanel'
import type { DistributiveOmit, ImageItem, LootEntry, NewThreadItem, RequestItem, StateIcon, ThreadItem } from '@/features/room/types'

/** Campos del ítem a crear; el orquestador rellena authorId/authorName/ts. */
type AddInput = DistributiveOmit<ThreadItem, 'id' | 'authorId' | 'authorName' | 'ts'> & {
  authorName?: string
}

export default function Room() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useLocale()
  const { user } = useAuth()
  const { setSessionId, roll } = useDice()
  const isDesktop = useMediaQuery('(min-width: 720px)')

  const { room, role, loading } = useRoom(id)
  useRoomAmbiance(id)
  const items = useRoomThread(id)
  const displayName = user?.displayName ?? user?.email ?? '?'
  const { character, loading: charLoading } = useRoomCharacter(id, user?.uid)
  const { npcs, resources, characters } = useNarratorData(id, role === 'narrator')

  const [view, setView] = useState<'partida' | 'panel'>('partida')
  const [input, setInput] = useState('')
  const [speakAs, setSpeakAs] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<ImageItem | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const threadRef = useRef<HTMLDivElement | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (id) setSessionId(id)
    return () => setSessionId(null)
  }, [id, setSessionId])

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [items, view, isDesktop])

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }, [])
  const flash = useCallback((key: string) => showToast(t(key)), [showToast, t])

  const memberCount = (room?.players?.length ?? 0) + 1
  const selfName = role === 'player' ? character?.name?.trim() || displayName : t('roleNarrator')

  const add = useCallback(
    (partial: AddInput) => {
      if (!id || !user) return
      const { authorName, ...rest } = partial
      pushThreadItem(id, {
        authorId: user.uid,
        authorName: authorName ?? selfName,
        ts: Date.now(),
        ...rest,
      } as NewThreadItem).catch(console.error)
    },
    [id, user, selfName],
  )

  const gotoPartida = () => setView('partida')
  const gotoPanel = () => {
    if (!isDesktop) setView('panel')
  }

  const doRoll = (attr: string, mod: number) => {
    const values = roll()
    if (!values) return
    const { total, result } = evaluateRoll(values, mod)
    add({ type: 'dice', attr, values, mod, total, result })
    gotoPartida()
  }

  const send = () => {
    const parsed = parseComposer(input)
    switch (parsed.kind) {
      case 'empty':
        return
      case 'error':
        flash(parsed.messageKey)
        return
      case 'roll':
        doRoll(t('freeRoll'), parsed.mod)
        break
      case 'whisper':
        add({ type: 'msg', variant: 'whisper', body: parsed.text })
        break
      case 'aside':
        add({ type: 'msg', variant: 'aside', body: parsed.text })
        break
      case 'text':
        if (speakAs) add({ type: 'msg', variant: 'npc', body: parsed.text, authorName: speakAs })
        else if (role === 'narrator') add({ type: 'narration', body: parsed.text })
        else add({ type: 'msg', variant: 'normal', body: parsed.text })
        break
    }
    setInput('')
  }

  /* acciones del Narrador */
  const dmRequest = (attr: string) => {
    add({ type: 'request', attr, done: false })
    gotoPartida()
    flash('toastRollRequested')
  }
  const dmImage = (resource: { title: string; caption: string; imageUrl?: string }) => {
    // RTDB rechaza valores undefined: solo incluir imageUrl si existe.
    add({
      type: 'image',
      title: resource.title,
      caption: resource.caption,
      body: resource.caption,
      ...(resource.imageUrl ? { imageUrl: resource.imageUrl } : {}),
    })
    gotoPartida()
    flash('toastImageShown')
  }
  const dmState = (label: string, icon: StateIcon) => {
    add({ type: 'state', label, icon })
    gotoPartida()
    showToast(label)
  }
  const speakNpc = (name: string) => {
    setSpeakAs(name)
    gotoPartida()
    showToast(`${t('speakingAs')} ${name}`)
    setTimeout(() => inputRef.current?.focus(), 60)
  }
  const createLoot = ({ shop, title, items: lootItems }: { shop: boolean; title: string; items: LootEntry[] }) => {
    add({ type: 'loot', shop, title, items: lootItems, taken: false })
    gotoPartida()
    flash(shop ? 'toastShopOpened' : 'toastLootOpened')
  }

  const resolveRequest = (item: RequestItem) => {
    const values = roll()
    if (!values) return
    const { total, result } = evaluateRoll(values, 0)
    add({ type: 'dice', attr: item.attr, values, mod: 0, total, result })
    if (id) updateThreadItem(id, item.id, { done: true }).catch(console.error)
  }
  const takeLoot = (itemId: string) => {
    if (id) updateThreadItem(id, itemId, { taken: true }).catch(console.error)
    flash('toastObjectsTaken')
  }

  const narratorActions: NarratorActions = {
    dmRequest,
    dmImage,
    dmState,
    speakNpc,
    createLoot,
    onRoll: () => doRoll(t('freeRoll'), 0),
    flash,
  }

  if (loading) {
    return <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-ink-faint">{t('loading')}</div>
  }
  if (!room || !user || !id) {
    return <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-ink-faint">{t('roomNotFound')}</div>
  }

  const subtitle =
    role === 'narrator'
      ? `${t('roleNarrator')} · ${memberCount} ${t('playersWord')}`
      : `${memberCount} ${t('onlineWord')}`

  const panel =
    role === 'player' ? (
      <PlayerPanel
        roomId={id}
        uid={user.uid}
        character={character}
        loading={charLoading}
        displayName={displayName}
        onRoll={() => doRoll(t('attribute'), 0)}
      />
    ) : (
      <NarratorPanel
        roomId={id}
        npcs={npcs}
        resources={resources}
        characters={characters}
        memberCount={memberCount}
        actions={narratorActions}
        withHeader={isDesktop}
      />
    )

  const composer = (
    <Composer
      role={role}
      value={input}
      setValue={setInput}
      onSend={send}
      speakAsName={speakAs}
      onCancelSpeakAs={() => setSpeakAs(null)}
      inputRef={inputRef}
      onAttach={() => flash('attachAction')}
      onRequest={() => dmRequest(t('attribute'))}
      onImage={() => (resources[0] ? dmImage(resources[0]) : (flash('toastNeedResource'), gotoPanel()))}
      onLoot={gotoPanel}
      onNpc={() => {
        const npc = npcs.find((n) => n.kind === 'npc')
        if (npc) speakNpc(npc.name)
        else gotoPanel()
      }}
    />
  )

  const thread = (
    <Thread
      items={items}
      uid={user.uid}
      role={role}
      onOpenImage={setLightbox}
      onTakeLoot={takeLoot}
      onResolveRequest={resolveRequest}
    />
  )

  const roomBar = (
    <RoomBar
      name={room.name}
      subtitle={subtitle}
      onBack={() => navigate('/')}
      onMembers={() => showToast(`${memberCount} ${t('playersWord')}`)}
      onTogglePanel={isDesktop ? undefined : () => setView((v) => (v === 'panel' ? 'partida' : 'panel'))}
    />
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-surface">
      {roomBar}

      {isDesktop ? (
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0 border-r border-border">
            <div ref={threadRef} className="flex-1 overflow-y-auto no-scrollbar px-6 pt-5 pb-2">
              <div className="w-full flex flex-col gap-0.5">{thread}</div>
            </div>
            <div className="border-t border-border px-6 py-3">{composer}</div>
          </div>
          <div className="w-[396px] shrink-0 flex flex-col">{panel}</div>
        </div>
      ) : (
        <>
          {view === 'partida' ? (
            <>
              <div ref={threadRef} className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-2 flex flex-col gap-0.5">
                {thread}
              </div>
              <div className="border-t border-border bg-surface">{composer}</div>
            </>
          ) : (
            panel
          )}

          <div className="flex gap-1 p-1.5 border-t border-border bg-surface shrink-0">
            <SegButton active={view === 'partida'} onClick={() => setView('partida')} icon={<Swords size={15} />} label={t('tabPartida')} />
            <SegButton
              active={view === 'panel'}
              onClick={() => setView('panel')}
              icon={<PanelRight size={15} />}
              label={role === 'narrator' ? t('tabPanelDM') : t('tabPanel')}
            />
          </div>
        </>
      )}

      {toast && (
        <div className="fixed left-1/2 bottom-20 -translate-x-1/2 z-[150] bg-ink text-surface text-[12px] font-medium px-4 py-2 rounded-full shadow-lg anim-toast-in">
          {toast}
        </div>
      )}
      <Lightbox item={lightbox} onClose={() => setLightbox(null)} />
    </div>
  )
}

function SegButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-[11px] transition-colors ${
        active ? 'bg-ink text-surface' : 'text-ink-faint hover:bg-surface-2'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
