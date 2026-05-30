import raw from './translations.csv?raw'

type LocaleMap = Record<string, Record<string, string>>

function parseTranslations(csv: string): { locales: LocaleMap; supportedLocales: string[] } {
  const lines = csv.trim().split('\n').filter((l) => l.trim() !== '')
  const headers = lines[0].split('|').map((h) => h.trim())
  const supportedLocales = headers.slice(1) // everything after 'key'

  const locales: LocaleMap = {}
  supportedLocales.forEach((locale) => (locales[locale] = {}))

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('|').map((c) => c.trim())
    const key = cols[0]
    supportedLocales.forEach((locale, idx) => {
      locales[locale][key] = cols[idx + 1] ?? ''
    })
  }

  return { locales, supportedLocales }
}

export const { locales, supportedLocales } = parseTranslations(raw)

export const LOCALE_STORAGE_KEY = 'twelves-locale'
export const DEFAULT_LOCALE = 'es'

export const localeLabels: Record<string, string> = {
  es: 'Español',
  en: 'English',
}
