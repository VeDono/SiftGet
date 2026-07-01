// Typed helpers the popup/options use to talk to the active tab and the background.
import { MSG, MSG_DETECT, MSG_AUTOSCAN } from '@/shared/config/constants'
import type { ChannelHint, PopupState, PickResponse, OpenResponse, DetectResponse } from '@/shared/types'

export function sendBg<T = unknown>(message: unknown): Promise<T> {
  return chrome.runtime.sendMessage(message) as Promise<T>
}

export async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab ?? null
}

/** Tell the content script to auto-scroll the channel page and import watched videos. */
export function autoScanPage(tabId: number): Promise<{ ok: boolean; marked?: number }> {
  return chrome.tabs.sendMessage(tabId, { type: MSG_AUTOSCAN })
}

/** Ask the content script for the channel of the active page (null if not YouTube). */
export async function detectChannel(tabId?: number): Promise<ChannelHint | null> {
  if (tabId == null) return null
  try {
    const res = await chrome.tabs.sendMessage<unknown, DetectResponse>(tabId, { type: MSG_DETECT })
    return res?.ok ? (res.channel ?? null) : null
  } catch {
    return null
  }
}

export const openOptions = () => chrome.runtime.openOptionsPage()
export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// ---- typed background messages ----
export const getState = (channelHint: ChannelHint | null) =>
  sendBg<PopupState>({ type: MSG.GET_STATE, channelHint })

export const pickVideo = (channelId: string, excludeId?: string) =>
  sendBg<PickResponse>({ type: MSG.PICK, channelId, excludeId })

export const openVideo = (channelId: string, videoId: string, tabId?: number) =>
  sendBg<OpenResponse>({ type: MSG.OPEN, channelId, videoId, tabId })

export const refreshChannel = (channelId: string) =>
  sendBg<PopupState>({ type: MSG.REFRESH, channelId })
