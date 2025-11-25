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

// Include all event types to capture all unique visitors (not just posters)
// Key event types: messages.publish (posts), view (page views), visits.visit-summary (visits)
// Empty array means include ALL event types
const ALLOWED_EVENT_TYPES = [] // Include all event types for accurate visitor counts

const parseTimestampValue = (value) => {
  if (value === undefined || value === null) return null

  if (typeof value === 'number') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return null

    const numeric = Number(trimmed)
    if (!isNaN(numeric) && numeric > 0) {
      return parseTimestampValue(numeric)
    }

    const date = new Date(trimmed)
    return isNaN(date.getTime()) ? null : date
  }

  return null
}

const parseDateFilterValue = (value, endOfDay = false) => {
  if (!value) return null

  if (/^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4))
    const month = Number(value.slice(4, 6)) - 1
    const day = Number(value.slice(6, 8))
    const date = new Date(Date.UTC(year, month, day))
    if (isNaN(date.getTime())) return null
    if (endOfDay) {
      date.setUTCHours(23, 59, 59, 999)
    }
    return date
  }

  const parsed = new Date(value)
  if (isNaN(parsed.getTime())) return null
  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999)
  }
  return parsed
}

const normalizeForSlug = (text = '') => {
  if (!text) return ''
  let normalized = text
  if (typeof normalized.normalize === 'function') {
    normalized = normalized.normalize('NFD')
  }

  return normalized
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/gi, 'ss')
    .replace(/ä/gi, 'ae')
    .replace(/ö/gi, 'oe')
    .replace(/ü/gi, 'ue')
}

const slugify = (text = '') => {
  const safe = normalizeForSlug(text)
    .replace(/&/g, ' und ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  return safe
}

const buildKhorosPostUrl = (msg = {}) => {
  const base = 'https://community.comdirect.de/t5'
  const boardSlug = slugify(msg.boardTitle || msg.board?.title || '')
  const topicSlug = slugify(msg.topicTitle || msg.messageSubject || msg.subject || msg.title || '')
  const messageId = msg.messageId && String(msg.messageId).trim() !== '' ? msg.messageId : null
  const topicId = msg.topicId && String(msg.topicId).trim() !== '' ? msg.topicId : null
  const isTopic = String(msg.messageIsTopic || '').toLowerCase() === 'true'

  if (boardSlug && topicSlug) {
    if (isTopic && topicId) {
      return `${base}/${boardSlug}/${topicSlug}/td-p/${topicId}`
    }
    if (messageId) {
      return `${base}/${boardSlug}/${topicSlug}/m-p/${messageId}`
    }
  }

  if (messageId) {
    return `${base}/m-p/${messageId}`
  }

  if (topicId) {
    return `${base}/m-p/${topicId}`
  }

  return null
}

const stripHtml = (html) => {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

const getProxyBaseUrl = () => {
  if (!KHOROS_API_CONFIG.proxyUrl) return null
  try {
    const proxyUrl = KHOROS_API_CONFIG.proxyUrl.split('?')[0]
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const url = new URL(proxyUrl, origin)
    let pathname = url.pathname.replace(/\/+$/, '')
    if (pathname.endsWith('/posts')) {
      pathname = pathname.slice(0, -('/posts'.length))
    }
    return `${url.origin}${pathname}`
  } catch (error) {
    console.warn('Invalid proxy URL configuration:', KHOROS_API_CONFIG.proxyUrl, error)
    return null
  }
}

const getProxyEndpoint = (path = '') => {
  const base = getProxyBaseUrl()
  if (!base) return null
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

const fetchMessageDetails = async (messageIds = []) => {
  if (!Array.isArray(messageIds) || messageIds.length === 0) return {}
  const endpoint = getProxyEndpoint('/messages/details')
  if (!endpoint) {
    console.warn('No proxy endpoint configured for message hydration.')
    return {}
  }

  try {
    const uniqueIds = Array.from(new Set(messageIds.filter(Boolean)))
    if (uniqueIds.length === 0) return {}

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messageIds: uniqueIds })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Message details proxy error: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    const detailsMap = {}
    if (Array.isArray(data?.items)) {
      data.items.forEach(item => {
        if (item?.id) {
          detailsMap[item.id] = item
        }
      })
    }
    return detailsMap
  } catch (error) {
    console.error('Failed to fetch message details:', error)
    return {}
  }
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
    let posts = transformKhorosData(data, { limit, category, sentiment, startDate: fromDate, endDate: toDate })

    posts = await hydratePostsWithContent(posts)
    
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
  const timestampCache = new WeakMap()
  const allowedEventTypesLower = ALLOWED_EVENT_TYPES.map(type => type.toLowerCase())
  const filterStartDate = parseDateFilterValue(startDate)
  const filterEndDate = parseDateFilterValue(endDate, true)

  const getMessageDate = (msg) => {
    if (timestampCache.has(msg)) {
      return timestampCache.get(msg)
    }

    const parsed = parseTimestampValue(
      msg.timestamp ||
      msg.createdAt ||
      msg.created_at ||
      msg.post_time
    )

    timestampCache.set(msg, parsed)
    return parsed
  }
  
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

      const eventType = String(msg.eventType || '').toLowerCase()
      if (allowedEventTypesLower.length > 0 && !allowedEventTypesLower.includes(eventType)) {
        return false
      }
      
      // For visitor analytics, we need ALL events (including views without topicId)
      // View events don't require topicTitle or topicId - they're still valid visitors
      const isViewEvent = eventType === 'view' || eventType === 'visits.visit-summary' || eventType === 'rss.feed-request'
      
      // For non-view events (posts), we require topic title
      if (!isViewEvent) {
        const topicTitle = msg.topicTitle || msg.subject || msg.title || ''
        
        // Filter out empty titles (only for non-view events)
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
        
        // For post events, we require topicId
        if (!msg.topicId || String(msg.topicId).trim() === '') {
          return false
        }
      }

      const msgDate = getMessageDate(msg)
      if (!msgDate) {
        return false
      }

      if (filterStartDate && msgDate < filterStartDate) return false
      if (filterEndDate && msgDate > filterEndDate) return false
      
      return true
    })
    .sort((a, b) => {
      const dateA = getMessageDate(a)
      const dateB = getMessageDate(b)

      if (!dateA && !dateB) return 0
      if (!dateA) return 1
      if (!dateB) return -1

      return dateB.getTime() - dateA.getTime()
    })
    // No limit - fetch all data for accurate MAU calculation
    .map(msg => {
      // LSI Data Export API returns CSV data that our proxy parses
      // The proxy extracts: topicTitle, boardTitle, username, timestamp, etc.
      
      // Extract title from CSV-parsed fields
      // For view events, use event type as title if no topic title available
      const eventType = String(msg.eventType || '').toLowerCase()
      const isViewEvent = eventType === 'view' || eventType === 'visits.visit-summary' || eventType === 'rss.feed-request'
      
      const title = msg.topicTitle || 
                    msg.subject || 
                    msg.title || 
                    (isViewEvent ? `View Event (${eventType})` : 'No subject')
      
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
      const parsedTimestamp = getMessageDate(msg)
      const createdAt = parsedTimestamp ? parsedTimestamp.toISOString() : new Date().toISOString()
      
      // Extract ID from CSV topicId
      // For view events without topicId, use timestamp + event type as ID
      const postId = msg.messageId ||
                     msg.topicId || 
                     msg.id || 
                     (isViewEvent && msg.timestamp ? `view_${msg.timestamp}_${eventType}` : `msg_${Math.random().toString(36).substr(2, 9)}`)
      
      // Extract engagement metrics (not available in CSV activity data)
      const likes = msg.likes || 0
      const replies = msg.replies || 0
      const views = msg.views || 0
      
      let postUrl = msg.url || buildKhorosPostUrl(msg)
      
      if (postUrl && !postUrl.startsWith('http')) {
        postUrl = `https://community.comdirect.de${postUrl}`
      }
      
      // Extract board/category name from CSV data
      const categoryName = msg.boardTitle || msg.board?.title || msg['board.title'] || 'Uncategorized'
      
      // Extract userId from CSV data (field 25 from proxy server)
      const userId = msg.userId || msg['user.uid'] || null
      
      return {
        id: postId,
        author: author,
        userId: userId, // Add userId for user analytics
        topic: title,
        content: stripHtml(body),
        category: categoryName, // Add category from boardTitle
        contentLanguage: detectLanguage(body, title),
        // Use topic title as fallback for sentiment analysis since CSV doesn't include message body
        sentiment: analyzeSentimentFromText(body || '', title || ''),
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
 * Analyze sentiment from text (placeholder - you'd integrate a real service)
 */
const POSITIVE_KEYWORDS = [
  'gut', 'toll', 'danke', 'super', 'hilfreich', 'zufrieden', 'perfekt', 'lieb', 'mag',
  'love', 'great', 'excellent', 'awesome', 'wonderful', 'funktioniert', 'gelöst', 'thanks',
  'top', 'empfehlen', 'happy', 'glücklich', 'grandios', 'stark'
]

const NEGATIVE_KEYWORDS = [
  'problem', 'fehler', 'bug', 'schlecht', 'ärgerlich', 'enttäuscht', 'frustriert',
  'funktioniert nicht', 'kaputt', 'broken', 'error', 'issue', 'beschwerde', 'beschweren',
  'kritik', 'hilfe', 'please fix', 'dringend', 'katastrophe', 'nervt', 'fail', 'failt',
  'nicht möglich', 'unmöglich'
]

const countKeywordMatches = (text, keywords) => {
  return keywords.reduce((score, keyword) => {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi')
    const matches = text.match(regex)
    return score + (matches ? matches.length : 0)
  }, 0)
}

const analyzeSentimentFromText = (text = '', fallback = '') => {
  const combined = `${fallback || ''} ${text || ''}`.toLowerCase()
  const normalized = combined
    .replace(/[^\wäöüß ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return 'neutral'

  let positiveScore = countKeywordMatches(normalized, POSITIVE_KEYWORDS)
  let negativeScore = countKeywordMatches(normalized, NEGATIVE_KEYWORDS)

  if (normalized.includes('!?') || normalized.includes('!!!')) {
    negativeScore += 1
  }

  if (normalized.includes('danke') || normalized.includes('vielen dank')) {
    positiveScore += 1
  }

  if (positiveScore === 0 && negativeScore === 0) {
    return 'neutral'
  }

  if (positiveScore >= negativeScore + 1) {
    return 'positive'
  }

  if (negativeScore >= positiveScore + 1) {
    return 'negative'
  }

  return 'neutral'
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

const MAX_MESSAGE_HYDRATION_IDS = 100

const hydratePostsWithContent = async (posts = []) => {
  if (!Array.isArray(posts) || posts.length === 0) {
    return Array.isArray(posts) ? posts : []
  }

  const candidateIds = Array.from(new Set(
    posts
      .map(post => post.messageId || post.id || post.topicId)
      .filter(id => !!id)
  )).slice(0, MAX_MESSAGE_HYDRATION_IDS)

  if (candidateIds.length === 0) {
    return posts
  }

  let detailsMap = {}
  try {
    detailsMap = await fetchMessageDetails(candidateIds)
  } catch (error) {
    console.warn('⚠️ Could not fetch message details (non-critical):', error.message)
    // Continue without message details - posts will still have basic info
  }

  return posts.map(post => {
    const detail =
      detailsMap[post.messageId] ||
      detailsMap[post.id] ||
      detailsMap[post.topicId]

    if (!detail) {
      return {
        ...post,
        sentiment: post.sentiment || analyzeSentimentFromText(post.content || '', post.topic)
      }
    }

    const htmlBody = detail.body || ''
    const plainBody = stripHtml(htmlBody)
    const parsedPostTime = detail.post_time ? new Date(detail.post_time) : null
    const normalizedDate = parsedPostTime && !isNaN(parsedPostTime.getTime())
      ? parsedPostTime.toISOString()
      : post.date

    const resolvedUrl = detail.view_href || post.url || buildKhorosPostUrl({
      ...post,
      messageId: post.id || post.messageId
    })

    return {
      ...post,
      author: detail.author?.login || post.author,
      content: plainBody || post.content,
      contentHtml: htmlBody || post.contentHtml,
      date: normalizedDate,
      url: resolvedUrl,
      sentiment: analyzeSentimentFromText(plainBody || htmlBody || post.content || '', post.topic),
      contentLanguage: detectLanguage(plainBody, post.topic),
      requestType: categorizePostType(plainBody, post.topic)
    }
  })
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

