// Data collection and scraping utilities
import axios from 'axios'
import { fetchPostsFromKhorosAPI, isApiConfigured } from './khorosApi'
import { 
  savePostsToIndexedDB, 
  loadPostsFromIndexedDB, 
  clearIndexedDB,
  isIndexedDBAvailable,
  getIndexedDBStorageInfo
} from './indexedDbStorage'
// Note: Browser-based scraping is disabled due to CORS restrictions
// import { scrapeComdirectPosts } from './communityScraper'

/**
 * Mock data generator for demonstration purposes
 * In production, this would connect to actual scraping endpoints or APIs
 */
export const generateMockPosts = (count = 50) => {
  // REAL topics from comdirect community (scraped manually from community.comdirect.de)
  const topics = [
    'TKMS Aktien werden nicht eingebucht',
    'High Yields und Junk',
    'Comdirect lehnt Alipay/Wechat Zahlung ab',
    'Werte im Depot werden nicht aktualisiert',
    'NV Bescheinigung zurückziehen',
    'Gold-Gold-Gold',
    'Dauerauftrag in SEPA Nachbarland ändern',
    'Tagesgeldkonto Echtzeit-Überweisung nicht möglich',
    'Warum nur Aktienanleihen auf Rüstungsaktien',
    'ETF mit fundamentalem Tilt',
    'Börsenblubber 2025',
    'Musterdepot 2025',
    'Drei globale ETF-Alternativen zum MSCI World',
    'Was haben wir zuletzt gekauft',
    'Bären-Strategien für das 1. HJ 2025',
    'So schwierig ist es Vermögen aufzubauen',
    'IPO Ottobock',
    'Looking for Financial Freedom',
    'Wartungsarbeiten Ankündigung'
  ]
  
  // Community platform related topics (REAL from comdirect)
  const platformTopics = [
    'comdirect wird barrierefrei',
    'FAQ zur Empfängerüberprüfung (Verification of Payee)',
    'photoTAN Probleme',
    'Website & Apps Feedback',
    'Community Regeln',
    'Posting-Tipps',
    'Community-Statistik',
    'Ankündigung von Wartungsarbeiten',
    'Community forum features',
    'Brokerboard Diskussion'
  ]
  
  const sentiments = ['positive', 'negative', 'neutral']
  const requestTypes = ['feature_request', 'bug_report', 'question', 'feedback', 'complaint', 'praise']
  
  const posts = []
  const now = new Date()
  
  for (let i = 0; i < count; i++) {
    // 30% chance of being a platform-related post
    const isPlatformRelated = Math.random() < 0.3
    const topicList = isPlatformRelated ? platformTopics : topics
    const topic = topicList[Math.floor(Math.random() * topicList.length)]
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
    const requestType = requestTypes[Math.floor(Math.random() * requestTypes.length)]
    const daysAgo = Math.floor(Math.random() * 90)
    // 70% German, 30% English (reflecting comdirect's German market)
    const language = Math.random() < 0.7 ? 'de' : 'en'
    
    const postDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const postId = Math.floor(100000 + Math.random() * 900000) // Realistic post ID
    
    posts.push({
      id: `post_${postId}`,
      author: `User${Math.floor(Math.random() * 1000)}`,
      topic: topic,
      content: generatePostContent(topic, requestType, language),
      contentLanguage: language,
      sentiment: sentiment,
      requestType: requestType,
      isPlatformRelated: isPlatformRelated,
      likes: Math.floor(Math.random() * 100),
      replies: Math.floor(Math.random() * 50),
      date: postDate.toISOString(),
      url: `https://community.comdirect.de/t5/community/m-p/${postId}`,
      tags: generateTags(topic, requestType)
    })
  }
  
  return posts
}

const generatePostContent = (topic, requestType, language = 'en') => {
  const templatesEN = {
    feature_request: [
      `Would love to see improvements in ${topic}. It would make a huge difference!`,
      `Any plans to add ${topic} functionality? This would be really helpful.`,
      `${topic} needs an upgrade. Here are my suggestions...`
    ],
    bug_report: [
      `I'm experiencing issues with ${topic}. Can someone help?`,
      `${topic} is not working as expected. Has anyone else noticed this?`,
      `Bug report: ${topic} causing problems in my account.`
    ],
    question: [
      `Quick question about ${topic} - how does this work?`,
      `Can someone explain ${topic} to me?`,
      `Looking for information regarding ${topic}.`
    ],
    feedback: [
      `My experience with ${topic} has been great overall.`,
      `Some thoughts on ${topic} and how it could be improved.`,
      `Feedback on ${topic}: generally good but room for improvement.`
    ],
    complaint: [
      `Really frustrated with ${topic}. This needs to be fixed ASAP!`,
      `${topic} is terrible. Very disappointed.`,
      `Unhappy with ${topic}. Expected better service.`
    ],
    praise: [
      `${topic} is excellent! Keep up the great work!`,
      `Love the ${topic} feature. Makes everything so much easier.`,
      `Impressed by ${topic}. Best in class!`
    ]
  }

  const templatesDE = {
    feature_request: [
      `Würde gerne Verbesserungen bei ${topic} sehen. Das würde einen großen Unterschied machen!`,
      `Gibt es Pläne für ${topic} Funktionalität? Das wäre wirklich hilfreich.`,
      `${topic} braucht ein Upgrade. Hier sind meine Vorschläge...`
    ],
    bug_report: [
      `Ich habe Probleme mit ${topic}. Kann mir jemand helfen?`,
      `${topic} funktioniert nicht wie erwartet. Hat das noch jemand bemerkt?`,
      `Fehlerbericht: ${topic} verursacht Probleme in meinem Konto.`
    ],
    question: [
      `Kurze Frage zu ${topic} - wie funktioniert das?`,
      `Kann mir jemand ${topic} erklären?`,
      `Suche Informationen bezüglich ${topic}.`
    ],
    feedback: [
      `Meine Erfahrung mit ${topic} war insgesamt großartig.`,
      `Einige Gedanken zu ${topic} und wie es verbessert werden könnte.`,
      `Feedback zu ${topic}: generell gut, aber Verbesserungspotenzial.`
    ],
    complaint: [
      `Wirklich frustriert mit ${topic}. Das muss dringend behoben werden!`,
      `${topic} ist schrecklich. Sehr enttäuscht.`,
      `Unzufrieden mit ${topic}. Besseren Service erwartet.`
    ],
    praise: [
      `${topic} ist ausgezeichnet! Macht weiter so!`,
      `Liebe die ${topic} Funktion. Macht alles so viel einfacher.`,
      `Beeindruckt von ${topic}. Erstklassig!`
    ]
  }
  
  const templates = language === 'de' ? templatesDE : templatesEN
  const templateList = templates[requestType] || templates.feedback
  return templateList[Math.floor(Math.random() * templateList.length)]
}

const generateTags = (topic, requestType) => {
  const tags = [topic.toLowerCase().replace(/ /g, '_')]
  if (Math.random() > 0.5) tags.push(requestType)
  if (Math.random() > 0.7) tags.push('urgent')
  return tags
}

/**
 * Fetch community posts (ONLY from Khoros API - NO DEMO DATA)
 */
export const fetchCommunityPosts = async (options = {}) => {
  const { page = 1, limit = 999999, filters = {} } = options // Default to very high limit to fetch all data for MAU
  
  // Check if Khoros API is configured
  if (!isApiConfigured()) {
    throw new Error('❌ Khoros API is not configured. Please add your API credentials to .env.local file.')
  }
  
  console.log('🔌 Khoros API is configured - fetching real data...')
  
  // Fetch real data from Khoros API - NO FALLBACK TO DEMO DATA
  const posts = await fetchPostsFromKhorosAPI({
    startDate: filters.dateFrom,
    endDate: filters.dateTo,
    limit: limit,
    category: filters.platformRelated !== undefined ? 
      (filters.platformRelated ? 'community-feedback' : null) : null,
    sentiment: filters.sentiment,
  })
  
  // Apply additional client-side filters
  let filteredPosts = posts
  
  if (filters.requestType) {
    filteredPosts = filteredPosts.filter(post => post.requestType === filters.requestType)
  }
  
  if (filters.language) {
    filteredPosts = filteredPosts.filter(post => post.contentLanguage === filters.language)
  }
  
  return {
    posts: filteredPosts,
    total: filteredPosts.length,
    page,
    hasMore: false,
    source: 'khoros_api'
  }
}

/**
 * Store posts to local storage for persistence
 */
/**
 * Store only essential fields for analytics to reduce storage size
 * For MAU calculation, we only need: id, userId, author, date, eventType, location
 * But we also need to keep fields that Dashboard/analytics functions expect
 */
const getMinimalPostData = (post) => {
  return {
    id: post.id,
    userId: post.userId,
    author: post.author,
    date: post.date,
    eventType: post.eventType,
    location: post.location,
    // Keep topic for basic filtering, but truncate if too long
    topic: post.topic ? post.topic.substring(0, 100) : '',
    // Keep these fields with defaults for analytics functions that expect them
    content: post.content || '',
    requestType: post.requestType || 'unknown',
    sentiment: post.sentiment || 'neutral',
    category: post.category || 'Uncategorized',
    // Keep URL if it exists (for migration)
    url: post.url || undefined
  }
}

/**
 * Save posts - tries localStorage first, falls back to IndexedDB if quota exceeded
 */
export const savePosts = async (posts) => {
  // First, minimize the data
  const BATCH_SIZE = 10000
  const uniqueMap = new Map()
  
  // Get existing posts from localStorage first
  let existing = []
  try {
    existing = JSON.parse(localStorage.getItem('comdirect_posts') || '[]')
  } catch (e) {
    console.warn('Could not load existing posts from localStorage:', e)
  }
  
  // Merge existing with new posts
  const merged = existing.concat(posts)
  
  // Process in batches to minimize data
  for (let i = 0; i < merged.length; i += BATCH_SIZE) {
    const batch = merged.slice(i, i + BATCH_SIZE)
    batch.forEach(post => {
      if (post && post.id) {
        const isAlreadyMinimal = !post.content || post.content === '' || 
                                 (post.content && post.content.length < 50 && !post.body)
        
        if (isAlreadyMinimal) {
          uniqueMap.set(post.id, {
            ...post,
            content: post.content || '',
            requestType: post.requestType || 'unknown',
            sentiment: post.sentiment || 'neutral',
            category: post.category || 'Uncategorized'
          })
        } else {
          uniqueMap.set(post.id, getMinimalPostData(post))
        }
      }
    })
  }
  
  const unique = Array.from(uniqueMap.values())
  const jsonString = JSON.stringify(unique)
  const sizeInMB = new Blob([jsonString]).size / (1024 * 1024)
  
  // Try localStorage first
  try {
    if (sizeInMB > 5) {
      console.warn(`⚠️ Large dataset (${sizeInMB.toFixed(2)}MB). Will use IndexedDB for storage.`)
    }
    
    localStorage.setItem('comdirect_posts', jsonString)
    console.log(`✅ Saved ${unique.length} posts to localStorage (${sizeInMB.toFixed(2)}MB)`)
    
    // Also save to IndexedDB as backup for large datasets
    if (isIndexedDBAvailable() && sizeInMB > 3) {
      try {
        await savePostsToIndexedDB(unique)
        // Mark that we're using IndexedDB
        localStorage.setItem('comdirect_use_indexeddb', 'true')
      } catch (idbError) {
        console.warn('⚠️ Could not save to IndexedDB (will use localStorage only):', idbError)
      }
    }
    
    return unique
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage quota exceeded. Switching to IndexedDB...')
      
      // Fallback to IndexedDB
      if (isIndexedDBAvailable()) {
        try {
          await savePostsToIndexedDB(unique)
          localStorage.setItem('comdirect_use_indexeddb', 'true')
          localStorage.removeItem('comdirect_posts') // Clear localStorage to free space
          
          const storageInfo = await getIndexedDBStorageInfo()
          if (storageInfo) {
            console.log(`✅ Saved ${unique.length} posts to IndexedDB (${storageInfo.usageMB}MB used, ${storageInfo.availableMB}MB available)`)
          } else {
            console.log(`✅ Saved ${unique.length} posts to IndexedDB`)
          }
          
          return unique
        } catch (idbError) {
          console.error('❌ Failed to save to IndexedDB:', idbError)
          // Last resort: save only recent posts
          try {
            const recentPosts = unique.slice(-50000)
            const minimal = recentPosts.map(getMinimalPostData)
            const jsonString = JSON.stringify(minimal)
            localStorage.setItem('comdirect_posts', jsonString)
            console.log(`⚠️ Saved only most recent 50,000 posts due to storage limits`)
            return minimal
          } catch (finalError) {
            console.error('❌ Failed to save even minimal data:', finalError)
            throw new Error('Storage quota exceeded. Please reduce date range or clear existing data.')
          }
        }
      } else {
        // IndexedDB not available - try to save only recent posts
        try {
          const recentPosts = unique.slice(-50000)
          const minimal = recentPosts.map(getMinimalPostData)
          const jsonString = JSON.stringify(minimal)
          localStorage.setItem('comdirect_posts', jsonString)
          console.log(`⚠️ IndexedDB not available. Saved only most recent 50,000 posts.`)
          return minimal
        } catch (finalError) {
          console.error('❌ Failed to save even minimal data:', finalError)
          throw new Error('Storage quota exceeded and IndexedDB not available. Please reduce date range.')
        }
      }
    }
    throw error
  }
}

/**
 * Migrate old posts to include isPlatformRelated, url, and contentLanguage fields
 */
const migratePosts = (posts) => {
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return []
  }
  
  const platformTopics = [
    'Community forum features', 'Post notifications', 'User profile settings',
    'Community moderation', 'Forum search functionality', 'Message threading',
    'Community badges', 'Reputation system', 'Forum mobile app',
    'Private messaging', 'Topic subscriptions', 'Community guidelines'
  ]
  
  return posts
    .filter(post => post && post.id && post.date) // Filter out invalid posts
    .map((post, index) => {
      const updates = {}
      
      // If the post doesn't have isPlatformRelated field, add it based on topic
      if (post.isPlatformRelated === undefined) {
        updates.isPlatformRelated = post.topic ? platformTopics.includes(post.topic) : false
      }
      
      // If the post doesn't have a URL field, generate one
      if (!post.url && post.id) {
        const postId = String(post.id).replace('post_', '')
        updates.url = `https://community.comdirect.de/t5/community/m-p/${postId}`
      }
      
      // If the post doesn't have a language field, default to 'en'
      if (!post.contentLanguage) {
        updates.contentLanguage = 'en'
      }
      
      // Ensure required fields exist for analytics
      if (!post.content) updates.content = ''
      if (!post.requestType) updates.requestType = 'unknown'
      if (!post.sentiment) updates.sentiment = 'neutral'
      if (!post.category) updates.category = 'Uncategorized'
      if (!post.topic) updates.topic = ''
      
      // Return post with updates if any, otherwise return original
      return Object.keys(updates).length > 0 ? { ...post, ...updates } : post
    })
}

/**
 * Load posts from storage (localStorage or IndexedDB)
 */
export const loadPosts = async () => {
  try {
    // Check if we're using IndexedDB
    const useIndexedDB = localStorage.getItem('comdirect_use_indexeddb') === 'true'
    
    if (useIndexedDB && isIndexedDBAvailable()) {
      console.log('📂 Loading posts from IndexedDB...')
      const posts = await loadPostsFromIndexedDB()
      
      if (posts && posts.length > 0) {
        const migratedPosts = migratePosts(posts)
        console.log(`✅ Loaded ${migratedPosts.length} posts from IndexedDB`)
        return migratedPosts
      }
    }
    
    // Fallback to localStorage
    const posts = JSON.parse(localStorage.getItem('comdirect_posts') || '[]')
    
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      // Try IndexedDB as fallback
      if (isIndexedDBAvailable()) {
        console.log('📂 No posts in localStorage, trying IndexedDB...')
        const idbPosts = await loadPostsFromIndexedDB()
        if (idbPosts && idbPosts.length > 0) {
          const migratedPosts = migratePosts(idbPosts)
          console.log(`✅ Loaded ${migratedPosts.length} posts from IndexedDB`)
          return migratedPosts
        }
      }
      console.log('📭 No posts found in storage')
      return []
    }
    
    console.log(`📂 Loading ${posts.length} posts from localStorage`)
    const migratedPosts = migratePosts(posts)
    
    // Only save back if we actually made changes (added missing fields)
    const needsMigration = migratedPosts.some(p => 
      p.isPlatformRelated === undefined || 
      !p.content || 
      !p.requestType || 
      !p.sentiment || 
      !p.category
    )
    
    if (needsMigration && migratedPosts.length > 0) {
      console.log('🔄 Migrating posts with missing fields...')
      try {
        // Try to save back - if it fails, switch to IndexedDB
        localStorage.setItem('comdirect_posts', JSON.stringify(migratedPosts))
        console.log(`✅ Migrated ${migratedPosts.length} posts`)
      } catch (error) {
        if (error.name === 'QuotaExceededError' && isIndexedDBAvailable()) {
          console.warn('⚠️ localStorage full, saving to IndexedDB instead...')
          try {
            await savePostsToIndexedDB(migratedPosts)
            localStorage.setItem('comdirect_use_indexeddb', 'true')
            localStorage.removeItem('comdirect_posts')
          } catch (idbError) {
            console.error('⚠️ Failed to save migrated posts to IndexedDB:', idbError)
          }
        } else {
          console.error('⚠️ Failed to save migrated posts:', error)
        }
      }
    }
    
    console.log(`✅ Loaded ${migratedPosts.length} posts`)
    return migratedPosts
  } catch (error) {
    console.error('❌ Error loading posts:', error)
    return []
  }
}

/**
 * Clear all stored posts (from both localStorage and IndexedDB)
 */
export const clearPosts = async () => {
  localStorage.removeItem('comdirect_posts')
  localStorage.removeItem('comdirect_use_indexeddb')
  
  if (isIndexedDBAvailable()) {
    try {
      await clearIndexedDB()
    } catch (error) {
      console.error('Error clearing IndexedDB:', error)
    }
  }
}

export default {
  generateMockPosts,
  fetchCommunityPosts,
  savePosts,
  loadPosts,
  clearPosts
}

