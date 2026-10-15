import { useState, type ReactNode } from 'react'
import { Button } from './Button'

/**
 * Ação destrutiva em dois cliques (sem window.confirm):
 * o primeiro pede confirmação, o segundo executa.
 */
export function ConfirmButton({
  onConfirm,
  loading,
  disabled,
  children,
  confirmLabel = 'Confirmar',
}: {
  onConfirm: () => void
  loading?: boolean
  disabled?: boolean
  children: ReactNode
  confirmLabel?: string
}) {
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <Button
        variant="dangerGhost"
        size="sm"
        disabled={disabled}
        onClick={() => setAsking(true)}
      >
        {children}
      </Button>
    )
  }

  return (
    <span className="inline-flex gap-1">
      <Button
        variant="danger"
        size="sm"
        loading={loading}
        onClick={() => {
          onConfirm()
        }}
      >
        {confirmLabel}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={loading}
        onClick={() => setAsking(false)}
      >
        Cancelar
      </Button>
    </span>
  )
}
