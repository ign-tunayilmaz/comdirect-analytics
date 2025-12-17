import React, { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import DataCollector from './components/DataCollector'
import Analytics from './components/Analytics'
import CSVMetrics from './components/CSVMetrics'
import Login from './components/Login'
import ProtectedRoute from './components/ProtectedRoute'
import { isAuthenticated, logout, getCurrentUser, getCurrentUserName, getCurrentUserPicture } from './utils/auth'
import { BarChart3, Database, TrendingUp, FileSpreadsheet, Menu, X, LogOut, User, Moon, Sun } from 'lucide-react'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState(null)
  const [userName, setUserName] = useState(null)
  const [userPicture, setUserPicture] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('theme')
    if (stored) {
      return stored === 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  
  // Use base path for GitHub Pages, empty for local dev
  const basename = import.meta.env.BASE_URL

  // Check authentication on mount and when it changes
  useEffect(() => {
    checkAuth()
  }, [])

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const checkAuth = () => {
    const isAuth = isAuthenticated()
    setAuthenticated(isAuth)
    if (isAuth) {
      setUserEmail(getCurrentUser())
      setUserName(getCurrentUserName())
      setUserPicture(getCurrentUserPicture())
    } else {
      setUserEmail(null)
      setUserName(null)
      setUserPicture(null)
    }
  }

  const handleLoginSuccess = (email, name, picture) => {
    setAuthenticated(true)
    setUserEmail(email)
    // Refresh to get updated user info
    checkAuth()
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout()
      setAuthenticated(false)
      setUserEmail(null)
      // Redirect to login
      window.location.hash = '#/login'
    }
  }

  // Show login page if not authenticated
  if (!authenticated) {
    return (
      <Router basename={basename}>
        <Routes>
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    )
  }

  return (
    <Router basename={basename}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-comdirect-dark text-white transition-all duration-300 flex flex-col`}>
          <div className="p-4 flex items-center justify-between">
            {isSidebarOpen && (
              <h1 className="text-xl font-bold text-comdirect-yellow">Comdirect Analytics</h1>
            )}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <Link 
              to="/" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <BarChart3 size={24} />
              {isSidebarOpen && <span>Dashboard</span>}
            </Link>
            <Link 
              to="/collector" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Database size={24} />
              {isSidebarOpen && <span>Data Collector</span>}
            </Link>
            <Link 
              to="/analytics" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <TrendingUp size={24} />
              {isSidebarOpen && <span>Analytics</span>}
            </Link>
            <Link 
              to="/csv-metrics" 
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <FileSpreadsheet size={24} />
              {isSidebarOpen && <span>CSV Metrics</span>}
            </Link>
          </nav>
          
          {isSidebarOpen && (
            <div className="p-4 border-t border-gray-700 space-y-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              
              {/* User Info */}
              <div className="flex items-center space-x-2 text-sm">
                {userPicture ? (
                  <img 
                    src={userPicture} 
                    alt={userName || userEmail || 'User'} 
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User size={16} className="text-gray-400" />
                )}
                <div className="flex-1 min-w-0">
                  {userName && (
                    <p className="text-gray-300 truncate font-medium">{userName}</p>
                  )}
                  <p className="text-gray-400 truncate text-xs">{userEmail}</p>
                </div>
              </div>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
              
              <div className="pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400">Community Insights Tool</p>
                <p className="text-xs text-gray-500 mt-1">v1.0.10</p>
              </div>
            </div>
          )}

          {/* Collapsed sidebar controls */}
          {!isSidebarOpen && (
            <div className="p-4 border-t border-gray-700 space-y-2">
              <button
                onClick={toggleDarkMode}
                className="w-full p-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={handleLogout}
                className="w-full p-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/collector" 
              element={
                <ProtectedRoute>
                  <DataCollector />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/csv-metrics" 
              element={
                <ProtectedRoute>
                  <CSVMetrics />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

