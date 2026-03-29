/**
 * ProtectedRoute — wraps admin routes and redirects to /admin/login
 * if the user is not authenticated. Also blocks parent accounts (users
 * who have a `parents/{uid}` doc) from accessing the admin portal.
 */
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getDb } from '../firebase/client'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth()
  const [isParent, setIsParent] = useState(null) // null = unchecked
  const [checkingParent, setCheckingParent] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsParent(null)
      return
    }

    const db = getDb()
    if (!db) {
      setIsParent(false)
      return
    }

    setCheckingParent(true)
    getDoc(doc(db, 'parents', user.uid))
      .then((snap) => setIsParent(snap.exists()))
      .catch(() => setIsParent(false))
      .finally(() => setCheckingParent(false))
  }, [user])

  const spinner = (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--ca-canvas)' }}
    >
      <p style={{ color: 'var(--ca-muted)', fontFamily: 'var(--ca-font-sans)' }}>Loading…</p>
    </div>
  )

  if (authLoading) return spinner
  if (!user) return <Navigate to="/admin/login" replace />
  if (checkingParent) return spinner
  // Parent account — not an admin
  if (isParent) return <Navigate to="/" replace />

  return <Outlet />
}
