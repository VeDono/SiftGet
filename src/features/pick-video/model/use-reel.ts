import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { pickVideo, openVideo, wait } from '@/shared/api/messaging'
import { STATUS } from '@/shared/config/constants'
import { POPUP_KEY, type PopupQueryData } from '@/features/channel-state/model/use-popup-state'
import type { Video } from '@/shared/types'

export type ReelPhase = 'idle' | 'spinning'

// The reveal-then-open reel: spin reveals a pick (no side effects); open commits it.
export function useReel(channelId: string | undefined, tabId: number | undefined) {
  const qc = useQueryClient()
  const [picked, setPicked] = useState<Video | null>(null)
  const [phase, setPhase] = useState<ReelPhase>('idle')

  const patchState = (patch: Partial<PopupQueryData['state']>) => {
    qc.setQueryData<PopupQueryData>(POPUP_KEY, (old) =>
      old ? { ...old, state: { ...old.state, ...patch } } : old,
    )
  }

  async function spin() {
    if (!channelId) return
    setPhase('spinning')
    try {
      const [res] = await Promise.all([pickVideo(channelId), wait(1200)])
      if (res.ok && res.video) setPicked(res.video)
      else if (res.reason === 'all-watched') patchState({ status: STATUS.ALL_WATCHED })
    } finally {
      // Always leave the spinner, even if the message rejects (e.g. worker restart).
      setPhase('idle')
    }
  }

  async function reroll() {
    if (!channelId) return
    setPhase('spinning')
    try {
      const [res] = await Promise.all([pickVideo(channelId, picked?.id), wait(800)])
      if (res.ok && res.video) setPicked(res.video)
    } finally {
      setPhase('idle')
    }
  }

  async function open() {
    if (!channelId || !picked) return
    const res = await openVideo(channelId, picked.id, tabId)
    if (res.ok) {
      const allDone = (res.total ?? 0) > 0 && (res.watchedCount ?? 0) >= (res.total ?? 0)
      setPicked(null)
      patchState({
        status: allDone ? STATUS.ALL_WATCHED : STATUS.READY,
        total: res.total,
        watchedCount: res.watchedCount,
        candidateCount: res.candidateCount,
      })
    }
  }

  return { picked, phase, spin, reroll, open }
}
