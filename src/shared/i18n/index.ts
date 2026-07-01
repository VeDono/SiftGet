import type { Language } from '@/shared/types'
import { dict } from './dict'

export { LANGUAGES } from './dict'
export type TranslateKey = keyof (typeof dict)['en']
export type Vars = Record<string, string | number>

/** Translate a key for a language, interpolating {var} placeholders. */
export function t(lang: Language, key: string, vars?: Vars): string {
  const table = dict[lang] ?? dict.en
  let str = table[key] ?? dict.en[key]
  if (str === undefined) return key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v))
    }
  }
  return str
}
