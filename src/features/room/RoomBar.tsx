import { ArrowLeft, Users, PanelRight } from 'lucide-react'

interface RoomBarProps {
  name: string
  subtitle: string
  onBack: () => void
  onMembers: () => void
  onTogglePanel?: () => void
}

const iconBtn =
  'w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-ink-light shrink-0 hover:bg-surface-2 active:scale-95 transition'

export default function RoomBar({ name, subtitle, onBack, onMembers, onTogglePanel }: RoomBarProps) {
  return (
    <div className="flex items-center gap-3 px-4 pt-2.5 pb-3 border-b border-border shrink-0">
      <button className={iconBtn} onClick={onBack} aria-label="back">
        <ArrowLeft size={19} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold tracking-tight text-ink truncate">{name}</div>
        <div className="flex items-center gap-1.5 text-[11px] text-ink-faint mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          {subtitle}
        </div>
      </div>
      <button className={iconBtn} onClick={onMembers} aria-label="members">
        <Users size={19} />
      </button>
      {onTogglePanel && (
        <button className={iconBtn} onClick={onTogglePanel} aria-label="panel">
          <PanelRight size={19} />
        </button>
      )}
    </div>
  )
}
