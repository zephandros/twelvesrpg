import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  query,
  where,
  or,
  onSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/contexts/LocaleContext'

interface Room {
  id: string
  name: string
  description: string
  hostId: string
  code: string
  maxPlayers?: number
  players: string[]
}

function fromDoc(id: string, data: DocumentData): Room {
  return {
    id,
    name: data.name ?? '',
    description: data.description ?? '',
    hostId: data.hostId ?? '',
    code: data.code ?? '',
    maxPlayers: data.maxPlayers,
    players: data.players ?? [],
  }
}

function CopyCodeButton({ code }: { code: string }) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button onClick={handleClick} className="flex flex-col items-end gap-0.5 shrink-0">
      <span className="text-[10px] font-mono text-ink-faint tracking-widest">{code}</span>
      <span className="text-[8px] tracking-wide uppercase text-ink-faint opacity-60">
        {copied ? t('copied') : t('copy')}
      </span>
    </button>
  )
}

function RoomList({ rooms, label, emptyText }: { rooms: Room[]; label: string; emptyText: string }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
        {label}
      </h2>
      {rooms.length === 0 ? (
        <p className="text-sm text-ink-faint font-light">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <button
                onClick={() => navigate(`/room/${room.id}`)}
                className="w-full bg-surface-2 rounded-xl p-4 text-left flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-sm">{room.name}</p>
                  {room.description && (
                    <p className="text-xs text-ink-faint mt-0.5 font-light">{room.description}</p>
                  )}
                </div>
                <CopyCodeButton code={room.code} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'rooms'),
      or(
        where('hostId', '==', user.uid),
        where('players', 'array-contains', user.uid),
      ),
    )
    return onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => fromDoc(d.id, d.data())))
    })
  }, [user])

  const myRooms = rooms.filter((r) => r.hostId === user?.uid)
  const joinedRooms = rooms.filter((r) => r.hostId !== user?.uid)

  return (
    <div className="px-5 py-6 flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <span />
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/room/join')}
            className="px-4 py-2 border border-border rounded-xl text-xs font-medium text-ink-light"
          >
            {t('joinButton')}
          </button>
          <button
            onClick={() => navigate('/room/new')}
            className="px-4 py-2 bg-accent text-surface rounded-xl text-xs font-semibold tracking-wide uppercase"
          >
            {t('createButton')}
          </button>
        </div>
      </div>

      <RoomList rooms={myRooms} label={t('myRooms')} emptyText={t('noMyRooms')} />
      <RoomList rooms={joinedRooms} label={t('joinedRooms')} emptyText={t('noJoinedRooms')} />
    </div>
  )
}
