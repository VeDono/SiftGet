// Thin typed helpers over chrome.storage.local (MV3 returns promises natively).
export async function getValue<T>(key: string): Promise<T | undefined> {
  const out = await chrome.storage.local.get(key)
  return out[key] as T | undefined
}

export async function setValue(items: Record<string, unknown>): Promise<void> {
  await chrome.storage.local.set(items)
}

export async function removeValue(keys: string | string[]): Promise<void> {
  await chrome.storage.local.remove(keys)
}

export async function getAll(): Promise<Record<string, unknown>> {
  return (await chrome.storage.local.get(null)) as Record<string, unknown>
}
