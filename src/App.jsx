/**
 * Root router: public marketing pages + protected admin portal.
 * Admin routes are wrapped in ProtectedRoute — unauthenticated users
 * are redirected to /admin/login automatically.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import BlogPage from './pages/BlogPage.jsx'
import ClassesPage from './pages/ClassesPage.jsx'
import HomePage from './pages/HomePage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import ClassFormPage from './pages/admin/ClassFormPage.jsx'
import ClassListPage from './pages/admin/ClassListPage.jsx'
import LoginPage from './pages/admin/LoginPage.jsx'
import RosterPage from './pages/admin/RosterPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public site ── */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/classes" element={<ClassesPage />} />
        </Route>

        {/* ── Admin login (public, no layout) ── */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* ── Protected admin portal ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/classes" replace />} />
            <Route path="/admin/classes" element={<ClassListPage />} />
            <Route path="/admin/classes/new" element={<ClassFormPage />} />
            <Route path="/admin/classes/:id/edit" element={<ClassFormPage />} />
            <Route path="/admin/rosters/:id" element={<RosterPage />} />
          </Route>
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
