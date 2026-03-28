/**
 * BlogPage — public-facing blog. Reads published posts from Firestore
 * ordered by newest first.
 */
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { getDb } from '../firebase/client'

function formatDate(val) {
  if (!val) return ''
  const d = val?.toDate ? val.toDate() : new Date(val)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function BlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const db = getDb()
    if (!db) { setLoading(false); return }

    const q = query(
      collection(db, 'posts'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-semibold text-ink sm:text-4xl">
          News &amp; Updates
        </h1>
        <p className="mt-2 text-muted">
          The latest from Cartwheel Arts — new classes, announcements, and studio news.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-sm text-muted">Loading posts…</p>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-20 text-center"
          style={{ border: '2px dashed var(--ca-border)' }}
        >
          <span className="text-5xl mb-4">📝</span>
          <h2 className="font-heading text-xl font-semibold text-ink mb-2">
            No posts yet
          </h2>
          <p className="text-muted text-sm max-w-sm">
            Check back soon for news and updates from Cartwheel Arts!
          </p>
        </div>
      )}

      {/* Posts */}
      {!loading && posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl p-6"
              style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
            >
              <p className="text-xs mb-2" style={{ color: 'var(--ca-muted)' }}>
                {formatDate(post.createdAt)}
              </p>
              <h2 className="font-heading text-xl font-semibold text-ink mb-3">
                {post.title}
              </h2>
              <p
                className="text-muted leading-relaxed whitespace-pre-line"
                style={{ fontSize: '0.9375rem' }}
              >
                {post.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
