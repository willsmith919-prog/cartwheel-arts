/**
 * Top navigation and site title; update links as you add real pages.
 * Sign In button links to parent account login (full parent auth coming in a future phase).
 * Admin portal is accessed directly via /admin — not linked here.
 */
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getAuthInstance } from '../firebase/client'
import { signOut } from 'firebase/auth'

const linkClass = ({ isActive }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent-muted/40 text-ink'
      : 'text-muted hover:bg-stone-200/60 hover:text-ink',
  ].join(' ')

export default function SiteHeader() {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    const auth = getAuthInstance()
    if (!auth) return
    try {
      await signOut(auth)
      navigate('/')
    } catch (err) {
      console.error('Sign out failed', err)
    }
  }

  return (
    <header className="border-b border-border bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <NavLink
          to="/"
          className="font-heading text-xl font-semibold tracking-tight text-ink no-underline"
        >
          Cartwheel Arts
        </NavLink>

        <div className="flex items-center gap-1 flex-wrap">
          <nav className="flex flex-wrap gap-1" aria-label="Primary">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/blog" className={linkClass}>
              News
            </NavLink>
            <NavLink to="/classes" className={linkClass}>
              Classes
            </NavLink>
          </nav>

          {/* Sign in / Sign out */}
          <div className="ml-2 pl-2" style={{ borderLeft: '1px solid var(--ca-border)' }}>
            {user ? (
              <div className="flex items-center gap-2">
                <span
                  className="text-xs hidden sm:block"
                  style={{ color: 'var(--ca-muted)' }}
                >
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    color: 'var(--ca-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <NavLink
                to="/account/signin"
                className="rounded-md px-3 py-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--ca-accent)' }}
              >
                Sign in
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
