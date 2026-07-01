import { useMutation, useQueryClient } from '@tanstack/react-query'
import { setChannelTracked } from '@/entities/channel/api/channel-storage'
import { POPUP_KEY, type PopupQueryData } from '@/features/channel-state/model/use-popup-state'
import { CHANNELS_KEY } from '@/features/channels/model/use-channels'

// Toggle whether the current channel appears in the options "tracked channels" list.
export function useTrackChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ channelId, tracked }: { channelId: string; tracked: boolean }) =>
      setChannelTracked(channelId, tracked),
    onSuccess: (_res, { tracked }) => {
      qc.setQueryData<PopupQueryData>(POPUP_KEY, (old) =>
        old ? { ...old, state: { ...old.state, tracked } } : old,
      )
      qc.invalidateQueries({ queryKey: CHANNELS_KEY })
    },
  })
}
