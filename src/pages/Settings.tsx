import { useAuth } from '@/hooks/useAuth'
import { useTheme, type Mode } from '@/contexts/ThemeContext'

const MODES: { value: Mode; label: string }[] = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
]

export default function Settings() {
  const { user } = useAuth()
  const { mode, setMode } = useTheme()

  return (
    <div className="px-5 py-6 flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
          Apariencia
        </h2>
        <div className="flex border border-border rounded-xl overflow-hidden">
          {MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`flex-1 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
                mode === value
                  ? 'bg-accent text-surface'
                  : 'text-ink-faint'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
          Cuenta
        </h2>
        <div className="flex flex-col gap-1">
          <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
            Correo
          </p>
          <p className="text-base border-b border-border pb-2">{user?.email}</p>
        </div>
      </section>
    </div>
  )
}
