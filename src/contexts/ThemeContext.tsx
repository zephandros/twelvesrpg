import { createContext, useContext, useEffect, useState } from 'react'

export type Mode = 'light' | 'dark'
export type Ambiance = 'default' | 'sunset' | 'morning' | 'night' | 'neon' | 'phosphor'

const STORAGE_KEY = 'twelves-mode'

interface ThemeContextValue {
  mode: Mode
  ambiance: Ambiance
  setMode: (m: Mode) => void
  setAmbiance: (a: Ambiance) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Mode) ?? 'light'
  })
  const [ambiance, setAmbianceState] = useState<Ambiance>('default')

  // Hydrate HTML attributes on mount and whenever they change
  useEffect(() => {
    const el = document.documentElement
    el.dataset.mode = mode
    if (ambiance === 'default') {
      delete el.dataset.ambiance
    } else {
      el.dataset.ambiance = ambiance
    }
  }, [mode, ambiance])

  function setMode(m: Mode) {
    localStorage.setItem(STORAGE_KEY, m)
    setModeState(m)
  }

  function setAmbiance(a: Ambiance) {
    setAmbianceState(a)
  }

  return (
    <ThemeContext.Provider value={{ mode, ambiance, setMode, setAmbiance }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
