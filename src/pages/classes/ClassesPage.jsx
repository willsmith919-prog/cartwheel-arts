/**
 * ClassesPage — public-facing class browser.
 * Reads active classes from Firestore and displays them as cards.
 * Links to individual class detail pages at /classes/:id
 */
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDb } from '../../firebase/client'

function formatDateRange(start, end) {
  if (!start) return null
  const fmt = (val) => {
    const d = val?.toDate ? val.toDate() : new Date(val)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }
  if (!end || start === end) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

function ClassCard({ cls }) {
  const isFull = cls.status === 'full'
  const isSeries = cls.type === 'series'

  const priceLabel = isSeries
    ? cls.bundlePrice
      ? `$${cls.bundlePrice} for full series${cls.allowDropIn && cls.dropInPrice ? ` · $${cls.dropInPrice}/session drop-in` : ''}`
      : null
    : cls.price
    ? `$${cls.price}`
    : null

  return (
    <Link
      to={`/classes/${cls.id}`}
      className="block rounded-2xl overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid var(--ca-border)',
        textDecoration: 'none',
      }}
    >
      {/* Image */}
      <div
        className="w-full flex items-center justify-center"
        style={{
          height: '180px',
          backgroundColor: '#fdf6f3',
          overflow: 'hidden',
        }}
      >
        {cls.imageUrl ? (
          <img
            src={cls.imageUrl}
            alt={cls.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: '3rem' }}>🎨</span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {isSeries && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#ede9fe', color: '#6d28d9' }}
            >
              Series
            </span>
          )}
          {cls.allowDropIn && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#dcfce7', color: '#15803d' }}
            >
              Drop-in available
            </span>
          )}
          {isFull && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
            >
              Full — waitlist open
            </span>
          )}
        </div>

        <h2
          className="font-heading text-lg font-semibold mb-1"
          style={{ color: 'var(--ca-ink)' }}
        >
          {cls.title}
        </h2>

        {formatDateRange(cls.startDate, cls.endDate) && (
          <p className="text-sm mb-1" style={{ color: 'var(--ca-muted)' }}>
            📅 {formatDateRange(cls.startDate, cls.endDate)}
          </p>
        )}

        {cls.ageRange && (
          <p className="text-sm mb-1" style={{ color: 'var(--ca-muted)' }}>
            👧 {cls.ageRange}
          </p>
        )}

        {cls.location && (
          <p className="text-sm mb-3" style={{ color: 'var(--ca-muted)' }}>
            📍 {cls.location}
          </p>
        )}

        {cls.description && (
          <p
            className="text-sm mb-4 leading-relaxed"
            style={{
              color: 'var(--ca-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {cls.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-2">
          {priceLabel && (
            <span className="text-sm font-semibold" style={{ color: 'var(--ca-ink)' }}>
              {priceLabel}
            </span>
          )}
          <span
            className="ml-auto text-sm font-medium"
            style={{ color: 'var(--ca-accent)' }}
          >
            {isFull ? 'Join waitlist →' : 'Learn more →'}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function ClassesPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const db = getDb()
    if (!db) {
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'classes'),
      where('status', 'in', ['active', 'full']),
      orderBy('startDate', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setClasses(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">
          Classes &amp; Series
        </h1>
        <p className="mt-2 text-muted">
          Register your child for upcoming Cartwheel Arts classes and series.
        </p>
      </div>

      {loading && (
        <p className="text-muted text-sm">Loading classes…</p>
      )}

      {!loading && classes.length === 0 && (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
          style={{ border: '2px dashed var(--ca-border)' }}
        >
          <span className="text-5xl mb-4">🎨</span>
          <h2 className="font-heading text-xl font-semibold text-ink mb-2">
            Classes coming soon
          </h2>
          <p className="text-muted text-sm max-w-sm">
            We're putting together our upcoming schedule. Check back soon or
            follow us for updates!
          </p>
        </div>
      )}

      {!loading && classes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {classes.map((cls) => (
            <ClassCard key={cls.id} cls={cls} />
          ))}
        </div>
      )}
    </div>
  )
}
