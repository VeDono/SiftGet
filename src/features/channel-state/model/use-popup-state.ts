import { useQuery } from '@tanstack/react-query'
import { getActiveTab, detectChannel, getState } from '@/shared/api/messaging'
import { STATUS } from '@/shared/config/constants'
import type { ChannelHint, PopupState } from '@/shared/types'

export const POPUP_KEY = ['popup'] as const

export interface PopupQueryData {
  tabId?: number
  hint: ChannelHint | null
  state: PopupState
}

// Detects the active tab's channel, then asks the background for its state.
export function usePopupState() {
  return useQuery<PopupQueryData>({
    queryKey: POPUP_KEY,
    queryFn: async () => {
      const tab = await getActiveTab()
      const hint = tab ? await detectChannel(tab.id) : null
      if (!hint) return { tabId: tab?.id, hint: null, state: { status: STATUS.NO_CHANNEL } }
      const state = await getState(hint)
      return { tabId: tab?.id, hint, state }
    },
  })
}
