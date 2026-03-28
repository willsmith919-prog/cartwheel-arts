/**
 * ProtectedRoute — wraps admin routes and redirects to /admin/login
 * if the user is not authenticated. Shows nothing while auth is loading
 * to prevent a flash of the login page on refresh.
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  // Still checking auth state — render nothing to avoid flicker
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--ca-canvas)' }}>
        <p style={{ color: 'var(--ca-muted)', fontFamily: 'var(--ca-font-sans)' }}>
          Loading…
        </p>
      </div>
    )
  }

  // Not signed in — send to login
  if (!user) {
    return <Navigate to="/admin/login" replace />
  }

  // Signed in — render the child route
  return <Outlet />
}
