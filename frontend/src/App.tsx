import { Navigate, Route, Routes } from 'react-router-dom'
import { RouteGuard } from './components/RouteGuard'
import { useAuth } from './context/AuthContext'
import { PORTAL_NAV } from './config/navigation'
import { getPortalPathForRole } from './config/roles'
import { PortalLayout } from './layouts/PortalLayout'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LoginPage } from './pages/LoginPage'
import { createPortalChildRoutes } from './routes/portalRoutes'

function RootRedirect() {
  const { session, appUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="route-guard-loading" role="status">
        <p className="skeleton">Loading...</p>
      </div>
    )
  }

  if (session && appUser) {
    return <Navigate to={getPortalPathForRole(appUser.role)} replace />
  }

  return <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        path="/executive/*"
        element={
          <RouteGuard allowedRoles={['CEO']}>
            <PortalLayout role="CEO" />
          </RouteGuard>
        }
      >
        {createPortalChildRoutes(PORTAL_NAV.CEO)}
      </Route>

      <Route
        path="/accountant/*"
        element={
          <RouteGuard allowedRoles={['Accountant']}>
            <PortalLayout role="Accountant" />
          </RouteGuard>
        }
      >
        {createPortalChildRoutes(PORTAL_NAV.Accountant)}
      </Route>

      <Route
        path="/project-manager/*"
        element={
          <RouteGuard allowedRoles={['ProjectManager']}>
            <PortalLayout role="ProjectManager" />
          </RouteGuard>
        }
      >
        {createPortalChildRoutes(PORTAL_NAV.ProjectManager)}
      </Route>

      <Route
        path="/employee/*"
        element={
          <RouteGuard allowedRoles={['Employee']}>
            <PortalLayout role="Employee" />
          </RouteGuard>
        }
      >
        {createPortalChildRoutes(PORTAL_NAV.Employee)}
      </Route>

      <Route
        path="/admin/*"
        element={
          <RouteGuard allowedRoles={['Admin']}>
            <PortalLayout role="Admin" />
          </RouteGuard>
        }
      >
        {createPortalChildRoutes(PORTAL_NAV.Admin)}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
