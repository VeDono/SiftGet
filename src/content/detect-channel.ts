// ISOLATED-world content script — the channel-detection authority on the page.
// Recomputes the channel on demand (DETECT) and keeps a live copy of the page globals
// fed by the MAIN-world reader, so it works across SPA navigation without a reload.
import { MSG_DETECT, YT_BRIDGE, YT_REQUEST } from '@/shared/config/constants'
import { parseYouTubeUrl } from '@/shared/lib/youtube-url'
import type { ChannelHint, DetectResponse } from '@/shared/types'

let ytGlobals: Partial<ChannelHint> = {}

window.addEventListener('message', (e) => {
  if (e.source !== window) return
  const d = e.data as { __siftget?: boolean; type?: string; payload?: Partial<ChannelHint> }
  if (d && d.__siftget && d.type === YT_BRIDGE && d.payload) ytGlobals = d.payload
})

// Fire-and-forget pre-warm (used on navigation).
function askMainWorld() {
  window.postMessage({ __siftget: true, type: YT_REQUEST }, '*')
}

// Awaitable variant: ask the MAIN world and resolve once it answers (or a short
// timeout). Used before answering DETECT so we don't reply with stale globals.
function requestGlobals(timeoutMs = 180): Promise<void> {
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      window.removeEventListener('message', onMsg)
      resolve()
    }
    const onMsg = (e: MessageEvent) => {
      if (e.source !== window) return
      const d = e.data as { __siftget?: boolean; type?: string; payload?: Partial<ChannelHint> }
      if (d && d.__siftget && d.type === YT_BRIDGE) {
        if (d.payload) ytGlobals = d.payload
        finish()
      }
    }
    window.addEventListener('message', onMsg)
    window.postMessage({ __siftget: true, type: YT_REQUEST }, '*')
    setTimeout(finish, timeoutMs)
  })
}

function readFromDom(): Partial<ChannelHint> {
  const res: Partial<ChannelHint> = {}

  const canon = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? ''
  let m = canon.match(/\/channel\/(UC[\w-]{20,})/)
  if (m) res.channelId = m[1]

  const metaCid = document.querySelector('meta[itemprop="channelId"]')?.getAttribute('content')
  if (!res.channelId && metaCid && /^UC[\w-]{20,}$/.test(metaCid)) res.channelId = metaCid

  const authorUrl =
    document.querySelector('[itemprop="author"] [itemprop="url"]')?.getAttribute('href') ?? ''
  if (authorUrl) {
    const a = authorUrl.match(/\/channel\/(UC[\w-]{20,})/)
    if (a && !res.channelId) res.channelId = a[1]
    const h = authorUrl.match(/\/@([^/?#]+)/)
    if (h) res.handle = '@' + h[1]
  }
  const authorName = document
    .querySelector('[itemprop="author"] [itemprop="name"]')
    ?.getAttribute('content')
  if (authorName) res.title = authorName

  const ownerA = document.querySelector(
    'ytd-watch-metadata #owner #channel-name a, ytd-video-owner-renderer a.yt-simple-endpoint, #owner a.yt-simple-endpoint',
  )
  if (ownerA) {
    const href = ownerA.getAttribute('href') ?? ''
    const a = href.match(/\/channel\/(UC[\w-]{20,})/)
    if (a && !res.channelId) res.channelId = a[1]
    const h = href.match(/\/@([^/?#]+)/)
    if (h && !res.handle) res.handle = '@' + h[1]
    const txt = ownerA.textContent?.trim()
    if (txt && !res.title) res.title = txt
  }

  if (!res.title) {
    const tEl = document.querySelector(
      'ytd-channel-name #text, #channel-header #text-container yt-formatted-string',
    )
    const txt = tEl?.textContent?.trim()
    if (txt) res.title = txt
  }
  return res
}

function detectChannel(): ChannelHint | null {
  const url = parseYouTubeUrl(location.href)
  if (!url.isYouTube) return null

  const dom = readFromDom()
  const g = ytGlobals
  const channelId = url.channelId || dom.channelId || g.channelId || undefined
  const handle = url.handle || dom.handle || g.handle || undefined
  const username = url.username || undefined
  const query = url.query || undefined

  let title = dom.title || g.title || undefined
  if (!title && url.pageType === 'channel') {
    title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? undefined
  }

  const hasSignal = channelId || handle || username || query
  if (!hasSignal) return null

  return { pageType: url.pageType, channelId, handle, username, query, title, url: location.href }
}

chrome.runtime.onMessage.addListener((msg: { type?: string }, _sender, sendResponse) => {
  if (msg?.type === MSG_DETECT) {
    // Refresh page globals first, then answer with the freshest detection.
    requestGlobals().then(() => {
      try {
        sendResponse({ ok: true, channel: detectChannel() } satisfies DetectResponse)
      } catch (e) {
        sendResponse({ ok: false, error: String(e) } satisfies DetectResponse)
      }
    })
    return true // async response
  }
  return false
})

window.addEventListener('yt-navigate-finish', askMainWorld)
window.addEventListener('popstate', askMainWorld)
askMainWorld()
