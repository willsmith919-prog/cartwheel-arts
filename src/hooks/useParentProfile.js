/**
 * useParentProfile — loads the current user's parent profile and children
 * from Firestore. Returns null profile if the user is not a parent (e.g. admin).
 *
 * Returns { profile, children, loading }
 *   profile: { id, name, email, phone, ... } or null
 *   children: array of { id, name, age }
 *   loading: true while fetching
 */
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { getDb } from '../firebase/client'
import { useAuth } from './useAuth'

export function useParentProfile() {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setProfile(null)
      setChildren([])
      setLoading(false)
      return
    }

    const db = getDb()
    if (!db) {
      setLoading(false)
      return
    }

    async function load() {
      try {
        const profileSnap = await getDoc(doc(db, 'parents', user.uid))
        if (!profileSnap.exists()) {
          setProfile(null)
          setChildren([])
          return
        }
        setProfile({ id: profileSnap.id, ...profileSnap.data() })

        const childrenSnap = await getDocs(
          query(collection(db, 'parents', user.uid, 'children'), orderBy('createdAt', 'asc'))
        )
        setChildren(childrenSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error('Failed to load parent profile', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user, authLoading])

  return { profile, children, loading }
}
