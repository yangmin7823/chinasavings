import { en } from './en'
import { zh } from './zh'
import { es } from './es'
import { fr } from './fr'
import { ar } from './ar'
import type { LangCode } from '../config'

export type { Dict } from './en'

export const dictionaries: Record<LangCode, typeof en> = {
  en,
  zh,
  es,
  fr,
  ar,
}
