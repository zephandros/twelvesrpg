import { createContext, useContext, useState } from 'react'
import { locales, supportedLocales, LOCALE_STORAGE_KEY, DEFAULT_LOCALE } from '@/locales'

interface LocaleContextValue {
  locale: string
  supportedLocales: string[]
  setLocale: (l: string) => void
  t: (key: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    return stored && supportedLocales.includes(stored) ? stored : DEFAULT_LOCALE
  })

  function t(key: string): string {
    return locales[locale]?.[key] ?? locales[DEFAULT_LOCALE]?.[key] ?? key
  }

  function setLocale(l: string) {
    if (!supportedLocales.includes(l)) return
    localStorage.setItem(LOCALE_STORAGE_KEY, l)
    setLocaleState(l)
  }

  return (
    <LocaleContext.Provider value={{ locale, supportedLocales, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
