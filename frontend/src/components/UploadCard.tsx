import { useRef, useState, type DragEvent, type FormEvent } from 'react'
import { ACCEPTED_AUDIO_EXTENSIONS, MAX_AUDIO_BYTES } from '../api/transcriptions.api'
import { useCreateTranscription } from '../hooks/useTranscriptions'
import { getErrorMessage } from '../lib/api'
import { formatBytes } from '../lib/format'
import { MicIcon } from './Logo'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { CopyButton } from './ui/CopyButton'

const LANGUAGES = [
  { value: '', label: 'Detectar automaticamente' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
  { value: 'fr', label: 'Francês' },
  { value: 'de', label: 'Alemão' },
  { value: 'it', label: 'Italiano' },
]

/** Mesmas regras do backend, checadas antes do envio para dar retorno imediato. */
function validateFile(file: File): string | null {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!ACCEPTED_AUDIO_EXTENSIONS.includes(extension)) {
    return `Formato não suportado. Use: ${ACCEPTED_AUDIO_EXTENSIONS.join(', ')}`
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return `O arquivo tem ${formatBytes(file.size)}; o limite é ${formatBytes(MAX_AUDIO_BYTES)}.`
  }
  if (file.size === 0) {
    return 'O arquivo está vazio.'
  }
  return null
}

export function UploadCard() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('pt')
  const [fileError, setFileError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const transcribe = useCreateTranscription()

  function selectFile(selected: File | undefined) {
    if (!selected) return
    transcribe.reset()
    const error = validateFile(selected)
    setFileError(error)
    setFile(error ? null : selected)
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault()
    setIsDragging(false)
    if (!transcribe.isPending) selectFile(event.dataTransfer.files[0])
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) return
    setProgress(0)
    transcribe.mutate(
      { file, language: language || undefined, onUploadProgress: setProgress },
      {
        onSuccess: () => {
          setFile(null)
          if (inputRef.current) inputRef.current.value = ''
        },
      },
    )
  }

  const stage = progress < 100 ? `Enviando… ${progress}%` : 'Transcrevendo…'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <h2 className="text-lg font-semibold text-slate-900">Nova transcrição</h2>
      <p className="mt-1 text-sm text-slate-600">
        Envie um arquivo de áudio de até 25 MB.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <label
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            isDragging
              ? 'border-brand-500 bg-brand-50'
              : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
          } ${transcribe.isPending ? 'pointer-events-none opacity-60' : ''}`}
        >
          <span className="grid size-10 place-items-center rounded-full bg-brand-100 text-brand-700">
            <MicIcon />
          </span>
          {file ? (
            <span className="text-sm">
              <strong className="font-medium text-slate-900">{file.name}</strong>
              <span className="text-slate-500"> · {formatBytes(file.size)}</span>
            </span>
          ) : (
            <span className="text-sm text-slate-600">
              <strong className="font-medium text-brand-700">Clique para escolher</strong> ou
              arraste um arquivo aqui
            </span>
          )}
          <span className="text-xs text-slate-500">
            {ACCEPTED_AUDIO_EXTENSIONS.map((ext) => ext.slice(1).toUpperCase()).join(', ')}
          </span>
          <input
            ref={inputRef}
            type="file"
            name="file"
            accept={[...ACCEPTED_AUDIO_EXTENSIONS, 'audio/*'].join(',')}
            className="sr-only"
            disabled={transcribe.isPending}
            onChange={(e) => selectFile(e.target.files?.[0])}
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-64">
            <label htmlFor="language" className="mb-1.5 block text-sm font-medium text-slate-700">
              Idioma do áudio
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={transcribe.isPending}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            className="sm:ml-auto sm:min-w-40"
            disabled={!file}
            loading={transcribe.isPending}
          >
            {transcribe.isPending ? stage : 'Transcrever'}
          </Button>
        </div>

        {transcribe.isPending && (
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full bg-brand-500 transition-all ${
                progress >= 100 ? 'animate-pulse' : ''
              }`}
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
        )}

        {fileError && <Alert>{fileError}</Alert>}
        {transcribe.isError && <Alert>{getErrorMessage(transcribe.error)}</Alert>}
      </form>

      {transcribe.isSuccess && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-emerald-800">Transcrição concluída</h3>
            <CopyButton text={transcribe.data.text} />
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {transcribe.data.text}
          </p>
        </div>
      )}
    </section>
  )
}
