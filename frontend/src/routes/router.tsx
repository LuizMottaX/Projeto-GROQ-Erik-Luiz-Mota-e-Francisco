import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../components/AppLayout'
import { AdminPage } from '../pages/AdminPage'
import { DashboardPage } from '../pages/DashboardPage'
import { EntrarPage } from '../pages/EntrarPage'
import { LandingPage } from '../pages/LandingPage'
import { AdminRoute, GuestOnlyRoute, ProtectedRoute } from './guards'

export const router = createBrowserRouter([
  // Públicas
  { path: '/', element: <LandingPage /> },
  {
    element: <GuestOnlyRoute />,
    children: [{ path: '/entrar', element: <EntrarPage /> }],
  },

  // Protegidas
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/app', element: <DashboardPage /> },
          {
            element: <AdminRoute />,
            children: [{ path: '/admin', element: <AdminPage /> }],
          },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])
