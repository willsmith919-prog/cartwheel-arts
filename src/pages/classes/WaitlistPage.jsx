/**
 * WaitlistPage — lets parents join the waitlist for a full class.
 * Writes to the waitlist subcollection in Firestore.
 */
import { collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getDb } from '../../firebase/client'

// Field defined outside component to prevent re-render focus loss
function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-sm font-medium"
        style={{ color: 'var(--ca-ink)', fontFamily: 'var(--ca-font-sans)' }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs" style={{ color: '#b91c1c', fontFamily: 'var(--ca-font-sans)' }}>
          {error}
        </p>
      )}
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

export default function WaitlistPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cls, setCls] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ parentName: '', parentEmail: '', parentPhone: '', childName: '', childAge: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const db = getDb()
    if (!db) { setLoading(false); return }
    getDoc(doc(db, 'classes', id)).then((snap) => {
      if (snap.exists()) setCls({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [id])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const e = {}
    if (!form.parentName.trim()) e.parentName = 'Name is required'
    if (!form.parentEmail.trim()) e.parentEmail = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.parentEmail)) e.parentEmail = 'Please enter a valid email'
    if (!form.parentPhone.trim()) e.parentPhone = 'Phone is required'
    if (!form.childName.trim()) e.childName = "Child's name is required"
    if (!form.childAge) e.childAge = "Child's age is required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    const db = getDb()
    try {
      const entryId = doc(collection(db, 'waitlist')).id
      await setDoc(doc(db, 'waitlist', entryId), {
        classId: id,
        className: cls?.title ?? '',
        parentName: form.parentName.trim(),
        parentEmail: form.parentEmail.trim(),
        parentPhone: form.parentPhone.trim(),
        childName: form.childName.trim(),
        childAge: Number(form.childAge),
        joinedAt: serverTimestamp(),
        notified: false,
      })
      setSubmitted(true)
    } catch (err) {
      console.error('Waitlist failed', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted text-sm">Loading…</p>

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-6 py-12">
        <div className="text-6xl">⏳</div>
        <div>
          <h1 className="font-heading text-3xl font-semibold text-ink mb-3">
            You're on the waitlist!
          </h1>
          <p className="text-muted">
            We'll email <strong style={{ color: 'var(--ca-ink)' }}>{form.parentEmail}</strong> if
            a spot opens up for <strong style={{ color: 'var(--ca-ink)' }}>{form.childName}</strong>.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/classes"
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition hover:opacity-90"
            style={{ backgroundColor: 'var(--ca-accent)', color: '#ffffff' }}
          >
            Browse more classes
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold"
            style={{ border: '1px solid var(--ca-border)', color: 'var(--ca-ink)', backgroundColor: '#ffffff' }}
          >
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link to={`/classes/${id}`} className="text-sm flex items-center gap-1" style={{ color: 'var(--ca-muted)' }}>
        ← Back to class
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">Join the Waitlist</h1>
        {cls && <p className="mt-1 text-sm" style={{ color: 'var(--ca-muted)' }}>{cls.title}</p>}
        <p className="mt-2 text-sm" style={{ color: 'var(--ca-muted)' }}>
          This class is currently full. Join the waitlist and we'll contact you if a spot opens up.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>Parent / Guardian</h2>
          <Field label="Full name *" error={errors.parentName}>
            <input type="text" value={form.parentName} onChange={(e) => setField('parentName', e.target.value)}
              placeholder="Jane Smith" style={inputStyle(errors.parentName)} />
          </Field>
          <Field label="Email address *" error={errors.parentEmail}>
            <input type="email" value={form.parentEmail} onChange={(e) => setField('parentEmail', e.target.value)}
              placeholder="jane@example.com" style={inputStyle(errors.parentEmail)} />
          </Field>
          <Field label="Phone number *" error={errors.parentPhone}>
            <input type="tel" value={form.parentPhone} onChange={(e) => setField('parentPhone', e.target.value)}
              placeholder="(801) 555-0100" style={inputStyle(errors.parentPhone)} />
          </Field>
        </section>

        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>Child</h2>
          <Field label="Child's name *" error={errors.childName}>
            <input type="text" value={form.childName} onChange={(e) => setField('childName', e.target.value)}
              placeholder="First name" style={inputStyle(errors.childName)} />
          </Field>
          <Field label="Child's age *" error={errors.childAge}>
            <input type="number" min="1" max="18" value={form.childAge}
              onChange={(e) => setField('childAge', e.target.value)}
              placeholder="e.g. 8" style={{ ...inputStyle(errors.childAge), maxWidth: '120px' }} />
          </Field>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg py-3 text-sm font-semibold transition hover:opacity-90"
          style={{
            backgroundColor: 'var(--ca-accent)',
            color: '#ffffff',
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Joining…' : 'Join Waitlist'}
        </button>
      </form>
    </div>
  )
}
