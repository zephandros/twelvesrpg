import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLocale } from '@/contexts/LocaleContext'
import { useDice } from '@/contexts/DiceContext'

export default function Room() {
  const { id } = useParams<{ id: string }>()
  const { t } = useLocale()
  const navigate = useNavigate()
  const { setSessionId, roll, isRolling, lastRoll, recentRolls, settled } = useDice()

  useEffect(() => {
    if (id) setSessionId(id)
    return () => setSessionId(null)
  }, [id, setSessionId])

  return (
    <div className="px-5 py-6 max-w-lg mx-auto flex flex-col gap-8">
      <div>
        <button onClick={() => navigate('/')} className="text-xs text-ink-faint">
          {t('back')}
        </button>
        <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint mt-4 mb-1">
          {t('roomLabel')}
        </p>
        <p className="font-mono text-sm text-ink-faint">{id}</p>
      </div>

      {lastRoll && settled && (
        <div className="text-center py-2">
          <p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-ink-faint mb-3">
            {t('rollResult')}
          </p>
          <div className="flex items-center justify-center gap-6">
            <span className="text-6xl font-bold tabular-nums">{lastRoll.values[0]}</span>
            <span className="text-xl text-ink-faint">+</span>
            <span className="text-6xl font-bold tabular-nums">{lastRoll.values[1]}</span>
          </div>
          <p className="text-2xl font-light text-ink-faint mt-2">
            = {lastRoll.values[0] + lastRoll.values[1]}
          </p>
          <p className="text-[10px] text-ink-faint mt-3 tracking-wide">{lastRoll.playerName}</p>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={roll}
          disabled={isRolling}
          className="px-8 py-3 bg-accent text-surface rounded-xl text-sm font-semibold tracking-wide uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {isRolling ? t('rolling') : t('rollButton')}
        </button>
      </div>

      {recentRolls.length > 0 && (
        <div>
          <h2 className="text-[9px] font-semibold tracking-[0.16em] uppercase text-ink-faint mb-3">
            {t('rollHistory')}
          </h2>
          <ul className="flex flex-col gap-2">
            {recentRolls.map((r, i) => (
              <li
                key={i}
                className="bg-surface-2 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <span className="text-xs text-ink-faint">{r.playerName}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">{r.values[0]}</span>
                  <span className="text-ink-faint text-xs">+</span>
                  <span className="font-mono text-sm font-semibold">{r.values[1]}</span>
                  <span className="text-ink-faint text-xs ml-1">
                    = {r.values[0] + r.values[1]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
