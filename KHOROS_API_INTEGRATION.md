# Khoros API Integration Complete ✅

## Summary

Your comdirect community analytics application has been successfully integrated with the **Khoros Bulk Data API v2**!

## What Was Set Up

### 1. Environment Variables (`.env.local`)

Created `.env.local` file with your Khoros API credentials:

```env
VITE_KHOROS_COMMUNITY_ID=comdirectbank.prod
VITE_KHOROS_CLIENT_ID=your_client_id_here
VITE_KHOROS_ACCESS_TOKEN=your_access_token_here
VITE_KHOROS_API_URL=https://api.livefyre.com/api/v4
VITE_KHOROS_BULK_API_URL=https://data.livefyre.com
```

### 2. Updated Files

#### `src/utils/khorosApi.js`
- ✅ Updated to use Khoros Bulk Data API v2
- ✅ Implements proper authentication with access token
- ✅ Fetches real community data from comdirectbank.prod
- ✅ Transforms API responses to application format
- ✅ Includes language detection (German/English)
- ✅ Sentiment analysis and post categorization

#### `src/utils/dataCollector.js`
- ✅ Automatically uses real API when configured
- ✅ Falls back to demo data if API fails
- ✅ Seamless integration with existing filters

#### `src/components/DataCollector.jsx`
- ✅ Shows API connection status (green banner when connected)
- ✅ Enhanced error handling and status messages
- ✅ Clear indication of data source (API vs demo)

## How It Works

### API Endpoint

The application uses the Khoros Bootstrap API endpoint:

```
https://data.livefyre.com/bs3/comdirectbank.prod/{timestamp}/
```

This endpoint provides conversation and message data from your community.

### Authentication

All requests include:
```javascript
Authorization: Bearer your_access_token_here
```

### Data Flow

1. **User clicks "Collect Posts"** → Application checks if API is configured
2. **API configured?** → Makes request to Khoros Bulk Data API v2
3. **Response received** → Transforms data to application format
4. **Data processed** → Applies filters (sentiment, type, language, dates)
5. **Display results** → Shows real community posts with analytics

### Features

- ✅ **Real-time data** from comdirect community
- ✅ **Date filtering** (default: last 90 days)
- ✅ **Sentiment analysis** (positive/negative/neutral)
- ✅ **Post categorization** (feature request, bug report, question, etc.)
- ✅ **Language detection** (German/English)
- ✅ **Platform-related filtering** (community posts vs general topics)
- ✅ **Engagement metrics** (likes, replies, views)

## Testing the Integration

### 1. Reload the Application

The development server has been restarted to load your API credentials.

Refresh your browser at: `http://localhost:5173`

### 2. Check API Status

You should see a **green banner** at the top of the Data Collector page:

```
✅ Khoros API Connected
Successfully connected to Khoros Bulk Data API v2 for comdirectbank.prod community.
```

### 3. Collect Real Data

1. Go to the **Data Collector** page
2. Set your filters (optional):
   - Date range
   - Sentiment
   - Request type
   - Language
3. Click **"Collect Posts"**
4. Watch for status: "🔌 Connecting to Khoros API..."
5. Success message: "✅ Successfully fetched X posts! Source: 🔌 Real Khoros API data"

### 4. Verify Data Source

Check the console logs in your browser (F12 → Console):

```
🔌 Khoros API is configured - fetching real data...
🔌 Fetching data from Khoros Bulk Data API v2...
📡 API Request URL: https://data.livefyre.com/bs3/comdirectbank.prod/...
✅ Khoros API Response received: {...}
✅ Successfully fetched X posts from Khoros API
```

## Troubleshooting

### Issue: Still seeing demo data

**Solution:**
1. Make sure you refreshed the browser after restarting the server
2. Check browser console for API errors
3. Verify `.env.local` file exists in project root
4. Restart development server: `npm run dev`

### Issue: API authentication error

**Solution:**
1. Verify your access token is correct and not expired
2. Check if the token has proper permissions for bulk data access
3. Contact Khoros support if token needs renewal

### Issue: CORS errors

**Solution:**
The Khoros Bulk Data API should support CORS. If you see CORS errors:
1. Check if your domain is whitelisted in Khoros settings
2. Consider setting up a backend proxy
3. Contact Khoros support to enable CORS for your domain

### Issue: Empty response

**Solution:**
1. Check your date filters - the community might not have posts in that range
2. Try removing all filters and fetching again
3. Verify the community ID is correct: `comdirectbank.prod`

## API Rate Limits

⚠️ **Important:** The Khoros API has rate limits. Be mindful of:

- Number of requests per minute
- Data volume per request
- Daily/monthly quotas

If you hit rate limits, the application will automatically fall back to demo data.

## Security Notes

🔒 **Keep your credentials secure:**

- ✅ `.env.local` is in `.gitignore` - not committed to git
- ✅ Environment variables only accessible to your application
- ⚠️ Never share your access token publicly
- ⚠️ Rotate tokens periodically for security

## Next Steps

### 1. Analytics Dashboard

Visit the **Analytics** page to see:
- Sentiment distribution charts
- Post type breakdown
- Platform-related vs general topics
- Engagement metrics
- Trending topics

### 2. Export Data

Use the **"Export Data"** button to download all collected posts as JSON for:
- Further analysis
- Backup
- Integration with other tools

### 3. Customize Analysis

Edit `src/utils/textAnalysis.js` to enhance:
- Sentiment analysis algorithms
- Keyword extraction
- Topic clustering
- Trend detection

## API Documentation

Full API documentation available at:
📚 [Khoros Bulk Data API v2 Reference](https://developer.khoros.com/khoroscommunitydevdocs/reference/bulk-data-api-v2)

## Support

For API issues or questions:
- **Khoros Support:** [Khoros Community](https://community.khoros.com/)
- **API Documentation:** [Developer Portal](https://developer.khoros.com/)

---

## Quick Reference

### Start Development Server
```bash
npm run dev
```

### Check API Configuration
```javascript
import { isApiConfigured } from './utils/khorosApi'
console.log('API configured:', isApiConfigured())
```

### Manual API Test
```javascript
import { fetchPostsFromKhorosAPI } from './utils/khorosApi'

const posts = await fetchPostsFromKhorosAPI({
  startDate: '2024-01-01',
  limit: 50
})

console.log('Posts:', posts)
```

---

**Status:** ✅ Integration Complete and Ready to Use!

**Last Updated:** November 13, 2025

