/**
 * Top navigation and site title; update links as you add real pages.
 */
import { NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) =>
  [
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-accent-muted/40 text-ink'
      : 'text-muted hover:bg-stone-200/60 hover:text-ink',
  ].join(' ')

export default function SiteHeader() {
  return (
    <header className="border-b border-border bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <NavLink
          to="/"
          className="font-heading text-xl font-semibold tracking-tight text-ink no-underline"
        >
          Cartwheel Arts
        </NavLink>
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
      </div>
    </header>
  )
}
