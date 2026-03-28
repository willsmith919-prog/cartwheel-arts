/**
 * AdminLayout — shell for all admin pages. Provides a sidebar with
 * navigation links and a sign-out button. Child routes render in the
 * main content area via <Outlet />.
 */
import { signOut } from 'firebase/auth'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getAuthInstance } from '../../firebase/client'
import cartwheelLogo from '../../assets/cartwheel-logo.jpg'

const navItems = [
  { label: 'Classes', path: '/admin/classes', icon: '🎨' },
  { label: 'Rosters', path: '/admin/rosters', icon: '📋' },
]

export default function AdminLayout() {
  const navigate = useNavigate()

  async function handleSignOut() {
    const auth = getAuthInstance()
    if (!auth) return
    try {
      await signOut(auth)
      navigate('/admin/login')
    } catch (err) {
      console.error('Sign out failed', err)
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: 'var(--ca-canvas)', fontFamily: 'var(--ca-font-sans)' }}
    >
      {/* ── Sidebar ── */}
      <aside
        className="w-56 flex flex-col flex-shrink-0"
        style={{
          backgroundColor: '#ffffff',
          borderRight: '1px solid var(--ca-border)',
          minHeight: '100vh',
        }}
      >
        {/* Logo */}
        <div
          className="flex flex-col items-center gap-2 px-4 py-6"
          style={{ borderBottom: '1px solid var(--ca-border)' }}
        >
          <img src={cartwheelLogo} alt="Cartwheel Arts" className="h-16 w-auto" />
          <span
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: 'var(--ca-muted)' }}
          >
            Admin Portal
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={({ isActive }) => ({
                backgroundColor: isActive ? '#fdf1ee' : 'transparent',
                color: isActive ? 'var(--ca-accent)' : 'var(--ca-ink)',
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-6">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--ca-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fdf1ee'
              e.currentTarget.style.color = 'var(--ca-accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--ca-muted)'
            }}
          >
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
