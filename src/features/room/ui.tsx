import type { ReactNode } from 'react'

/** Etiqueta "eyebrow": 9px, 600, mayúsculas, tracking ancho. */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint ${className}`}>
      {children}
    </div>
  )
}

/** Título de sección con línea horizontal a la derecha. */
export function SecTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint">
      <span>{children}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  )
}

type BtnVariant = 'default' | 'dark'

/** Botón "pill" del sistema de la Sala. */
export function PillButton({
  children,
  onClick,
  variant = 'default',
  full = false,
  sm = false,
  disabled = false,
  type = 'button',
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: BtnVariant
  full?: boolean
  sm?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-[11px] font-semibold tracking-[0.04em] border transition-colors active:scale-95 disabled:opacity-50'
  const size = sm ? 'text-[10px] px-2.5 py-1.5' : 'text-[11px] px-3.5 py-2'
  const look =
    variant === 'dark'
      ? 'bg-ink text-surface border-ink hover:opacity-90'
      : 'bg-surface text-ink-light border-border hover:border-ink hover:text-ink'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${size} ${look} ${full ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  )
}
