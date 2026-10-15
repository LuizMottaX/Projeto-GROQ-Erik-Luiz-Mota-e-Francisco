/**
 * Navegação fora do React (usada pelo interceptor do axios).
 * Recarga completa de propósito: após um 401 nenhum estado antigo sobrevive.
 */
export function redirectTo(path: string): void {
  if (window.location.pathname !== path) {
    window.location.replace(path)
  }
}
