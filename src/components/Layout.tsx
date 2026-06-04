import { Outlet, useNavigate, useMatch } from 'react-router-dom'
import { Settings as SettingsIcon } from 'lucide-react'
import { useLocale } from '@/contexts/LocaleContext'
import DiceScene from '@/babylon/DiceScene'

export default function Layout() {
  const { t } = useLocale()
  const navigate = useNavigate()

  // En la Sala (detalle), la propia roombar hace de cabecera y el chat
  // gestiona su scroll interno, así que ocultamos la cabecera de la app.
  const roomMatch = useMatch('/room/:id')
  const inRoom = !!roomMatch && roomMatch.params.id !== 'new' && roomMatch.params.id !== 'join'

  return (
    <div className="h-dvh flex flex-col bg-surface">
      <div className="w-full flex flex-col flex-1 min-h-0 border-x border-border">
        {!inRoom && (
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
        )}

        <main className={`flex-1 min-h-0 flex flex-col ${inRoom ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <Outlet />
        </main>
      </div>
      <DiceScene />
    </div>
  )
}
