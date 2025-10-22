import React, { useState, useEffect } from 'react'
import { loadPosts } from '../utils/dataCollector'
import { 
  analyzeSentiment, 
  analyzeRequestTypes, 
  analyzeTopics, 
  analyzeEngagement,
  generateInsights 
} from '../utils/textAnalysis'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, MessageSquare, ThumbsUp, AlertCircle, CheckCircle, Info } from 'lucide-react'

const COLORS = ['#FFD500', '#003C71', '#00A0E3', '#FF6B6B', '#4ECDC4', '#45B7D1']

function Dashboard() {
  const [posts, setPosts] = useState([])
  const [sentimentData, setSentimentData] = useState([])
  const [requestTypeData, setRequestTypeData] = useState([])
  const [topicsData, setTopicsData] = useState([])
  const [engagement, setEngagement] = useState({})
  const [insights, setInsights] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const loadedPosts = loadPosts()
    setPosts(loadedPosts)
    
    if (loadedPosts.length > 0) {
      setSentimentData(analyzeSentiment(loadedPosts))
      setRequestTypeData(analyzeRequestTypes(loadedPosts))
      setTopicsData(analyzeTopics(loadedPosts).slice(0, 10))
      setEngagement(analyzeEngagement(loadedPosts))
      setInsights(generateInsights(loadedPosts))
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
        <p className="text-gray-600 dark:text-gray-400">Overview of community sentiment and engagement</p>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Likes</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{engagement.avgLikes}</p>
            </div>
            <ThumbsUp className="text-comdirect-yellow" size={40} />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Replies</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">{engagement.avgReplies}</p>
            </div>
            <MessageSquare className="text-blue-500" size={40} />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Engagement</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">
                {parseInt(engagement.totalLikes) + parseInt(engagement.totalReplies)}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={40} />
          </div>
        </div>
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
        {/* Sentiment Analysis */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Sentiment Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

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
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Top Discussion Topics</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={topicsData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#FFD500" name="Mentions" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Dashboard

