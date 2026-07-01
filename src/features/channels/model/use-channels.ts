import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listChannels, resetWatched, removeChannel } from '@/entities/channel/api/channel-storage'
import { refreshChannel } from '@/shared/api/messaging'
import type { ChannelRowData } from '@/shared/types'

export const CHANNELS_KEY = ['channels'] as const

export function useChannels() {
  return useQuery({ queryKey: CHANNELS_KEY, queryFn: listChannels })
}

function patchRow(
  qc: ReturnType<typeof useQueryClient>,
  id: string,
  patch: Partial<ChannelRowData>,
) {
  qc.setQueryData<ChannelRowData[]>(CHANNELS_KEY, (rows) =>
    rows?.map((r) => (r.id === id ? { ...r, ...patch } : r)),
  )
}

// Manual "refresh video list" — re-fetches via the background (uses the API).
export function useRefreshChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => refreshChannel(id),
    onSuccess: (state, id) => {
      if (typeof state.total === 'number') {
        patchRow(qc, id, {
          total: state.total,
          watchedCount: state.watchedCount ?? 0,
          jackpot: state.total > 0 && (state.watchedCount ?? 0) >= state.total,
        })
      }
    },
  })
}

export function useResetChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => resetWatched(id),
    onSuccess: (_res, id) => patchRow(qc, id, { watchedCount: 0, jackpot: false }),
  })
}

export function useDeleteChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeChannel(id),
    onSuccess: (_res, id) =>
      qc.setQueryData<ChannelRowData[]>(CHANNELS_KEY, (rows) => rows?.filter((r) => r.id !== id)),
  })
}
