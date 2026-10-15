import { useEffect, useState } from 'react'
import { Button } from './Button'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // Sem permissão de área de transferência: nada a fazer.
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={copy}>
      {copied ? 'Copiado!' : 'Copiar'}
    </Button>
  )
}
