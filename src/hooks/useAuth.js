/**
 * useAuth — watches Firebase Auth state and returns the current user.
 * Returns { user, loading }
 *   user: Firebase User object if signed in, null if signed out
 *   loading: true while the initial auth check is in flight
 */
import { onAuthStateChanged } from 'firebase/auth'
import { useEffect, useState } from 'react'
import { getAuthInstance } from '../firebase/client'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuthInstance()
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    // Cleanup listener on unmount
    return () => unsubscribe()
  }, [])

  return { user, loading }
}
