import { useEffect, useState } from 'react'
import { useI18n } from '@/app/providers/i18n'
import { useApiKey, useSaveApiKey } from '../model/use-api-key'

export function ApiKeyField() {
  const { t } = useI18n()
  const { data: savedKey } = useApiKey()
  const save = useSaveApiKey()
  const [value, setValue] = useState('')
  const [reveal, setReveal] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    if (savedKey !== undefined) setValue(savedKey)
  }, [savedKey])

  const onSave = async () => {
    await save.mutateAsync(value)
    setFlash(true)
    setTimeout(() => setFlash(false), 1600)
  }

  return (
    <>
      <label className="mb-2 block text-[15px] font-bold text-ink">{t('apikey_label')}</label>
      <div className="mb-3 flex gap-2.5">
        <div className="flex h-[52px] flex-1 items-center rounded-xl border-[1.5px] border-ink bg-input pl-4 pr-2">
          <input
            type={reveal ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t('apikey_placeholder')}
            spellCheck={false}
            autoComplete="off"
            className="min-w-0 flex-1 border-0 bg-transparent font-mono text-[15px] font-bold tracking-[0.5px] text-ink outline-none"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setReveal((r) => !r)}
            className="cursor-pointer border-0 bg-transparent p-1.5 text-base leading-none"
          >
            {reveal ? '🙈' : '👁'}
          </button>
        </div>
        <button
          onClick={onSave}
          className="w-[120px] flex-none cursor-pointer rounded-xl border-0 bg-ink text-sm font-bold text-cream transition-colors hover:bg-ink-hover"
        >
          {flash ? `${t('saved')} ✓` : t('save')}
        </button>
      </div>
      <div className="flex items-start gap-2 rounded-[10px] bg-cream-2 p-3.5 text-[13px] leading-[1.5] text-text-2">
        <span className="h-[18px] w-[18px] flex-none rounded-full bg-teal text-center font-mono text-[11px] font-bold leading-[18px] text-cream">
          i
        </span>
        <div>{t('apikey_info')}</div>
      </div>
    </>
  )
}
