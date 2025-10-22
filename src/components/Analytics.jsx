import React, { useState, useEffect } from 'react'
import { loadPosts } from '../utils/dataCollector'
import { 
  calculateWordFrequency,
  analyzeTrends,
  findCommonIssues,
  analyzeTopics,
  analyzeRequestTypes
} from '../utils/textAnalysis'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { Search, Filter, TrendingUp, AlertTriangle } from 'lucide-react'

function Analytics() {
  const [posts, setPosts] = useState([])
  const [wordFrequency, setWordFrequency] = useState([])
  const [trends, setTrends] = useState([])
  const [commonIssues, setCommonIssues] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPosts, setFilteredPosts] = useState([])
  const [selectedTopic, setSelectedTopic] = useState('')
  const [topics, setTopics] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterPosts()
  }, [searchTerm, selectedTopic, posts])

  const loadData = () => {
    const loadedPosts = loadPosts()
    setPosts(loadedPosts)
    setFilteredPosts(loadedPosts)
    
    if (loadedPosts.length > 0) {
      setWordFrequency(calculateWordFrequency(loadedPosts))
      setTrends(analyzeTrends(loadedPosts))
      setCommonIssues(findCommonIssues(loadedPosts))
      setTopics(analyzeTopics(loadedPosts))
    }
  }

  const filterPosts = () => {
    let filtered = posts

    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.topic.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedTopic) {
      filtered = filtered.filter(post => post.topic === selectedTopic)
    }

    setFilteredPosts(filtered)
  }

  if (posts.length === 0) {
    return (
      <div className="p-8">
        <div className="card text-center py-12">
          <TrendingUp size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">No Data to Analyze</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Collect community posts first to see detailed analytics.
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Advanced Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Deep dive into community trends and patterns</p>
      </div>

      {/* Search and Filter */}
      <div className="card mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Posts
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by content or topic..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Topic
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              >
                <option value="">All Topics</option>
                {topics.map((topic) => (
                  <option key={topic.name} value={topic.name}>{topic.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          Showing {filteredPosts.length} of {posts.length} posts
        </p>
      </div>

      {/* Trends Over Time */}
      {trends.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Sentiment Trends Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="positive" stroke="#4ECDC4" name="Positive" strokeWidth={2} />
              <Line type="monotone" dataKey="negative" stroke="#FF6B6B" name="Negative" strokeWidth={2} />
              <Line type="monotone" dataKey="neutral" stroke="#95A5A6" name="Neutral" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Common Issues */}
      {commonIssues.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-yellow-500" />
            Top Issues & Feature Requests
          </h2>
          <div className="space-y-3">
            {commonIssues.map((issue, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {index + 1}. {issue.topic}
                  </h3>
                  <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
                    {issue.count} reports
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    <span className="font-medium mr-1">Type:</span>
                    {issue.primaryType.replace(/_/g, ' ')}
                  </span>
                  <span className="flex items-center">
                    <span className="font-medium mr-1">Avg Engagement:</span>
                    {issue.avgLikes} likes
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Word Frequency */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Most Common Keywords</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={wordFrequency.slice(0, 20)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="text" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#003C71" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filtered Posts Detail */}
      {filteredPosts.length > 0 && (searchTerm || selectedTopic) && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Filtered Posts ({filteredPosts.length})
          </h2>
          <div className="space-y-4">
            {filteredPosts.slice(0, 10).map((post) => (
              <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-white">{post.author}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.sentiment === 'positive' 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : post.sentiment === 'negative'
                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {post.sentiment}
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-2">{post.content}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-comdirect-blue">{post.topic}</span>
                  <span>{post.likes} likes</span>
                  <span>{post.replies} replies</span>
                </div>
              </div>
            ))}
            {filteredPosts.length > 10 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Showing 10 of {filteredPosts.length} filtered posts
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics

