/**
 * ClassDetailPage — full detail view for a single class.
 * Shows all class info, sessions list, pricing, and
 * a Register or Join Waitlist button.
 */
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDb } from '../../firebase/client'

function formatDate(val) {
  if (!val) return '—'
  const d = val?.toDate ? val.toDate() : new Date(val)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTime(val) {
  if (!val) return ''
  // val is "HH:MM" string from time input
  const [h, m] = val.split(':')
  const date = new Date()
  date.setHours(Number(h), Number(m))
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function ClassDetailPage() {
  const { id } = useParams()
  const [cls, setCls] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const db = getDb()
    if (!db) { setLoading(false); return }

    async function loadClass() {
      try {
        const snap = await getDoc(doc(db, 'classes', id))
        if (!snap.exists()) { setLoading(false); return }
        setCls({ id: snap.id, ...snap.data() })
      } catch (err) {
        console.error('Failed to load class', err)
        setLoading(false)
      }
    }

    function loadSessions() {
      const q = query(
        collection(db, 'classes', id, 'sessions'),
        orderBy('date', 'asc')
      )
      return onSnapshot(q, (snap) => {
        setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      })
    }

    loadClass()
    const unsub = loadSessions()
    return () => unsub()
  }, [id])

  if (loading) {
    return <p className="text-muted text-sm p-8">Loading…</p>
  }

  if (!cls) {
    return (
      <div className="text-center py-20">
        <p className="text-muted mb-4">Class not found.</p>
        <Link to="/classes" style={{ color: 'var(--ca-accent)' }}>← Back to classes</Link>
      </div>
    )
  }

  const isFull = cls.status === 'full'
  const isSeries = cls.type === 'series'

  const priceLabel = isSeries
    ? cls.bundlePrice
      ? `$${cls.bundlePrice} for the full series`
      : null
    : cls.price
    ? `$${cls.price}`
    : null

  return (
    <div className="space-y-8">

      {/* Back link */}
      <Link
        to="/classes"
        className="text-sm flex items-center gap-1"
        style={{ color: 'var(--ca-muted)' }}
      >
        ← All classes
      </Link>

      {/* Hero image */}
      {cls.imageUrl && (
        <div className="rounded-2xl overflow-hidden" style={{ maxHeight: '320px' }}>
          <img
            src={cls.imageUrl}
            alt={cls.title}
            style={{ width: '100%', height: '320px', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Title + badges */}
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          {isSeries && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}>
              Series
            </span>
          )}
          {cls.allowDropIn && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#dcfce7', color: '#15803d' }}>
              Drop-in available
            </span>
          )}
          {isFull && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}>
              Full — waitlist open
            </span>
          )}
        </div>

        <h1 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">
          {cls.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* ── Left: details ── */}
        <div className="sm:col-span-2 space-y-6">

          {/* Quick info */}
          <div
            className="rounded-xl p-5 grid grid-cols-2 gap-3"
            style={{ backgroundColor: '#fdf6f3', border: '1px solid var(--ca-border)' }}
          >
            {cls.ageRange && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ca-muted)' }}>Age range</p>
                <p className="text-sm font-medium" style={{ color: 'var(--ca-ink)' }}>{cls.ageRange}</p>
              </div>
            )}
            {cls.location && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ca-muted)' }}>Location</p>
                <p className="text-sm font-medium" style={{ color: 'var(--ca-ink)' }}>{cls.location}</p>
              </div>
            )}
            {cls.capacity && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ca-muted)' }}>Class size</p>
                <p className="text-sm font-medium" style={{ color: 'var(--ca-ink)' }}>Max {cls.capacity} students</p>
              </div>
            )}
            {priceLabel && (
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--ca-muted)' }}>Price</p>
                <p className="text-sm font-medium" style={{ color: 'var(--ca-ink)' }}>{priceLabel}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {cls.description && (
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink mb-3">About this class</h2>
              <p className="text-muted leading-relaxed whitespace-pre-line">{cls.description}</p>
            </div>
          )}

          {/* Sessions */}
          {sessions.length > 0 && (
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink mb-3">
                {isSeries ? `Sessions (${sessions.length})` : 'Date & Time'}
              </h2>
              <div className="space-y-2">
                {sessions.map((s, i) => (
                  <div
                    key={s.id}
                    className="rounded-lg px-4 py-3 flex items-center justify-between"
                    style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
                  >
                    <div>
                      {isSeries && (
                        <span className="text-xs font-medium mr-2" style={{ color: 'var(--ca-muted)' }}>
                          Session {i + 1}
                        </span>
                      )}
                      <span className="text-sm font-medium" style={{ color: 'var(--ca-ink)' }}>
                        {formatDate(s.date)}
                      </span>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--ca-muted)' }}>
                      {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drop-in pricing note */}
          {isSeries && cls.allowDropIn && cls.dropInPrice && (
            <div
              className="rounded-xl px-5 py-4"
              style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
            >
              <p className="text-sm font-medium" style={{ color: '#15803d' }}>
                Drop-in sessions available at ${cls.dropInPrice} per session
              </p>
              <p className="text-xs mt-1" style={{ color: '#16a34a' }}>
                You can register for individual sessions instead of the full series.
              </p>
            </div>
          )}
        </div>

        {/* ── Right: register CTA ── */}
        <div className="sm:col-span-1">
          <div
            className="rounded-2xl p-6 sticky top-6 space-y-4"
            style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
          >
            {priceLabel && (
              <div>
                <p className="text-2xl font-semibold font-heading" style={{ color: 'var(--ca-ink)' }}>
                  {isSeries ? `$${cls.bundlePrice}` : `$${cls.price}`}
                </p>
                {isSeries && (
                  <p className="text-xs" style={{ color: 'var(--ca-muted)' }}>for the full series</p>
                )}
              </div>
            )}

            <Link
              to={isFull ? `/classes/${id}/waitlist` : `/classes/${id}/register`}
              className="block w-full text-center rounded-lg py-3 text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: isFull ? '#f3f4f6' : 'var(--ca-accent)',
                color: isFull ? 'var(--ca-ink)' : '#ffffff',
              }}
            >
              {isFull ? 'Join waitlist' : 'Register now'}
            </Link>

            {isSeries && cls.allowDropIn && cls.dropInPrice && !isFull && (
              <Link
                to={`/classes/${id}/register?dropin=true`}
                className="block w-full text-center rounded-lg py-3 text-sm font-medium transition"
                style={{
                  border: '1px solid var(--ca-border)',
                  color: 'var(--ca-ink)',
                  backgroundColor: '#fafafa',
                }}
              >
                Register for drop-in sessions
              </Link>
            )}

            <p className="text-xs text-center" style={{ color: 'var(--ca-muted)' }}>
              Questions?{' '}
              <a href="mailto:katie@cartwheelarts.org" style={{ color: 'var(--ca-accent)' }}>
                Email Katie
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
