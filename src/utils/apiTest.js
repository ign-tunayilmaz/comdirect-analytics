/**
 * API Testing Utility
 * 
 * Use this to test your Khoros API connection directly from browser console
 * 
 * Usage:
 *   import { testKhorosConnection } from './utils/apiTest'
 *   testKhorosConnection()
 */

import { fetchPostsFromKhorosAPI, isApiConfigured } from './khorosApi'

/**
 * Test Khoros API connection
 */
export const testKhorosConnection = async () => {
  console.log('🧪 Testing Khoros API Connection...')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Check configuration
  console.log('\n1️⃣ Checking API Configuration...')
  const configured = isApiConfigured()
  console.log('   API Configured:', configured ? '✅ YES' : '❌ NO')
  
  if (!configured) {
    console.error('\n❌ API is not configured!')
    console.log('\n📝 Next steps:')
    console.log('   1. Check if .env.local exists in project root')
    console.log('   2. Verify environment variables are set:')
    console.log('      - VITE_KHOROS_COMMUNITY_ID')
    console.log('      - VITE_KHOROS_ACCESS_TOKEN')
    console.log('   3. Restart development server: npm run dev')
    console.log('   4. Refresh browser and try again')
    return
  }
  
  // Test API request
  console.log('\n2️⃣ Testing API Request...')
  console.log('   Fetching last 10 posts from last 30 days...')
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  
  try {
    const posts = await fetchPostsFromKhorosAPI({
      startDate: startDate.toISOString(),
      limit: 10
    })
    
    console.log('\n✅ API Request Successful!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`\n📊 Retrieved ${posts.length} posts`)
    
    if (posts.length > 0) {
      console.log('\n📝 Sample Post:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('   ID:', posts[0].id)
      console.log('   Author:', posts[0].author)
      console.log('   Topic:', posts[0].topic)
      console.log('   Date:', posts[0].date)
      console.log('   Sentiment:', posts[0].sentiment)
      console.log('   Type:', posts[0].requestType)
      console.log('   Language:', posts[0].contentLanguage)
      console.log('   Platform Related:', posts[0].isPlatformRelated)
      console.log('   Content:', posts[0].content.substring(0, 100) + '...')
      console.log('\n✅ Khoros API is working correctly!')
    } else {
      console.log('\n⚠️ No posts found in the specified date range')
      console.log('   Try expanding the date range or check if the community has recent posts')
    }
    
  } catch (error) {
    console.error('\n❌ API Request Failed!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.error('   Error:', error.message)
    console.log('\n📝 Possible issues:')
    console.log('   1. Invalid or expired access token')
    console.log('   2. Incorrect community ID')
    console.log('   3. Network/CORS issues')
    console.log('   4. API rate limit exceeded')
    console.log('   5. API endpoint URL incorrect')
    console.log('\n💡 Check the network tab in DevTools for more details')
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

/**
 * Display current API configuration (without sensitive data)
 */
export const showApiConfig = () => {
  console.log('🔧 API Configuration')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Community ID:', import.meta.env.VITE_KHOROS_COMMUNITY_ID || '❌ Not set')
  console.log('Access Token:', import.meta.env.VITE_KHOROS_ACCESS_TOKEN ? '✅ Set (hidden for security)' : '❌ Not set')
  console.log('Client ID:', import.meta.env.VITE_KHOROS_CLIENT_ID ? '✅ Set (hidden for security)' : '❌ Not set')
  console.log('Base API URL:', import.meta.env.VITE_KHOROS_API_URL || '❌ Not set')
  console.log('Bulk API URL:', import.meta.env.VITE_KHOROS_BULK_API_URL || '❌ Not set')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

export default {
  testKhorosConnection,
  showApiConfig
}

