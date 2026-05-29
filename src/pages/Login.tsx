import { useState, type FormEvent } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

type Mode = 'login' | 'register'

export default function Login() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-1">
            Sistema de rol
          </p>
          <h1 className="text-3xl font-bold tracking-tight">TWELVES</h1>
        </div>

        <div className="flex border-b border-border mb-6">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              className={`flex-1 pb-2.5 text-[11px] font-medium tracking-[0.06em] uppercase transition-colors border-b-2 -mb-px ${
                mode === m
                  ? 'text-ink border-ink'
                  : 'text-ink-faint border-transparent'
              }`}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-b border-border pb-2 text-base bg-transparent outline-none focus:border-ink transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="border-b border-border pb-2 text-base bg-transparent outline-none focus:border-ink transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 bg-ink text-white text-xs font-semibold tracking-[0.06em] uppercase rounded-xl disabled:opacity-50 transition-opacity"
          >
            {loading ? '...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
