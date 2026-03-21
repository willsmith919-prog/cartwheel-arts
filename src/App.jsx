/**
 * Root router: public marketing pages, future blog and class registration routes.
 */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import BlogPage from './pages/BlogPage.jsx'
import ClassesPage from './pages/ClassesPage.jsx'
import HomePage from './pages/HomePage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
