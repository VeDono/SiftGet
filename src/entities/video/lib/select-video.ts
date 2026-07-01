import type { Settings, Video, WatchedMap } from '@/shared/types'

export interface Selection {
  total: number
  watchedCount: number
  candidateCount: number
  allWatched: boolean
  empty: boolean
  video: Video | null
  sample: Video[]
}

function poolFor(videos: Video[], includeShorts: boolean): Video[] {
  return includeShorts ? videos : videos.filter((v) => !v.isShort)
}

/** Pure selection: decide the eligible pool and pick one at random. */
export function selectVideo(
  videos: Video[] | undefined,
  watched: WatchedMap | undefined,
  settings: Partial<Settings>,
  options: { excludeId?: string } = {},
): Selection {
  const { includeShorts = false, ignoreWatched = false } = settings
  const pool = poolFor(videos ?? [], includeShorts)
  const total = pool.length

  let watchedCount = 0
  for (const v of pool) if (watched?.[v.id]) watchedCount++

  const empty = total === 0
  const allWatched = !empty && !ignoreWatched && watchedCount >= total

  const candidates = ignoreWatched ? pool : pool.filter((v) => !watched?.[v.id])

  let pickPool = candidates
  if (options.excludeId && candidates.length > 1) {
    pickPool = candidates.filter((v) => v.id !== options.excludeId)
  }
  const video = pickPool.length > 0 ? pickRandom(pickPool) : null

  const sample = shuffle(candidates)
    .slice(0, 12)
    .map((v) => ({ id: v.id, title: v.title }))

  return { total, watchedCount, candidateCount: candidates.length, allWatched, empty, video, sample }
}

export function pickRandom<T>(list: T[]): T | null {
  if (!list || list.length === 0) return null
  return list[Math.floor(Math.random() * list.length)]
}

function shuffle<T>(list: T[]): T[] {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
