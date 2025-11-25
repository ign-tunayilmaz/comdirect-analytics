/**
 * IndexedDB Storage Utility for Large Datasets
 * 
 * IndexedDB can store much more data than localStorage (GBs vs MBs)
 * This provides a fallback when localStorage quota is exceeded
 */

const DB_NAME = 'comdirect_analytics'
const DB_VERSION = 1
const STORE_NAME = 'posts'

/**
 * Open or create the IndexedDB database
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('date', 'date', { unique: false })
        store.createIndex('userId', 'userId', { unique: false })
        store.createIndex('author', 'author', { unique: false })
      }
    }
  })
}

/**
 * Save posts to IndexedDB
 * @param {Array} posts - Array of post objects
 * @returns {Promise<Array>} - Array of saved posts
 */
export const savePostsToIndexedDB = async (posts) => {
  try {
    const db = await openDB()
    
    // First, get existing posts in a separate transaction
    const readTransaction = db.transaction([STORE_NAME], 'readonly')
    const readStore = readTransaction.objectStore(STORE_NAME)
    const existingRequest = readStore.getAll()
    
    const existing = await new Promise((resolve, reject) => {
      existingRequest.onsuccess = () => resolve(existingRequest.result)
      existingRequest.onerror = () => reject(existingRequest.error)
    })
    
    // Create a map of existing posts
    const existingMap = new Map(existing.map(p => [p.id, p]))
    
    // Process in batches with separate transactions to avoid transaction timeout
    const BATCH_SIZE = 1000
    let saved = 0
    
    for (let i = 0; i < posts.length; i += BATCH_SIZE) {
      const batch = posts.slice(i, i + BATCH_SIZE)
      
      // Create a new transaction for each batch
      const writeTransaction = db.transaction([STORE_NAME], 'readwrite')
      const writeStore = writeTransaction.objectStore(STORE_NAME)
      
      const promises = []
      
      batch.forEach(post => {
        if (post && post.id) {
          // Merge with existing if present
          const existingPost = existingMap.get(post.id)
          const postToSave = existingPost 
            ? { ...existingPost, ...post } 
            : post
          
          const request = writeStore.put(postToSave)
          promises.push(
            new Promise((resolve, reject) => {
              request.onsuccess = () => {
                saved++
                resolve()
              }
              request.onerror = () => reject(request.error)
            })
          )
        }
      })
      
      // Wait for all writes in this batch to complete
      await Promise.all(promises)
      
      // Wait for transaction to complete before starting next batch
      await new Promise((resolve, reject) => {
        writeTransaction.oncomplete = () => resolve()
        writeTransaction.onerror = () => reject(writeTransaction.error)
      })
    }
    
    db.close()
    console.log(`✅ Saved ${saved} posts to IndexedDB`)
    
    return posts
  } catch (error) {
    console.error('❌ Error saving to IndexedDB:', error)
    throw error
  }
}

/**
 * Load all posts from IndexedDB
 * @returns {Promise<Array>} - Array of posts
 */
export const loadPostsFromIndexedDB = async () => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()
    
    const posts = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    db.close()
    console.log(`✅ Loaded ${posts.length} posts from IndexedDB`)
    return posts
  } catch (error) {
    console.error('❌ Error loading from IndexedDB:', error)
    return []
  }
}

/**
 * Clear all posts from IndexedDB
 */
export const clearIndexedDB = async () => {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()
    
    await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
    
    db.close()
    console.log('✅ Cleared IndexedDB')
  } catch (error) {
    console.error('❌ Error clearing IndexedDB:', error)
    throw error
  }
}

/**
 * Get storage size estimate from IndexedDB
 */
export const getIndexedDBStorageInfo = async () => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        usageMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
        quotaMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
        availableMB: (((estimate.quota || 0) - (estimate.usage || 0)) / (1024 * 1024)).toFixed(2)
      }
    }
    return null
  } catch (error) {
    console.error('Error getting storage info:', error)
    return null
  }
}

/**
 * Check if IndexedDB is available
 */
export const isIndexedDBAvailable = () => {
  return typeof indexedDB !== 'undefined'
}

