/**
 * RosterPage — shows registered students for a specific class.
 * Reads from the registrations collection filtered by classId.
 * Stub-ready: displays a friendly empty state when no registrations exist yet.
 */
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDb } from '../../firebase/client'

export default function RosterPage() {
  const { id } = useParams()
  const [registrations, setRegistrations] = useState([])
  const [className, setClassName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const db = getDb()
    if (!db) {
      setLoading(false)
      return
    }

    // Load class name for the heading
    import('firebase/firestore').then(({ doc, getDoc }) => {
      getDoc(doc(db, 'classes', id)).then((snap) => {
        if (snap.exists()) setClassName(snap.data().title ?? '')
      })
    })

    // Live listener on registrations for this class
    const q = query(
      collection(db, 'registrations'),
      where('classId', '==', id)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      // Sort by registeredAt ascending
      data.sort((a, b) => {
        const aTime = a.registeredAt?.toMillis?.() ?? 0
        const bTime = b.registeredAt?.toMillis?.() ?? 0
        return aTime - bTime
      })
      setRegistrations(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [id])

  function formatDate(val) {
    if (!val) return '—'
    const date = val?.toDate ? val.toDate() : new Date(val)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function paymentBadge(status) {
    const styles = {
      paid:    { backgroundColor: '#dcfce7', color: '#15803d' },
      pending: { backgroundColor: '#fef9c3', color: '#854d0e' },
      refunded:{ backgroundColor: '#fee2e2', color: '#b91c1c' },
    }
    const s = styles[status] ?? styles.pending
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
        style={s}
      >
        {status ?? 'pending'}
      </span>
    )
  }

  return (
    <div className="p-8" style={{ fontFamily: 'var(--ca-font-sans)' }}>

      {/* Header */}
      <div className="mb-6">
        <Link
          to="/admin/classes"
          className="text-sm mb-3 flex items-center gap-1"
          style={{ color: 'var(--ca-muted)' }}
        >
          ← Back to Classes
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: 'var(--ca-font-heading)', color: 'var(--ca-ink)' }}
            >
              Roster
            </h1>
            {className && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--ca-muted)' }}>
                {className}
              </p>
            )}
          </div>

          {registrations.length > 0 && (
            <div
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: '#f3f4f6',
                color: 'var(--ca-ink)',
              }}
            >
              {registrations.length} student{registrations.length !== 1 ? 's' : ''} registered
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-sm" style={{ color: 'var(--ca-muted)' }}>
          Loading roster…
        </p>
      )}

      {/* Empty state */}
      {!loading && registrations.length === 0 && (
        <div
          className="rounded-xl flex flex-col items-center justify-center py-16 text-center"
          style={{ border: '2px dashed var(--ca-border)' }}
        >
          <span className="text-4xl mb-3">📋</span>
          <p className="font-medium mb-1" style={{ color: 'var(--ca-ink)' }}>
            No registrations yet
          </p>
          <p className="text-sm" style={{ color: 'var(--ca-muted)' }}>
            Registrations will appear here once parents sign up
          </p>
        </div>
      )}

      {/* Roster table */}
      {!loading && registrations.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--ca-border)', backgroundColor: '#ffffff' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--ca-border)',
                  backgroundColor: '#fafaf9',
                }}
              >
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>#</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Student</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Age</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Parent</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Email</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Phone</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Registered</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Payment</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r, i) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom:
                      i < registrations.length - 1
                        ? '1px solid var(--ca-border)'
                        : 'none',
                  }}
                >
                  <td className="px-4 py-3" style={{ color: 'var(--ca-muted)' }}>
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ca-ink)' }}>
                    {r.childName ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ca-muted)' }}>
                    {r.childAge ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ca-muted)' }}>
                    {r.parentName ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ca-muted)' }}>
                    <a
                      href={`mailto:${r.parentEmail}`}
                      style={{ color: 'var(--ca-accent)' }}
                    >
                      {r.parentEmail ?? '—'}
                    </a>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ca-muted)' }}>
                    {r.parentPhone ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ca-muted)' }}>
                    {formatDate(r.registeredAt)}
                  </td>
                  <td className="px-4 py-3">
                    {paymentBadge(r.paymentStatus)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Waitlist section — placeholder for Phase 3 */}
      {!loading && (
        <div className="mt-8">
          <h2
            className="text-base font-semibold mb-3"
            style={{ color: 'var(--ca-ink)' }}
          >
            Waitlist
          </h2>
          <div
            className="rounded-xl flex flex-col items-center justify-center py-10 text-center"
            style={{ border: '2px dashed var(--ca-border)' }}
          >
            <span className="text-3xl mb-2">⏳</span>
            <p className="text-sm" style={{ color: 'var(--ca-muted)' }}>
              Waitlist management coming in Phase 3
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
