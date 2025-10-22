/**
 * Text analysis utilities for processing community posts
 */

/**
 * Extract keywords from text
 */
export const extractKeywords = (text) => {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him',
    'us', 'them', 'what', 'which', 'who', 'when', 'where', 'why', 'how'
  ])
  
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
  
  return words
}

/**
 * Calculate word frequency from posts
 */
export const calculateWordFrequency = (posts) => {
  const frequency = {}
  
  posts.forEach(post => {
    const keywords = extractKeywords(post.content + ' ' + post.topic)
    keywords.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })
  })
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, count]) => ({ text: word, value: count }))
}

/**
 * Analyze sentiment distribution
 */
export const analyzeSentiment = (posts) => {
  const sentiments = { positive: 0, negative: 0, neutral: 0 }
  
  posts.forEach(post => {
    sentiments[post.sentiment] = (sentiments[post.sentiment] || 0) + 1
  })
  
  return Object.entries(sentiments).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }))
}

/**
 * Analyze request types distribution
 */
export const analyzeRequestTypes = (posts) => {
  const types = {}
  
  posts.forEach(post => {
    const type = post.requestType || 'unknown'
    types[type] = (types[type] || 0) + 1
  })
  
  return Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value
    }))
}

/**
 * Analyze topics/themes
 */
export const analyzeTopics = (posts) => {
  const topics = {}
  
  posts.forEach(post => {
    const topic = post.topic || 'Other'
    topics[topic] = (topics[topic] || 0) + 1
  })
  
  return Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      percentage: 0 // Will be calculated later
    }))
    .map((item, _, arr) => ({
      ...item,
      percentage: ((item.value / posts.length) * 100).toFixed(1)
    }))
}

/**
 * Analyze post engagement
 */
export const analyzeEngagement = (posts) => {
  if (posts.length === 0) return { avgLikes: 0, avgReplies: 0, totalPosts: 0 }
  
  const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0)
  const totalReplies = posts.reduce((sum, post) => sum + (post.replies || 0), 0)
  
  return {
    avgLikes: (totalLikes / posts.length).toFixed(1),
    avgReplies: (totalReplies / posts.length).toFixed(1),
    totalPosts: posts.length,
    totalLikes,
    totalReplies
  }
}

/**
 * Analyze trends over time
 */
export const analyzeTrends = (posts) => {
  const trends = {}
  
  posts.forEach(post => {
    const date = new Date(post.date)
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!trends[monthYear]) {
      trends[monthYear] = { date: monthYear, posts: 0, positive: 0, negative: 0, neutral: 0 }
    }
    
    trends[monthYear].posts++
    trends[monthYear][post.sentiment]++
  })
  
  return Object.values(trends).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Find common issues/demands
 */
export const findCommonIssues = (posts) => {
  const issues = {}
  
  posts.forEach(post => {
    if (post.requestType === 'bug_report' || post.requestType === 'complaint' || post.requestType === 'feature_request') {
      const key = post.topic
      if (!issues[key]) {
        issues[key] = {
          topic: key,
          count: 0,
          types: {},
          avgLikes: 0,
          totalLikes: 0
        }
      }
      
      issues[key].count++
      issues[key].types[post.requestType] = (issues[key].types[post.requestType] || 0) + 1
      issues[key].totalLikes += post.likes || 0
    }
  })
  
  return Object.values(issues)
    .map(issue => ({
      ...issue,
      avgLikes: (issue.totalLikes / issue.count).toFixed(1),
      primaryType: Object.entries(issue.types).sort((a, b) => b[1] - a[1])[0][0]
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

/**
 * Generate insights summary
 */
export const generateInsights = (posts) => {
  const insights = []
  
  const sentiment = analyzeSentiment(posts)
  const negativeCount = sentiment.find(s => s.name === 'Negative')?.value || 0
  const positiveCount = sentiment.find(s => s.name === 'Positive')?.value || 0
  
  if (negativeCount > positiveCount) {
    insights.push({
      type: 'warning',
      message: `${negativeCount} negative posts detected. Consider addressing user concerns.`
    })
  } else {
    insights.push({
      type: 'success',
      message: `Positive sentiment is strong with ${positiveCount} positive posts.`
    })
  }
  
  const topics = analyzeTopics(posts)
  if (topics.length > 0) {
    const topTopic = topics[0]
    insights.push({
      type: 'info',
      message: `"${topTopic.name}" is the most discussed topic (${topTopic.percentage}% of posts).`
    })
  }
  
  const issues = findCommonIssues(posts)
  if (issues.length > 0) {
    insights.push({
      type: 'warning',
      message: `Top issue: "${issues[0].topic}" with ${issues[0].count} reports.`
    })
  }
  
  return insights
}

export default {
  extractKeywords,
  calculateWordFrequency,
  analyzeSentiment,
  analyzeRequestTypes,
  analyzeTopics,
  analyzeEngagement,
  analyzeTrends,
  findCommonIssues,
  generateInsights
}

