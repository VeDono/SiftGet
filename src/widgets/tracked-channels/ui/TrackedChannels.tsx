import { useState } from 'react'
import { useI18n } from '@/app/providers/i18n'
import {
  useChannels,
  useRefreshChannel,
  useResetChannel,
  useDeleteChannel,
} from '@/features/channels/model/use-channels'
import { ChannelRow } from './ChannelRow'

export function TrackedChannels() {
  const { t } = useI18n()
  const { data: channels = [] } = useChannels()
  const refresh = useRefreshChannel()
  const reset = useResetChannel()
  const del = useDeleteChannel()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (channels.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-track p-6 text-center text-sm leading-[1.5] text-muted">
        {t('channels_empty')}
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-track">
      {channels.map((ch) => (
        <ChannelRow
          key={ch.id}
          ch={ch}
          confirming={confirmId === ch.id}
          busy={refresh.isPending && refresh.variables === ch.id}
          onRefresh={(id) => refresh.mutate(id)}
          onReset={(id) => reset.mutate(id)}
          onAskDelete={setConfirmId}
          onCancelDelete={() => setConfirmId(null)}
          onDelete={(id) => {
            del.mutate(id)
            setConfirmId(null)
          }}
        />
      ))}
    </div>
  )
}
