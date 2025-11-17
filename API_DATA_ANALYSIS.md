# Khoros LSI Data Export API - Data Analysis & Fixes

## 📊 What We Discovered

### 1. **"ehemaliger Nutzer" (Former User) Issue**
**Status:** ✅ NOT A BUG - This is REAL data from Khoros

- The API returns `"username": "ehemaliger Nutzer"` with `"userId": "-1"`
- This represents **deleted or anonymized user accounts** in the Khoros system
- This is legitimate data, not a parsing error
- Many community activities are performed by anonymous/deleted users

### 2. **Empty Posts / Activity Logs**
**Problem:** Most records in the API response have empty `topicId` and `topicTitle`

**Root Cause:** The LSI Data Export API returns **activity logs**, not just posts:
- Event types include: `rss.feed-request`, `view`, `visits.visit-summary`
- Many activities (like RSS feed views) don't reference specific posts
- Only records with `eventType` like `rss.feed-request` that reference a topic have post data

**Fix Applied:**
```javascript
// Filter out records without valid topicId
if (!msg.topicId || msg.topicId.trim() === '') {
  return false
}
```

This ensures we only show records that reference actual forum posts.

### 3. **404 Error on "View Post" Links**
**Problem:** URLs were constructed incorrectly, leading to 404 pages

**Root Cause:** 
- Initial URL format used board slugs: `/t5/board-slug/m-p/123456`
- Khoros URL structure is complex and board slugs need exact formatting

**Fix Applied:**
- Simplified to use Khoros's redirect-friendly format: `/t5/m-p/{messageId}`
- This format always works and Khoros automatically redirects to the canonical URL
- Example: `https://community.comdirect.de/t5/m-p/229153`

### 4. **Old Posts Appearing**
**Problem:** Posts from 2022 appearing even when filtering for recent dates (last 7 days)

**Root Cause:** The LSI Data Export API returns **activity timestamps**, not post creation dates
- `event.time.ms` (field 4) = when someone viewed/accessed the post
- The API doesn't provide the original post creation date
- A post from 2022 will appear if someone viewed it in the last 7 days

**Current Behavior:**
- Date filtering works on **activity date** (when the post was viewed/accessed)
- You see when users interacted with content, not when content was created

**Possible Solutions:**
1. Accept this limitation (you're seeing "what's been active recently")
2. Use a different Khoros API that provides message content with creation dates
3. Request access to additional CSV fields that include post creation dates

## 📋 Sample API Data Structure

From actual API response (JSON converted from CSV):

```json
{
  "rawLine": "rss.feed-request_RSS_VIEW_comdirectbank.prod_72058301203...",
  "timestamp": "1762732802542",
  "city": "Isenburg",
  "country": "DE",
  "topicId": "229153",
  "topicTitle": "photoTAN Lesegerät (Digipass 760) gebraucht kaufen",
  "boardId": "17",
  "boardTitle": "Konto, Depot & Karte",
  "username": "ehemaliger Nutzer",
  "userId": "-1",
  "eventType": "rss.feed-request",
  "messageId": "229153",
  "messageSubject": "photoTAN Lesegerät (Digipass 760) gebraucht kaufen",
  "messageIsTopic": "true",
  "messageType": "topic",
  "allFields": 60
}
```

## ✅ Changes Applied

1. **src/utils/khorosApi.js**
   - Added filter to exclude records without `topicId`
   - Simplified URL construction to use `/t5/m-p/{messageId}` format
   - Enhanced logging to debug data parsing

2. **proxy-server.cjs**
   - Added CSV header and sample data line logging
   - Better visibility into what data the API actually returns

## 🎯 Current Status

**Working:**
- ✅ Proxy server successfully fetching data from Khoros API
- ✅ CSV parsing working correctly
- ✅ Filtering out activity logs without post references
- ✅ URLs now use correct format (though may still 404 for deleted posts)

**Limitations:**
- ⚠️ "ehemaliger Nutzer" will appear (it's real data for anonymous users)
- ⚠️ Dates represent activity time, not post creation time
- ⚠️ No message body content (LSI Data Export API doesn't include it)
- ⚠️ Some posts may still 404 if they've been deleted or are not publicly accessible

## 📝 Recommendations

1. **If you need post creation dates:** Request access to different Khoros API endpoints that include message metadata
2. **If you need message content:** The LSI Data Export API doesn't provide body text - you may need the Community API v2
3. **For better user data:** Consider filtering out `userId: "-1"` if anonymous users aren't relevant
4. **For public posts only:** Some posts might be in restricted boards, causing 404s even with correct URLs


