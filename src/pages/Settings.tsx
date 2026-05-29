import { useAuth } from '@/hooks/useAuth'

export default function Settings() {
  const { user } = useAuth()

  return (
    <div className="px-5 py-6">
      <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint mb-6">
        Cuenta
      </h2>
      <div className="flex flex-col gap-1">
        <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint">
          Correo
        </p>
        <p className="text-base border-b border-border pb-2">{user?.email}</p>
      </div>
    </div>
  )
}
