import { useAuth } from '@/hooks/useAuth'
import { useTheme, type Mode } from '@/contexts/ThemeContext'
import { useLocale } from '@/contexts/LocaleContext'
import { localeLabels } from '@/locales'

const MODES: Mode[] = ['light', 'dark']

export default function Settings() {
  const { user } = useAuth()
  const { mode, setMode } = useTheme()
  const { locale, setLocale, supportedLocales, t } = useLocale()

  return (
    <div className="px-5 py-6 flex flex-col gap-8">
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

      <section className="flex flex-col gap-4">
        <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
          {t('accountSection')}
        </h2>
        <div className="flex flex-col gap-1">
          <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
            {t('emailFieldLabel')}
          </p>
          <p className="text-base border-b border-border pb-2">{user?.email}</p>
        </div>
      </section>
    </div>
  )
}
