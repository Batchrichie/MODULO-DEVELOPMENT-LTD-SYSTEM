import { Navigate, useLocation } from 'react-router-dom'
import { getPortalPathForRole } from '../config/roles'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types/auth'

interface RouteGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function RouteGuard({ allowedRoles, children }: RouteGuardProps) {
  const { session, appUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="route-guard-loading" role="status" aria-live="polite">
        <p>Loading session…</p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!appUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message:
            'Your account is not linked to a CAREMS user profile. Contact an administrator.',
        }}
      />
    )
  }

  if (!allowedRoles.includes(appUser.role)) {
    return <Navigate to={getPortalPathForRole(appUser.role)} replace />
  }

  return <>{children}</>
}
