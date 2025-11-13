import React, { useState, useEffect } from 'react'
import { fetchCommunityPosts, savePosts, loadPosts, clearPosts } from '../utils/dataCollector'
import { isApiConfigured } from '../utils/khorosApi'
import { Download, RefreshCw, Trash2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

function DataCollector() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [posts, setPosts] = useState(loadPosts())
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [apiConfigured, setApiConfigured] = useState(false)
  // Calculate default date range (last 7 days - Khoros API limit)
  const getDefaultDates = () => {
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    return {
      dateFrom: sevenDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    }
  }

  const defaultDates = getDefaultDates()

  const [filters, setFilters] = useState({
    sentiment: '',
    requestType: '',
    platformRelated: '',
    language: '',
    dateFrom: defaultDates.dateFrom,
    dateTo: defaultDates.dateTo,
    limit: 50
  })

  // Check API configuration on mount
  useEffect(() => {
    const configured = isApiConfigured()
    setApiConfigured(configured)
    
    // Debug logging
    console.log('🔍 Environment Variables Check:')
    console.log('   Community ID:', import.meta.env.VITE_KHOROS_COMMUNITY_ID || '❌ NOT SET')
    console.log('   Has Access Token:', import.meta.env.VITE_KHOROS_ACCESS_TOKEN ? '✅ YES' : '❌ NO')
    console.log('   API Configured:', configured ? '✅ YES' : '❌ NO')
  }, [])

  const toggleRowExpansion = (postId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedRows(newExpanded)
  }

  // Filter posts for display based on current filter settings
  const getFilteredPostsForDisplay = () => {
    let filtered = posts

    if (filters.sentiment) {
      filtered = filtered.filter(post => post.sentiment === filters.sentiment)
    }

    if (filters.requestType) {
      filtered = filtered.filter(post => post.requestType === filters.requestType)
    }

    if (filters.platformRelated === 'true') {
      filtered = filtered.filter(post => post.isPlatformRelated === true)
    } else if (filters.platformRelated === 'false') {
      filtered = filtered.filter(post => post.isPlatformRelated === false)
    }

    if (filters.language) {
      filtered = filtered.filter(post => post.contentLanguage === filters.language)
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      filtered = filtered.filter(post => new Date(post.date) >= fromDate)
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999) // Include the entire end date
      filtered = filtered.filter(post => new Date(post.date) <= toDate)
    }

    return filtered
  }

  const displayedPosts = getFilteredPostsForDisplay()

  const handleFetchData = async () => {
    // Validate date range (Khoros API allows maximum 7 days)
    if (filters.dateFrom && filters.dateTo) {
      const fromDate = new Date(filters.dateFrom)
      const toDate = new Date(filters.dateTo)
      const daysDiff = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24))
      
      if (daysDiff > 7) {
        setStatus('❌ Error: Khoros API allows maximum 7 days per request. Please select a shorter date range.')
        return
      }
      
      if (daysDiff < 0) {
        setStatus('❌ Error: "From Date" must be before "To Date".')
        return
      }
    }
    
    setLoading(true)
    setStatus('🔌 Connecting to Khoros API...')
    
    try {
      const result = await fetchCommunityPosts({
        limit: filters.limit,
        filters: {
          sentiment: filters.sentiment || undefined,
          requestType: filters.requestType || undefined,
          platformRelated: filters.platformRelated === '' ? undefined : filters.platformRelated === 'true',
          language: filters.language || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined
        }
      })
      
      const savedPosts = savePosts(result.posts)
      setPosts(savedPosts)
      
      setStatus(`✅ Successfully fetched ${result.posts.length} real posts from Khoros API!`)
      
      setTimeout(() => setStatus(''), 5000)
    } catch (error) {
      console.error('❌ Collection Error:', error)
      
      // Provide helpful error messages based on error type
      let errorMessage = error.message
      
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        errorMessage = '❌ CORS Error: Browser blocked the API request. The Khoros API at community.comdirect.de does not allow direct browser access. Solutions: 1) Set up a backend proxy server, 2) Contact Khoros support to enable CORS for your domain, 3) Use Khoros Community API with proper authentication.'
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = '❌ Authentication Error: Your API credentials may be invalid or expired. Please check your access token in .env.local'
      } else if (error.message.includes('404')) {
        errorMessage = '❌ API Endpoint Not Found: The API URL may be incorrect. Please verify the community domain and API path.'
      }
      
      setStatus(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all collected data?')) {
      clearPosts()
      setPosts([])
      setStatus('All data cleared.')
      setTimeout(() => setStatus(''), 3000)
    }
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(posts, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `comdirect_posts_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    setStatus('Data exported successfully!')
    setTimeout(() => setStatus(''), 3000)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Data Collector</h1>
        <p className="text-gray-600 dark:text-gray-400">Collect and manage community posts for analysis</p>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
          status.includes('Error') 
            ? 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20' 
            : 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20'
        }`}>
          {status.includes('Error') ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{status}</span>
        </div>
      )}

      {/* API Status Notice */}
      {apiConfigured ? (
        <div className="card mb-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-2xl">✅</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                Khoros API Connected
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                Successfully connected to <strong>Khoros LSI Data Export API</strong> for comdirectbank.prod. 
                Ready to fetch real community data!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300">
                📡 Using credentials from <code className="bg-green-100 dark:bg-green-800 px-1 rounded">.env.local</code>. 
                Endpoint: <code className="bg-green-100 dark:bg-green-800 px-1 rounded">eu.api.lithium.com/lsi-data/v1</code>
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                ⚠️ <strong>Note:</strong> Khoros API allows maximum 7 days per request. For larger date ranges, make multiple requests.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card mb-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-2xl">❌</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                API Not Configured
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                Khoros API credentials not found. The application requires valid API credentials to fetch community data.
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">
                <strong>Required:</strong> Add your Khoros API credentials to <code className="bg-red-100 dark:bg-red-800 px-1 rounded">.env.local</code>. 
                See <code className="bg-red-100 dark:bg-red-800 px-1 rounded">KHOROS_API_SETUP.md</code> for setup instructions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collection Controls */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Collection Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sentiment Filter
            </label>
            <select
              value={filters.sentiment}
              onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Request Type Filter
            </label>
            <select
              value={filters.requestType}
              onChange={(e) => setFilters({ ...filters, requestType: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="feature_request">Feature Request</option>
              <option value="bug_report">Bug Report</option>
              <option value="question">Question</option>
              <option value="feedback">Feedback</option>
              <option value="complaint">Complaint</option>
              <option value="praise">Praise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Filter
            </label>
            <select
              value={filters.platformRelated}
              onChange={(e) => setFilters({ ...filters, platformRelated: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="true">Community Platform Only</option>
              <option value="false">General Topics Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language Filter
            </label>
            <select
              value={filters.language}
              onChange={(e) => setFilters({ ...filters, language: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            >
              <option value="">All Languages</option>
              <option value="de">🇩🇪 German (Deutsch)</option>
              <option value="en">🇬🇧 English</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Posts to Collect
            </label>
            <input
              type="number"
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
              min="10"
              max="500"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ <strong>API Limit:</strong> Maximum 7 days per request. Current range: {
              filters.dateFrom && filters.dateTo 
                ? `${Math.ceil((new Date(filters.dateTo) - new Date(filters.dateFrom)) / (1000 * 60 * 60 * 24))} days`
                : 'Not selected'
            }
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleFetchData}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Collecting...' : 'Collect Posts'}</span>
          </button>

          <button
            onClick={handleExportData}
            disabled={posts.length === 0}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download size={20} />
            <span>Export Data</span>
          </button>

          <button
            onClick={handleClearData}
            disabled={posts.length === 0}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
          >
            <Trash2 size={20} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Data Overview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Collected Data ({displayedPosts.length} posts)
            {displayedPosts.length !== posts.length && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                (filtered from {posts.length} total)
              </span>
            )}
          </h2>
          {displayedPosts.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              💡 Click author/topic/content to expand full message
            </p>
          )}
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No posts collected yet.</p>
            <p className="text-sm text-gray-400">Click "Collect Posts" to start gathering data.</p>
          </div>
        ) : displayedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No posts match the current filters.</p>
            <p className="text-sm text-gray-400">Try adjusting your filter settings or collect new posts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300">Date</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300">Author</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300">Lang</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300">Topic</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300">Content</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300">Category</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300">Type</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300">Sentiment</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300">Engagement</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300">Link</th>
                </tr>
              </thead>
              <tbody>
                {displayedPosts.slice(0, 20).map((post) => {
                  const isExpanded = expandedRows.has(post.id)
                  const postDate = new Date(post.date)
                  const formattedDate = postDate.toLocaleDateString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })
                  
                  return (
                    <tr 
                      key={post.id} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="p-3 text-gray-600 dark:text-gray-400 text-sm whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td 
                        className="p-3 text-gray-800 dark:text-gray-200 cursor-pointer"
                        onClick={() => toggleRowExpansion(post.id)}
                      >
                        {post.author}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          post.contentLanguage === 'de' 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                            : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                        }`}>
                          {post.contentLanguage?.toUpperCase() || 'EN'}
                        </span>
                      </td>
                      <td 
                        className="p-3 text-gray-800 dark:text-gray-200 cursor-pointer"
                        onClick={() => toggleRowExpansion(post.id)}
                      >
                        {post.topic}
                      </td>
                      <td 
                        className={`p-3 text-gray-600 dark:text-gray-400 cursor-pointer ${isExpanded ? '' : 'max-w-md truncate'}`}
                        onClick={() => toggleRowExpansion(post.id)}
                      >
                        {post.content}
                      </td>
                      <td className="p-3">
                        {post.isPlatformRelated ? (
                          <span className="px-2 py-1 text-xs rounded-full bg-comdirect-yellow text-comdirect-dark font-semibold">
                            Platform
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            General
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {post.requestType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          post.sentiment === 'positive' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : post.sentiment === 'negative'
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {post.sentiment}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {post.likes} likes, {post.replies} replies
                      </td>
                      <td className="p-3">
                        {post.url ? (
                          <div className="relative group">
                            <a 
                              href={post.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-comdirect-blue hover:bg-comdirect-yellow text-white hover:text-comdirect-dark transition-all duration-200 font-medium text-xs"
                              title={apiConfigured ? "View post in community" : "Demo link - may not work"}
                            >
                              <ExternalLink size={14} />
                              <span>View Post</span>
                            </a>
                            {!apiConfigured && (
                              <div className="hidden group-hover:block absolute bottom-full mb-2 left-0 z-10 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap">
                                ⚠️ Demo link - Use real API for working links
                                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No link</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {displayedPosts.length > 20 && (
              <p className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                Showing 20 of {displayedPosts.length} filtered posts. Export data to view all.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DataCollector

