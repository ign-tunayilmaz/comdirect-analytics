import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../utils/auth'

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  const authenticated = isAuthenticated()

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute

