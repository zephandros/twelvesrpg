import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

function generateCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function CreateRoom() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [maxPlayers, setMaxPlayers] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const doc = await addDoc(collection(db, 'rooms'), {
        name: name.trim(),
        description: description.trim(),
        maxPlayers: maxPlayers ? parseInt(maxPlayers) : null,
        hostId: user.uid,
        players: [],
        code: generateCode(),
        createdAt: serverTimestamp(),
      })
      navigate(`/room/${doc.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la sala')
      setLoading(false)
    }
  }

  return (
    <div className="px-5 py-6 max-w-sm mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="text-xs text-ink-faint mb-6 block"
      >
        ← Volver
      </button>

      <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint mb-6">
        Nueva sala
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="border-b border-border pb-2 text-base bg-transparent outline-none focus:border-ink transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
            Descripción <span className="font-light normal-case tracking-normal">(opcional)</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border-b border-border pb-2 text-base bg-transparent outline-none focus:border-ink transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
            Máx. jugadores <span className="font-light normal-case tracking-normal">(opcional)</span>
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            className="border-b border-border pb-2 text-base bg-transparent outline-none focus:border-ink transition-colors"
          />
        </div>

        {error && <p className="text-[11px] text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 py-3 bg-accent text-surface text-xs font-semibold tracking-[0.06em] uppercase rounded-xl disabled:opacity-50"
        >
          {loading ? '...' : 'Crear sala'}
        </button>
      </form>
    </div>
  )
}
