/**
 * RegistrationPage — parent registers a child for a class.
 * Placeholder flow (no Stripe yet): captures parent + child info,
 * writes a registration doc to Firestore with paymentStatus: 'pending',
 * then redirects to a success page.
 *
 * Stripe checkout will replace the save step in Phase 2.
 */
import { collection, doc, getDoc, serverTimestamp, setDoc, updateDoc, increment } from 'firebase/firestore'
import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getDb } from '../../firebase/client'

function blankForm() {
  return {
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    childName: '',
    childAge: '',
    notes: '',
  }
}

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

export default function RegistrationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isDropIn = searchParams.get('dropin') === 'true'

  const [cls, setCls] = useState(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blankForm())
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const db = getDb()
    if (!db) { setLoading(false); return }

    async function loadClass() {
      try {
        const snap = await getDoc(doc(db, 'classes', id))
        if (!snap.exists()) {
          navigate('/classes')
          return
        }
        const data = snap.data()
        // Redirect if class is full
        if (data.status === 'full') {
          navigate(`/classes/${id}/waitlist`)
          return
        }
        setCls({ id: snap.id, ...data })
      } catch (err) {
        console.error('Failed to load class', err)
      } finally {
        setLoading(false)
      }
    }

    loadClass()
  }, [id, navigate])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const e = {}
    if (!form.parentName.trim()) e.parentName = 'Parent name is required'
    if (!form.parentEmail.trim()) e.parentEmail = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.parentEmail)) e.parentEmail = 'Please enter a valid email'
    if (!form.parentPhone.trim()) e.parentPhone = 'Phone number is required'
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
    if (!db) {
      alert('Firebase is not configured.')
      setSaving(false)
      return
    }

    try {
      // Write registration doc
      const regId = doc(collection(db, 'registrations')).id
      await setDoc(doc(db, 'registrations', regId), {
        classId: id,
        className: cls.title,
        parentName: form.parentName.trim(),
        parentEmail: form.parentEmail.trim(),
        parentPhone: form.parentPhone.trim(),
        childName: form.childName.trim(),
        childAge: Number(form.childAge),
        notes: form.notes.trim(),
        registrationMode: isDropIn ? 'dropin' : 'bundle',
        paymentStatus: 'pending',
        registeredAt: serverTimestamp(),
      })

      // Decrement spotsRemaining on the class
      await updateDoc(doc(db, 'classes', id), {
        spotsRemaining: increment(-1),
      })

      // Navigate to success page
      navigate(`/classes/${id}/register/success?name=${encodeURIComponent(form.childName)}&parent=${encodeURIComponent(form.parentEmail)}`)
    } catch (err) {
      console.error('Registration failed', err)
      alert('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-muted text-sm p-8">Loading…</p>
  }

  if (!cls) return null

  const price = isDropIn ? cls.dropInPrice : (cls.type === 'series' ? cls.bundlePrice : cls.price)

  return (
    <div className="max-w-xl mx-auto space-y-6">

      {/* Back link */}
      <Link
        to={`/classes/${id}`}
        className="text-sm flex items-center gap-1"
        style={{ color: 'var(--ca-muted)' }}
      >
        ← Back to class
      </Link>

      {/* Heading */}
      <div>
        <h1 className="font-heading text-2xl font-semibold text-ink">
          {isDropIn ? 'Drop-in Registration' : 'Register for Class'}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ca-muted)' }}>
          {cls.title}
        </p>
      </div>

      {/* Price summary */}
      {price && (
        <div
          className="rounded-xl px-5 py-4 flex items-center justify-between"
          style={{ backgroundColor: '#fdf6f3', border: '1px solid var(--ca-border)' }}
        >
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--ca-ink)' }}>
              {isDropIn ? 'Drop-in price' : cls.type === 'series' ? 'Full series price' : 'Class price'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ca-muted)' }}>
              Payment will be collected at the door for now
            </p>
          </div>
          <p className="text-xl font-semibold font-heading" style={{ color: 'var(--ca-accent)' }}>
            ${price}
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Parent info */}
        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
            Parent / Guardian
          </h2>

          <Field label="Full name *" error={errors.parentName}>
            <input
              type="text"
              value={form.parentName}
              onChange={(e) => setField('parentName', e.target.value)}
              placeholder="Jane Smith"
              style={inputStyle(errors.parentName)}
            />
          </Field>

          <Field label="Email address *" error={errors.parentEmail}>
            <input
              type="email"
              value={form.parentEmail}
              onChange={(e) => setField('parentEmail', e.target.value)}
              placeholder="jane@example.com"
              style={inputStyle(errors.parentEmail)}
            />
          </Field>

          <Field label="Phone number *" error={errors.parentPhone}>
            <input
              type="tel"
              value={form.parentPhone}
              onChange={(e) => setField('parentPhone', e.target.value)}
              placeholder="(801) 555-0100"
              style={inputStyle(errors.parentPhone)}
            />
          </Field>
        </section>

        {/* Child info */}
        <section
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--ca-ink)' }}>
            Child
          </h2>

          <Field label="Child's name *" error={errors.childName}>
            <input
              type="text"
              value={form.childName}
              onChange={(e) => setField('childName', e.target.value)}
              placeholder="First name"
              style={inputStyle(errors.childName)}
            />
          </Field>

          <Field label="Child's age *" error={errors.childAge}>
            <input
              type="number"
              min="1"
              max="18"
              value={form.childAge}
              onChange={(e) => setField('childAge', e.target.value)}
              placeholder="e.g. 8"
              style={{ ...inputStyle(errors.childAge), maxWidth: '120px' }}
            />
          </Field>

          <Field label="Anything Katie should know? (allergies, accommodations, etc.)">
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Optional notes…"
              rows={3}
              style={{ ...inputStyle(false), resize: 'vertical' }}
            />
          </Field>
        </section>

        {/* Submit */}
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
          {saving ? 'Submitting…' : 'Complete Registration'}
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--ca-muted)' }}>
          By registering you agree to Cartwheel Arts' class policies.
          Questions? <a href="mailto:katie@cartwheelarts.org" style={{ color: 'var(--ca-accent)' }}>Email Katie</a>
        </p>
      </form>
    </div>
  )
}
