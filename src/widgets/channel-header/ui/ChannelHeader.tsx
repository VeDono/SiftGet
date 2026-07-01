import { useI18n } from '@/app/providers/i18n'
import { GearButton } from '@/shared/ui/icons'
import type { ChannelHeader as ChannelHeaderData } from '@/shared/types'

const STRIPES = 'repeating-linear-gradient(135deg,#4a3d5c,#4a3d5c 5px,#3a3047 5px,#3a3047 10px)'

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.6l2.7 5.9 6.5.6-4.9 4.3 1.5 6.4L12 16.9 6.2 19.8l1.5-6.4L2.8 9.1l6.5-.6z"
        fill={filled ? '#E8A63C' : 'none'}
        stroke={filled ? '#E8A63C' : '#A99FB0'}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Avatar({ src }: { src?: string }) {
  if (src) {
    return (
      <img
        className="h-[34px] w-[34px] flex-none rounded-full border-[1.5px] border-amber object-cover"
        src={src}
        alt=""
        referrerPolicy="no-referrer"
      />
    )
  }
  return (
    <div
      className="h-[34px] w-[34px] flex-none rounded-full border-[1.5px] border-amber"
      style={{ background: STRIPES }}
    />
  )
}

export function ChannelHeader({
  channel,
  onSettings,
  tracked,
  onToggleTrack,
}: {
  channel?: ChannelHeaderData | null
  onSettings: () => void
  tracked?: boolean
  onToggleTrack?: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex h-14 flex-none items-center gap-2.5 bg-ink px-3.5">
      <Avatar src={channel?.thumbnail} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold leading-[1.1] text-cream">
          {channel?.title || '—'}
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] leading-[1.2] tracking-[0.5px] text-muted-dark">
          {channel?.displayUrl || 'youtube.com'}
        </div>
      </div>
      {onToggleTrack && (
        <button
          title={tracked ? t('track_remove') : t('track_add')}
          aria-label={tracked ? t('track_remove') : t('track_add')}
          onClick={onToggleTrack}
          className="flex h-[30px] w-[30px] flex-none cursor-pointer items-center justify-center rounded-lg border-0 bg-cream/12 transition-colors hover:bg-cream/20"
        >
          <StarIcon filled={!!tracked} />
        </button>
      )}
      <GearButton title={t('settings_title')} onClick={onSettings} />
    </div>
  )
}
