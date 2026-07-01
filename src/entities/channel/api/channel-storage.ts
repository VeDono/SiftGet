import {
  channelKey,
  watchedKey,
  aliasStoreKey,
  CHANNEL_PREFIX,
  WATCHED_PREFIX,
  ALIAS_PREFIX,
} from '@/shared/config/constants'
import { getValue, setValue, removeValue, getAll } from '@/shared/lib/chrome-storage'
import type { Channel, WatchedMap, ChannelHint, ChannelRowData } from '@/shared/types'

// ---- channel cache ----------------------------------------------------------
export async function getChannel(channelId: string): Promise<Channel | undefined> {
  return getValue<Channel>(channelKey(channelId))
}

export async function setChannel(channelId: string, data: Channel): Promise<void> {
  await setValue({ [channelKey(channelId)]: data })
}

// Add/remove the channel from the visible "tracked channels" list.
export async function setChannelTracked(channelId: string, tracked: boolean): Promise<void> {
  const ch = await getChannel(channelId)
  if (!ch) return
  await setChannel(channelId, { ...ch, tracked })
}

// ---- watched set ------------------------------------------------------------
export async function getWatched(channelId: string): Promise<WatchedMap> {
  return (await getValue<WatchedMap>(watchedKey(channelId))) ?? {}
}

export async function markWatched(channelId: string, videoIds: string | string[]): Promise<void> {
  const ids = Array.isArray(videoIds) ? videoIds : [videoIds]
  if (ids.length === 0) return
  const watched = await getWatched(channelId)
  const now = Date.now()
  let changed = false
  for (const id of ids) {
    if (id && !watched[id]) {
      watched[id] = now
      changed = true
    }
  }
  if (changed) await setValue({ [watchedKey(channelId)]: watched })
}

export async function resetWatched(channelId: string): Promise<void> {
  await removeValue(watchedKey(channelId))
}

// ---- channelId aliases (avoid re-resolving handles / vanity urls) -----------
export function aliasKeyFor(hint: ChannelHint): string | null {
  if (!hint) return null
  if (hint.handle) return 'h:' + hint.handle.replace(/^@/, '').toLowerCase()
  if (hint.username) return 'u:' + hint.username.toLowerCase()
  if (hint.query) return 'q:' + hint.query.toLowerCase()
  return null
}

export async function getAliasChannelId(hint: ChannelHint): Promise<string | null> {
  const key = aliasKeyFor(hint)
  if (!key) return null
  return (await getValue<string>(aliasStoreKey(key))) ?? null
}

export async function setAlias(hint: ChannelHint, channelId: string): Promise<void> {
  const key = aliasKeyFor(hint)
  if (!key || !channelId) return
  await setValue({ [aliasStoreKey(key)]: channelId })
}

// ---- remove a channel entirely ----------------------------------------------
export async function removeChannel(channelId: string): Promise<void> {
  const keys = [channelKey(channelId), watchedKey(channelId)]
  const all = await getAll()
  for (const [k, v] of Object.entries(all)) {
    if (k.startsWith(ALIAS_PREFIX) && v === channelId) keys.push(k)
  }
  await removeValue(keys)
}

// ---- options: all tracked channels + counts ---------------------------------
export async function listChannels(): Promise<ChannelRowData[]> {
  const all = await getAll()
  const rows: ChannelRowData[] = []
  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith(CHANNEL_PREFIX)) continue
    const channel = value as Channel
    // Only show channels the user explicitly added. Channels auto-cached for spinning
    // have tracked === false; pre-existing ones (undefined) are grandfathered in.
    if (channel.tracked === false) continue
    const id = key.slice(CHANNEL_PREFIX.length)
    const watched = (all[WATCHED_PREFIX + id] as WatchedMap | undefined) ?? {}
    const videos = Array.isArray(channel.videos) ? channel.videos : []
    let watchedCount = 0
    for (const v of videos) if (watched[v.id]) watchedCount++
    const total = videos.length
    rows.push({
      id,
      title: channel.title || id,
      handle: channel.handle || '',
      thumbnail: channel.thumbnail || '',
      total,
      watchedCount,
      fetchedAt: channel.fetchedAt || 0,
      jackpot: total > 0 && watchedCount >= total,
    })
  }
  rows.sort((a, b) => b.total - a.total || a.title.localeCompare(b.title))
  return rows
}
