import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { t as translate, type Vars } from '@/shared/i18n'
import { KEY_SETTINGS, DEFAULT_SETTINGS } from '@/shared/config/constants'
import type { Language, Settings } from '@/shared/types'

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string, vars?: Vars) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(DEFAULT_SETTINGS.language)

  useEffect(() => {
    let alive = true
    chrome.storage.local.get(KEY_SETTINGS).then((out) => {
      const s = out[KEY_SETTINGS] as Settings | undefined
      if (alive && s?.language) setLangState(s.language)
    })
    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string,
    ) => {
      if (area === 'local' && changes[KEY_SETTINGS]) {
        const next = (changes[KEY_SETTINGS].newValue as Settings | undefined)?.language
        if (next) setLangState(next)
      }
    }
    chrome.storage.onChanged.addListener(onChange)
    return () => {
      alive = false
      chrome.storage.onChanged.removeListener(onChange)
    }
  }, [])

  const value: I18nContextValue = {
    lang,
    setLang: setLangState,
    t: (key, vars) => translate(lang, key, vars),
  }
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
