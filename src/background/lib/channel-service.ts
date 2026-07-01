import { CACHE_TTL_MS, ERR, STATUS, type ErrCode } from '@/shared/config/constants'
import { getApiKey, getSettings } from '@/entities/settings/api/settings-storage'
import {
  getChannel,
  setChannel,
  getWatched,
  markWatched,
  getAliasChannelId,
  setAlias,
} from '@/entities/channel/api/channel-storage'
import { ApiError, resolveChannelId, buildChannelData } from '@/shared/api/youtube'
import { selectVideo } from '@/entities/video/lib/select-video'
import { channelDisplayUrl } from '@/shared/lib/youtube-url'
import type { Channel, ChannelHeader, ChannelHint, PopupState, Settings } from '@/shared/types'

// Resolve a hint to a channelId, caching aliases to save quota.
export async function resolveToChannelId(hint: ChannelHint, apiKey: string): Promise<string> {
  if (hint.channelId && /^UC[\w-]{20,}$/.test(hint.channelId)) return hint.channelId
  const cached = await getAliasChannelId(hint)
  if (cached) return cached
  const id = await resolveChannelId(hint, apiKey)
  if (id) await setAlias(hint, id)
  return id
}

// Keep a channel's cached video list fresh; report (not throw) a failed refresh if we
// can fall back to a stale cache.
async function ensureChannel(
  channelId: string,
  apiKey: string,
  forceRefresh: boolean,
): Promise<{ channel: Channel; refreshError: ErrCode | null }> {
  let channel = await getChannel(channelId)
  const stale = !channel || Date.now() - (channel.fetchedAt || 0) > CACHE_TTL_MS
  let refreshError: ErrCode | null = null
  const prevTracked = channel?.tracked // preserve list membership across refreshes

  if (forceRefresh || stale) {
    try {
      const data = await buildChannelData(channelId, apiKey)
      // Auto-cached channels are NOT added to the list until the user asks (tracked:false).
      channel = { ...data, fetchedAt: Date.now(), tracked: prevTracked ?? false }
      await setChannel(channelId, channel)
    } catch (e) {
      if (!channel) throw e
      refreshError = e instanceof ApiError ? e.code : ERR.UNKNOWN
    }
  }
  return { channel: channel!, refreshError }
}

async function reconcileHistory(channel: Channel, settings: Settings): Promise<void> {
  if (!settings.useHistory) return
  const granted = await chrome.permissions.contains({ permissions: ['history'] })
  if (!granted || !chrome.history) return

  const known = new Set((channel.videos ?? []).map((v) => v.id))
  let items: chrome.history.HistoryItem[] = []
  try {
    items = await chrome.history.search({ text: 'youtube.com/watch', startTime: 0, maxResults: 5000 })
  } catch {
    return
  }
  const found: string[] = []
  for (const it of items) {
    const m = /[?&]v=([\w-]{6,})/.exec(it.url ?? '')
    if (m && known.has(m[1])) found.push(m[1])
  }
  if (found.length) await markWatched(channel.channelId, found)
}

export function headerFromHint(hint: ChannelHint): ChannelHeader {
  return {
    channelId: hint.channelId ?? '',
    title: hint.title ?? '',
    handle: hint.handle ?? '',
    thumbnail: '',
    displayUrl: channelDisplayUrl(hint),
  }
}

export async function computeState(
  channelId: string,
  { forceRefresh = false } = {},
): Promise<PopupState> {
  const apiKey = await getApiKey()
  if (!apiKey) throw new ApiError(ERR.API_KEY_MISSING, 'No API key')

  const settings = await getSettings()
  const { channel, refreshError } = await ensureChannel(channelId, apiKey, forceRefresh)

  await reconcileHistory(channel, settings)
  const watched = await getWatched(channelId)
  const sel = selectVideo(channel.videos, watched, settings)

  let status: PopupState['status'] = STATUS.READY
  if (sel.empty) status = STATUS.EMPTY
  else if (sel.allWatched) status = STATUS.ALL_WATCHED

  const onlyShorts = sel.empty && (channel.videos?.length ?? 0) > 0 && !settings.includeShorts

  return {
    status,
    channel: {
      channelId,
      title: channel.title,
      handle: channel.handle || (channel.customUrl?.startsWith('@') ? channel.customUrl : ''),
      thumbnail: channel.thumbnail ?? '',
      displayUrl: channelDisplayUrl(channel),
    },
    total: sel.total,
    watchedCount: sel.watchedCount,
    candidateCount: sel.candidateCount,
    reel: sel.sample,
    onlyShorts,
    tracked: channel.tracked === true, // in the list only when explicitly added
    refreshError,
    settings: {
      ignoreWatched: settings.ignoreWatched,
      includeShorts: settings.includeShorts,
      openInNewTab: settings.openInNewTab,
    },
  }
}
