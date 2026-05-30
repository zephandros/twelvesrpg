import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/contexts/LocaleContext'

export default function JoinRoom() {
  const { user } = useAuth()
  const { t } = useLocale()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const snap = await getDocs(
        query(collection(db, 'rooms'), where('code', '==', code.trim().toUpperCase())),
      )
      if (snap.empty) {
        setError(t('invalidCodeError'))
        return
      }
      const roomDoc = snap.docs[0]
      await updateDoc(roomDoc.ref, { players: arrayUnion(user.uid) })
      navigate(`/room/${roomDoc.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('joinRoomError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-5 py-6 max-w-sm mx-auto">
      <button onClick={() => navigate(-1)} className="text-xs text-ink-faint mb-6 block">
        {t('back')}
      </button>

      <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint mb-6">
        {t('joinRoomTitle')}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
            {t('roomCodeLabel')}
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={t('roomCodePlaceholder')}
            maxLength={6}
            required
            className="border-b border-border pb-2 text-xl font-mono tracking-[0.2em] bg-transparent outline-none focus:border-ink transition-colors uppercase"
          />
        </div>

        {error && <p className="text-[11px] text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || code.length < 6}
          className="mt-2 py-3 bg-accent text-surface text-xs font-semibold tracking-[0.06em] uppercase rounded-xl disabled:opacity-50"
        >
          {loading ? t('loading') : t('joinRoomButton')}
        </button>
      </form>
    </div>
  )
}
