import { useParams, useNavigate } from 'react-router-dom'

export default function Room() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div className="px-5 py-6 text-center">
      <button
        onClick={() => navigate('/')}
        className="text-xs text-ink-faint mb-8 block mx-auto"
      >
        ← Volver
      </button>
      <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-2">
        Sala
      </p>
      <p className="font-mono text-sm text-ink-faint">{id}</p>
      <p className="text-sm text-ink-faint font-light mt-8">
        Vista de sala — Fase 2
      </p>
    </div>
  )
}
