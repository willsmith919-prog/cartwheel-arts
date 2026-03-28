/**
 * LoginPage — admin sign-in form using Firebase email/password auth.
 * Redirects to /admin/classes on successful login.
 */
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthInstance } from '../../firebase/client'
import cartwheelLogo from '../../assets/cartwheel-logo.jpg'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const auth = getAuthInstance()
    if (!auth) {
      setError('Firebase is not configured. Check your .env file.')
      setLoading(false)
      return
    }

    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin/classes')
    } catch (err) {
      console.error('Login failed', err)
      setError('Incorrect email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--ca-canvas)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-lg p-8"
        style={{ backgroundColor: '#ffffff', border: '1px solid var(--ca-border)' }}
      >
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={cartwheelLogo}
            alt="Cartwheel Arts"
            className="h-24 w-auto"
          />
        </div>

        {/* Heading */}
        <h1
          className="text-2xl text-center mb-1"
          style={{ fontFamily: 'var(--ca-font-heading)', color: 'var(--ca-ink)' }}
        >
          Admin Portal
        </h1>
        <p
          className="text-sm text-center mb-8"
          style={{ color: 'var(--ca-muted)', fontFamily: 'var(--ca-font-sans)' }}
        >
          Cartwheel Arts class management
        </p>

        {/* Error message */}
        {error && (
          <div
            className="rounded-lg px-4 py-3 mb-6 text-sm"
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontFamily: 'var(--ca-font-sans)',
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-sm font-medium"
              style={{ color: 'var(--ca-ink)', fontFamily: 'var(--ca-font-sans)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none transition-all"
              style={{
                border: '1px solid var(--ca-border)',
                fontFamily: 'var(--ca-font-sans)',
                color: 'var(--ca-ink)',
                backgroundColor: '#ffffff',
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-sm font-medium"
              style={{ color: 'var(--ca-ink)', fontFamily: 'var(--ca-font-sans)' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm outline-none transition-all"
              style={{
                border: '1px solid var(--ca-border)',
                fontFamily: 'var(--ca-font-sans)',
                color: 'var(--ca-ink)',
                backgroundColor: '#ffffff',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium mt-2 transition-opacity"
            style={{
              backgroundColor: 'var(--ca-accent)',
              color: '#ffffff',
              fontFamily: 'var(--ca-font-sans)',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
