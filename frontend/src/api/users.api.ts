import { api } from '../lib/api'
import type { User } from '../types/api'

/** Admin: lista todas as contas. */
export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users')
  return data
}

/** Admin: exclui uma conta e suas transcrições. */
export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`)
}
