/**
 * AdminBlogPage — Katie can write, publish, and delete blog posts.
 * Posts are stored in the Firestore 'posts' collection.
 */
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { getDb } from '../../firebase/client'

// Defined outside component to prevent focus loss on re-render
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium" style={{ color: 'var(--ca-ink)', fontFamily: 'var(--ca-font-sans)' }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: '#b91c1c' }}>{error}</p>}
    </div>
  )
}

function inputStyle(hasError) {
  return {
    border: `1px solid ${hasError ? '#f87171' : 'var(--ca-border)'}`,
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontSize: '0.875rem',
    fontFamily: 'var(--ca-font-sans)',
    color: 'var(--ca-ink)',
    backgroundColor: '#ffffff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }
}

function blankPost() {
  return { title: '', body: '', status: 'draft' }
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blankPost())
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const db = getDb()
    if (!db) { setLoading(false); return }
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function startNew() {
    setForm(blankPost())
    setEditingId(null)
    setErrors({})
    setShowForm(true)
  }

  function startEdit(post) {
    setForm({ title: post.title, body: post.body, status: post.status })
    setEditingId(post.id)
    setErrors({})
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(blankPost())
    setErrors({})
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.body.trim()) e.body = 'Post content is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const db = getDb()
    try {
      if (editingId) {
        await updateDoc(doc(db, 'posts', editingId), {
          title: form.title.trim(),
          body: form.body.trim(),
          status: form.status,
          updatedAt: serverTimestamp(),
        })
      } else {
        const newId = doc(collection(db, 'posts')).id
        await setDoc(doc(db, 'posts', newId), {
          title: form.title.trim(),
          body: form.body.trim(),
          status: form.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
      cancelForm()
    } catch (err) {
      console.error('Save failed', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(post) {
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return
    const db = getDb()
    try {
      await deleteDoc(doc(db, 'posts', post.id))
    } catch (err) {
      console.error('Delete failed', err)
      alert('Something went wrong.')
    }
  }

  function formatDate(val) {
    if (!val) return '—'
    const d = val?.toDate ? val.toDate() : new Date(val)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="p-8" style={{ fontFamily: 'var(--ca-font-sans)' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--ca-font-heading)', color: 'var(--ca-ink)' }}>
            Blog Posts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--ca-muted)' }}>
            Write news and updates for the public blog
          </p>
        </div>
        {!showForm && (
          <button
            onClick={startNew}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--ca-accent)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
          >
            + New Post
          </button>
        )}
      </div>

      {/* Write / Edit form */}
      {showForm && (
        <div
          className="rounded-xl p-6 mb-8 space-y-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
            {editingId ? 'Edit Post' : 'New Post'}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Title *" error={errors.title}>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="e.g. Fall classes are open for registration!"
                style={inputStyle(errors.title)}
              />
            </Field>

            <Field label="Content *" error={errors.body}>
              <textarea
                value={form.body}
                onChange={(e) => setField('body', e.target.value)}
                placeholder="Write your post here…"
                rows={8}
                style={{ ...inputStyle(errors.body), resize: 'vertical' }}
              />
            </Field>

            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => setField('status', e.target.value)}
                style={{ ...inputStyle(false), maxWidth: '200px' }}
              >
                <option value="draft">Draft (hidden from public)</option>
                <option value="published">Published (visible to public)</option>
              </select>
            </Field>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--ca-accent)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Publish Post'}
              </button>
              <button
                type="button"
                onClick={cancelForm}
                className="px-5 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#f3f4f6', color: 'var(--ca-ink)', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts list */}
      {loading && <p className="text-sm" style={{ color: 'var(--ca-muted)' }}>Loading posts…</p>}

      {!loading && posts.length === 0 && !showForm && (
        <div
          className="rounded-xl flex flex-col items-center justify-center py-16 text-center"
          style={{ border: '2px dashed var(--ca-border)' }}
        >
          <span className="text-4xl mb-3">📝</span>
          <p className="font-medium mb-1" style={{ color: 'var(--ca-ink)' }}>No posts yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--ca-muted)' }}>Write your first post to share news with families</p>
          <button
            onClick={startNew}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--ca-accent)', color: '#ffffff', border: 'none', cursor: 'pointer' }}
          >
            + New Post
          </button>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--ca-border)', backgroundColor: '#ffffff' }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--ca-border)', backgroundColor: '#fafaf9' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Title</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Status</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--ca-muted)' }}>Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => (
                <tr
                  key={post.id}
                  style={{ borderBottom: i < posts.length - 1 ? '1px solid var(--ca-border)' : 'none' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--ca-ink)' }}>
                    {post.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                      style={{
                        backgroundColor: post.status === 'published' ? '#dcfce7' : '#f3f4f6',
                        color: post.status === 'published' ? '#15803d' : '#6b7280',
                      }}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--ca-muted)' }}>
                    {formatDate(post.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => startEdit(post)}
                        className="text-sm font-medium"
                        style={{ color: 'var(--ca-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="text-sm"
                        style={{ color: '#b91c1c', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
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
