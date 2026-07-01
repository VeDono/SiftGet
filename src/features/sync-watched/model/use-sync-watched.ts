import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { autoScanPage } from '@/shared/api/messaging'
import { MSG_AUTOSCAN_PROGRESS } from '@/shared/config/constants'
import { POPUP_KEY } from '@/features/channel-state/model/use-popup-state'

// Drives the content script to auto-scroll the channel page and harvest watched videos,
// showing a live count, then refreshes the popup state so the counter updates.
export function useSyncWatched(tabId: number | undefined) {
  const qc = useQueryClient()
  const [running, setRunning] = useState(false)
  const [found, setFound] = useState(0)

  useEffect(() => {
    const onMsg = (msg: { type?: string; found?: number }) => {
      if (msg?.type === MSG_AUTOSCAN_PROGRESS) setFound(msg.found ?? 0)
    }
    chrome.runtime.onMessage.addListener(onMsg)
    return () => chrome.runtime.onMessage.removeListener(onMsg)
  }, [])

  async function sync() {
    if (tabId == null || running) return
    setRunning(true)
    setFound(0)
    try {
      await autoScanPage(tabId)
    } finally {
      setRunning(false)
      qc.invalidateQueries({ queryKey: POPUP_KEY })
    }
  }

  return { running, found, sync }
}
