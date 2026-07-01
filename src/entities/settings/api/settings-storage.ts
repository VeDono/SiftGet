import { KEY_API, KEY_SETTINGS, DEFAULT_SETTINGS } from '@/shared/config/constants'
import { getValue, setValue } from '@/shared/lib/chrome-storage'
import type { Settings } from '@/shared/types'

export async function getApiKey(): Promise<string> {
  return ((await getValue<string>(KEY_API)) ?? '').trim()
}

export async function setApiKey(key: string): Promise<void> {
  await setValue({ [KEY_API]: (key ?? '').trim() })
}

export async function getSettings(): Promise<Settings> {
  const stored = await getValue<Partial<Settings>>(KEY_SETTINGS)
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) }
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch }
  await setValue({ [KEY_SETTINGS]: next })
  return next
}
