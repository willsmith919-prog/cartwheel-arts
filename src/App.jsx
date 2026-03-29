/**
 * Root router: public site + protected admin portal.
 * Admin routes are wrapped in ProtectedRoute — unauthenticated users
 * are redirected to /admin/login automatically.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Public pages
import BlogPage from './pages/BlogPage.jsx'
import HomePage from './pages/HomePage.jsx'

// Account pages
import SignInPage from './pages/account/SignInPage.jsx'
import SignUpPage from './pages/account/SignUpPage.jsx'

// Classes pages
import ClassDetailPage from './pages/classes/ClassDetailPage.jsx'
import ClassesPage from './pages/classes/ClassesPage.jsx'
import RegistrationPage from './pages/classes/RegistrationPage.jsx'
import RegistrationSuccessPage from './pages/classes/RegistrationSuccessPage.jsx'
import WaitlistPage from './pages/classes/WaitlistPage.jsx'

// Admin pages
import AdminAboutPage from './pages/admin/AdminAboutPage.jsx'
import AdminBlogPage from './pages/admin/AdminBlogPage.jsx'
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
          <Route path="/classes/:id" element={<ClassDetailPage />} />
          <Route path="/classes/:id/register" element={<RegistrationPage />} />
          <Route path="/classes/:id/register/success" element={<RegistrationSuccessPage />} />
          <Route path="/classes/:id/waitlist" element={<WaitlistPage />} />
          <Route path="/account/signup" element={<SignUpPage />} />
          <Route path="/account/signin" element={<SignInPage />} />
          {/* Legacy /signin redirect */}
          <Route path="/signin" element={<SignInPage />} />
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
            <Route path="/admin/blog" element={<AdminBlogPage />} />
            <Route path="/admin/about" element={<AdminAboutPage />} />
          </Route>
        </Route>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
