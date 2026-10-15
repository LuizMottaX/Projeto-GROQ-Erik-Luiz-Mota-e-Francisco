import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTranscription,
  deleteTranscription,
  listTranscriptions,
  type CreateTranscriptionInput,
} from '../api/transcriptions.api'

export const transcriptionsKey = ['transcriptions'] as const

export function useTranscriptions() {
  return useQuery({
    queryKey: transcriptionsKey,
    queryFn: listTranscriptions,
  })
}

export function useCreateTranscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTranscriptionInput) => createTranscription(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transcriptionsKey }),
  })
}

export function useDeleteTranscription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTranscription(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: transcriptionsKey }),
  })
}
