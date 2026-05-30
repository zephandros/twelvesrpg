import { useState, type FormEvent } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useLocale } from '@/contexts/LocaleContext'
import { getFirebaseErrorKey } from '@/lib/firebaseError'
import { notify } from '@/lib/notify'

type Mode = 'login' | 'register'

export default function Login() {
  const { t } = useLocale()
  const [mode, setMode] = useState<Mode>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(m: Mode) {
    setMode(m)
    setDisplayName('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(user, { displayName })
        await setDoc(doc(db, 'users', user.uid), {
          displayName,
          email: user.email,
          createdAt: serverTimestamp(),
        })
      }
    } catch (err: unknown) {
      notify(t(getFirebaseErrorKey(err)))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-1">
            {t('appSubtitle')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{t('appName')}</h1>
        </div>

        <div className="flex border-b border-border mb-6">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 pb-2.5 text-[11px] font-medium tracking-[0.06em] uppercase transition-colors border-b-2 -mb-px ${
                mode === m ? 'text-ink border-ink' : 'text-ink-faint border-transparent'
              }`}
            >
              {m === 'login' ? t('loginTab') : t('registerTab')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {mode === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
                {t('displayNameLabel')}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="border-b border-border pb-2 text-base bg-transparent outline-none focus:border-ink transition-colors"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
              {t('emailLabel')}
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
              {t('passwordLabel')}
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

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 bg-accent text-surface text-xs font-semibold tracking-[0.06em] uppercase rounded-xl disabled:opacity-50 transition-opacity"
          >
            {loading ? t('loading') : mode === 'login' ? t('signInButton') : t('registerButton')}
          </button>
        </form>
      </div>
    </div>
  )
}
