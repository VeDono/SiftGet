// YouTube Data API v3 wrapper (axios). Called with the user's own key; no backend.
// Never touches storage — callers pass the key and get plain data back.
import { AxiosError } from 'axios'
import { http } from './http'
import { ERR, type ErrCode } from '@/shared/config/constants'
import type { Video } from '@/shared/types'

export class ApiError extends Error {
  code: ErrCode
  constructor(code: ErrCode, message?: string) {
    super(message ?? code)
    this.name = 'ApiError'
    this.code = code
  }
}

interface YtError {
  error?: { message?: string; errors?: { reason?: string }[]; status?: string }
}

function classify(status: number | undefined, data: YtError | undefined): ErrCode {
  const reason = String(data?.error?.errors?.[0]?.reason ?? data?.error?.status ?? '')
  if (/quota|rateLimit|dailyLimit|userRateLimit/i.test(reason)) return ERR.QUOTA_EXCEEDED
  if (/keyInvalid|badRequest|API_KEY_INVALID|ipRefererBlocked|accessNotConfigured|forbidden/i.test(reason)) {
    return ERR.KEY_INVALID
  }
  if (status === 403) return ERR.QUOTA_EXCEEDED
  if (status === 400) return ERR.KEY_INVALID
  if (status === 404) return ERR.CHANNEL_NOT_FOUND
  return ERR.UNKNOWN
}

async function apiGet<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>,
  apiKey: string,
): Promise<T> {
  if (!apiKey) throw new ApiError(ERR.API_KEY_MISSING, 'No API key set')
  try {
    const res = await http.get<T>(`/${endpoint}`, { params: { ...params, key: apiKey } })
    return res.data
  } catch (e) {
    const ax = e as AxiosError<YtError>
    if (ax.response) {
      const code = classify(ax.response.status, ax.response.data)
      throw new ApiError(code, ax.response.data?.error?.message ?? `HTTP ${ax.response.status}`)
    }
    throw new ApiError(ERR.NETWORK, ax.message ?? 'Network error')
  }
}

// ---- response shapes (only the fields we use) -------------------------------
interface ChannelsListResponse {
  items?: {
    id?: string
    snippet?: {
      title?: string
      customUrl?: string
      thumbnails?: Record<string, { url?: string }>
    }
    contentDetails?: { relatedPlaylists?: { uploads?: string } }
  }[]
}
interface SearchListResponse {
  items?: { id?: { channelId?: string }; snippet?: { channelId?: string } }[]
}
interface PlaylistItemsResponse {
  items?: {
    snippet?: { title?: string; publishedAt?: string; resourceId?: { videoId?: string } }
    contentDetails?: { videoId?: string; videoPublishedAt?: string }
  }[]
  nextPageToken?: string
}
interface VideosListResponse {
  items?: { id?: string; contentDetails?: { duration?: string } }[]
}

export interface ChannelInfo {
  channelId: string
  title: string
  customUrl: string
  handle: string
  thumbnail: string
  uploadsPlaylistId: string
}

export interface ChannelHintLike {
  channelId?: string
  handle?: string
  username?: string
  query?: string
  title?: string
}

// ---- channel id resolution (cheapest -> most expensive) ---------------------
export async function resolveChannelId(hint: ChannelHintLike, apiKey: string): Promise<string> {
  if (hint.channelId && /^UC[\w-]{20,}$/.test(hint.channelId)) return hint.channelId

  const handle = (hint.handle ?? '').replace(/^@/, '').trim()
  if (handle) {
    const data = await apiGet<ChannelsListResponse>('channels', { part: 'id', forHandle: handle }, apiKey)
    const id = data.items?.[0]?.id
    if (id) return id
  }

  const username = (hint.username ?? '').trim()
  if (username) {
    const data = await apiGet<ChannelsListResponse>('channels', { part: 'id', forUsername: username }, apiKey)
    const id = data.items?.[0]?.id
    if (id) return id
  }

  const q = (hint.query ?? handle ?? username ?? hint.title ?? '').trim()
  if (q) {
    const data = await apiGet<SearchListResponse>(
      'search',
      { part: 'snippet', type: 'channel', maxResults: 1, q },
      apiKey,
    )
    const id = data.items?.[0]?.id?.channelId ?? data.items?.[0]?.snippet?.channelId
    if (id) return id
  }

  throw new ApiError(ERR.CHANNEL_NOT_FOUND, 'Could not resolve channel id')
}

export async function getChannelInfo(channelId: string, apiKey: string): Promise<ChannelInfo> {
  const data = await apiGet<ChannelsListResponse>(
    'channels',
    { part: 'snippet,contentDetails', id: channelId },
    apiKey,
  )
  const item = data.items?.[0]
  if (!item) throw new ApiError(ERR.CHANNEL_NOT_FOUND, 'Channel not found')
  const thumbs = item.snippet?.thumbnails ?? {}
  const customUrl = item.snippet?.customUrl ?? ''
  return {
    channelId,
    title: item.snippet?.title ?? channelId,
    customUrl,
    handle: customUrl.startsWith('@') ? customUrl : '',
    thumbnail: (thumbs.medium ?? thumbs.default ?? thumbs.high ?? {}).url ?? '',
    uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads ?? '',
  }
}

const UNAVAILABLE = new Set(['Private video', 'Deleted video', 'This video is private'])

export async function fetchAllUploads(
  uploadsPlaylistId: string,
  apiKey: string,
  onPage?: (count: number) => void,
): Promise<Video[]> {
  if (!uploadsPlaylistId) return []
  const videos: Video[] = []
  let pageToken = ''
  let guard = 0

  do {
    const data = await apiGet<PlaylistItemsResponse>(
      'playlistItems',
      { part: 'snippet,contentDetails', maxResults: 50, playlistId: uploadsPlaylistId, pageToken },
      apiKey,
    )
    for (const item of data.items ?? []) {
      const id = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId
      const title = item.snippet?.title ?? ''
      if (!id || UNAVAILABLE.has(title)) continue
      videos.push({
        id,
        title,
        publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? '',
      })
    }
    pageToken = data.nextPageToken ?? ''
    onPage?.(videos.length)
  } while (pageToken && ++guard < 200)

  return videos
}

export function parseISODuration(iso: string | undefined): number {
  if (!iso) return 0
  const m = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso)
  if (!m) return 0
  const [, h, mi, s] = m
  return (Number(h) || 0) * 3600 + (Number(mi) || 0) * 60 + (Number(s) || 0)
}

// Shorts detection via duration (≤ 60s). Cheap; documented approximation.
export async function annotateShorts(videos: Video[], apiKey: string): Promise<Video[]> {
  const ids = videos.map((v) => v.id)
  const durationById = new Map<string, number>()

  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50)
    try {
      const data = await apiGet<VideosListResponse>(
        'videos',
        { part: 'contentDetails', id: chunk.join(',') },
        apiKey,
      )
      for (const item of data.items ?? []) {
        if (item.id) durationById.set(item.id, parseISODuration(item.contentDetails?.duration))
      }
    } catch {
      // don't fail the whole build if durations can't be fetched
    }
  }

  for (const v of videos) {
    const secs = durationById.get(v.id)
    v.isShort = typeof secs === 'number' && secs > 0 && secs <= 60
  }
  return videos
}

export async function buildChannelData(
  channelId: string,
  apiKey: string,
): Promise<Omit<import('@/shared/types').Channel, 'fetchedAt'>> {
  const info = await getChannelInfo(channelId, apiKey)
  const videos = await fetchAllUploads(info.uploadsPlaylistId, apiKey)
  await annotateShorts(videos, apiKey)
  return { ...info, videos }
}
