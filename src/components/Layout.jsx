/**
 * Shared chrome: header, main outlet, footer. Keeps every page visually consistent.
 */
import { Outlet } from 'react-router-dom'
import SiteFooter from './SiteFooter.jsx'
import SiteHeader from './SiteHeader.jsx'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
