// Contratos da API (espelham os DTOs de resposta do backend).

export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export interface LoginResponse {
  user: User
  accessToken: string
}

export interface Transcription {
  id: string
  text: string
  originalFilename: string | null
  createdAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}

/** Corpo de erro padrão do NestJS. */
export interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error?: string
}
