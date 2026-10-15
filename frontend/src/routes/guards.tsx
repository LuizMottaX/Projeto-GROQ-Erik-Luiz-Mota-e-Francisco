import { Navigate, Outlet, useLocation } from 'react-router-dom'
import {
  selectIsAdmin,
  selectIsAuthenticated,
  useAuthStore,
} from '../stores/auth.store'

/** Exige sessão; guarda a rota de origem para voltar após o login. */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/** Exige role 'admin'. A API também valida (403), isto é só para a UI. */
export function AdminRoute() {
  const isAdmin = useAuthStore(selectIsAdmin)
  if (!isAdmin) {
    return <Navigate to="/app" replace />
  }
  return <Outlet />
}

/** Telas públicas de autenticação: quem já está logado vai direto para /app. */
export function GuestOnlyRoute() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }
  return <Outlet />
}
