// Data collection and scraping utilities
import axios from 'axios'

/**
 * Mock data generator for demonstration purposes
 * In production, this would connect to actual scraping endpoints or APIs
 */
export const generateMockPosts = (count = 50) => {
  const topics = [
    'Trading fees', 'Mobile app', 'Account security', 'Customer service',
    'ETF savings plan', 'Depot transfer', 'API access', 'Real-time quotes',
    'Tax documents', 'Options trading', 'Cryptocurrency', 'Dividends',
    'Bank transfer speed', 'Interest rates', 'Credit cards', 'Login issues',
    'Portfolio analysis', 'Market data', 'Trading hours', 'Order types'
  ]
  
  // Community platform related topics
  const platformTopics = [
    'Community forum features', 'Post notifications', 'User profile settings',
    'Community moderation', 'Forum search functionality', 'Message threading',
    'Community badges', 'Reputation system', 'Forum mobile app',
    'Private messaging', 'Topic subscriptions', 'Community guidelines'
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
    
    const postDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    posts.push({
      id: `post_${i + 1}`,
      author: `User${Math.floor(Math.random() * 1000)}`,
      topic: topic,
      content: generatePostContent(topic, requestType),
      sentiment: sentiment,
      requestType: requestType,
      isPlatformRelated: isPlatformRelated,
      likes: Math.floor(Math.random() * 100),
      replies: Math.floor(Math.random() * 50),
      date: postDate.toISOString(),
      url: `https://community.comdirect.de/t5/post/${i + 1}`,
      tags: generateTags(topic, requestType)
    })
  }
  
  return posts
}

const generatePostContent = (topic, requestType) => {
  const templates = {
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
 * Simulates fetching data from an external source
 * In production, this would make actual API calls or use a scraping service
 */
export const fetchCommunityPosts = async (options = {}) => {
  const { page = 1, limit = 50, filters = {} } = options
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Generate or retrieve mock data
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
  
  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom)
    posts = posts.filter(post => new Date(post.date) >= fromDate)
  }
  
  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo)
    toDate.setHours(23, 59, 59, 999) // Include the entire end date
    posts = posts.filter(post => new Date(post.date) <= toDate)
  }
  
  return {
    posts,
    total: posts.length,
    page,
    hasMore: false
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
 * Migrate old posts to include isPlatformRelated and url fields
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
      updates.url = `https://community.comdirect.de/t5/post/${post.id.replace('post_', '')}`
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

