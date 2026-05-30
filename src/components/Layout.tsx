import { Outlet, NavLink } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from '@/contexts/LocaleContext'

export default function Layout() {
  const { user } = useAuth()
  const { t } = useLocale()

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-screen border-x border-border">
        <header className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
              {t('appSubtitle')}
            </p>
            <p className="text-xl font-bold tracking-tight">{t('appName')}</p>
          </div>
          {user && (
            <button
              onClick={() => signOut(auth)}
              className="text-xs text-ink-faint hover:text-ink transition-colors"
            >
              {t('navSignOut')}
            </button>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

        <nav className="border-t border-border flex">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-[10px] font-semibold tracking-widest uppercase transition-colors ${
                isActive ? 'text-ink' : 'text-ink-faint'
              }`
            }
          >
            {t('navRooms')}
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-[10px] font-semibold tracking-widest uppercase transition-colors ${
                isActive ? 'text-ink' : 'text-ink-faint'
              }`
            }
          >
            {t('navSettings')}
          </NavLink>
        </nav>
      </div>
    </div>
  )
}
