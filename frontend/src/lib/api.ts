import axios, { isAxiosError } from 'axios'
import { useAuthStore } from '../stores/auth.store'
import type { ApiErrorBody } from '../types/api'
import { redirectTo } from './navigation'
import { queryClient } from './query-client'

export const LOGIN_PATH = '/entrar'

/**
 * Instância ÚNICA do axios da aplicação.
 * baseURL relativo: o proxy do Vite encaminha /api para o backend.
 */
export const api = axios.create({
  baseURL: '/api',
})

// Injeta o token da sessão em toda requisição.
// getState() lê o Zustand fora do React, sem precisar de hooks.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 = sessão inválida ou expirada: limpa tudo e manda para o login.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const isLoginAttempt =
      isAxiosError(error) && error.config?.url?.includes('/auth/login')

    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      !isLoginAttempt // senha errada no login não é sessão expirada
    ) {
      useAuthStore.getState().clearSession()
      queryClient.clear()
      redirectTo(LOGIN_PATH)
    }

    return Promise.reject(error)
  },
)

/** Extrai uma mensagem legível de um erro da API para exibir ao usuário. */
export function getErrorMessage(
  error: unknown,
  fallback = 'Algo deu errado. Tente novamente.',
): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) {
      return 'Não foi possível conectar ao servidor.'
    }
    const message = error.response.data?.message
    if (Array.isArray(message)) return message.join('\n')
    if (typeof message === 'string' && message) return message
  }
  return fallback
}
