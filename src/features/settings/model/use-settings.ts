import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSettings, setSettings } from '@/entities/settings/api/settings-storage'
import type { Settings } from '@/shared/types'

export const SETTINGS_KEY = ['settings'] as const

export function useSettings() {
  return useQuery({ queryKey: SETTINGS_KEY, queryFn: getSettings })
}

export function usePatchSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: Partial<Settings>) => setSettings(patch),
    onSuccess: (next) => qc.setQueryData(SETTINGS_KEY, next),
  })
}
