import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../stores/auth.store'
import type { User } from '../types/api'
import { api, getErrorMessage } from './api'
import { redirectTo } from './navigation'
import { queryClient } from './query-client'

vi.mock('./navigation', () => ({ redirectTo: vi.fn() }))

const user: User = {
  id: '1',
  name: 'Ana',
  email: 'ana@teste.com',
  role: 'user',
  createdAt: '2026-01-01T00:00:00.000Z',
}

/** Substitui a camada HTTP do axios: devolve `status` sem ir à rede. */
function respondWith(status: number, data: unknown = {}) {
  const adapter = vi.fn(async (config: InternalAxiosRequestConfig) => {
    const response = {
      data,
      status,
      statusText: String(status),
      headers: {},
      config,
    }
    if (status >= 400) {
      throw new AxiosError('erro', String(status), config, null, response)
    }
    return response
  })
  api.defaults.adapter = adapter
  return adapter
}

describe('instância do axios', () => {
  beforeEach(() => {
    useAuthStore.getState().setSession('token-123', user)
    vi.mocked(redirectTo).mockClear()
  })

  afterEach(() => {
    useAuthStore.getState().clearSession()
    queryClient.clear()
  })

  it('usa /api relativo como baseURL', () => {
    expect(api.defaults.baseURL).toBe('/api')
  })

  it('injeta o Bearer token da sessão', async () => {
    const adapter = respondWith(200)
    await api.get('/transcriptions')

    const headers = AxiosHeaders.from(adapter.mock.calls[0][0].headers)
    expect(headers.get('Authorization')).toBe('Bearer token-123')
  })

  it('não envia Authorization sem sessão', async () => {
    useAuthStore.getState().clearSession()
    const adapter = respondWith(200)
    await api.get('/transcriptions')

    const headers = AxiosHeaders.from(adapter.mock.calls[0][0].headers)
    expect(headers.has('Authorization')).toBe(false)
  })

  it('em 401 limpa sessão e cache e redireciona para /entrar', async () => {
    queryClient.setQueryData(['transcriptions'], [{ id: 'x' }])
    respondWith(401)

    await expect(api.get('/transcriptions')).rejects.toThrow()

    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(queryClient.getQueryData(['transcriptions'])).toBeUndefined()
    expect(redirectTo).toHaveBeenCalledWith('/entrar')
  })

  it('401 no login (senha errada) não derruba a sessão nem redireciona', async () => {
    respondWith(401, { statusCode: 401, message: 'E-mail ou senha inválidos' })

    await expect(api.post('/auth/login', {})).rejects.toThrow()

    expect(useAuthStore.getState().token).toBe('token-123')
    expect(redirectTo).not.toHaveBeenCalled()
  })

  it('outros erros (ex.: 403) não encerram a sessão', async () => {
    respondWith(403)

    await expect(api.get('/users')).rejects.toThrow()

    expect(useAuthStore.getState().token).toBe('token-123')
    expect(redirectTo).not.toHaveBeenCalled()
  })

  it('persiste a sessão no localStorage', () => {
    const stored = JSON.parse(localStorage.getItem('ditado-auth') ?? '{}')
    expect(stored.state).toEqual({ token: 'token-123', user })
  })
})

describe('getErrorMessage', () => {
  const errorWith = (data: unknown, status = 400) => {
    const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig
    return new AxiosError('erro', String(status), config, null, {
      data,
      status,
      statusText: '',
      headers: {},
      config,
    })
  }

  it('usa a mensagem do backend', () => {
    expect(getErrorMessage(errorWith({ message: 'E-mail já cadastrado' }))).toBe(
      'E-mail já cadastrado',
    )
  })

  it('junta listas de validação', () => {
    expect(getErrorMessage(errorWith({ message: ['a', 'b'] }))).toBe('a\nb')
  })

  it('informa falha de conexão', () => {
    expect(getErrorMessage(new AxiosError('Network Error'))).toBe(
      'Não foi possível conectar ao servidor.',
    )
  })

  it('usa o fallback para erros desconhecidos', () => {
    expect(getErrorMessage(new Error('x'), 'padrão')).toBe('padrão')
  })
})
