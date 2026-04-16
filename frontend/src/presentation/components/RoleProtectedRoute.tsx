import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@application/store/authStore'
import type { UserRole } from '@domain/models'

interface RoleProtectedRouteProps {
  role: UserRole
  children: React.ReactNode
}

export default function RoleProtectedRoute({ role, children }: RoleProtectedRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user || user.role !== role) return <Navigate to="/" replace />
  return <>{children}</>
}
