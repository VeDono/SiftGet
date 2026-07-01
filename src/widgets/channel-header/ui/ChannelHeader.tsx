import { useI18n } from '@/app/providers/i18n'
import { GearButton } from '@/shared/ui/icons'
import type { ChannelHeader as ChannelHeaderData } from '@/shared/types'

const STRIPES = 'repeating-linear-gradient(135deg,#4a3d5c,#4a3d5c 5px,#3a3047 5px,#3a3047 10px)'

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
}: {
  channel?: ChannelHeaderData | null
  onSettings: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex h-14 flex-none items-center gap-[11px] bg-ink px-3.5">
      <Avatar src={channel?.thumbnail} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold leading-[1.1] text-cream">
          {channel?.title || '—'}
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] leading-[1.2] tracking-[0.5px] text-muted-dark">
          {channel?.displayUrl || 'youtube.com'}
        </div>
      </div>
      <GearButton title={t('settings_title')} onClick={onSettings} />
    </div>
  )
}
