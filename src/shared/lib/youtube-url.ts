import type { ChannelHint } from '@/shared/types'

/** Parse a YouTube URL into a channel hint (fallback when the content script can't be reached). */
export function parseYouTubeUrl(rawUrl: string): ChannelHint {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return { isYouTube: false, pageType: 'other' }
  }

  const host = url.hostname.replace(/^www\.|^m\./, '')
  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com') {
    return { isYouTube: false, pageType: 'other' }
  }

  const path = url.pathname
  const base: ChannelHint = { isYouTube: true }

  let m = path.match(/^\/channel\/(UC[\w-]{20,})/)
  if (m) return { ...base, pageType: 'channel', channelId: m[1] }

  m = path.match(/^\/@([^/]+)/)
  if (m) return { ...base, pageType: 'channel', handle: decodeURIComponent(m[1]) }

  m = path.match(/^\/c\/([^/]+)/)
  if (m) return { ...base, pageType: 'channel', query: decodeURIComponent(m[1]) }

  m = path.match(/^\/user\/([^/]+)/)
  if (m) return { ...base, pageType: 'channel', username: decodeURIComponent(m[1]) }

  if (path === '/watch' && url.searchParams.get('v')) {
    return { ...base, pageType: 'watch', videoId: url.searchParams.get('v') ?? undefined }
  }
  m = path.match(/^\/(shorts|live)\/([\w-]+)/)
  if (m) return { ...base, pageType: 'watch', videoId: m[2] }

  return { ...base, pageType: 'other' }
}

/** "youtube.com/@handle" for the popup header. */
export function channelDisplayUrl(c: {
  handle?: string
  customUrl?: string
  channelId?: string
}): string {
  if (c.handle) return `youtube.com/${c.handle.startsWith('@') ? c.handle : '@' + c.handle}`
  if (c.customUrl) return `youtube.com/${c.customUrl}`
  if (c.channelId) return `youtube.com/channel/${c.channelId}`
  return 'youtube.com'
}
