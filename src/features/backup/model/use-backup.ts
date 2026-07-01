import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface BackupFile {
  app: 'siftget'
  version: number
  exportedAt: string
  data: Record<string, unknown>
}

// Dump everything in chrome.storage.local (settings, API key, channel caches, watched
// history, aliases) into a JSON file the user can keep or move to another machine.
export async function exportBackup(): Promise<void> {
  const data = await chrome.storage.local.get(null)
  const payload: BackupFile = {
    app: 'siftget',
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const stamp = new Date().toISOString().slice(0, 10)
  a.download = `siftget-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Restore from a file. Accepts our envelope or a raw storage object. Merges (overwrites
// matching keys, keeps everything else).
export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  const parsed = JSON.parse(text) as BackupFile | Record<string, unknown>
  const data =
    parsed && typeof parsed === 'object' && 'data' in parsed && (parsed as BackupFile).data
      ? (parsed as BackupFile).data
      : (parsed as Record<string, unknown>)
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid backup file')
  }
  await chrome.storage.local.set(data)
}

export function useBackup() {
  const qc = useQueryClient()
  const [imported, setImported] = useState(false)

  async function importFrom(file: File) {
    await importBackup(file)
    await qc.invalidateQueries()
    setImported(true)
    setTimeout(() => setImported(false), 2000)
  }

  return { exportNow: exportBackup, importFrom, imported }
}
