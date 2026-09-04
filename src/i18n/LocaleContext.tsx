import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { dictionaries, type Dict } from './locales'
import { LANGUAGES, CURRENCIES, defaultCurrencyForLang, getCurrency, fmtMoney, type CurrencyCode, type LangCode } from './config'

interface LocaleContextValue {
  lang: LangCode
  setLang: (l: LangCode) => void
  t: Dict
  dir: 'ltr' | 'rtl'
  currency: CurrencyCode
  setCurrency: (c: CurrencyCode) => void
  fmt: (usd: number) => string   // format a USD amount in active currency
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function readStored(key: string, fallback: string): string {
  try {
    const v = localStorage.getItem(key)
    return v || fallback
  } catch {
    return fallback
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    const saved = readStored('cs_lang', '')
    return (LANGUAGES.some((l) => l.code === saved) ? saved : 'en') as LangCode
  })
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = readStored('cs_currency', '')
    if (CURRENCIES.some((c) => c.code === saved)) return saved as CurrencyCode
    return defaultCurrencyForLang(lang)
  })

  const setLang = useCallback((l: LangCode) => {
    setLangState(l)
    try {
      localStorage.setItem('cs_lang', l)
    } catch { /* ignore */ }
  }, [])

  const t: Dict = dictionaries[lang] ?? dictionaries.en

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c)
    try {
      localStorage.setItem('cs_currency', c)
    } catch { /* ignore */ }
  }, [])
  const dir = t.dir === 'rtl' ? 'rtl' : 'ltr'

  // Keep document html lang & dir in sync
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    document.title = t.metaTitle
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', t.metaDesc)
  }, [lang, dir, t])

  const fmt = useCallback(
    (usd: number) => {
      const cur = getCurrency(currency)
      return fmtMoney(usd, cur.symbol, cur.rate)
    },
    [currency],
  )

  const value = useMemo<LocaleContextValue>(
    () => ({ lang, setLang, t, dir, currency, setCurrency, fmt }),
    [lang, setLang, t, dir, currency, setCurrency, fmt],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
