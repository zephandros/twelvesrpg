import { Outlet, NavLink } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

export default function Layout() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Shell centrado con ancho máximo */}
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 min-h-screen border-x border-border">
        <header className="border-b border-border px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
              Sistema de rol
            </p>
            <p className="text-xl font-bold tracking-tight">TWELVES</p>
          </div>
          {user && (
            <button
              onClick={() => signOut(auth)}
              className="text-xs text-ink-faint hover:text-ink transition-colors"
            >
              Salir
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
            Salas
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-[10px] font-semibold tracking-widest uppercase transition-colors ${
                isActive ? 'text-ink' : 'text-ink-faint'
              }`
            }
          >
            Ajustes
          </NavLink>
        </nav>
      </div>
    </div>
  )
}
