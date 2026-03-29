/**
 * SignUpPage — creates a parent account (Firebase Auth + parents Firestore doc).
 * Shown before registration so families can save children and re-register faster.
 * After signup, redirects to the `next` query param (usually the registration page).
 */
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getAuthInstance, getDb } from '../../firebase/client'

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

function blankForm() {
  return { name: '', email: '', phone: '', password: '', confirmPassword: '' }
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/classes'

  const [form, setForm] = useState(blankForm())
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [firebaseError, setFirebaseError] = useState(null)

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
    setFirebaseError(null)
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Your name is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid email'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setFirebaseError(null)

    const auth = getAuthInstance()
    const db = getDb()
    if (!auth || !db) {
      setFirebaseError('Service unavailable. Please try again.')
      setSaving(false)
      return
    }

    try {
      const credential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password)
      const uid = credential.user.uid

      await setDoc(doc(db, 'parents', uid), {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        createdAt: serverTimestamp(),
      })

      navigate(next, { replace: true })
    } catch (err) {
      console.error('Sign up failed', err)
      if (err.code === 'auth/email-already-in-use') {
        setFirebaseError('An account with this email already exists. Try signing in instead.')
      } else if (err.code === 'auth/invalid-email') {
        setErrors((prev) => ({ ...prev, email: 'Invalid email address' }))
      } else {
        setFirebaseError('Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">

      {/* Returning family prompt — prominent, at the top */}
      <div
        className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
        style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--ca-ink)' }}>
            Already have an account?
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ca-muted)' }}>
            Sign in to access your saved children and register faster.
          </p>
        </div>
        <Link
          to={`/account/signin?next=${encodeURIComponent(next)}`}
          className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition hover:opacity-90"
          style={{
            backgroundColor: 'var(--ca-ink)',
            color: '#ffffff',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          Sign in
        </Link>
      </div>

      {/* Heading */}
      <div>
        <h1 className="font-heading text-2xl font-semibold" style={{ color: 'var(--ca-ink)' }}>
          Create your account
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ca-muted)' }}>
          New to Cartwheel Arts? It only takes a minute.
        </p>
      </div>

      {/* Why create an account */}
      <div
        className="rounded-xl px-5 py-4 space-y-2"
        style={{ backgroundColor: '#fdf6f3', border: '1px solid var(--ca-border)' }}
      >
        <p className="text-sm font-semibold" style={{ color: 'var(--ca-accent)' }}>
          Why create an account?
        </p>
        <ul className="space-y-1">
          {[
            'Register multiple children at once',
            'Re-register for future classes in seconds — no re-typing info',
            'Your children\'s details are saved to your account',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm" style={{ color: 'var(--ca-ink)' }}>
              <span style={{ color: 'var(--ca-accent)', flexShrink: 0 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
        <p className="text-xs pt-1" style={{ color: 'var(--ca-muted)', borderTop: '1px solid var(--ca-border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
          Your family's information is used only for class registration and communication with Katie.
          It is never sold or shared with third parties.
        </p>
      </div>

      {/* Firebase error */}
      {firebaseError && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' }}
        >
          {firebaseError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className="rounded-xl p-6 space-y-4"
          style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
        >
          <Field label="Your full name *" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Jane Smith"
              style={inputStyle(errors.name)}
            />
          </Field>

          <Field label="Email address *" error={errors.email}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
              style={inputStyle(errors.email)}
            />
          </Field>

          <Field label="Phone number *" error={errors.phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              placeholder="(801) 555-0100"
              style={inputStyle(errors.phone)}
            />
          </Field>

          <Field label="Password *" error={errors.password}>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              style={inputStyle(errors.password)}
            />
          </Field>

          <Field label="Confirm password *" error={errors.confirmPassword}>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              style={inputStyle(errors.confirmPassword)}
            />
          </Field>
        </div>

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
          {saving ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
