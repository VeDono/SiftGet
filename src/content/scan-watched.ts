// ISOLATED-world content script. On a channel page, YouTube renders a red "resume"
// progress bar under thumbnails of videos you've already watched (your account state).
// We read those bars and mark videos at/above the user's threshold as watched — so the
// popup reflects what you've actually seen, not only what this extension opened.
//
// Limitations (by design): only covers video tiles currently rendered — scroll the
// channel's "Videos" tab to load more; reflects the logged-in account in this browser.
import {
  YT_BRIDGE,
  YT_REQUEST,
  MSG_AUTOSCAN,
  MSG_AUTOSCAN_PROGRESS,
} from '@/shared/config/constants'
import { getSettings } from '@/entities/settings/api/settings-storage'
import { markWatched } from '@/entities/channel/api/channel-storage'

const DEBUG = true // logs "[SiftGet]" diagnostics to the page console

// Tile containers YouTube uses across its layouts (grid / list / new lockup view-model).
const TILE_SEL = [
  'ytd-rich-item-renderer',
  'ytd-grid-video-renderer',
  'ytd-video-renderer',
  'ytd-rich-grid-media',
  'ytd-compact-video-renderer',
  'yt-lockup-view-model',
  'ytm-media-item',
].join(',')

// Progress-bar elements across old and new markup.
const BAR_SEL = [
  'ytd-thumbnail-overlay-resume-playback-renderer #progress',
  '.ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment',
  '.ytProgressBarLineProgressBarPlayed',
  '[class*="ProgressBarPlayed"]',
  '[class*="resume-playback-progress"]',
].join(',')

// Channel id fed by the MAIN-world reader (ytInitialData.metadata.externalId etc.).
let bridgeChannelId: string | null = null
window.addEventListener('message', (e) => {
  if (e.source !== window) return
  const d = e.data as { __siftget?: boolean; type?: string; payload?: { channelId?: string } }
  if (d && d.__siftget && d.type === YT_BRIDGE && d.payload?.channelId) {
    bridgeChannelId = d.payload.channelId
  }
})

function currentChannelId(): string | null {
  if (bridgeChannelId && /^UC[\w-]{20,}$/.test(bridgeChannelId)) return bridgeChannelId
  const canon = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? ''
  const m = canon.match(/\/channel\/(UC[\w-]{20,})/)
  if (m) return m[1]
  const meta = document.querySelector('meta[itemprop="channelId"]')?.getAttribute('content')
  return meta && /^UC[\w-]{20,}$/.test(meta) ? meta : null
}

function readPct(bar: HTMLElement): number {
  const w = bar.style.width
  if (w && w.trim().endsWith('%')) return parseFloat(w)
  const parent = bar.parentElement
  if (parent && parent.offsetWidth > 0) return (bar.offsetWidth / parent.offsetWidth) * 100
  return NaN
}

function videoIdOf(el: Element | null): string | null {
  const href = el?.querySelector<HTMLAnchorElement>('a[href*="watch?v="]')?.getAttribute('href') ?? ''
  const m = href.match(/[?&]v=([\w-]{6,})/)
  return m ? m[1] : null
}

// Iterate tiles (each maps to one video) and check each tile's own progress bar.
function collectWatched(threshold: number): { ids: string[]; tiles: number; bars: number } {
  const ids = new Set<string>()
  const tiles = document.querySelectorAll(TILE_SEL)
  let bars = 0
  tiles.forEach((tile) => {
    const bar = tile.querySelector<HTMLElement>(BAR_SEL)
    if (!bar) return
    bars++
    if (readPct(bar) >= threshold) {
      const id = videoIdOf(tile)
      if (id) ids.add(id)
    }
  })
  return { ids: [...ids], tiles: tiles.length, bars }
}

let running = false
async function scan() {
  if (running) return
  running = true
  try {
    const settings = await getSettings()
    if (!settings.useYouTubeWatched) return
    const channelId = currentChannelId()
    const threshold = settings.watchedThreshold ?? 90
    const { ids, tiles, bars } = collectWatched(threshold)
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log('[SiftGet] scan', { channelId, tiles, barsFound: bars, threshold, matched: ids.length })
    }
    if (channelId && ids.length) await markWatched(channelId, ids)
  } finally {
    running = false
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Triggered by the popup: auto-scroll the channel's Videos grid to the bottom, harvesting
// watched videos as tiles lazy-load, until the list stops growing. Marks everything found
// (uses the threshold, but works regardless of the passive toggle — it's an explicit action).
async function autoScan(onProgress: (found: number) => void): Promise<{ ok: true; marked: number }> {
  running = true // suppress passive scans while we drive the page
  try {
    const settings = await getSettings()
    const threshold = settings.watchedThreshold ?? 90
    const channelId = currentChannelId()
    const seen = new Set<string>()
    const harvest = () => collectWatched(threshold).ids.forEach((id) => seen.add(id))

    let stable = 0
    let steps = 0
    const MAX_STEPS = 80
    while (stable < 3 && steps < MAX_STEPS) {
      harvest()
      onProgress(seen.size)
      const before = document.querySelectorAll(TILE_SEL).length
      window.scrollTo(0, document.documentElement.scrollHeight)
      steps++
      await sleep(750) // let YouTube lazy-load the next batch
      const after = document.querySelectorAll(TILE_SEL).length
      stable = after > before ? 0 : stable + 1
    }
    harvest()
    onProgress(seen.size)
    if (channelId && seen.size) await markWatched(channelId, [...seen])
    window.scrollTo(0, 0)
    return { ok: true, marked: seen.size }
  } finally {
    running = false
  }
}

chrome.runtime.onMessage.addListener((msg: { type?: string }, _sender, sendResponse) => {
  if (msg?.type === MSG_AUTOSCAN) {
    autoScan((found) => {
      chrome.runtime.sendMessage({ type: MSG_AUTOSCAN_PROGRESS, found }).catch(() => {})
    })
      .then(sendResponse)
      .catch((e) => sendResponse({ ok: false, error: String(e) }))
    return true // async response
  }
  return false
})

let timer: ReturnType<typeof setTimeout> | undefined
function scheduleScan() {
  clearTimeout(timer)
  timer = setTimeout(scan, 700)
}

// Ask the MAIN world for the channelId, and re-scan on nav, scroll, and DOM growth
// (YouTube lazy-loads tiles into a scroll container, so scroll alone can miss them).
window.postMessage({ __siftget: true, type: YT_REQUEST }, '*')
window.addEventListener('yt-navigate-finish', () => {
  window.postMessage({ __siftget: true, type: YT_REQUEST }, '*')
  scheduleScan()
})
window.addEventListener('scroll', scheduleScan, { passive: true })

const host = document.querySelector('ytd-app') ?? document.body
if (host) new MutationObserver(scheduleScan).observe(host, { childList: true, subtree: true })

scheduleScan()
