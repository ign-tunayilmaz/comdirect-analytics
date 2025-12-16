import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'
import { clearPosts } from './utils/dataCollector'

// Make clearPosts available globally for easy access from browser console
if (typeof window !== 'undefined') {
  window.clearAllData = async () => {
    if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      console.log('🗑️ Starting comprehensive data clear...')
      
      // Clear localStorage
      try {
        localStorage.clear()
        console.log('✅ Cleared all localStorage')
      } catch (e) {
        console.error('❌ Error clearing localStorage:', e)
      }
      
      // Clear sessionStorage
      try {
        sessionStorage.clear()
        console.log('✅ Cleared all sessionStorage')
      } catch (e) {
        console.error('❌ Error clearing sessionStorage:', e)
      }
      
      // Clear IndexedDB
      try {
        await clearPosts()
        console.log('✅ Cleared via clearPosts function')
      } catch (e) {
        console.error('❌ Error in clearPosts:', e)
      }
      
      // Force delete IndexedDB database
      if ('indexedDB' in window) {
        try {
          const deleteRequest = indexedDB.deleteDatabase('comdirect_analytics')
          await new Promise((resolve) => {
            deleteRequest.onsuccess = () => {
              console.log('✅ Deleted IndexedDB database')
              resolve()
            }
            deleteRequest.onerror = () => {
              console.warn('⚠️ Error deleting database:', deleteRequest.error)
              resolve()
            }
            deleteRequest.onblocked = () => {
              console.warn('⚠️ Database deletion blocked')
              resolve()
            }
          })
        } catch (e) {
          console.error('❌ Error deleting database:', e)
        }
      }
      
      alert('✅ All data cleared! Refreshing page...')
      window.location.reload()
    }
  }
  console.log('💡 Tip: Run clearAllData() in the console to force clear all stored data')
  
  // Add API test function
  window.testKhorosAPI = async () => {
    console.log('🧪 Testing Khoros API connection...')
    const { isApiConfigured, fetchPostsFromKhorosAPI } = await import('./utils/khorosApi')
    
    if (!isApiConfigured()) {
      console.error('❌ API is not configured')
      console.log('   Check your .env.local file for:')
      console.log('   - VITE_KHOROS_COMMUNITY_ID')
      console.log('   - VITE_KHOROS_ACCESS_TOKEN')
      console.log('   - VITE_KHOROS_PROXY_URL (if using proxy)')
      return
    }
    
    console.log('✅ API is configured')
    
    // Test with last 7 days
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fromDate = sevenDaysAgo.toISOString().split('T')[0]
    const toDate = today.toISOString().split('T')[0]
    
    console.log(`📅 Testing date range: ${fromDate} to ${toDate}`)
    
    try {
      const posts = await fetchPostsFromKhorosAPI({
        startDate: fromDate,
        endDate: toDate
      })
      console.log(`✅ API test successful! Fetched ${posts.length} posts`)
      if (posts.length > 0) {
        console.log('📝 Sample post:', posts[0])
      } else {
        console.warn('⚠️ API returned 0 posts. This could mean:')
        console.warn('   - No data exists for this date range')
        console.warn('   - Check the console logs above for API response details')
      }
    } catch (error) {
      console.error('❌ API test failed:', error)
      console.error('   Error message:', error.message)
      console.error('   Check the Network tab in DevTools to see the actual API request/response')
    }
  }
  
  console.log('💡 Tip: Run testKhorosAPI() in the console to test API connectivity')
}

// Get Google OAuth Client ID from environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Only wrap with GoogleOAuthProvider if client ID is provided
const AppWrapper = ({ children }) => {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {children}
      </GoogleOAuthProvider>
    )
  }
  return children
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </React.StrictMode>,
)

