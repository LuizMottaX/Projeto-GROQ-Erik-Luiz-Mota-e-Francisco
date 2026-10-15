import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User } from '../types/api'

/**
 * Estado de sessão do navegador (somente token + usuário logado).
 * Dados vindos do servidor (transcrições, lista de usuários) ficam no TanStack Query.
 */
interface AuthState {
  token: string | null
  user: User | null
  setSession: (token: string, user: User) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      clearSession: () => set({ token: null, user: null }),
    }),
    {
      name: 'ditado-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ token, user }) => ({ token, user }),
    },
  ),
)

export const selectIsAuthenticated = (state: AuthState) => !!state.token
export const selectIsAdmin = (state: AuthState) => state.user?.role === 'admin'
