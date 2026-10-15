import { useMutation } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth.api'
import { queryClient } from '../lib/query-client'
import { useAuthStore } from '../stores/auth.store'
import type { LoginInput, LoginResponse, RegisterInput } from '../types/api'

/** Para onde ir após autenticar: a página protegida que o usuário tentou abrir, ou /app. */
function useRedirectAfterAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  const setSession = useAuthStore((s) => s.setSession)
  const from = (location.state as { from?: string } | null)?.from

  return ({ accessToken, user }: LoginResponse) => {
    setSession(accessToken, user)
    navigate(from && from !== '/entrar' ? from : '/app', { replace: true })
  }
}

export function useLogin() {
  const onAuthenticated = useRedirectAfterAuth()
  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: onAuthenticated,
  })
}

/** Cadastro seguido de login automático. */
export function useRegister() {
  const onAuthenticated = useRedirectAfterAuth()
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      await register(input)
      return login({ email: input.email, password: input.password })
    },
    onSuccess: onAuthenticated,
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const clearSession = useAuthStore((s) => s.clearSession)
  return async () => {
    // Sai da área protegida ANTES de limpar a sessão; caso contrário o
    // ProtectedRoute reage primeiro e redireciona para /entrar.
    // flushSync: a navegação é aplicada já, não como transição adiada.
    await navigate('/', { replace: true, flushSync: true })
    clearSession()
    queryClient.clear()
  }
}
