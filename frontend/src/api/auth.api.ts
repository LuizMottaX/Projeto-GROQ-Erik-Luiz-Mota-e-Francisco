import { api } from '../lib/api'
import type { LoginInput, LoginResponse, RegisterInput, User } from '../types/api'

export async function login(input: LoginInput): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', input)
  return data
}

/** Cadastro público (POST /users). Não retorna token: o login vem em seguida. */
export async function register(input: RegisterInput): Promise<User> {
  const { data } = await api.post<User>('/users', input)
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/auth/me')
  return data
}
