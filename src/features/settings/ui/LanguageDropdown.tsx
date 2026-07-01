import { useEffect, useRef, useState } from 'react'
import { useI18n } from '@/app/providers/i18n'
import { LANGUAGES } from '@/shared/i18n'
import type { Language } from '@/shared/types'
import { usePatchSettings } from '../model/use-settings'

export function LanguageDropdown() {
  const { lang, setLang, t } = useI18n()
  const patch = usePatchSettings()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const choose = (code: Language) => {
    setLang(code)
    patch.mutate({ language: code })
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-[46px] w-full cursor-pointer items-center justify-between rounded-[11px] border-[1.5px] border-ink bg-input px-3.5"
      >
        <span className="flex items-center gap-2.5 text-sm font-bold text-ink">
          <span className="h-2 w-2 rounded-sm bg-amber" />
          {current.label}
        </span>
        <span className="font-mono text-[11px] font-bold text-muted">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute inset-x-0 z-10 mt-1.5 overflow-hidden rounded-[11px] border border-line bg-input shadow-[0_14px_30px_-14px_rgba(36,27,46,0.45)]">
          {LANGUAGES.map((l) => (
            <div
              key={l.code}
              onClick={() => choose(l.code)}
              data-sel={l.code === lang}
              className="flex cursor-pointer items-center justify-between border-t border-[#efe7d8] px-3.5 py-[11px] text-sm font-semibold text-ink first:border-t-0 hover:bg-[#f0e8d9] data-[sel=true]:bg-cream-2 data-[sel=true]:font-bold"
            >
              <span>{l.label}</span>
              {l.code === lang && <span className="font-mono text-[13px] font-bold text-teal">✓</span>}
            </div>
          ))}
          <div className="border-t border-[#efe7d8] bg-cream px-3.5 py-[9px] font-mono text-[11px] leading-[1.3] text-[#a99c8a]">
            {t('language_more')}
          </div>
        </div>
      )}
    </div>
  )
}
