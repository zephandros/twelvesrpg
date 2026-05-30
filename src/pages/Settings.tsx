import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, type Mode } from '@/contexts/ThemeContext'
import { useLocale } from '@/contexts/LocaleContext'
import { localeLabels } from '@/locales'

const MODES: Mode[] = ['light', 'dark']

export default function Settings() {
  const { user } = useAuth()
  const { mode, setMode } = useTheme()
  const { locale, setLocale, supportedLocales, t } = useLocale()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState('')
  const [initialName, setInitialName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveErr, setSaveErr] = useState('')

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
    setSaveErr('')
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { displayName, email: user.email, updatedAt: serverTimestamp() },
        { merge: true },
      )
      await updateProfile(user, { displayName })
      setInitialName(displayName)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch {
      setSaveErr(t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  const hasChanges = displayName !== initialName

  return (
    <div className="px-5 py-6 flex flex-col gap-8">
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
          <input
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setSaveErr('') }}
            className="border-b border-border pb-2 text-base bg-transparent outline-none focus:border-ink transition-colors"
          />
        </div>

        {saveErr && <p className="text-[11px] text-red-500">{saveErr}</p>}

        {hasChanges && (
          <button
            onClick={handleSaveName}
            disabled={saving}
            className="self-start py-2 px-5 bg-accent text-surface text-xs font-semibold tracking-[0.06em] uppercase rounded-xl disabled:opacity-50"
          >
            {saving ? t('loading') : saved ? t('savedFeedback') : t('saveButton')}
          </button>
        )}

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
