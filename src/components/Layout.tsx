import { Outlet, useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import DiceScene from '@/babylon/DiceScene'

export default function Layout() {
  const { t } = useLocale()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <div className="w-full flex flex-col flex-1 min-h-screen border-x border-border">
        <header className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
              {t('appSubtitle')}
            </p>
            <p className="text-xl font-bold tracking-tight">{t('appName')}</p>
          </div>
          <button
            onClick={() => navigate('/settings')}
            className="text-ink-faint hover:text-ink transition-colors p-1"
            aria-label={t('navSettings')}
          >
            <SettingsIcon size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <DiceScene />
    </div>
  )
}
