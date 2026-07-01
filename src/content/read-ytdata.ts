// MAIN-world content script — the only place that can read the page's own JS globals
// (ytInitialData / ytInitialPlayerResponse). Relays the channel to the ISOLATED script.
// Dependency-free on purpose; the two string constants mirror shared/config/constants.
;(() => {
  const YT_BRIDGE = 'SIFTGET_YT_DATA' // main -> isolated
  const YT_REQUEST = 'SIFTGET_YT_REQUEST' // isolated -> main

  function readGlobals(): Record<string, string> {
    const out: Record<string, string> = {}
    const w = window as unknown as {
      ytInitialPlayerResponse?: { videoDetails?: { channelId?: string; author?: string } }
      ytInitialData?: {
        metadata?: { channelMetadataRenderer?: { externalId?: string; title?: string; vanityChannelUrl?: string } }
      }
    }
    try {
      const vd = w.ytInitialPlayerResponse?.videoDetails
      if (vd) {
        if (vd.channelId) out.channelId = vd.channelId
        if (vd.author) out.title = vd.author
      }
    } catch {
      /* ignore */
    }
    try {
      const md = w.ytInitialData?.metadata?.channelMetadataRenderer
      if (md) {
        if (md.externalId && !out.channelId) out.channelId = md.externalId
        if (md.title && !out.title) out.title = md.title
        const h = (md.vanityChannelUrl ?? '').match(/@([^/?#]+)/)
        if (h) out.handle = '@' + h[1]
      }
    } catch {
      /* ignore */
    }
    return out
  }

  function post() {
    window.postMessage({ __siftget: true, type: YT_BRIDGE, payload: readGlobals() }, '*')
  }

  window.addEventListener('message', (e) => {
    if (e.source !== window) return
    const d = e.data as { __siftget?: boolean; type?: string }
    if (d && d.__siftget && d.type === YT_REQUEST) post()
  })
  window.addEventListener('yt-navigate-finish', post)
  post()
})()

export {}
