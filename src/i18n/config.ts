// ===== Locale & currency configuration =====

export type LangCode = 'en' | 'zh' | 'es' | 'fr' | 'ar'

export interface LanguageDef {
  code: LangCode
  label: string      // English name for switcher
  native: string     // name in its own language
  flag: string
  dir: 'ltr' | 'rtl'
}

export const LANGUAGES: LanguageDef[] = [
  { code: 'en', label: 'English', native: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'zh', label: 'Chinese', native: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'es', label: 'Spanish', native: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', label: 'French', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', label: 'Arabic', native: 'العربية', flag: '🇸🇦', dir: 'rtl' },
]

export type CurrencyCode = 'USD' | 'GBP' | 'EUR' | 'AED' | 'SAR' | 'CNY'

export interface CurrencyDef {
  code: CurrencyCode
  symbol: string
  // approximate reference rate vs USD (for display only)
  rate: number
  regions: string
}

export const CURRENCIES: CurrencyDef[] = [
  { code: 'USD', symbol: '$', rate: 1, regions: 'US · Worldwide' },
  { code: 'GBP', symbol: '£', rate: 0.78, regions: 'United Kingdom' },
  { code: 'EUR', symbol: '€', rate: 0.92, regions: 'European Union' },
  { code: 'AED', symbol: 'د.إ', rate: 3.67, regions: 'UAE · Gulf' },
  { code: 'SAR', symbol: 'ر.س', rate: 3.75, regions: 'Saudi Arabia · Gulf' },
  { code: 'CNY', symbol: '¥', rate: 7.1, regions: 'China' },
]

export function getCurrency(code: CurrencyCode): CurrencyDef {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]
}

export function getLanguage(code: LangCode): LanguageDef {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}

// Format a USD amount into the active currency
export function convert(usd: number, rate: number): number {
  return usd * rate
}

export function fmtMoney(usd: number, symbol: string, rate: number): string {
  const v = Math.round(usd * rate)
  return `${symbol}${v.toLocaleString('en-US')}`
}

// Map a language to a sensible default currency for target markets
export function defaultCurrencyForLang(code: LangCode): CurrencyCode {
  switch (code) {
    case 'en': return 'USD'
    case 'zh': return 'CNY'
    case 'es': return 'USD'   // target: US Hispanic + LATAM USD
    case 'fr': return 'EUR'
    case 'ar': return 'AED'   // target: Gulf / Middle East
    default: return 'USD'
  }
}
