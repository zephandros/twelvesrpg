import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, type Mode } from '@/contexts/ThemeContext'
import { useLocale } from '@/contexts/LocaleContext'
import { localeLabels } from '@/locales'
import { getFirebaseErrorKey } from '@/lib/firebaseError'
import { notify } from '@/lib/notify'
import { Pencil, X, Check } from 'lucide-react'

const MODES: Mode[] = ['light', 'dark']

export default function Settings() {
  const { user } = useAuth()
  const { mode, setMode } = useTheme()
  const { locale, setLocale, supportedLocales, t } = useLocale()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [initialName, setInitialName] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      const name = snap.exists()
        ? (snap.data().displayName ?? user.displayName ?? '')
        : (user.displayName ?? '')
      setDisplayName(name)
      setInitialName(name)
    })
  }, [user])

  async function handleSaveName() {
    if (!user) return
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { displayName, email: user.email, updatedAt: serverTimestamp() },
        { merge: true },
      )
      await updateProfile(user, { displayName })
      setInitialName(displayName)
      setEditing(false)
      notify(t('savedFeedback'), 'success')
    } catch (err: unknown) {
      notify(t(getFirebaseErrorKey(err)))
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    setDisplayName(initialName)
    setEditing(false)
  }

  async function handleSignOut() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  return (
    <div className="px-5 py-6 max-w-lg mx-auto flex flex-col gap-8">
      <button onClick={() => navigate(-1)} className="text-xs text-ink-faint self-start">
        {t('back')}
      </button>

      {/* Apariencia */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
          {t('appearanceSection')}
        </h2>
        <div className="flex border border-border rounded-xl overflow-hidden">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
                mode === m ? 'bg-accent text-surface' : 'text-ink-faint'
              }`}
            >
              {t(m === 'light' ? 'lightMode' : 'darkMode')}
            </button>
          ))}
        </div>
      </section>

      {/* Idioma */}
      <section className="flex flex-col gap-4">
        <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
          {t('languageSection')}
        </h2>
        <div className="flex border border-border rounded-xl overflow-hidden">
          {supportedLocales.map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wide transition-colors ${
                locale === l ? 'bg-accent text-surface' : 'text-ink-faint'
              }`}
            >
              {localeLabels[l] ?? l}
            </button>
          ))}
        </div>
      </section>

      {/* Cuenta */}
      <section className="flex flex-col gap-5">
        <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
          {t('accountSection')}
        </h2>

        <div className="flex flex-col gap-1">
          <label className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
            {t('displayNameLabel')}
          </label>
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <input
              ref={nameInputRef}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              readOnly={!editing}
              className="flex-1 text-base bg-transparent outline-none transition-colors"
            />
            {!editing ? (
              <button
                onClick={() => { setEditing(true); setTimeout(() => nameInputRef.current?.focus(), 0) }}
                className="pr-1 text-ink-faint hover:text-ink transition-colors"
                aria-label="Editar nombre"
              >
                <Pencil size={15} />
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="text-ink-faint hover:text-ink transition-colors disabled:opacity-40"
                  aria-label="Cancelar"
                >
                  <X size={15} />
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={saving}
                  className="text-ink hover:text-accent transition-colors disabled:opacity-40"
                  aria-label="Guardar"
                >
                  <Check size={15} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
            {t('emailFieldLabel')}
          </p>
          <p className="text-base border-b border-border pb-2 text-ink-faint">{user?.email}</p>
        </div>
      </section>

      {/* Cerrar sesión */}
      <section>
        <button
          onClick={handleSignOut}
          className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
        >
          {t('signOutButton')}
        </button>
      </section>
    </div>
  )
}
