// Core domain + message contracts shared across background, entities, features and UI.
import type { Status, ErrCode } from '@/shared/config/constants'

export type Language = 'en' | 'ru' | 'uk'

export interface Settings {
  language: Language
  openInNewTab: boolean
  includeShorts: boolean
  useHistory: boolean
  ignoreWatched: boolean
  /** Read YouTube's own watched-progress bar off the channel page. */
  useYouTubeWatched: boolean
  /** A video counts as watched when its progress bar is ≥ this percent (50–100). */
  watchedThreshold: number
}

export interface Video {
  id: string
  title: string
  publishedAt?: string
  isShort?: boolean
}

export interface Channel {
  channelId: string
  title: string
  handle?: string
  customUrl?: string
  thumbnail?: string
  uploadsPlaylistId?: string
  videos: Video[]
  fetchedAt: number
  /** In the options "tracked channels" list. Auto-cached channels default to false. */
  tracked?: boolean
}

export type WatchedMap = Record<string, number>

/** Enough to identify a channel from a page, before it's resolved to a channelId. */
export interface ChannelHint {
  isYouTube?: boolean
  pageType?: 'channel' | 'watch' | 'other'
  channelId?: string
  handle?: string
  username?: string
  query?: string
  title?: string
  videoId?: string
  url?: string
}

/** Minimal channel info for the popup header. */
export interface ChannelHeader {
  channelId: string
  title: string
  handle: string
  thumbnail: string
  displayUrl: string
}

/** A tracked-channel row on the options page. */
export interface ChannelRowData {
  id: string
  title: string
  handle: string
  thumbnail: string
  total: number
  watchedCount: number
  fetchedAt: number
  jackpot: boolean
}

/** The state the popup renders, returned by GET_STATE / REFRESH. */
export interface PopupState {
  status: Status
  code?: ErrCode
  error?: string
  channel?: ChannelHeader
  total?: number
  watchedCount?: number
  candidateCount?: number
  reel?: Video[]
  onlyShorts?: boolean
  tracked?: boolean
  refreshError?: ErrCode | null
  settings?: Pick<Settings, 'ignoreWatched' | 'includeShorts' | 'openInNewTab'>
}

export interface PickResponse {
  ok: boolean
  reason?: 'no-cache' | 'all-watched' | 'empty'
  video?: Video
  total?: number
  watchedCount?: number
  candidateCount?: number
}

export interface OpenResponse {
  ok: boolean
  total?: number
  watchedCount?: number
  candidateCount?: number
}

export interface DetectResponse {
  ok: boolean
  channel?: ChannelHint | null
  error?: string
}
