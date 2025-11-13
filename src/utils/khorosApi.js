/**
 * Khoros API Integration for Comdirect Community
 * 
 * Documentation: https://developer.khoros.com/khoroscommunitydevdocs/reference/bulk-data-api-v2
 * 
 * Using Khoros Bulk Data API v2 for fetching community data
 */

// Configuration - These should be stored in environment variables
const KHOROS_API_CONFIG = {
  communityId: import.meta.env.VITE_KHOROS_COMMUNITY_ID || '',
  clientId: import.meta.env.VITE_KHOROS_CLIENT_ID || '',
  accessToken: import.meta.env.VITE_KHOROS_ACCESS_TOKEN || '',
  baseUrl: import.meta.env.VITE_KHOROS_API_URL || 'https://eu.api.lithium.com/lsi-data/v1/data/export/community',
  proxyUrl: import.meta.env.VITE_KHOROS_PROXY_URL || '', // Use proxy to bypass CORS
}

/**
 * Check if API is properly configured
 */
export const isApiConfigured = () => {
  return !!(KHOROS_API_CONFIG.communityId && 
           KHOROS_API_CONFIG.accessToken)
}

/**
 * Fetch posts from Khoros LSI Data Export API
 * 
 * Documentation: https://api.lithium.com/lsi-data/
 * 
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of posts
 */
export const fetchPostsFromKhorosAPI = async (options = {}) => {
  const {
    startDate,
    endDate,
    limit = 100,
    category = null,
    sentiment = null,
    pageToken = null
  } = options

  if (!isApiConfigured()) {
    throw new Error('Khoros API is not configured. Please check your environment variables.')
  }

  try {
    console.log('🔌 Fetching data from Khoros LSI Data Export API...')
    
    // Calculate date range (default to last 30 days if not specified)
    const endDateTime = endDate ? new Date(endDate) : new Date()
    const startDateTime = startDate ? new Date(startDate) : new Date(endDateTime.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Format dates for LSI API (YYYYMMDD format)
    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}${month}${day}`
    }
    
    const fromDate = formatDate(startDateTime)
    const toDate = formatDate(endDateTime)

    // Use proxy server if configured (to bypass CORS), otherwise direct API call
    const useProxy = !!KHOROS_API_CONFIG.proxyUrl
    let url, headers
    
    if (useProxy) {
      // Use proxy server - no authentication needed (proxy handles it)
      url = `${KHOROS_API_CONFIG.proxyUrl}?fromDate=${fromDate}&toDate=${toDate}`
      headers = {
        'Accept': 'application/json',
      }
      console.log('🔄 Using proxy server to bypass CORS')
    } else {
      // Direct API call (will likely fail due to CORS in browser)
      url = `${KHOROS_API_CONFIG.baseUrl}/${KHOROS_API_CONFIG.communityId}?fromDate=${fromDate}&toDate=${toDate}`
      headers = {
        'client-id': KHOROS_API_CONFIG.clientId,
        'Authorization': `Basic ${btoa(`${KHOROS_API_CONFIG.accessToken}:`)}`,
        'Accept': 'application/json',
      }
      console.log('⚠️ Direct API call (may fail due to CORS)')
    }
    
    console.log('📡 API Request URL:', url)
    console.log('📅 Date Range:', fromDate, 'to', toDate)

    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Khoros API Error Response:', errorText)
      throw new Error(`Khoros API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('✅ Khoros API Response received')
    console.log('📦 Response structure:', Object.keys(data))
    console.log('📦 Full response (first 500 chars):', JSON.stringify(data).substring(0, 500))

    // Transform Khoros data to our format
    const posts = transformKhorosData(data, { limit, category, sentiment, startDate: fromDate, endDate: toDate })
    
    console.log(`✅ Successfully fetched ${posts.length} posts from Khoros API`)
    
    if (posts.length > 0) {
      console.log('📝 Sample post:', posts[0])
    }
    
    return posts

  } catch (error) {
    console.error('❌ Error fetching from Khoros API:', error)
    throw error
  }
}

/**
 * Transform Khoros LSI Data Export API response to our application format
 */
const transformKhorosData = (khorosResponse, options = {}) => {
  const { limit = 100, category = null, startDate, endDate } = options
  
  // LSI Data Export API returns data in various formats
  // The API response shows: { "records": [...] }
  let messages = []
  
  if (Array.isArray(khorosResponse)) {
    messages = khorosResponse
  } else if (khorosResponse.records) {
    // LSI Data Export API format: { records: [...] }
    messages = khorosResponse.records
    console.log('✅ Found records array with', messages.length, 'items')
  } else if (khorosResponse.data?.messages) {
    // LSI format: { data: { messages: [...] } }
    messages = khorosResponse.data.messages
  } else if (khorosResponse.data?.items) {
    // Standard v2 API format: { data: { items: [...] } }
    messages = khorosResponse.data.items
  } else if (khorosResponse.data) {
    messages = Array.isArray(khorosResponse.data) ? khorosResponse.data : [khorosResponse.data]
  } else if (khorosResponse.messages) {
    // Direct messages array
    messages = khorosResponse.messages
  } else if (khorosResponse.items) {
    // Direct items array
    messages = khorosResponse.items
  } else if (khorosResponse.conversations) {
    // LSI might return conversations
    messages = khorosResponse.conversations
  }
  
  // If still no messages, log the response structure for debugging
  if (messages.length === 0) {
    console.log('⚠️ No messages found. Response keys:', Object.keys(khorosResponse))
    console.log('⚠️ Response sample:', JSON.stringify(khorosResponse).substring(0, 200))
  }

  console.log(`📊 Processing ${messages.length} messages from API response`)
  
  // Debug: Show structure of first message to understand API format
  if (messages.length > 0) {
    console.log('🔬 First message structure:')
    console.log('   Available keys:', Object.keys(messages[0]))
    console.log('   Sample values:', {
      id: messages[0].id,
      subject: messages[0].subject,
      body: messages[0].body,
      'user.login': messages[0]['user.login'],
      'user.displayName': messages[0]['user.displayName'],
      author: messages[0].author,
      title: messages[0].title,
      'message.subject': messages[0]['message.subject']
    })
    console.log('   Full first record (truncated):', JSON.stringify(messages[0]).substring(0, 500))
  }

  const transformedPosts = messages
    .filter(msg => {
      // Filter out if it's not a valid message
      if (!msg || typeof msg !== 'object') return false
      
      // Filter out posts without a proper topic title
      const topicTitle = msg.topicTitle || msg.subject || msg.title || ''
      
      // Filter out empty titles
      if (!topicTitle || topicTitle.trim() === '') {
        return false
      }
      
      // Filter out "No subject" posts
      if (topicTitle === 'No subject') {
        return false
      }
      
      // Filter out CSV header values (in case header wasn't skipped properly)
      const headerValues = ['conversation.title', 'user.login', 'conversation.uid', 'board.title', 'board.uid']
      if (headerValues.includes(topicTitle)) {
        return false
      }
      
      // Apply date filtering if dates are provided
      if (startDate || endDate) {
        const msgDate = new Date(msg.createdAt || msg.created_at || msg.post_time || msg.timestamp)
        if (startDate && msgDate < new Date(startDate)) return false
        if (endDate && msgDate > new Date(endDate)) return false
      }
      
      return true
    })
    .slice(0, limit) // Apply limit
    .map(msg => {
      // LSI Data Export API returns CSV data that our proxy parses
      // The proxy extracts: topicTitle, boardTitle, username, timestamp, etc.
      
      // Extract title from CSV-parsed fields
      const title = msg.topicTitle || 
                    msg.subject || 
                    msg.title || 
                    'No subject'
      
      // Extract body/content - CSV doesn't include message body
      // This is activity/analytics data, not message content
      const body = msg.body || 
                   msg.content || 
                   ''
      
      // Extract author from CSV-parsed username field
      const author = msg.username ||
                     msg.author || 
                     msg.displayName ||
                     msg.login ||
                     'Unknown User'
      
      // Extract creation date from CSV timestamp (epoch milliseconds)
      let createdAt = new Date().toISOString() // Default to now
      
      if (msg.timestamp) {
        try {
          const timestamp = parseInt(msg.timestamp)
          if (!isNaN(timestamp) && timestamp > 0) {
            const date = new Date(timestamp)
            if (!isNaN(date.getTime())) {
              createdAt = date.toISOString()
            }
          }
        } catch (e) {
          console.warn('Failed to parse timestamp:', msg.timestamp, e)
        }
      }
      
      // Extract ID from CSV topicId
      const postId = msg.topicId || 
                     msg.id || 
                     `msg_${Math.random().toString(36).substr(2, 9)}`
      
      // Extract engagement metrics (not available in CSV activity data)
      const likes = msg.likes || 0
      const replies = msg.replies || 0
      const views = msg.views || 0
      
      // Build proper URL using topicId and boardId
      let postUrl = msg.url || null
      
      // If we have topicId, construct the URL
      if (msg.topicId && !postUrl) {
        postUrl = `https://community.comdirect.de/t5/${msg.boardId || 'forum'}/td-p/${msg.topicId}`
      }
      
      // If url field exists but doesn't have protocol, construct it
      if (postUrl && !postUrl.startsWith('http')) {
        postUrl = `https://community.comdirect.de${postUrl}`
      }
      
      if (!postUrl && postId) {
        // Try to construct URL from available data
        const boardId = msg.boardId || msg['board.id'] || msg.board?.id
        if (boardId) {
          postUrl = `https://community.comdirect.de/t5/${boardId}/m-p/${postId}`
        } else {
          postUrl = `https://community.comdirect.de/t5/m-p/${postId}`
        }
      }
      
      console.log('🔍 Parsing message:', {
        id: postId,
        author,
        title: title.substring(0, 50),
        hasBody: !!body,
        url: postUrl,
        boardTitle: msg.boardTitle,
        eventType: msg.eventType
      })
      
      // Extract board/category name from CSV data
      const categoryName = msg.boardTitle || msg.board?.title || msg['board.title'] || 'Uncategorized'
      
      return {
        id: postId,
        author: author,
        topic: title,
        content: stripHtml(body),
        category: categoryName, // Add category from boardTitle
        contentLanguage: detectLanguage(body, title),
        sentiment: analyzeSentimentFromText(body),
        requestType: categorizePostType(body, title),
        isPlatformRelated: checkIfPlatformRelated(msg.boardId || msg.board?.id, title, body),
        likes: likes,
        replies: replies,
        views: views,
        date: createdAt,
        url: postUrl,
        tags: msg.tags || [],
        eventType: msg.eventType, // Include event type for analytics
        location: msg.city && msg.country ? `${msg.city}, ${msg.country}` : null // Add location data
      }
    })

  console.log(`✅ Transformed ${transformedPosts.length} posts`)
  return transformedPosts
}

/**
 * Strip HTML tags from content
 */
const stripHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Analyze sentiment from text (placeholder - you'd integrate a real service)
 */
const analyzeSentimentFromText = (text) => {
  // TODO: Integrate with sentiment analysis service
  // For now, return random values like the mock data
  const sentiments = ['positive', 'negative', 'neutral']
  return sentiments[Math.floor(Math.random() * sentiments.length)]
}

/**
 * Categorize post type based on content
 */
const categorizePostType = (body, subject) => {
  const text = `${subject} ${body}`.toLowerCase()
  
  if (text.includes('feature') || text.includes('would like')) return 'feature_request'
  if (text.includes('bug') || text.includes('error') || text.includes('problem')) return 'bug_report'
  if (text.includes('?') || text.includes('how to') || text.includes('question')) return 'question'
  if (text.includes('terrible') || text.includes('disappointed') || text.includes('frustrated')) return 'complaint'
  if (text.includes('great') || text.includes('excellent') || text.includes('love')) return 'praise'
  
  return 'feedback'
}

/**
 * Detect language of content (German vs English)
 */
const detectLanguage = (body, title) => {
  const text = `${title} ${body}`.toLowerCase()
  
  // German-specific words and patterns
  const germanKeywords = [
    'der', 'die', 'das', 'und', 'ist', 'nicht', 'ein', 'eine',
    'ich', 'mir', 'können', 'würde', 'sollte', 'haben', 'sein',
    'über', 'für', 'mit', 'bei', 'nach', 'von', 'zu', 'auf'
  ]
  
  // Count German keywords
  const germanCount = germanKeywords.filter(word => 
    text.includes(` ${word} `) || text.startsWith(`${word} `) || text.endsWith(` ${word}`)
  ).length
  
  // If we find 3 or more German keywords, it's likely German
  return germanCount >= 3 ? 'de' : 'en'
}

/**
 * Check if post is platform-related
 */
const checkIfPlatformRelated = (boardId, subject, body = '') => {
  // Platform-related board IDs or keywords
  const platformBoards = ['community-feedback', 'platform-discussion', 'meta', 'announcement']
  const platformKeywords = [
    'community', 'forum', 'platform', 'profile', 'notification',
    'website', 'app', 'mobile', 'login', 'interface', 'feedback',
    'phottan', 'wartungsarbeiten', 'ankündigung', 'barrierefrei'
  ]
  
  if (boardId && platformBoards.includes(boardId)) return true
  
  const textLower = `${subject || ''} ${body || ''}`.toLowerCase()
  return platformKeywords.some(keyword => textLower.includes(keyword))
}

/**
 * Fetch available boards/categories
 */
export const fetchKhorosBoards = async () => {
  try {
    const url = `${KHOROS_API_CONFIG.baseUrl}/search?q=SELECT id, title FROM boards`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KHOROS_API_CONFIG.apiKey}`,
      }
    })

    if (!response.ok) {
      throw new Error(`Khoros API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data?.items || []

  } catch (error) {
    console.error('Error fetching Khoros boards:', error)
    return []
  }
}

/**
 * Get user profile data
 */
export const fetchKhorosUserProfile = async (userId) => {
  try {
    const url = `${KHOROS_API_CONFIG.baseUrl}/search?q=SELECT * FROM users WHERE id = '${userId}'`
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KHOROS_API_CONFIG.apiKey}`,
      }
    })

    const data = await response.json()
    return data.data?.items?.[0] || null

  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

export default {
  fetchPostsFromKhorosAPI,
  fetchKhorosBoards,
  fetchKhorosUserProfile
}

