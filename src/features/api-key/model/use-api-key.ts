import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiKey, setApiKey } from '@/entities/settings/api/settings-storage'

export const API_KEY = ['apiKey'] as const

export function useApiKey() {
  return useQuery({ queryKey: API_KEY, queryFn: getApiKey })
}

export function useSaveApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (key: string) => setApiKey(key),
    onSuccess: (_res, key) => qc.setQueryData(API_KEY, key.trim()),
  })
}
