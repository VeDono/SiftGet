// Background service worker — resolves channels, keeps the cache fresh, tracks watched
// videos, opens the pick, and (optionally) reconciles with the browser history.
import { MSG, STATUS, ERR, DEFAULT_SETTINGS } from '@/shared/config/constants'
import { getApiKey, getSettings } from '@/entities/settings/api/settings-storage'
import {
  getChannel,
  getWatched,
  markWatched,
  resetWatched,
  listChannels,
} from '@/entities/channel/api/channel-storage'
import { selectVideo } from '@/entities/video/lib/select-video'
import { ApiError } from '@/shared/api/youtube'
import { computeState, resolveToChannelId, headerFromHint } from './lib/channel-service'
import type {
  ChannelHint,
  OpenResponse,
  PickResponse,
  PopupState,
} from '@/shared/types'

interface Message {
  type?: string
  channelHint?: ChannelHint | null
  channelId?: string
  excludeId?: string
  videoId?: string
  tabId?: number
}

async function handleGetState(msg: Message): Promise<PopupState> {
  const hint = msg.channelHint
  if (!hint) return { status: STATUS.NO_CHANNEL }

  const apiKey = await getApiKey()
  if (!apiKey) {
    return { status: STATUS.ERROR, code: ERR.API_KEY_MISSING, channel: headerFromHint(hint) }
  }
  try {
    const channelId = await resolveToChannelId(hint, apiKey)
    return await computeState(channelId)
  } catch (e) {
    return {
      status: STATUS.ERROR,
      code: e instanceof ApiError ? e.code : ERR.UNKNOWN,
      channel: headerFromHint(hint),
      error: String((e as Error)?.message ?? e),
    }
  }
}

// Reveal only — no open, no mark-watched. excludeId gives a different reroll result.
async function handlePick(msg: Message): Promise<PickResponse> {
  const channelId = msg.channelId!
  const settings = await getSettings()
  const channel = await getChannel(channelId)
  if (!channel) return { ok: false, reason: 'no-cache' }

  const watched = await getWatched(channelId)
  const sel = selectVideo(channel.videos, watched, settings, { excludeId: msg.excludeId })
  if (!sel.video) return { ok: false, reason: sel.allWatched ? 'all-watched' : 'empty' }

  return {
    ok: true,
    video: { id: sel.video.id, title: sel.video.title },
    total: sel.total,
    watchedCount: sel.watchedCount,
    candidateCount: sel.candidateCount,
  }
}

// Commit — open the chosen video and mark it watched (the only place that marks).
async function handleOpen(msg: Message): Promise<OpenResponse> {
  const { channelId, videoId, tabId } = msg
  const settings = await getSettings()
  const url = `https://www.youtube.com/watch?v=${videoId}`

  if (settings.openInNewTab || tabId == null) {
    await chrome.tabs.create({ url, active: true })
  } else {
    try {
      await chrome.tabs.update(tabId, { url })
    } catch {
      await chrome.tabs.create({ url, active: true })
    }
  }
  await markWatched(channelId!, videoId!)

  const channel = await getChannel(channelId!)
  const watched = await getWatched(channelId!)
  const sel = selectVideo(channel?.videos, watched, settings)
  return { ok: true, total: sel.total, watchedCount: sel.watchedCount, candidateCount: sel.candidateCount }
}

const ROUTES: Record<string, (msg: Message) => Promise<unknown>> = {
  [MSG.GET_STATE]: handleGetState,
  [MSG.PICK]: handlePick,
  [MSG.OPEN]: handleOpen,
  [MSG.REFRESH]: (msg) => computeState(msg.channelId!, { forceRefresh: true }),
  [MSG.RESET_PROGRESS]: async (msg) => {
    await resetWatched(msg.channelId!)
    return { ok: true }
  },
  [MSG.LIST_CHANNELS]: async () => ({ ok: true, channels: await listChannels() }),
}

chrome.runtime.onMessage.addListener((msg: Message, _sender, sendResponse) => {
  const handler = msg?.type ? ROUTES[msg.type] : undefined
  if (!handler) return false
  Promise.resolve(handler(msg))
    .then(sendResponse)
    .catch((e) =>
      sendResponse({
        status: STATUS.ERROR,
        ok: false,
        code: e instanceof ApiError ? e.code : ERR.UNKNOWN,
        error: String((e as Error)?.message ?? e),
      }),
    )
  return true // keep the channel open for the async response
})

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings()
  await chrome.storage.local.set({ settings: { ...DEFAULT_SETTINGS, ...settings } })
})
