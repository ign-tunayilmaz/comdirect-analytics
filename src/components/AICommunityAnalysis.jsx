import React, { useState, useEffect } from 'react'
import { loadPosts } from '../utils/dataCollector'
import Sentiment from 'sentiment'
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { 
  Brain, TrendingUp, Users, MessageSquare, AlertCircle, CheckCircle, Info, 
  Loader2, Filter, Download, BarChart3, Calendar, Tag, FileText, Clock
} from 'lucide-react'

const sentiment = new Sentiment()

// Color scheme for sentiment
const SENTIMENT_COLORS = {
  'very-positive': '#059669',
  positive: '#10b981',
  'slightly-positive': '#34d399',
  neutral: '#6b7280',
  'slightly-negative': '#f59e0b',
  negative: '#ef4444',
  'very-negative': '#dc2626',
  mixed: '#f59e0b'
}

function AICommunityAnalysis() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [communitySentiment, setCommunitySentiment] = useState(null)
  const [userSentiment, setUserSentiment] = useState([])
  const [sentimentTrends, setSentimentTrends] = useState([])
  const [sentimentByCategory, setSentimentByCategory] = useState([])
  const [sentimentByRequestType, setSentimentByRequestType] = useState([])
  const [sentimentByTopic, setSentimentByTopic] = useState([])
  const [sentimentByTime, setSentimentByTime] = useState([])
  const [wordAnalysis, setWordAnalysis] = useState(null)
  const [insights, setInsights] = useState([])
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedWord, setSelectedWord] = useState(null)
  const [wordPosts, setWordPosts] = useState({})
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const loadedPosts = await loadPosts()
      console.log('🤖 AI Analysis: Loaded posts:', loadedPosts.length)
      setPosts(loadedPosts)
      
      if (loadedPosts.length > 0) {
        analyzeSentiment(loadedPosts)
      } else {
        setLoading(false)
      }
    } catch (error) {
      console.error('Error loading posts:', error)
      setLoading(false)
    }
  }

  const analyzeSentiment = async (postsToAnalyze) => {
    setAnalyzing(true)
    
    try {
      // Analyze overall community sentiment
      const communityAnalysis = analyzeCommunitySentiment(postsToAnalyze)
      setCommunitySentiment(communityAnalysis)
      
      // Analyze user sentiment
      const userAnalysis = analyzeUserSentiment(postsToAnalyze)
      setUserSentiment(userAnalysis)
      
      // Analyze sentiment trends over time
      const trends = analyzeSentimentTrends(postsToAnalyze)
      setSentimentTrends(trends)
      
      // Analyze sentiment by category
      const categoryAnalysis = analyzeSentimentByCategory(postsToAnalyze)
      setSentimentByCategory(categoryAnalysis)
      
      // Analyze sentiment by request type
      const requestTypeAnalysis = analyzeSentimentByRequestType(postsToAnalyze)
      setSentimentByRequestType(requestTypeAnalysis)
      
      // Analyze sentiment by topic
      const topicAnalysis = analyzeSentimentByTopic(postsToAnalyze)
      setSentimentByTopic(topicAnalysis)
      
      // Analyze sentiment by time patterns
      const timeAnalysis = analyzeSentimentByTime(postsToAnalyze)
      setSentimentByTime(timeAnalysis)
      
      // Analyze words
      const wordAnalysisResult = analyzeWords(postsToAnalyze)
      setWordAnalysis(wordAnalysisResult)
      
      // Generate insights
      const generatedInsights = generateInsights(
        communityAnalysis, 
        userAnalysis, 
        trends,
        categoryAnalysis,
        requestTypeAnalysis,
        topicAnalysis
      )
      setInsights(generatedInsights)
      
    } catch (error) {
      console.error('Error analyzing sentiment:', error)
    } finally {
      setAnalyzing(false)
      setLoading(false)
    }
  }

  const getDetailedSentimentCategory = (score) => {
    if (score >= 5) return 'very-positive'
    if (score >= 2) return 'positive'
    if (score > 0) return 'slightly-positive'
    if (score === 0) return 'neutral'
    if (score > -2) return 'slightly-negative'
    if (score > -5) return 'negative'
    return 'very-negative'
  }

  const analyzeCommunitySentiment = (posts) => {
    const sentimentCounts = {
      'very-positive': 0,
      'positive': 0,
      'slightly-positive': 0,
      'neutral': 0,
      'slightly-negative': 0,
      'negative': 0,
      'very-negative': 0
    }
    
    const sentimentScores = []
    const scoreDistribution = []
    
    posts.forEach(post => {
      const text = `${post.topic || ''} ${post.content || ''}`.trim()
      if (!text) return
      
      const result = sentiment.analyze(text)
      const score = result.score
      const category = getDetailedSentimentCategory(score)
      
      sentimentCounts[category]++
      sentimentScores.push({
        score,
        category,
        text: text.substring(0, 100),
        date: post.date,
        category: post.category,
        requestType: post.requestType,
        topic: post.topic
      })
      scoreDistribution.push(score)
    })
    
    const total = posts.length
    const distribution = Object.entries(sentimentCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({
        name: name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        value: count,
        percentage: ((count / total) * 100).toFixed(1),
        category: name
      }))
    
    const averageScore = sentimentScores.reduce((sum, s) => sum + s.score, 0) / sentimentScores.length
    const medianScore = [...scoreDistribution].sort((a, b) => a - b)[Math.floor(scoreDistribution.length / 2)]
    const minScore = Math.min(...scoreDistribution)
    const maxScore = Math.max(...scoreDistribution)
    
    // Calculate standard deviation
    const variance = scoreDistribution.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / scoreDistribution.length
    const stdDev = Math.sqrt(variance)
    
    return {
      distribution,
      averageScore: averageScore.toFixed(2),
      medianScore: medianScore.toFixed(2),
      minScore: minScore.toFixed(2),
      maxScore: maxScore.toFixed(2),
      stdDev: stdDev.toFixed(2),
      totalPosts: total,
      sentimentScores,
      counts: sentimentCounts,
      scoreDistribution
    }
  }

  const analyzeUserSentiment = (posts) => {
    const userMap = new Map()
    
    posts.forEach(post => {
      const author = post.author || post.userId || 'Unknown'
      if (!userMap.has(author)) {
        userMap.set(author, {
          author,
          posts: [],
          totalScore: 0,
          postCount: 0,
          categories: new Set(),
          requestTypes: new Set()
        })
      }
      
      const text = `${post.topic || ''} ${post.content || ''}`.trim()
      if (!text) return
      
      const result = sentiment.analyze(text)
      const userData = userMap.get(author)
      userData.posts.push({
        score: result.score,
        text: text.substring(0, 150),
        date: post.date,
        category: post.category,
        requestType: post.requestType,
        topic: post.topic,
        url: post.url
      })
      userData.totalScore += result.score
      userData.postCount++
      if (post.category) userData.categories.add(post.category)
      if (post.requestType) userData.requestTypes.add(post.requestType)
    })
    
    // Calculate average sentiment per user
    const userAnalysis = Array.from(userMap.values())
      .map(user => ({
        ...user,
        averageScore: (user.totalScore / user.postCount).toFixed(2),
        sentiment: getDetailedSentimentCategory(user.totalScore / user.postCount),
        categories: Array.from(user.categories),
        requestTypes: Array.from(user.requestTypes),
        positivePosts: user.posts.filter(p => p.score > 0).length,
        negativePosts: user.posts.filter(p => p.score < 0).length,
        neutralPosts: user.posts.filter(p => p.score === 0).length
      }))
      .sort((a, b) => parseFloat(b.averageScore) - parseFloat(a.averageScore))
    
    return userAnalysis
  }

  const analyzeSentimentTrends = (posts) => {
    const trends = {}
    
    posts.forEach(post => {
      const date = new Date(post.date)
      if (isNaN(date.getTime())) return
      
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!trends[monthYear]) {
        trends[monthYear] = {
          period: monthYear,
          'very-positive': 0,
          'positive': 0,
          'slightly-positive': 0,
          'neutral': 0,
          'slightly-negative': 0,
          'negative': 0,
          'very-negative': 0,
          total: 0,
          totalScore: 0
        }
      }
      
      const text = `${post.topic || ''} ${post.content || ''}`.trim()
      if (!text) return
      
      const result = sentiment.analyze(text)
      const score = result.score
      const category = getDetailedSentimentCategory(score)
      
      trends[monthYear][category]++
      trends[monthYear].total++
      trends[monthYear].totalScore += score
    })
    
    return Object.values(trends)
      .map(trend => ({
        ...trend,
        displayPeriod: formatMonth(trend.period),
        averageScore: (trend.totalScore / trend.total).toFixed(2),
        positive: trend['very-positive'] + trend['positive'] + trend['slightly-positive'],
        negative: trend['very-negative'] + trend['negative'] + trend['slightly-negative'],
        neutral: trend['neutral']
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
  }

  const analyzeSentimentByCategory = (posts) => {
    const categoryMap = new Map()
    
    posts.forEach(post => {
      const category = post.category || 'Uncategorized'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          posts: [],
          totalScore: 0,
          postCount: 0
        })
      }
      
      const text = `${post.topic || ''} ${post.content || ''}`.trim()
      if (!text) return
      
      const result = sentiment.analyze(text)
      const categoryData = categoryMap.get(category)
      categoryData.posts.push(result.score)
      categoryData.totalScore += result.score
      categoryData.postCount++
    })
    
    return Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        averageScore: (cat.totalScore / cat.postCount).toFixed(2),
        sentiment: getDetailedSentimentCategory(cat.totalScore / cat.postCount),
        positiveCount: cat.posts.filter(s => s > 0).length,
        negativeCount: cat.posts.filter(s => s < 0).length,
        neutralCount: cat.posts.filter(s => s === 0).length
      }))
      .sort((a, b) => parseFloat(b.averageScore) - parseFloat(a.averageScore))
  }

  const analyzeSentimentByRequestType = (posts) => {
    const typeMap = new Map()
    
    posts.forEach(post => {
      const requestType = post.requestType || 'unknown'
      if (!typeMap.has(requestType)) {
        typeMap.set(requestType, {
          requestType,
          posts: [],
          totalScore: 0,
          postCount: 0
        })
      }
      
      const text = `${post.topic || ''} ${post.content || ''}`.trim()
      if (!text) return
      
      const result = sentiment.analyze(text)
      const typeData = typeMap.get(requestType)
      typeData.posts.push(result.score)
      typeData.totalScore += result.score
      typeData.postCount++
    })
    
    return Array.from(typeMap.values())
      .map(type => ({
        ...type,
        averageScore: (type.totalScore / type.postCount).toFixed(2),
        sentiment: getDetailedSentimentCategory(type.totalScore / type.postCount),
        displayName: type.requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }))
      .sort((a, b) => parseFloat(b.averageScore) - parseFloat(a.averageScore))
  }

  const analyzeSentimentByTopic = (posts) => {
    const topicMap = new Map()
    
    posts.forEach(post => {
      const topic = post.topic || 'Untitled'
      if (!topic || topic === 'Untitled') return
      
      if (!topicMap.has(topic)) {
        topicMap.set(topic, {
          topic,
          posts: [],
          totalScore: 0,
          postCount: 0
        })
      }
      
      const text = `${topic} ${post.content || ''}`.trim()
      if (!text) return
      
      const result = sentiment.analyze(text)
      const topicData = topicMap.get(topic)
      topicData.posts.push(result.score)
      topicData.totalScore += result.score
      topicData.postCount++
    })
    
    return Array.from(topicMap.values())
      .map(topic => ({
        ...topic,
        averageScore: (topic.totalScore / topic.postCount).toFixed(2),
        sentiment: getDetailedSentimentCategory(topic.totalScore / topic.postCount)
      }))
      .filter(t => t.postCount >= 2) // Only topics with at least 2 posts
      .sort((a, b) => parseFloat(b.averageScore) - parseFloat(a.averageScore))
      .slice(0, 20) // Top 20 topics
  }

  const analyzeSentimentByTime = (posts) => {
    const dayOfWeekMap = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' }
    const timeMap = {}
    const dayMap = {}
    
    posts.forEach(post => {
      const date = new Date(post.date)
      if (isNaN(date.getTime())) return
      
      const hour = date.getHours()
      const dayOfWeek = dayOfWeekMap[date.getDay()]
      
      // Time of day analysis
      let timeSlot = 'Morning (6-12)'
      if (hour >= 12 && hour < 18) timeSlot = 'Afternoon (12-18)'
      else if (hour >= 18 && hour < 22) timeSlot = 'Evening (18-22)'
      else if (hour >= 22 || hour < 6) timeSlot = 'Night (22-6)'
      
      if (!timeMap[timeSlot]) {
        timeMap[timeSlot] = { timeSlot, posts: [], totalScore: 0, postCount: 0 }
      }
      
      if (!dayMap[dayOfWeek]) {
        dayMap[dayOfWeek] = { dayOfWeek, posts: [], totalScore: 0, postCount: 0 }
      }
      
      const text = `${post.topic || ''} ${post.content || ''}`.trim()
      if (!text) return
      
      const result = sentiment.analyze(text)
      
      timeMap[timeSlot].posts.push(result.score)
      timeMap[timeSlot].totalScore += result.score
      timeMap[timeSlot].postCount++
      
      dayMap[dayOfWeek].posts.push(result.score)
      dayMap[dayOfWeek].totalScore += result.score
      dayMap[dayOfWeek].postCount++
    })
    
    // Order time slots properly
    const timeSlotOrder = ['Morning (6-12)', 'Afternoon (12-18)', 'Evening (18-22)', 'Night (22-6)']
    const timeAnalysis = timeSlotOrder
      .filter(slot => timeMap[slot]) // Only include slots that have data
      .map(slot => {
        const t = timeMap[slot]
        return {
          ...t,
          averageScore: parseFloat((t.totalScore / t.postCount).toFixed(2)), // Convert to number
          sentiment: getDetailedSentimentCategory(t.totalScore / t.postCount),
          postCount: t.postCount
        }
      })
    
    // Order days of week properly
    const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayAnalysis = dayOrder
      .filter(day => dayMap[day]) // Only include days that have data
      .map(day => {
        const d = dayMap[day]
        return {
          ...d,
          averageScore: parseFloat((d.totalScore / d.postCount).toFixed(2)), // Convert to number
          sentiment: getDetailedSentimentCategory(d.totalScore / d.postCount),
          postCount: d.postCount
        }
      })
    
    return { timeAnalysis, dayAnalysis }
  }

  const analyzeWords = (posts) => {
    const positiveWords = {}
    const negativeWords = {}
    const allWords = {}
    const wordToPosts = {} // Track which posts contain each word
    
    posts.forEach(post => {
      const text = `${post.topic || ''} ${post.content || ''}`.trim()
      if (!text || text.length < 3) return
      
      const textLower = text.toLowerCase()
      
      try {
        const result = sentiment.analyze(text)
        
        // The sentiment library returns positive and negative arrays
        // Use those instead of calculation which might not always be present
        if (result.positive && Array.isArray(result.positive)) {
          result.positive.forEach(word => {
            if (word && word.length > 2) { // Filter out very short words
              const wordLower = word.toLowerCase()
              positiveWords[wordLower] = (positiveWords[wordLower] || 0) + 1
              allWords[wordLower] = (allWords[wordLower] || 0) + 1
              
              // Track posts containing this word
              if (!wordToPosts[wordLower]) {
                wordToPosts[wordLower] = []
              }
              // Check if this post already added (avoid duplicates)
              if (!wordToPosts[wordLower].find(p => p.id === post.id)) {
                wordToPosts[wordLower].push({
                  id: post.id,
                  topic: post.topic,
                  content: post.content,
                  author: post.author,
                  date: post.date,
                  url: post.url,
                  category: post.category,
                  sentiment: sentiment.analyze(text).score
                })
              }
            }
          })
        }
        
        if (result.negative && Array.isArray(result.negative)) {
          result.negative.forEach(word => {
            if (word && word.length > 2) { // Filter out very short words
              const wordLower = word.toLowerCase()
              negativeWords[wordLower] = (negativeWords[wordLower] || 0) + 1
              allWords[wordLower] = (allWords[wordLower] || 0) + 1
              
              // Track posts containing this word
              if (!wordToPosts[wordLower]) {
                wordToPosts[wordLower] = []
              }
              // Check if this post already added (avoid duplicates)
              if (!wordToPosts[wordLower].find(p => p.id === post.id)) {
                wordToPosts[wordLower].push({
                  id: post.id,
                  topic: post.topic,
                  content: post.content,
                  author: post.author,
                  date: post.date,
                  url: post.url,
                  category: post.category,
                  sentiment: sentiment.analyze(text).score
                })
              }
            }
          })
        }
        
        // Also check calculation if available (for more detailed scoring)
        if (result.calculation && typeof result.calculation === 'object') {
          Object.entries(result.calculation).forEach(([word, score]) => {
            if (word && word.length > 2) {
              const wordLower = word.toLowerCase()
              if (score > 0) {
                positiveWords[wordLower] = (positiveWords[wordLower] || 0) + 1
              } else if (score < 0) {
                negativeWords[wordLower] = (negativeWords[wordLower] || 0) + 1
              }
              allWords[wordLower] = (allWords[wordLower] || 0) + 1
              
              // Track posts containing this word
              if (!wordToPosts[wordLower]) {
                wordToPosts[wordLower] = []
              }
              // Check if this post already added (avoid duplicates)
              if (!wordToPosts[wordLower].find(p => p.id === post.id)) {
                wordToPosts[wordLower].push({
                  id: post.id,
                  topic: post.topic,
                  content: post.content,
                  author: post.author,
                  date: post.date,
                  url: post.url,
                  category: post.category,
                  sentiment: result.score
                })
              }
            }
          })
        }
      } catch (error) {
        console.warn('Error analyzing text for words:', error, text.substring(0, 50))
      }
    })
    
    const topPositive = Object.entries(positiveWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }))
    
    const topNegative = Object.entries(negativeWords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }))
    
    console.log('📊 Word Analysis:', {
      topPositive: topPositive.length,
      topNegative: topNegative.length,
      totalUniqueWords: Object.keys(allWords).length,
      wordToPostsCount: Object.keys(wordToPosts).length
    })
    
    // Store word-to-posts mapping in state
    setWordPosts(wordToPosts)
    
    return {
      topPositive,
      topNegative,
      totalUniqueWords: Object.keys(allWords).length
    }
  }

  const getSentimentCategory = (score) => {
    return getDetailedSentimentCategory(score)
  }

  const formatMonth = (monthYear) => {
    const [year, month] = monthYear.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  const generateInsights = (community, users, trends, categories, requestTypes, topics) => {
    const insights = []
    
    if (community) {
      const positivePct = parseFloat(community.distribution.find(d => d.category === 'positive' || d.category === 'very-positive')?.percentage || 0)
      const negativePct = parseFloat(community.distribution.find(d => d.category === 'negative' || d.category === 'very-negative')?.percentage || 0)
      
      if (positivePct > 50) {
        insights.push({
          type: 'success',
          icon: CheckCircle,
          title: 'Positive Community Sentiment',
          message: `${positivePct.toFixed(1)}% of posts have positive sentiment. The community is generally satisfied.`
        })
      } else if (negativePct > 30) {
        insights.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Negative Sentiment Alert',
          message: `${negativePct.toFixed(1)}% of posts have negative sentiment. Consider addressing user concerns.`
        })
      }
      
      const avgScore = parseFloat(community.averageScore)
      if (avgScore > 1) {
        insights.push({
          type: 'success',
          icon: TrendingUp,
          title: 'Above Average Sentiment',
          message: `Average sentiment score is ${avgScore}, indicating positive community engagement.`
        })
      } else if (avgScore < -1) {
        insights.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'Below Average Sentiment',
          message: `Average sentiment score is ${avgScore}. Monitor community feedback closely.`
        })
      }
    }
    
    if (categories && categories.length > 0) {
      const worstCategory = categories[categories.length - 1]
      const bestCategory = categories[0]
      
      if (parseFloat(worstCategory.averageScore) < -1) {
        insights.push({
          type: 'warning',
          icon: Tag,
          title: 'Category Needing Attention',
          message: `"${worstCategory.category}" has the lowest sentiment (${worstCategory.averageScore}). Focus improvement efforts here.`
        })
      }
      
      if (parseFloat(bestCategory.averageScore) > 1) {
        insights.push({
          type: 'success',
          icon: Tag,
          title: 'Best Performing Category',
          message: `"${bestCategory.category}" has the highest sentiment (${bestCategory.averageScore}). Learn from this success.`
        })
      }
    }
    
    if (requestTypes && requestTypes.length > 0) {
      const complaintType = requestTypes.find(rt => rt.requestType === 'complaint')
      if (complaintType && parseFloat(complaintType.averageScore) < -2) {
        insights.push({
          type: 'warning',
          icon: AlertCircle,
          title: 'High Complaint Sentiment',
          message: `Complaints show very negative sentiment (${complaintType.averageScore}). Urgent action needed.`
        })
      }
    }
    
    if (topics && topics.length > 0) {
      const negativeTopics = topics.filter(t => parseFloat(t.averageScore) < -2).slice(0, 3)
      if (negativeTopics.length > 0) {
        insights.push({
          type: 'warning',
          icon: FileText,
          title: 'Topics with Negative Sentiment',
          message: `These topics need attention: ${negativeTopics.map(t => `"${t.topic.substring(0, 30)}..."`).join(', ')}`
        })
      }
    }
    
    if (users && users.length > 0) {
      const topNegativeUsers = users.filter(u => parseFloat(u.averageScore) < -2).slice(0, 3)
      if (topNegativeUsers.length > 0) {
        insights.push({
          type: 'warning',
          icon: Users,
          title: 'Users Needing Support',
          message: `Consider reaching out to: ${topNegativeUsers.map(u => u.author).join(', ')} to address concerns.`
        })
      }
    }
    
    return insights
  }

  const exportData = () => {
    const exportData = {
      summary: {
        totalPosts: communitySentiment?.totalPosts || 0,
        averageScore: communitySentiment?.averageScore || 0,
        analyzedAt: new Date().toISOString()
      },
      communitySentiment: communitySentiment?.distribution || [],
      userSentiment: userSentiment.slice(0, 50).map(u => ({
        author: u.author,
        averageScore: u.averageScore,
        postCount: u.postCount,
        sentiment: u.sentiment
      })),
      sentimentByCategory: sentimentByCategory,
      sentimentByRequestType: sentimentByRequestType,
      topTopics: sentimentByTopic.slice(0, 10)
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-sentiment-analysis-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || analyzing) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {loading ? 'Loading community data...' : 'Analyzing sentiment...'}
          </p>
        </div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="p-8">
        <div className="card text-center py-12">
          <Brain size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">No Data to Analyze</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Collect community posts first to perform AI sentiment analysis.
          </p>
          <a href="#/collector" className="btn-primary inline-block">
            Go to Data Collector
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Brain className="text-blue-600 dark:text-blue-400" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">AI Community Analysis</h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                Advanced sentiment analysis powered by AI to understand community mood and user satisfaction
              </p>
            </div>
          </div>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {insights.map((insight, index) => {
            const Icon = insight.icon
            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : insight.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`mt-1 ${
                      insight.type === 'success'
                        ? 'text-green-600 dark:text-green-400'
                        : insight.type === 'warning'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                    size={20}
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{insight.message}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-4">
          {['overview', 'categories', 'topics', 'users', 'time', 'words'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Community Sentiment Overview */}
          {communitySentiment && (
            <div className="card mb-8">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Community Sentiment Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    Sentiment Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={communitySentiment.distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {communitySentiment.distribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={SENTIMENT_COLORS[entry.category] || SENTIMENT_COLORS.neutral}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    Detailed Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Total Posts Analyzed</span>
                      <span className="font-bold text-gray-800 dark:text-white">
                        {communitySentiment.totalPosts}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Average Sentiment Score</span>
                      <span className={`font-bold ${
                        parseFloat(communitySentiment.averageScore) > 0
                          ? 'text-green-600 dark:text-green-400'
                          : parseFloat(communitySentiment.averageScore) < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {communitySentiment.averageScore}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Median Score</span>
                      <span className="font-bold text-gray-800 dark:text-white">
                        {communitySentiment.medianScore}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Score Range</span>
                      <span className="font-bold text-gray-800 dark:text-white">
                        {communitySentiment.minScore} to {communitySentiment.maxScore}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Standard Deviation</span>
                      <span className="font-bold text-gray-800 dark:text-white">
                        {communitySentiment.stdDev}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {communitySentiment.distribution.map((item) => (
                      <div
                        key={item.name}
                        className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: SENTIMENT_COLORS[item.category] || SENTIMENT_COLORS.neutral
                            }}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item.name}</span>
                        </div>
                        <span className="font-semibold text-sm text-gray-800 dark:text-white">
                          {item.value} ({item.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sentiment Trends Over Time */}
          {sentimentTrends.length > 0 && (
            <div className="card mb-8">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Sentiment Trends Over Time
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={sentimentTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayPeriod" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="positive"
                    stackId="1"
                    stroke={SENTIMENT_COLORS.positive}
                    fill={SENTIMENT_COLORS.positive}
                    name="Positive"
                  />
                  <Area
                    type="monotone"
                    dataKey="negative"
                    stackId="1"
                    stroke={SENTIMENT_COLORS.negative}
                    fill={SENTIMENT_COLORS.negative}
                    name="Negative"
                  />
                  <Area
                    type="monotone"
                    dataKey="neutral"
                    stackId="1"
                    stroke={SENTIMENT_COLORS.neutral}
                    fill={SENTIMENT_COLORS.neutral}
                    name="Neutral"
                  />
                  <Line
                    type="monotone"
                    dataKey="averageScore"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Avg Score"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {sentimentByCategory.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Sentiment by Category
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={sentimentByCategory.slice(0, 10).map(cat => ({
                      ...cat,
                      averageScore: parseFloat(cat.averageScore)
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [parseFloat(value).toFixed(2), 'Avg Score']}
                    />
                    <Bar dataKey="averageScore" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                      {sentimentByCategory.slice(0, 10).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            parseFloat(entry.averageScore) > 0 
                              ? '#10b981' 
                              : parseFloat(entry.averageScore) < 0 
                              ? '#ef4444' 
                              : '#6b7280'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {sentimentByCategory.slice(0, 10).map((cat, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCategory === cat.category
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => setSelectedCategory(selectedCategory === cat.category ? null : cat.category)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-white">{cat.category}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {cat.postCount} posts
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-lg font-bold ${
                            parseFloat(cat.averageScore) > 0
                              ? 'text-green-600 dark:text-green-400'
                              : parseFloat(cat.averageScore) < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {cat.averageScore}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {cat.positiveCount} positive, {cat.negativeCount} negative
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {sentimentByRequestType.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Sentiment by Request Type
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={sentimentByRequestType.map(rt => ({
                    ...rt,
                    averageScore: parseFloat(rt.averageScore)
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="displayName" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [parseFloat(value).toFixed(2), 'Avg Score']}
                  />
                  <Bar dataKey="averageScore" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                    {sentimentByRequestType.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          parseFloat(entry.averageScore) > 0 
                            ? '#10b981' 
                            : parseFloat(entry.averageScore) < 0 
                            ? '#ef4444' 
                            : '#6b7280'
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Topics Tab */}
      {activeTab === 'topics' && sentimentByTopic.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Sentiment by Topic (Top 20)
          </h2>
          <div className="space-y-2">
            {sentimentByTopic.map((topic, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedTopic === topic.topic
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => setSelectedTopic(selectedTopic === topic.topic ? null : topic.topic)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                      {topic.topic.length > 80 ? `${topic.topic.substring(0, 80)}...` : topic.topic}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {topic.postCount} posts
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <span className={`text-lg font-bold ${
                      parseFloat(topic.averageScore) > 0
                        ? 'text-green-600 dark:text-green-400'
                        : parseFloat(topic.averageScore) < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {topic.averageScore}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {topic.sentiment}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && userSentiment.length > 0 && (
        <>
          <div className="card mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              User Sentiment Analysis
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Sentiment analysis per user based on their posts. Click on a user to see details.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      User
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Posts
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Avg. Score
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Positive
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Negative
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Sentiment
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {userSentiment.slice(0, 30).map((user, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                        selectedUser === user.author ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => setSelectedUser(selectedUser === user.author ? null : user.author)}
                    >
                      <td className="py-3 px-4 text-sm text-gray-800 dark:text-gray-200">
                        {user.author}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {user.postCount}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`font-semibold ${
                            parseFloat(user.averageScore) > 0
                              ? 'text-green-600 dark:text-green-400'
                              : parseFloat(user.averageScore) < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {user.averageScore}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-green-600 dark:text-green-400">
                        {user.positivePosts}
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600 dark:text-red-400">
                        {user.negativePosts}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.sentiment === 'positive' || user.sentiment === 'very-positive'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : user.sentiment === 'negative' || user.sentiment === 'very-negative'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {user.sentiment.replace('-', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {selectedUser && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
                Posts by {selectedUser}
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {userSentiment
                  .find(u => u.author === selectedUser)
                  ?.posts.slice(0, 20)
                  .map((post, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              post.score > 0
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : post.score < 0
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                            }`}
                          >
                            Score: {post.score.toFixed(2)}
                          </span>
                          {post.category && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                              {post.category}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-1">{post.text}...</p>
                      {post.topic && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                          Topic: {post.topic}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Top Users Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Most Positive Users
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={userSentiment
                    .filter(u => parseFloat(u.averageScore) > 0)
                    .slice(0, 10)
                    .reverse()
                    .map(u => ({
                      ...u,
                      averageScore: parseFloat(u.averageScore)
                    }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="author" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [parseFloat(value).toFixed(2), 'Avg Score']}
                  />
                  <Bar dataKey="averageScore" fill={SENTIMENT_COLORS.positive} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Users Needing Attention
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={userSentiment
                    .filter(u => parseFloat(u.averageScore) < 0)
                    .slice(0, 10)
                    .reverse()
                    .map(u => ({
                      ...u,
                      averageScore: parseFloat(u.averageScore)
                    }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="author" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [parseFloat(value).toFixed(2), 'Avg Score']}
                  />
                  <Bar dataKey="averageScore" fill={SENTIMENT_COLORS.negative} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Time Tab */}
      {activeTab === 'time' && sentimentByTime.timeAnalysis && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Sentiment by Time of Day
            </h2>
            {sentimentByTime.timeAnalysis.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sentimentByTime.timeAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="timeSlot" 
                      angle={0}
                      textAnchor="middle"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [parseFloat(value).toFixed(2), 'Avg Score']}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Bar 
                      dataKey="averageScore" 
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                    >
                      {sentimentByTime.timeAnalysis.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.averageScore > 0 
                              ? '#10b981' 
                              : entry.averageScore < 0 
                              ? '#ef4444' 
                              : '#6b7280'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {sentimentByTime.timeAnalysis.map((time, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{time.timeSlot}</p>
                      <p className={`text-lg font-bold ${
                        time.averageScore > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : time.averageScore < 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {time.averageScore.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{time.postCount} posts</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No time-based data available</p>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Sentiment by Day of Week
            </h2>
            {sentimentByTime.dayAnalysis.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sentimentByTime.dayAnalysis} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="dayOfWeek" 
                      angle={0}
                      textAnchor="middle"
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => [parseFloat(value).toFixed(2), 'Avg Score']}
                      labelFormatter={(label) => `Day: ${label}`}
                    />
                    <Bar 
                      dataKey="averageScore" 
                      fill="#8b5cf6"
                      radius={[8, 8, 0, 0]}
                    >
                      {sentimentByTime.dayAnalysis.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.averageScore > 0 
                              ? '#10b981' 
                              : entry.averageScore < 0 
                              ? '#ef4444' 
                              : '#6b7280'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-7 gap-2">
                  {sentimentByTime.dayAnalysis.map((day, index) => (
                    <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">{day.dayOfWeek}</p>
                      <p className={`text-sm font-bold ${
                        day.averageScore > 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : day.averageScore < 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {day.averageScore.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{day.postCount}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No day-based data available</p>
            )}
          </div>
        </div>
      )}

      {/* Words Tab */}
      {activeTab === 'words' && wordAnalysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Top Positive Words
            </h2>
            {wordAnalysis.topPositive && wordAnalysis.topPositive.length > 0 ? (
              <div className="space-y-2">
                {wordAnalysis.topPositive.map((item, index) => {
                  const wordLower = item.word.toLowerCase()
                  const postsForWord = wordPosts[wordLower] || []
                  const isSelected = selectedWord === wordLower
                  
                  return (
                    <div key={index}>
                      <div
                        onClick={() => setSelectedWord(isSelected ? null : wordLower)}
                        className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-green-100 dark:bg-green-800 border-2 border-green-400 dark:border-green-600'
                            : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40'
                        }`}
                      >
                        <span className="text-gray-800 dark:text-white font-medium">{item.word}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 dark:text-green-400 font-bold">{item.count}</span>
                          {postsForWord.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({postsForWord.length} posts)
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{isSelected ? '▼' : '▶'}</span>
                        </div>
                      </div>
                      {isSelected && postsForWord.length > 0 && (
                        <div className="mt-2 ml-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                            Posts containing "{item.word}" ({postsForWord.length})
                          </h4>
                          <div className="space-y-3">
                            {postsForWord.slice(0, 20).map((post, postIndex) => (
                              <div
                                key={postIndex}
                                className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div className="flex-1">
                                    {post.topic && (
                                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                                        {post.topic.length > 80 ? `${post.topic.substring(0, 80)}...` : post.topic}
                                      </h5>
                                    )}
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      by {post.author || 'Unknown'} • {new Date(post.date).toLocaleDateString()}
                                      {post.category && ` • ${post.category}`}
                                    </p>
                                    {post.content && (
                                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                                        {post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                                      </p>
                                    )}
                                  </div>
                                  <span className={`ml-2 text-xs font-medium px-2 py-1 rounded ${
                                    post.sentiment > 0
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : post.sentiment < 0
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                  }`}>
                                    {post.sentiment > 0 ? '+' : ''}{post.sentiment.toFixed(1)}
                                  </span>
                                </div>
                                {post.url && (
                                  <a
                                    href={post.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1"
                                  >
                                    <MessageSquare size={12} />
                                    View Post
                                  </a>
                                )}
                              </div>
                            ))}
                            {postsForWord.length > 20 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                                Showing 20 of {postsForWord.length} posts
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No positive words found in the analyzed posts.</p>
                <p className="text-sm mt-2">The sentiment analysis may not have detected positive sentiment words in the text.</p>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Top Negative Words
            </h2>
            {wordAnalysis.topNegative && wordAnalysis.topNegative.length > 0 ? (
              <div className="space-y-2">
                {wordAnalysis.topNegative.map((item, index) => {
                  const wordLower = item.word.toLowerCase()
                  const postsForWord = wordPosts[wordLower] || []
                  const isSelected = selectedWord === wordLower
                  
                  return (
                    <div key={index}>
                      <div
                        onClick={() => setSelectedWord(isSelected ? null : wordLower)}
                        className={`flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-red-100 dark:bg-red-800 border-2 border-red-400 dark:border-red-600'
                            : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40'
                        }`}
                      >
                        <span className="text-gray-800 dark:text-white font-medium">{item.word}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 dark:text-red-400 font-bold">{item.count}</span>
                          {postsForWord.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({postsForWord.length} posts)
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{isSelected ? '▼' : '▶'}</span>
                        </div>
                      </div>
                      {isSelected && postsForWord.length > 0 && (
                        <div className="mt-2 ml-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                          <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
                            Posts containing "{item.word}" ({postsForWord.length})
                          </h4>
                          <div className="space-y-3">
                            {postsForWord.slice(0, 20).map((post, postIndex) => (
                              <div
                                key={postIndex}
                                className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <div className="flex-1">
                                    {post.topic && (
                                      <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                                        {post.topic.length > 80 ? `${post.topic.substring(0, 80)}...` : post.topic}
                                      </h5>
                                    )}
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                                      by {post.author || 'Unknown'} • {new Date(post.date).toLocaleDateString()}
                                      {post.category && ` • ${post.category}`}
                                    </p>
                                    {post.content && (
                                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">
                                        {post.content.length > 150 ? `${post.content.substring(0, 150)}...` : post.content}
                                      </p>
                                    )}
                                  </div>
                                  <span className={`ml-2 text-xs font-medium px-2 py-1 rounded ${
                                    post.sentiment > 0
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : post.sentiment < 0
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                  }`}>
                                    {post.sentiment > 0 ? '+' : ''}{post.sentiment.toFixed(1)}
                                  </span>
                                </div>
                                {post.url && (
                                  <a
                                    href={post.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-1"
                                  >
                                    <MessageSquare size={12} />
                                    View Post
                                  </a>
                                )}
                              </div>
                            ))}
                            {postsForWord.length > 20 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                                Showing 20 of {postsForWord.length} posts
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No negative words found in the analyzed posts.</p>
                <p className="text-sm mt-2">The sentiment analysis may not have detected negative sentiment words in the text.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AICommunityAnalysis
