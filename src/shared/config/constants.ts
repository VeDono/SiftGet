import type { Settings } from '@/shared/types'

// ---- chrome.storage.local keys ----------------------------------------------
export const KEY_API = 'apiKey'
export const KEY_SETTINGS = 'settings'
export const CHANNEL_PREFIX = 'ch:' //      ch:<channelId>      -> Channel
export const WATCHED_PREFIX = 'watched:' // watched:<channelId> -> WatchedMap
export const ALIAS_PREFIX = 'alias:' //     alias:<hintKey>     -> channelId

export const channelKey = (id: string) => `${CHANNEL_PREFIX}${id}`
export const watchedKey = (id: string) => `${WATCHED_PREFIX}${id}`
export const aliasStoreKey = (hintKey: string) => `${ALIAS_PREFIX}${hintKey}`

// ---- cache policy -----------------------------------------------------------
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // auto-refresh at most once/day

// ---- default settings -------------------------------------------------------
export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  openInNewTab: true,
  includeShorts: false,
  useHistory: false,
  ignoreWatched: false,
  useYouTubeWatched: true,
  watchedThreshold: 90,
}

// ---- messages (popup/options <-> background) --------------------------------
export const MSG = {
  GET_STATE: 'GET_STATE',
  PICK: 'PICK',
  OPEN: 'OPEN',
  REFRESH: 'REFRESH',
  RESET_PROGRESS: 'RESET_PROGRESS',
  LIST_CHANNELS: 'LIST_CHANNELS',
  RECONCILE_HISTORY: 'RECONCILE_HISTORY',
} as const
export type MsgType = (typeof MSG)[keyof typeof MSG]

// content script <-> popup, and MAIN <-> ISOLATED bridge
export const MSG_DETECT = 'SIFTGET_DETECT'
export const MSG_AUTOSCAN = 'SIFTGET_AUTOSCAN' // popup -> content: auto-scroll + harvest watched
export const MSG_AUTOSCAN_PROGRESS = 'SIFTGET_AUTOSCAN_PROGRESS' // content -> popup: live count
export const YT_BRIDGE = 'SIFTGET_YT_DATA' // main -> isolated
export const YT_REQUEST = 'SIFTGET_YT_REQUEST' // isolated -> main

// ---- popup status codes -----------------------------------------------------
export const STATUS = {
  LOADING: 'loading',
  NO_CHANNEL: 'no-channel',
  READY: 'ready',
  ALL_WATCHED: 'all-watched',
  EMPTY: 'empty',
  ERROR: 'error',
} as const
export type Status = (typeof STATUS)[keyof typeof STATUS]

// ---- error codes ------------------------------------------------------------
export const ERR = {
  API_KEY_MISSING: 'API_KEY_MISSING',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  KEY_INVALID: 'KEY_INVALID',
  CHANNEL_NOT_FOUND: 'CHANNEL_NOT_FOUND',
  NETWORK: 'NETWORK',
  UNKNOWN: 'UNKNOWN',
} as const
export type ErrCode = (typeof ERR)[keyof typeof ERR]
