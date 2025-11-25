import React, { useState, useEffect } from 'react'
import { loadPosts } from '../utils/dataCollector'
import { 
  analyzeRequestTypes, 
  analyzeTopics, 
  analyzeEngagement,
  generateInsights,
  calculateActiveUsersByPeriod,
  calculateNewVsReturningMembers
} from '../utils/textAnalysis'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, MessageSquare, ThumbsUp, AlertCircle, CheckCircle, Info, Users, UserPlus, Eye, Database } from 'lucide-react'

const COLORS = ['#FFD500', '#003C71', '#00A0E3', '#FF6B6B', '#4ECDC4', '#45B7D1']

function Dashboard() {
  const [posts, setPosts] = useState([])
  const [requestTypeData, setRequestTypeData] = useState([])
  const [topicsData, setTopicsData] = useState([])
  const [engagement, setEngagement] = useState({})
  const [insights, setInsights] = useState([])
  const [mauData, setMauData] = useState([])
  const [newVsReturning, setNewVsReturning] = useState(null)
  const [showVerification, setShowVerification] = useState(false)
  const [userBreakdown, setUserBreakdown] = useState(null)
  const [periodType, setPeriodType] = useState('monthly') // 'weekly', 'monthly', 'quarterly'

  useEffect(() => {
    loadData()
  }, [])

  const updateActiveUsersData = (postsToAnalyze, period) => {
    setMauData(calculateActiveUsersByPeriod(postsToAnalyze, period))
  }

  useEffect(() => {
    if (posts.length > 0) {
      updateActiveUsersData(posts, periodType)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodType])

  const calculateUserBreakdown = (posts) => {
    if (!posts || posts.length === 0) {
      setUserBreakdown(null)
      return
    }
    
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    // Get all unique users with their details
    const usersMap = new Map()
    const monthlyUsers = {}
    
    posts.forEach(post => {
      if (!post || !post.date) return
      
      try {
        const date = new Date(post.date)
        if (isNaN(date.getTime())) return
        
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        const userIdentifier = post.userId || post.author || null
        
        if (!userIdentifier || 
            userIdentifier === '-1' || 
            userIdentifier === 'ehemaliger Nutzer' || 
            userIdentifier === 'unknown' ||
            String(userIdentifier).trim() === '') {
          return
        }
        
        const cleanId = String(userIdentifier).trim()
        
        if (!usersMap.has(cleanId)) {
          usersMap.set(cleanId, {
            userId: post.userId || null,
            username: post.author || cleanId,
            firstSeen: date,
            lastSeen: date,
            postCount: 0,
            months: new Set()
          })
        }
        
        const user = usersMap.get(cleanId)
        user.postCount++
        user.months.add(monthYear)
        if (date < user.firstSeen) user.firstSeen = date
        if (date > user.lastSeen) user.lastSeen = date
      } catch (error) {
        // Skip invalid posts
      }
    })
    
    // Get current month users
    const currentMonthUsers = Array.from(usersMap.values())
      .filter(user => user.months.has(currentMonth))
      .map(user => ({
        identifier: user.userId || user.username,
        username: user.username,
        hasUserId: !!user.userId,
        postCount: user.postCount,
        firstSeen: user.firstSeen.toISOString().split('T')[0],
        lastSeen: user.lastSeen.toISOString().split('T')[0]
      }))
      .sort((a, b) => b.postCount - a.postCount)
    
    setUserBreakdown({
      totalUsers: usersMap.size,
      currentMonthUsers: currentMonthUsers,
      totalPosts: posts.length,
      postsWithUserId: posts.filter(p => p.userId && p.userId !== '-1').length,
      postsWithAuthor: posts.filter(p => p.author && p.author !== 'ehemaliger Nutzer').length
    })
  }

  const loadData = () => {
    const loadedPosts = loadPosts()
    setPosts(loadedPosts)
    
    if (loadedPosts.length > 0) {
      setRequestTypeData(analyzeRequestTypes(loadedPosts))
      const topics = analyzeTopics(loadedPosts).slice(0, 10)
      console.log('📊 Topics Data:', JSON.stringify(topics, null, 2))
      console.log('📊 Topics Data Sample:', topics[0])
      setTopicsData(topics)
      setEngagement(analyzeEngagement(loadedPosts))
      setInsights(generateInsights(loadedPosts))
      updateActiveUsersData(loadedPosts, periodType)
      setNewVsReturning(calculateNewVsReturningMembers(loadedPosts))
      
      // Calculate user breakdown for verification
      calculateUserBreakdown(loadedPosts)
    }
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertCircle className="text-yellow-500" size={20} />
      case 'success': return <CheckCircle className="text-green-500" size={20} />
      case 'info': return <Info className="text-blue-500" size={20} />
      default: return <Info className="text-gray-500" size={20} />
    }
  }

  const getInsightColor = (type) => {
    switch (type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20'
      case 'success': return 'bg-green-50 border-green-200 dark:bg-green-900/20'
      case 'info': return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20'
      default: return 'bg-gray-50 border-gray-200'
    }
  }

  if (posts.length === 0) {
    return (
      <div className="p-8">
        <div className="card text-center py-12">
          <MessageSquare size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">No Data Available</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Start by collecting community posts from the Data Collector page.
          </p>
          <a href="/collector" className="btn-primary inline-block">
            Go to Data Collector
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Community Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Overview of community activity and engagement</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Posts</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{engagement.totalPosts}</p>
            </div>
            <MessageSquare className="text-comdirect-blue" size={40} />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unique Users</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {new Set(posts.map(p => p.userId || p.author).filter(Boolean)).size}
              </p>
            </div>
            <Users className="text-comdirect-yellow" size={40} />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unique Topics</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {new Set(posts.map(p => p.topic).filter(Boolean)).size}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={40} />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Categories</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {new Set(posts.map(p => p.category).filter(Boolean)).size}
              </p>
            </div>
            <Info className="text-blue-500" size={40} />
          </div>
        </div>
      </div>

      {/* User Analytics Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">User Analytics</h2>
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white font-medium"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Users Chart */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <Users className="text-comdirect-blue" size={24} />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                {periodType === 'weekly' ? 'Weekly' : periodType === 'quarterly' ? 'Quarterly' : 'Monthly'} Active Users
              </h2>
            </div>
            {mauData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mauData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayPeriod" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="activeUsers" 
                      stroke="#003C71" 
                      strokeWidth={2}
                      name="Active Users"
                      dot={{ fill: '#003C71', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {periodType === 'weekly' ? 'Latest Week' : periodType === 'quarterly' ? 'Current Quarter' : 'Current Month'}:
                    </span>
                    <span className="text-lg font-bold text-gray-800 dark:text-white">
                      {mauData[mauData.length - 1]?.activeUsers || 0} users
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8">
                <p className="text-gray-500 dark:text-gray-400 text-center mb-2">No monthly user data available</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  {posts.length > 0 
                    ? 'Posts may not have user identifiers. Try collecting fresh data from the Data Collector.'
                    : 'Collect posts first to see user analytics.'}
                </p>
              </div>
            )}
          </div>

          {/* New vs Returning Members */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-4">
              <UserPlus className="text-comdirect-yellow" size={24} />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">New vs Returning Members</h2>
            </div>
            {!newVsReturning?.hasMultipleMonths && newVsReturning?.currentMonth.total > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ <strong>Limited Data:</strong> Only {newVsReturning.availableMonths} month(s) of data available. 
                  All users appear as "new" because we can't compare to previous months. 
                  Collect data from multiple months to see returning users.
                </p>
              </div>
            )}
            {newVsReturning && newVsReturning.currentMonth.total > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={newVsReturning.chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {newVsReturning.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">New Members:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {newVsReturning.currentMonth.new}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Returning Members:</span>
                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                      {newVsReturning.currentMonth.returning}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Active:</span>
                    <span className="text-xl font-bold text-gray-800 dark:text-white">
                      {newVsReturning.currentMonth.total}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8">
                <p className="text-gray-500 dark:text-gray-400 text-center mb-2">No user activity data for current month</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  {posts.length > 0 
                    ? 'No users found in current month data. Try collecting data for the current month.'
                    : 'Collect posts first to see user analytics.'}
                </p>
                {newVsReturning && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Current month total: {newVsReturning.currentMonth.total} users
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Verification Section */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Database className="text-comdirect-blue" size={24} />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Data Verification</h2>
          </div>
          <button
            onClick={() => setShowVerification(!showVerification)}
            className="flex items-center space-x-2 px-4 py-2 bg-comdirect-blue text-white rounded-lg hover:bg-comdirect-yellow hover:text-comdirect-dark transition-colors"
          >
            <Eye size={20} />
            <span>{showVerification ? 'Hide' : 'Show'} Verification Details</span>
          </button>
        </div>
        
        {showVerification && (
          <div className="space-y-4">
            {/* Data Source Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">📊 Data Source</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Storage:</strong> Browser localStorage (key: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">comdirect_posts</code>)</p>
                <p><strong>Total Posts:</strong> {posts.length} posts loaded</p>
                <p><strong>Posts with userId:</strong> {userBreakdown?.postsWithUserId || 0} posts</p>
                <p><strong>Posts with author:</strong> {userBreakdown?.postsWithAuthor || 0} posts</p>
                <p><strong>Data Flow:</strong> Khoros API → Proxy Server (port 3001) → Frontend → localStorage</p>
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">🔢 Calculation Breakdown</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <div>
                  <p className="font-medium">Monthly Active Users (MAU):</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Groups posts by month (YYYY-MM format)</li>
                    <li>Counts unique users per month using: <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">userId || author</code></li>
                    <li>Excludes: userId="-1", username="ehemaliger Nutzer", empty values</li>
                    <li>Current month: <strong>{mauData.length > 0 ? mauData[mauData.length - 1]?.activeUsers || 0 : 0} unique users</strong></li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">New vs Returning Members:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Compares current month users vs all previous months</li>
                    <li><strong>New:</strong> Users appearing for the first time in current month</li>
                    <li><strong>Returning:</strong> Users who appeared in previous months</li>
                    <li>Current month: <strong>{newVsReturning?.currentMonth.total || 0} total</strong> ({newVsReturning?.currentMonth.new || 0} new, {newVsReturning?.currentMonth.returning || 0} returning)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* User List */}
            {userBreakdown && userBreakdown.currentMonthUsers.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                  👥 Current Month Users ({userBreakdown.currentMonthUsers.length})
                </h3>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300 dark:border-gray-600">
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">User Identifier</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Has userId?</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Posts</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">First Seen</th>
                        <th className="text-left p-2 text-gray-700 dark:text-gray-300">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userBreakdown.currentMonthUsers.slice(0, 50).map((user, idx) => (
                        <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="p-2 text-gray-800 dark:text-gray-200 font-mono text-xs">
                            {user.identifier}
                          </td>
                          <td className="p-2">
                            {user.hasUserId ? (
                              <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">Yes</span>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">No (using author)</span>
                            )}
                          </td>
                          <td className="p-2 text-gray-600 dark:text-gray-400">{user.postCount}</td>
                          <td className="p-2 text-gray-600 dark:text-gray-400 text-xs">{user.firstSeen}</td>
                          <td className="p-2 text-gray-600 dark:text-gray-400 text-xs">{user.lastSeen}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {userBreakdown.currentMonthUsers.length > 50 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Showing 50 of {userBreakdown.currentMonthUsers.length} users
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sample Posts */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">📝 Sample Posts (with user data)</h3>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {posts
                  .filter(p => (p.userId || p.author) && p.userId !== '-1' && p.author !== 'ehemaliger Nutzer')
                  .slice(0, 5)
                  .map((post, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-700 rounded p-3 text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-mono text-gray-800 dark:text-gray-200">
                          userId: <strong>{post.userId || 'null'}</strong> | author: <strong>{post.author || 'null'}</strong>
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 truncate">{post.topic || post.content}</p>
                    </div>
                  ))}
                {posts.filter(p => (p.userId || p.author) && p.userId !== '-1' && p.author !== 'ehemaliger Nutzer').length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No posts with valid user identifiers found</p>
                )}
              </div>
            </div>

            {/* How to Verify */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🔍 How to Verify This Data</h3>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p><strong>1. Check Browser Console:</strong> Open DevTools (F12) → Console tab. Look for logs starting with "📊"</p>
                <p><strong>2. Inspect localStorage:</strong> DevTools → Application tab → Local Storage → <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">comdirect_posts</code></p>
                <p><strong>3. Check Network Tab:</strong> DevTools → Network tab → Look for requests to <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">/api/khoros/posts</code></p>
                <p><strong>4. Verify Proxy Server:</strong> Check terminal running <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">node proxy-server.cjs</code> for API response logs</p>
                <p><strong>5. Export Data:</strong> Go to Data Collector page → Click "Export Data" to download JSON file</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Key Insights</h2>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className={`card ${getInsightColor(insight.type)} flex items-start space-x-3`}>
                {getInsightIcon(insight.type)}
                <p className="text-gray-700 dark:text-gray-300 flex-1">{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Request Types */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Request Types</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={requestTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#003C71" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Topics */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">Top Discussion Topics</h2>
        {topicsData.length > 0 ? (
          <div className="space-y-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={topicsData.slice(0, 10)} 
                margin={{ top: 20, right: 30, left: 20, bottom: 120 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={120}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  interval={0}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  label={{ value: 'Mentions', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                            {label}
                          </p>
                          <p className="text-comdirect-blue dark:text-comdirect-yellow font-bold text-lg">
                            {payload[0].value} mentions
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                  cursor={{ fill: 'rgba(255, 213, 0, 0.1)', stroke: '#FFD500', strokeWidth: 2 }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#FFD500" 
                  name="Mentions"
                  radius={[4, 4, 0, 0]}
                  stroke="#003C71"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
            {/* Summary table for better readability */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Top 10 Topics Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topicsData.slice(0, 10).map((topic, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-comdirect-yellow text-comdirect-dark font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-800 dark:text-gray-200 truncate" title={topic.name}>
                        {topic.name}
                      </span>
                    </div>
                    <span className="flex-shrink-0 ml-4 px-3 py-1 bg-comdirect-blue text-white rounded-full text-sm font-semibold">
                      {topic.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <p>No topic data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

