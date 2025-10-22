/**
 * Comdirect Community Web Scraper
 * Fetches real posts from https://community.comdirect.de/
 */

import axios from 'axios'

const COMMUNITY_BASE_URL = 'https://community.comdirect.de'
const CORS_PROXY = 'https://api.allorigins.win/raw?url=' // CORS proxy for browser requests

/**
 * Scrape posts from comdirect community
 * 
 * NOTE: Browser-based scraping is blocked by CORS policies.
 * This function will always fail in the browser.
 * 
 * To get real data, you need to:
 * 1. Set up a backend proxy server
 * 2. Use the official Khoros API with credentials
 * 3. Deploy a server-side scraper
 */
export const scrapeComdirectPosts = async (options = {}) => {
  const { limit = 50, category = '', filters = {} } = options

  // Immediately throw error explaining the limitation
  throw new Error(
    '🚫 Browser scraping blocked by CORS policy. ' +
    'Web browsers prevent direct scraping for security. ' +
    'To get real data: (1) Set up a backend proxy, or (2) Use Khoros API with credentials. ' +
    'See KHOROS_API_SETUP.md for details.'
  )
}

/**
 * Alternative: Try to fetch from Khoros REST API endpoints
 */
const scrapeFromAPI = async (limit, filters) => {
  try {
    // Khoros communities often expose a REST API endpoint
    const apiUrl = `${COMMUNITY_BASE_URL}/api/2.0/search?q=SELECT id, subject, body, author.login, post_time, kudos.sum(weight), replies.count(*), view_count FROM messages WHERE depth=0 ORDER BY post_time DESC LIMIT ${limit}`
    
    const response = await axios.get(apiUrl)
    
    if (response.data?.data?.items) {
      return {
        posts: response.data.data.items.map(transformKhorosPost),
        total: response.data.data.items.length,
        source: 'khoros_api'
      }
    }
    
    throw new Error('No data in API response')
  } catch (error) {
    throw error
  }
}

/**
 * Parse HTML to extract post information
 */
const parseComdirectHTML = (html, limit, filters) => {
  const posts = []
  
  try {
    // Extract post data using regex patterns (simplified parser)
    // In production, you'd use a proper HTML parser like cheerio or jsdom
    
    // Pattern to find post containers
    const postPattern = /<div[^>]*class="[^"]*lia-list-row[^"]*"[^>]*>(.*?)<\/div>/gs
    const matches = [...html.matchAll(postPattern)]
    
    for (let i = 0; i < Math.min(matches.length, limit); i++) {
      const postHtml = matches[i][1]
      
      // Extract post details
      const post = {
        id: extractPattern(postHtml, /data-messageid="(\d+)"/) || `scraped_${Date.now()}_${i}`,
        author: extractPattern(postHtml, /data-author-login="([^"]+)"/) || extractPattern(postHtml, /<span class="[^"]*lia-message-author-username[^"]*">([^<]+)<\/span>/) || 'Unknown',
        topic: extractPattern(postHtml, /<a[^>]*class="[^"]*lia-link-navigation[^"]*"[^>]*>([^<]+)<\/a>/) || 'No Subject',
        content: stripHtml(extractPattern(postHtml, /<div[^>]*class="[^"]*lia-message-body[^"]*"[^>]*>(.*?)<\/div>/s) || ''),
        likes: parseInt(extractPattern(postHtml, /(\d+)\s*Danke/i) || extractPattern(postHtml, /kudos.*?(\d+)/i)) || 0,
        replies: parseInt(extractPattern(postHtml, /(\d+)\s*Antworten/i) || extractPattern(postHtml, /replies.*?(\d+)/i)) || 0,
        views: parseInt(extractPattern(postHtml, /(\d+)\s*Anzeigen/i) || extractPattern(postHtml, /views.*?(\d+)/i)) || 0,
        date: extractDate(postHtml) || new Date().toISOString(),
        url: extractPostUrl(postHtml) || `${COMMUNITY_BASE_URL}`,
        contentLanguage: 'de', // Comdirect is primarily German
        sentiment: analyzeSentiment(stripHtml(postHtml)),
        requestType: categorizePost(stripHtml(postHtml)),
        isPlatformRelated: checkIfPlatformRelated(stripHtml(postHtml))
      }
      
      // Apply filters
      if (applyFilters(post, filters)) {
        posts.push(post)
      }
    }
    
  } catch (error) {
    console.error('Error parsing HTML:', error)
  }
  
  return posts
}

/**
 * Extract pattern from HTML using regex
 */
const extractPattern = (html, pattern) => {
  const match = html.match(pattern)
  return match ? match[1].trim() : null
}

/**
 * Extract post URL
 */
const extractPostUrl = (html) => {
  const urlPattern = /href="(\/t5\/[^"]+)"/
  const match = html.match(urlPattern)
  return match ? `${COMMUNITY_BASE_URL}${match[1]}` : null
}

/**
 * Extract and parse date
 */
const extractDate = (html) => {
  try {
    // Look for date patterns in German format
    const datePattern = /(\d{2})\.(\d{2})\.(\d{4})/
    const match = html.match(datePattern)
    if (match) {
      const [_, day, month, year] = match
      return new Date(`${year}-${month}-${day}`).toISOString()
    }
    
    // Try ISO format
    const isoPattern = /(\d{4}-\d{2}-\d{2})/
    const isoMatch = html.match(isoPattern)
    if (isoMatch) {
      return new Date(isoMatch[1]).toISOString()
    }
    
    return new Date().toISOString()
  } catch (error) {
    return new Date().toISOString()
  }
}

/**
 * Strip HTML tags
 */
const stripHtml = (html) => {
  if (!html) return ''
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

/**
 * Simple sentiment analysis based on keywords
 */
const analyzeSentiment = (text) => {
  const textLower = text.toLowerCase()
  
  const positiveWords = ['gut', 'super', 'toll', 'danke', 'perfekt', 'ausgezeichnet', 'empfehlen', 'zufrieden', 'great', 'excellent', 'love']
  const negativeWords = ['problem', 'fehler', 'schlecht', 'enttäuscht', 'ärgerlich', 'nicht', 'bug', 'issue', 'frustrated', 'terrible']
  
  const positiveCount = positiveWords.filter(word => textLower.includes(word)).length
  const negativeCount = negativeWords.filter(word => textLower.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

/**
 * Categorize post type
 */
const categorizePost = (text) => {
  const textLower = text.toLowerCase()
  
  if (textLower.includes('feature') || textLower.includes('funktion') || textLower.includes('vorschlag')) return 'feature_request'
  if (textLower.includes('fehler') || textLower.includes('bug') || textLower.includes('problem')) return 'bug_report'
  if (textLower.includes('?') || textLower.includes('frage') || textLower.includes('wie')) return 'question'
  if (textLower.includes('schrecklich') || textLower.includes('enttäuscht') || textLower.includes('ärger')) return 'complaint'
  if (textLower.includes('danke') || textLower.includes('super') || textLower.includes('toll')) return 'praise'
  
  return 'feedback'
}

/**
 * Check if post is platform-related
 */
const checkIfPlatformRelated = (text) => {
  const textLower = text.toLowerCase()
  const platformKeywords = ['community', 'forum', 'plattform', 'website', 'app', 'profil', 'notification', 'benachrichtigung', 'anmeldung', 'login']
  
  return platformKeywords.some(keyword => textLower.includes(keyword))
}

/**
 * Apply filters to post
 */
const applyFilters = (post, filters) => {
  if (filters.sentiment && post.sentiment !== filters.sentiment) return false
  if (filters.requestType && post.requestType !== filters.requestType) return false
  if (filters.language && post.contentLanguage !== filters.language) return false
  if (filters.platformRelated !== undefined && post.isPlatformRelated !== filters.platformRelated) return false
  
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom)
    if (new Date(post.date) < fromDate) return false
  }
  
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo)
    toDate.setHours(23, 59, 59, 999)
    if (new Date(post.date) > toDate) return false
  }
  
  return true
}

/**
 * Transform Khoros API post to our format
 */
const transformKhorosPost = (khorosPost) => {
  return {
    id: khorosPost.id || `api_${Date.now()}`,
    author: khorosPost.author?.login || 'Unknown',
    topic: khorosPost.subject || 'No Subject',
    content: stripHtml(khorosPost.body || ''),
    likes: khorosPost.kudos?.sum?.weight || 0,
    replies: khorosPost.replies?.count || 0,
    views: khorosPost.view_count || 0,
    date: khorosPost.post_time || new Date().toISOString(),
    url: khorosPost.view_href || `${COMMUNITY_BASE_URL}/t5/message/${khorosPost.id}`,
    contentLanguage: 'de',
    sentiment: analyzeSentiment(khorosPost.body || ''),
    requestType: categorizePost(khorosPost.body || ''),
    isPlatformRelated: checkIfPlatformRelated(khorosPost.body || '')
  }
}

export default {
  scrapeComdirectPosts
}

