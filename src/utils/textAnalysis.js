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
    // Skip empty or very short topics
    if (topic && topic.trim().length > 0 && topic !== 'Other') {
      topics[topic] = (topics[topic] || 0) + 1
    }
  })
  
  return Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name: name.length > 60 ? name.substring(0, 60) + '...' : name, // Truncate very long names
      value: Number(value), // Ensure value is a number
      percentage: 0 // Will be calculated later
    }))
    .map((item, _, arr) => ({
      ...item,
      percentage: ((item.value / posts.length) * 100).toFixed(1)
    }))
    .filter(item => item.value > 0) // Only include topics with at least 1 mention
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

/**
 * Calculate Active Users by period (weekly, monthly, quarterly)
 * Returns an array of period data with unique user counts
 */
export const calculateActiveUsersByPeriod = (posts, periodType = 'monthly') => {
  if (!posts || posts.length === 0) return []
  
  // Group posts by period and track unique users
  const periodData = {}
  let validUserCount = 0
  
  const getPeriodKey = (date, type) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    
    if (type === 'weekly') {
      // Get week number (ISO week: week starts on Monday)
      const startOfYear = new Date(year, 0, 1)
      const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000))
      const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7)
      // Format: YYYY-WW
      return `${year}-W${String(weekNumber).padStart(2, '0')}`
    } else if (type === 'quarterly') {
      // Get quarter (1-4)
      const quarter = Math.floor(month / 3) + (month % 3 === 0 ? 0 : 1)
      // Format: YYYY-Q1, YYYY-Q2, etc.
      return `${year}-Q${quarter}`
    } else {
      // Monthly (default)
      // Format: YYYY-MM
      return `${year}-${String(month).padStart(2, '0')}`
    }
  }
  
  const formatPeriodForDisplay = (periodKey, type) => {
    if (type === 'weekly') {
      // Format: "Week 45, 2025"
      const [year, week] = periodKey.split('-W')
      return `W${week} ${year}`
    } else if (type === 'quarterly') {
      // Format: "Q1 2025"
      const [year, quarter] = periodKey.split('-Q')
      return `Q${quarter} ${year}`
    } else {
      // Format: "Jan 2025"
      return formatMonthForDisplay(periodKey)
    }
  }
  
  posts.forEach(post => {
    if (!post || !post.date) return
    
    try {
      const date = new Date(post.date)
      if (isNaN(date.getTime())) return
      
      const periodKey = getPeriodKey(date, periodType)
      
      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          period: periodKey,
          users: new Set(),
          totalActivities: 0
        }
      }
      
      // For active users calculation, we want to count ALL unique visitors
      // Use userId if available, otherwise fall back to username/author
      // For view events without user info, use location-based identifier
      const userIdentifier = post.userId || post.author || null
      const eventType = post.eventType || ''
      
      let identifier = null
      
      if (userIdentifier && 
          userIdentifier !== '-1' && 
          userIdentifier !== 'ehemaliger Nutzer' && 
          userIdentifier !== 'unknown' &&
          String(userIdentifier).trim() !== '') {
        // Use userId/author if available
        identifier = String(userIdentifier).trim()
      } else if (post.location) {
        // For anonymous users, use location + event type as identifier
        // This helps count unique anonymous visitors by location
        identifier = `anonymous_${post.location}_${eventType}`
      }
      
      if (identifier) {
        periodData[periodKey].users.add(identifier)
        validUserCount++
      }
      
      periodData[periodKey].totalActivities++
    } catch (error) {
      console.warn('Error processing post for Active Users:', error, post)
    }
  })
  
  // Convert to array format for charts
  const result = Object.values(periodData)
    .map(data => ({
      period: data.period,
      activeUsers: data.users.size,
      totalActivities: data.totalActivities,
      // Format period for display
      displayPeriod: formatPeriodForDisplay(data.period, periodType)
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
  
  const periodName = periodType === 'weekly' ? 'weeks' : periodType === 'quarterly' ? 'quarters' : 'months'
  console.log(`📊 Active Users Calculation (${periodType}): ${result.length} ${periodName}, ${validUserCount} valid user activities`)
  return result
}

/**
 * Calculate Monthly Active Users (MAU) - kept for backward compatibility
 * Returns an array of monthly data with unique user counts
 */
export const calculateMonthlyActiveUsers = (posts) => {
  return calculateActiveUsersByPeriod(posts, 'monthly')
}

/**
 * Calculate New vs Returning members
 * Compares users in the most recent month in dataset vs all previous months in dataset
 */
export const calculateNewVsReturningMembers = (posts, comparisonMonths = 1) => {
  if (!posts || posts.length === 0) {
    return {
      currentMonth: { new: 0, returning: 0, total: 0 },
      previousMonth: { new: 0, returning: 0, total: 0 },
      trend: { new: 0, returning: 0 },
      chartData: [
        { name: 'New Members', value: 0, color: '#00A0E3' },
        { name: 'Returning Members', value: 0, color: '#FFD500' }
      ],
      hasMultipleMonths: false,
      dataQuality: 'insufficient'
    }
  }
  
  // Group all posts by month to find what months we actually have data for
  const monthlyData = {}
  const allUsers = new Set()
  
  posts.forEach(post => {
    if (!post || !post.date) return
    
    try {
      const date = new Date(post.date)
      if (isNaN(date.getTime())) return
      
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      const userIdentifier = post.userId || post.author || null
      
      // Skip anonymous/deleted users and empty identifiers
      if (!userIdentifier || 
          userIdentifier === '-1' || 
          userIdentifier === 'ehemaliger Nutzer' || 
          userIdentifier === 'unknown' ||
          String(userIdentifier).trim() === '') {
        return
      }
      
      const cleanIdentifier = String(userIdentifier).trim()
      allUsers.add(cleanIdentifier)
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = new Set()
      }
      monthlyData[monthYear].add(cleanIdentifier)
    } catch (error) {
      console.warn('Error processing post for New vs Returning:', error, post)
    }
  })
  
  // Get all months sorted (most recent first)
  const months = Object.keys(monthlyData).sort((a, b) => b.localeCompare(a))
  
  // If we only have data from one month, we can't determine returning users
  if (months.length === 0) {
    return {
      currentMonth: { new: 0, returning: 0, total: 0 },
      previousMonth: { new: 0, returning: 0, total: 0 },
      trend: { new: 0, returning: 0 },
      chartData: [
        { name: 'New Members', value: 0, color: '#00A0E3' },
        { name: 'Returning Members', value: 0, color: '#FFD500' }
      ],
      hasMultipleMonths: false,
      dataQuality: 'insufficient'
    }
  }
  
  const mostRecentMonth = months[0]
  const currentMonthUsers = monthlyData[mostRecentMonth]
  
  // Collect all users from previous months (all months before the most recent)
  const allPreviousUsers = new Set()
  for (let i = 1; i < months.length; i++) {
    monthlyData[months[i]].forEach(user => allPreviousUsers.add(user))
  }
  
  // Calculate new vs returning for the most recent month
  const newUsers = new Set()
  const returningUsers = new Set()
  
  currentMonthUsers.forEach(user => {
    if (allPreviousUsers.has(user)) {
      returningUsers.add(user)
    } else {
      newUsers.add(user)
    }
  })
  
  // Get previous month stats (second most recent month if available)
  const previousMonth = months.length > 1 ? months[1] : null
  const previousMonthUsers = previousMonth ? monthlyData[previousMonth] : new Set()
  
  const result = {
    currentMonth: {
      new: newUsers.size,
      returning: returningUsers.size,
      total: currentMonthUsers.size,
      month: mostRecentMonth
    },
    previousMonth: {
      new: 0, // Would need even earlier data to calculate
      returning: 0,
      total: previousMonthUsers.size,
      month: previousMonth
    },
    trend: {
      new: newUsers.size,
      returning: returningUsers.size
    },
    chartData: [
      { name: 'New Members', value: newUsers.size, color: '#00A0E3' },
      { name: 'Returning Members', value: returningUsers.size, color: '#FFD500' }
    ],
    hasMultipleMonths: months.length > 1,
    dataQuality: months.length > 1 ? 'good' : 'limited',
    availableMonths: months.length,
    monthsInData: months
  }
  
  console.log(`📊 New vs Returning Analysis:`)
  console.log(`   Available months in data: ${months.length} (${months.join(', ')})`)
  console.log(`   Most recent month: ${mostRecentMonth} (${currentMonthUsers.size} users)`)
  console.log(`   Previous months users: ${allPreviousUsers.size} unique users`)
  console.log(`   Result: ${result.currentMonth.total} total (${result.currentMonth.new} new, ${result.currentMonth.returning} returning)`)
  console.log(`   Data quality: ${result.dataQuality} (${result.hasMultipleMonths ? 'can determine returning users' : 'only one month - all appear as new'})`)
  
  return result
}

/**
 * Calculate Unique Visitors
 * Tracks unique users and optionally by location
 */
export const calculateUniqueVisitors = (posts) => {
  if (!posts || posts.length === 0) {
    return {
      total: 0,
      byLocation: {},
      byCountry: {},
      topLocations: [],
      topCountries: []
    }
  }
  
  const uniqueUsers = new Set()
  const locationMap = new Map() // location -> Set of users
  const countryMap = new Map() // country -> Set of users
  const userLocations = new Map() // user -> location
  
  posts.forEach(post => {
    if (!post || !post.date) return
    
    // For unique visitors, we want to count ALL users, including anonymous ones
    // But we'll track them differently - use a combination of identifiers
    const userIdentifier = post.userId || post.author || null
    const eventType = post.eventType || ''
    
    // For view events, we might not have userId/author, so use location + IP-like identifier
    // For other events, use userId/author
    let identifier = null
    
    if (userIdentifier && 
        userIdentifier !== '-1' && 
        userIdentifier !== 'ehemaliger Nutzer' && 
        userIdentifier !== 'unknown' &&
        String(userIdentifier).trim() !== '') {
      // Use userId/author if available
      identifier = String(userIdentifier).trim()
    } else if (post.location) {
      // For anonymous users, use location + event type as identifier
      // This helps count unique anonymous visitors by location
      identifier = `anonymous_${post.location}_${eventType}`
    } else {
      // Skip if we have no way to identify this visitor
      return
    }
    
    uniqueUsers.add(identifier)
    
    // Track by location if available
    if (post.location) {
      const location = post.location
      
      if (!locationMap.has(location)) {
        locationMap.set(location, new Set())
      }
      locationMap.get(location).add(identifier)
      
      // Extract country from location (format: "City, Country")
      const country = location.split(',').pop()?.trim() || 'Unknown'
      if (!countryMap.has(country)) {
        countryMap.set(country, new Set())
      }
      countryMap.get(country).add(identifier)
      
      // Store user's primary location (first seen)
      if (!userLocations.has(identifier)) {
        userLocations.set(identifier, location)
      }
    }
  })
  
  // Convert to arrays for display
  const topLocations = Array.from(locationMap.entries())
    .map(([location, users]) => ({
      location,
      visitors: users.size,
      percentage: ((users.size / uniqueUsers.size) * 100).toFixed(1)
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10)
  
  const topCountries = Array.from(countryMap.entries())
    .map(([country, users]) => ({
      country,
      visitors: users.size,
      percentage: ((users.size / uniqueUsers.size) * 100).toFixed(1)
    }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 10)
  
  return {
    total: uniqueUsers.size,
    byLocation: Object.fromEntries(
      Array.from(locationMap.entries()).map(([loc, users]) => [loc, users.size])
    ),
    byCountry: Object.fromEntries(
      Array.from(countryMap.entries()).map(([country, users]) => [country, users.size])
    ),
    topLocations,
    topCountries,
    locationsWithData: locationMap.size,
    countriesWithData: countryMap.size
  }
}

/**
 * Format month string for display
 */
const formatMonthForDisplay = (monthYear) => {
  const [year, month] = monthYear.split('-')
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${monthNames[parseInt(month) - 1]} ${year}`
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
  generateInsights,
  calculateMonthlyActiveUsers,
  calculateActiveUsersByPeriod,
  calculateNewVsReturningMembers,
  calculateUniqueVisitors
}

