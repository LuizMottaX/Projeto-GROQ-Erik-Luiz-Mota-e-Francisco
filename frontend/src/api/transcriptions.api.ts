import { api } from '../lib/api'
import type { Transcription } from '../types/api'

export const MAX_AUDIO_BYTES = 25 * 1024 * 1024

export const ACCEPTED_AUDIO_EXTENSIONS = [
  '.flac',
  '.m4a',
  '.mp3',
  '.mp4',
  '.mpeg',
  '.mpga',
  '.ogg',
  '.opus',
  '.wav',
  '.webm',
]

export interface CreateTranscriptionInput {
  file: File
  language?: string
  /** Progresso do envio, de 0 a 100. */
  onUploadProgress?: (percent: number) => void
}

export async function listTranscriptions(): Promise<Transcription[]> {
  const { data } = await api.get<Transcription[]>('/transcriptions')
  return data
}

export async function createTranscription({
  file,
  language,
  onUploadProgress,
}: CreateTranscriptionInput): Promise<Transcription> {
  const form = new FormData()
  form.append('file', file)
  if (language) form.append('language', language)

  // Sem Content-Type manual: o navegador define o boundary do multipart.
  const { data } = await api.post<Transcription>('/transcriptions', form, {
    onUploadProgress: (event) => {
      if (onUploadProgress && event.total) {
        onUploadProgress(Math.round((event.loaded / event.total) * 100))
      }
    },
  })
  return data
}

export async function deleteTranscription(id: string): Promise<void> {
  await api.delete(`/transcriptions/${id}`)
}
