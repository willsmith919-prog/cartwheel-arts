/**
 * SignInPage — returning parent login.
 * After sign-in, redirects to the `next` query param (usually the registration page).
 */
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getAuthInstance } from '../../firebase/client'

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

export default function SignInPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/classes'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [firebaseError, setFirebaseError] = useState(null)
  const [saving, setSaving] = useState(false)

  function validate() {
    const e = {}
    if (!email.trim()) e.email = 'Email is required'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    setFirebaseError(null)

    const auth = getAuthInstance()
    if (!auth) {
      setFirebaseError('Service unavailable. Please try again.')
      setSaving(false)
      return
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      navigate(next, { replace: true })
    } catch (err) {
      console.error('Sign in failed', err)
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setFirebaseError('Incorrect email or password. Please try again.')
      } else {
        setFirebaseError('Something went wrong. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">

      {/* Heading */}
      <div>
        <h1 className="font-heading text-2xl font-semibold" style={{ color: 'var(--ca-ink)' }}>
          Welcome back
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--ca-muted)' }}>
          Don't have an account?{' '}
          <Link
            to={`/account/signup?next=${encodeURIComponent(next)}`}
            style={{ color: 'var(--ca-accent)' }}
          >
            Create one
          </Link>
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
          <Field label="Email address" error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); setFirebaseError(null) }}
              placeholder="jane@example.com"
              autoComplete="email"
              style={inputStyle(errors.email)}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); setFirebaseError(null) }}
              placeholder="Your password"
              autoComplete="current-password"
              style={inputStyle(errors.password)}
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
          {saving ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
