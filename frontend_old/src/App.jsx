import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Home from './pages/Home'
import CategoryView from './pages/CategoryView'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import MFASetup from './pages/MFASetup'
import MyHistory from './pages/MyHistory'
import Search from './pages/Search'

function ProtectedRoute({ children, adminOnly = false, allowGuest = false }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user && !allowGuest) {
    return <Navigate to="/login" />
  }

  if (adminOnly && (!user || !user.is_admin)) {
    return <Navigate to="/" />
  }

  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      <Route path="/" element={<Layout />}>
        <Route index element={
          <ProtectedRoute allowGuest>
            <Home />
          </ProtectedRoute>
        } />
        <Route path="category/:slug" element={
          <ProtectedRoute allowGuest>
            <CategoryView />
          </ProtectedRoute>
        } />
        <Route path="search" element={
          <ProtectedRoute allowGuest>
            <Search />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="history" element={
          <ProtectedRoute>
            <MyHistory />
          </ProtectedRoute>
        } />
        <Route path="mfa-setup" element={
          <ProtectedRoute>
            <MFASetup />
          </ProtectedRoute>
        } />
        <Route path="admin/*" element={
          <ProtectedRoute adminOnly>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}

export default App
