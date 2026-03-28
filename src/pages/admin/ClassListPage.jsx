/**
 * ClassListPage — shows all classes in a table with Edit and Archive actions.
 * Classes are read from Firestore in real-time. Archived classes are hidden
 * by default but can be shown with a toggle.
 */
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDb } from '../../firebase/client'

export default function ClassListPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  const [archiving, setArchiving] = useState(null) // id of class being archived

  useEffect(() => {
    const db = getDb()
    if (!db) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'classes'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setClasses(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  async function handleArchive(classItem) {
    if (!window.confirm(`Archive "${classItem.title}"? It will be hidden from the public site.`)) return
    setArchiving(classItem.id)
    try {
      const db = getDb()
      await updateDoc(doc(db, 'classes', classItem.id), { status: 'archived' })
    } catch (err) {
      console.error('Archive failed', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setArchiving(null)
    }
  }

  async function handleUnarchive(classItem) {
    setArchiving(classItem.id)
    try {
      const db = getDb()
      await updateDoc(doc(db, 'classes', classItem.id), { status: 'active' })
    } catch (err) {
      console.error('Unarchive failed', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setArchiving(null)
    }
  }

  const visibleClasses = showArchived
    ? classes
    : classes.filter((c) => c.status !== 'archived')

  function statusBadge(status) {
    const styles = {
      active:   { backgroundColor: '#dcfce7', color: '#15803d' },
      draft:    { backgroundColor: '#fef9c3', color: '#854d0e' },
      full:     { backgroundColor: '#fee2e2', color: '#b91c1c' },
      archived: { backgroundColor: '#f3f4f6', color: '#6b7280' },
    }
    const s = styles[status] ?? styles.draft
    return (
      <span
        className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
        style={s}
      >
        {status}
      </span>
    )
  }

  function formatDate(val) {
    if (!val) return '—'
    // Firestore Timestamp or plain string
    const date = val?.toDate ? val.toDate() : new Date(val)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="p-8" style={{ fontFamily: 'var(--ca-font-sans)' }}>

      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: 'var(--ca-font-heading)', color: 'var(--ca-ink)' }}
          >
            Classes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ca-muted)' }}>
            Manage your standalone classes and series
          </p>
        </div>

        <Link
          to="/admin/classes/new"
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--ca-accent)', color: '#ffffff' }}
        >
          + New Class
        </Link>
      </div>

      {/* Show archived toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="text-sm"
          style={{ color: 'var(--ca-muted)' }}
        >
          {showArchived ? '↑ Hide archived' : '↓ Show archived'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-sm" style={{ color: 'var(--ca-muted)' }}>Loading classes…</p>
      )}

      {/* Empty state */}
      {!loading && visibleClasses.length === 0 && (
        <div
          className="rounded-xl flex flex-col items-center justify-center py-16 text-center"
          style={{ border: '2px dashed var(--ca-border)' }}
        >
          <span className="text-4xl mb-3">🎨</span>
          <p className="font-medium mb-1" style={{ color: 'var(--ca-ink)' }}>No classes yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--ca-muted)' }}>
            Create your first class to get started
          </p>
          <Link
            to="/admin/classes/new"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--ca-accent)', color: '#ffffff' }}
          >
            + New Class
          </Link>
        </div>
      )}

      {/* Table */}
      {!loading && visibleClasses.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--ca-border)', backgroundColor: '#ffffff' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ca-border)', backgroundColor: '#fafaf9' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Title</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Type</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Starts</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Price</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Status</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Drop-in</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visibleClasses.map((c, i) => (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: i < visibleClasses.length - 1 ? '1px solid var(--ca-border)' : 'none',
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ca-ink)' }}>
                    {c.title}
                  </td>
                  <td className="px-4 py-3 capitalize" style={{ color: 'var(--ca-muted)' }}>
                    {c.type ?? '—'}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ca-muted)' }}>
                    {formatDate(c.startDate)}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ca-muted)' }}>
                    {c.type === 'series' && c.bundlePrice
                      ? `$${c.bundlePrice}`
                      : c.price
                      ? `$${c.price}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(c.status ?? 'draft')}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: c.allowDropIn ? '#dcfce7' : '#f3f4f6',
                        color: c.allowDropIn ? '#15803d' : '#6b7280',
                      }}
                    >
                      {c.allowDropIn ? 'On' : 'Off'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <Link
                        to={`/admin/classes/${c.id}/edit`}
                        className="text-sm font-medium"
                        style={{ color: 'var(--ca-accent)' }}
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/admin/rosters/${c.id}`}
                        className="text-sm font-medium"
                        style={{ color: 'var(--ca-muted)' }}
                      >
                        Roster
                      </Link>
                      {c.status !== 'archived' ? (
                        <button
                          onClick={() => handleArchive(c)}
                          disabled={archiving === c.id}
                          className="text-sm"
                          style={{ color: '#b91c1c', opacity: archiving === c.id ? 0.5 : 1 }}
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnarchive(c)}
                          disabled={archiving === c.id}
                          className="text-sm"
                          style={{ color: 'var(--ca-muted)', opacity: archiving === c.id ? 0.5 : 1 }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
