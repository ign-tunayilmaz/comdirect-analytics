// Data collection and scraping utilities
import axios from 'axios'
import { scrapeComdirectPosts } from './communityScraper'

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
 * Fetch real posts from comdirect community via web scraping
 */
export const fetchCommunityPosts = async (options = {}) => {
  const { page = 1, limit = 50, filters = {} } = options
  
  try {
    console.log('🌐 Fetching REAL data from comdirect community...')
    
    // Scrape real posts from comdirect community
    const result = await scrapeComdirectPosts({
      limit,
      filters
    })
    
    console.log(`✅ Successfully fetched ${result.posts.length} real posts`)
    
    return {
      posts: result.posts,
      total: result.posts.length,
      page,
      hasMore: false,
      source: result.source
    }
    
  } catch (error) {
    console.error('❌ Error fetching real data:', error.message)
    console.warn('⚠️ Falling back to mock data due to error')
    
    // Fallback to mock data only if scraping fails
    let posts = generateMockPosts(limit)
    
    // Apply filters
    if (filters.sentiment) {
      posts = posts.filter(post => post.sentiment === filters.sentiment)
    }
    
    if (filters.requestType) {
      posts = posts.filter(post => post.requestType === filters.requestType)
    }
    
    if (filters.platformRelated !== undefined) {
      posts = posts.filter(post => post.isPlatformRelated === filters.platformRelated)
    }
    
    if (filters.language) {
      posts = posts.filter(post => post.contentLanguage === filters.language)
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom)
      posts = posts.filter(post => new Date(post.date) >= fromDate)
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo)
      toDate.setHours(23, 59, 59, 999)
      posts = posts.filter(post => new Date(post.date) <= toDate)
    }
    
    return {
      posts,
      total: posts.length,
      page,
      hasMore: false,
      source: 'mock_data_fallback'
    }
  }
}

/**
 * Store posts to local storage for persistence
 */
export const savePosts = (posts) => {
  try {
    const existing = JSON.parse(localStorage.getItem('comdirect_posts') || '[]')
    const merged = [...existing, ...posts]
    // Remove duplicates based on ID
    const unique = Array.from(new Map(merged.map(post => [post.id, post])).values())
    localStorage.setItem('comdirect_posts', JSON.stringify(unique))
    return unique
  } catch (error) {
    console.error('Error saving posts:', error)
    return posts
  }
}

/**
 * Migrate old posts to include isPlatformRelated, url, and contentLanguage fields
 */
const migratePosts = (posts) => {
  const platformTopics = [
    'Community forum features', 'Post notifications', 'User profile settings',
    'Community moderation', 'Forum search functionality', 'Message threading',
    'Community badges', 'Reputation system', 'Forum mobile app',
    'Private messaging', 'Topic subscriptions', 'Community guidelines'
  ]
  
  return posts.map((post, index) => {
    const updates = {}
    
    // If the post doesn't have isPlatformRelated field, add it based on topic
    if (post.isPlatformRelated === undefined) {
      updates.isPlatformRelated = platformTopics.includes(post.topic)
    }
    
    // If the post doesn't have a URL field, generate one
    if (!post.url) {
      const postId = post.id.replace('post_', '')
      updates.url = `https://community.comdirect.de/t5/community/m-p/${postId}`
    }
    
    // If the post doesn't have a language field, default to 'en'
    if (!post.contentLanguage) {
      updates.contentLanguage = 'en'
    }
    
    // Return post with updates if any, otherwise return original
    return Object.keys(updates).length > 0 ? { ...post, ...updates } : post
  })
}

/**
 * Load posts from local storage
 */
export const loadPosts = () => {
  try {
    const posts = JSON.parse(localStorage.getItem('comdirect_posts') || '[]')
    const migratedPosts = migratePosts(posts)
    
    // Save migrated posts back to localStorage
    if (migratedPosts.length > 0 && migratedPosts.some(p => p.isPlatformRelated === undefined)) {
      localStorage.setItem('comdirect_posts', JSON.stringify(migratedPosts))
    }
    
    return migratedPosts
  } catch (error) {
    console.error('Error loading posts:', error)
    return []
  }
}

/**
 * Clear all stored posts
 */
export const clearPosts = () => {
  localStorage.removeItem('comdirect_posts')
}

export default {
  generateMockPosts,
  fetchCommunityPosts,
  savePosts,
  loadPosts,
  clearPosts
}

