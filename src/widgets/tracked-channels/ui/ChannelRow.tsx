import { useI18n } from '@/app/providers/i18n'
import { TrashIcon } from '@/shared/ui/icons'
import type { ChannelRowData } from '@/shared/types'

const AV_STRIPES = 'repeating-linear-gradient(135deg,#d8cdb8,#d8cdb8 5px,#cdc1a9 5px,#cdc1a9 10px)'
const iconBtn =
  'flex h-[30px] w-8 flex-none cursor-pointer items-center justify-center rounded-lg border border-[#d8cdb8] bg-transparent text-[15px] font-bold text-text-2 transition-colors hover:bg-cream-2 disabled:cursor-default disabled:opacity-70'

export function ChannelRow({
  ch,
  confirming,
  busy,
  onRefresh,
  onReset,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  ch: ChannelRowData
  confirming: boolean
  busy: boolean
  onRefresh: (id: string) => void
  onReset: (id: string) => void
  onAskDelete: (id: string) => void
  onCancelDelete: () => void
  onDelete: (id: string) => void
}) {
  const { t } = useI18n()
  const pct = ch.total ? Math.round((ch.watchedCount / ch.total) * 100) : 0
  const doneAttr = ch.jackpot ? 'true' : 'false'

  return (
    <div className="flex items-center gap-3.5 border-b border-track bg-input px-4 py-3.5 last:border-b-0">
      {ch.thumbnail ? (
        <img
          className="h-[38px] w-[38px] flex-none rounded-full object-cover"
          src={ch.thumbnail}
          alt=""
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="h-[38px] w-[38px] flex-none rounded-full" style={{ background: AV_STRIPES }} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-bold text-ink">
          <span className="truncate">{ch.title}</span>
          {ch.jackpot && <span className="flex-none font-mono text-[10px] font-bold text-teal">✓ 777</span>}
        </div>
        <div className="progress mt-1.5 h-1.5 max-w-[220px]">
          <div className="progress__fill" data-done={doneAttr} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {confirming ? (
        <div className="flex flex-none items-center gap-2">
          <span className="font-mono text-xs font-bold text-text-2">{t('delete_confirm')}</span>
          <button
            onClick={() => onDelete(ch.id)}
            className="cursor-pointer rounded-lg border-0 bg-red px-3 py-[7px] text-xs font-bold text-cream transition-colors hover:bg-red-hover"
          >
            {t('delete')}
          </button>
          <button
            onClick={onCancelDelete}
            className="cursor-pointer rounded-lg border border-[#d8cdb8] bg-transparent px-3 py-[7px] text-xs font-bold text-text-2 hover:bg-cream-2"
          >
            {t('cancel')}
          </button>
        </div>
      ) : (
        <>
          <div className={`flex-none font-mono text-sm font-bold ${ch.jackpot ? 'text-teal' : 'text-ink'}`}>
            {ch.watchedCount}{' '}
            <span className={ch.jackpot ? 'text-teal' : 'text-muted'}>/ {ch.total}</span>
          </div>
          <button
            className={iconBtn}
            title={t('refresh_title')}
            aria-label={t('refresh')}
            disabled={busy}
            onClick={() => onRefresh(ch.id)}
          >
            <span className={busy ? 'inline-block animate-spin' : ''}>↻</span>
          </button>
          <button
            className="flex-none cursor-pointer rounded-lg border border-[#d8cdb8] bg-transparent px-3 py-[7px] text-xs font-bold text-text-2 transition-colors hover:bg-cream-2"
            onClick={() => onReset(ch.id)}
          >
            {t('reset')}
          </button>
          <button
            className={`${iconBtn} hover:border-red hover:bg-red/10 hover:text-red`}
            title={t('delete_title')}
            aria-label={t('delete_title')}
            onClick={() => onAskDelete(ch.id)}
          >
            <TrashIcon />
          </button>
        </>
      )}
    </div>
  )
}
