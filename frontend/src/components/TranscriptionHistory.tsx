import { useState } from 'react'
import { useDeleteTranscription, useTranscriptions } from '../hooks/useTranscriptions'
import { getErrorMessage } from '../lib/api'
import { formatDateTime } from '../lib/format'
import type { Transcription } from '../types/api'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { ConfirmButton } from './ui/ConfirmButton'
import { CopyButton } from './ui/CopyButton'

export function TranscriptionHistory() {
  const { data, isPending, isError, error, refetch } = useTranscriptions()

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Histórico</h2>
        {data && data.length > 0 && (
          <span className="text-sm text-slate-500">
            {data.length} {data.length === 1 ? 'transcrição' : 'transcrições'}
          </span>
        )}
      </div>

      {isPending && (
        <div className="space-y-3" aria-busy="true" aria-label="Carregando histórico">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200/60" />
          ))}
        </div>
      )}

      {isError && (
        <div className="space-y-3">
          <Alert>{getErrorMessage(error, 'Não foi possível carregar o histórico.')}</Alert>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-700">Nenhuma transcrição ainda</p>
          <p className="mt-1 text-sm text-slate-500">
            Envie seu primeiro áudio acima. O resultado aparece aqui.
          </p>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((transcription) => (
            <HistoryItem key={transcription.id} transcription={transcription} />
          ))}
        </ul>
      )}
    </section>
  )
}

function HistoryItem({ transcription }: { transcription: Transcription }) {
  const [expanded, setExpanded] = useState(false)
  const remove = useDeleteTranscription()
  const isLong = transcription.text.length > 280

  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="truncate text-sm font-medium text-slate-900">
          {transcription.originalFilename ?? 'Áudio'}
        </span>
        <time dateTime={transcription.createdAt} className="text-xs text-slate-500">
          {formatDateTime(transcription.createdAt)}
        </time>
        <div className="ml-auto flex items-center gap-1">
          <CopyButton text={transcription.text} />
          <ConfirmButton
            onConfirm={() => remove.mutate(transcription.id)}
            loading={remove.isPending}
            confirmLabel="Excluir"
          >
            Excluir
          </ConfirmButton>
        </div>
      </div>
      <p
        className={`whitespace-pre-wrap text-sm leading-relaxed text-slate-700 ${
          !expanded && isLong ? 'line-clamp-3' : ''
        }`}
      >
        {transcription.text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-sm font-medium text-brand-700 hover:underline"
        >
          {expanded ? 'Mostrar menos' : 'Mostrar tudo'}
        </button>
      )}
      {remove.isError && (
        <div className="mt-3">
          <Alert>{getErrorMessage(remove.error, 'Não foi possível excluir.')}</Alert>
        </div>
      )}
    </li>
  )
}
