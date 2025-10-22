import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import DataCollector from './components/DataCollector'
import Analytics from './components/Analytics'
import { BarChart3, Database, TrendingUp, Menu, X } from 'lucide-react'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  
  // Use base path for GitHub Pages, empty for local dev
  const basename = import.meta.env.BASE_URL

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
          </nav>
          
          {isSidebarOpen && (
            <div className="p-4 border-t border-gray-700">
              <p className="text-xs text-gray-400">Community Insights Tool</p>
              <p className="text-xs text-gray-500 mt-1">v1.0.0</p>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/collector" element={<DataCollector />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

