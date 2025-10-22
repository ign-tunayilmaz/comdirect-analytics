# Khoros API Integration Setup Guide

## Overview

The comdirect community platform is powered by Khoros. You can use the [Khoros Bulk Data API](https://community.khoros.com/kb/khoros-communities-classic-docs/bulk-data-api-faqs/438764) to fetch real data instead of using mock data.

## Getting API Access

### 1. Request API Credentials

Contact your Khoros administrator or Comdirect community team to request:
- **API Key** or **OAuth credentials**
- **API endpoint URL** (typically: `https://community.comdirect.de/api/2.0`)
- **Permissions** for reading messages and user data

### 2. Authentication Methods

Khoros supports multiple authentication methods:

- **API Key/Token**: Simplest method, pass in Authorization header
- **OAuth 2.0**: More secure, requires token refresh flow
- **Session-based**: Using li-api-session-key header

## Environment Variables

Create a `.env.local` file in the project root with:

```env
VITE_KHOROS_API_URL=https://community.comdirect.de/api/2.0
VITE_KHOROS_API_KEY=your_api_key_here
VITE_KHOROS_BULK_API_URL=https://community.comdirect.de/api/bulk
```

## API Integration

### Using the Khoros API Module

The `src/utils/khorosApi.js` module provides functions to:

```javascript
import { fetchPostsFromKhorosAPI } from './utils/khorosApi'

// Fetch posts with filters
const posts = await fetchPostsFromKhorosAPI({
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  limit: 100,
  category: 'platform-feedback'
})
```

### Switching from Mock to Real Data

Update `src/utils/dataCollector.js`:

```javascript
import { fetchPostsFromKhorosAPI } from './khorosApi'

export const fetchCommunityPosts = async (options = {}) => {
  const { filters = {} } = options
  
  // Check if API is configured
  if (import.meta.env.VITE_KHOROS_API_KEY) {
    // Use real Khoros API
    return await fetchPostsFromKhorosAPI({
      startDate: filters.dateFrom,
      endDate: filters.dateTo,
      limit: options.limit,
      category: filters.platformRelated ? 'community-platform' : null
    })
  } else {
    // Fallback to mock data
    console.warn('Khoros API not configured, using mock data')
    return generateMockPosts(options.limit)
  }
}
```

## LiQL Query Examples

Khoros uses LiQL (Lithium Query Language), similar to SQL:

### Get Recent Posts
```sql
SELECT id, subject, body, author, post_time, kudos.sum(weight), replies.count(*)
FROM messages
WHERE depth = 0 AND post_time > '2024-01-01'
ORDER BY post_time DESC
LIMIT 100
```

### Get Posts by Category
```sql
SELECT *
FROM messages
WHERE board.id = 'platform-feedback'
LIMIT 50
```

### Get User Activity
```sql
SELECT login, posts_count, kudos_received.sum(weight)
FROM users
WHERE last_visit_time > '2024-01-01'
ORDER BY posts_count DESC
```

## API Endpoints

### Search API
```
GET /api/2.0/search?q=SELECT...
```

### Bulk Data Export
```
POST /api/bulk/export
```

### User Profile
```
GET /api/2.0/users/id/{user_id}
```

## Rate Limiting

- Khoros typically enforces rate limits (e.g., 60 requests/minute)
- Bulk Data API is better for large exports
- Implement caching to minimize API calls

## Testing

Test your API connection:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://community.comdirect.de/api/2.0/search?q=SELECT id FROM messages LIMIT 1"
```

## Resources

- [Khoros Bulk Data API Docs](https://community.khoros.com/kb/khoros-communities-classic-docs/bulk-data-api-faqs/438764)
- [Khoros Developer Portal](https://developer.khoros.com/)
- [LiQL Query Reference](https://developer.khoros.com/khoroscommunitydevdocs/docs/using-liql)

## Next Steps

1. ✅ Request API credentials from Comdirect/Khoros admin
2. ✅ Add credentials to `.env.local`
3. ✅ Test connection with simple query
4. ✅ Update `dataCollector.js` to use real API
5. ✅ Add error handling and fallback logic
6. ✅ Implement caching for performance
7. ✅ Add sentiment analysis integration (optional)

## Support

For API access issues, contact:
- **Comdirect Community Team**: [community support email]
- **Khoros Support**: https://community.khoros.com/

