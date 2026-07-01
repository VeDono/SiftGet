import { useRef } from 'react'
import { useI18n } from '@/app/providers/i18n'
import { useBackup } from '@/features/backup/model/use-backup'

export function Backup() {
  const { t } = useI18n()
  const { exportNow, importFrom, imported } = useBackup()
  const fileRef = useRef<HTMLInputElement>(null)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-importing the same file
    if (!file) return
    if (!window.confirm(t('import_confirm'))) return
    try {
      await importFrom(file)
    } catch {
      window.alert('Invalid backup file')
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="max-w-[440px] text-[13px] leading-[1.5] text-muted">{t('backup_desc')}</div>
      <div className="flex flex-none gap-2.5">
        <button
          onClick={() => exportNow()}
          className="cursor-pointer rounded-[10px] border-[1.5px] border-ink bg-transparent px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-cream-2"
        >
          ↧ {t('export_data')}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-[10px] border-0 bg-ink px-4 py-2.5 text-sm font-bold text-cream transition-colors hover:bg-ink-hover"
        >
          {imported ? t('imported_ok') : `↥ ${t('import_data')}`}
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onPick} className="hidden" />
      </div>
    </div>
  )
}
