# CORS Issue and Solutions

## Current Status

✅ **API Credentials:** Configured and working  
✅ **API Endpoint:** `https://community.comdirect.de/api/2.0/search`  
❌ **Problem:** CORS (Cross-Origin Resource Sharing) blocked by browser

## What is CORS?

CORS is a security feature that browsers enforce to prevent malicious websites from accessing APIs they shouldn't. When you try to access the Khoros API from your browser at `localhost:3000`, the browser blocks the request because:

1. Your app runs on `http://localhost:3000`
2. The API is on `https://community.comdirect.de`
3. The Khoros API doesn't send proper CORS headers allowing `localhost:3000` to access it

## Error You're Seeing

```
Access to fetch at 'https://community.comdirect.de/api/2.0/search' 
from origin 'http://localhost:3000' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution Options

### Option 1: Backend Proxy Server (Recommended)

Create a simple backend server that acts as a proxy between your frontend and the Khoros API.

#### Quick Setup with Node.js + Express:

1. **Install dependencies:**
```bash
npm install express cors node-fetch
```

2. **Create `server.js`:**
```javascript
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const KHOROS_CONFIG = {
  communityId: 'comdirectbank.prod',
  accessToken: '6d100a667bbc8a27e9d6e8b773b9e02d2400d21e',
  apiUrl: 'https://community.comdirect.de/api/2.0/search'
};

app.get('/api/posts', async (req, res) => {
  try {
    const { q } = req.query;
    
    const url = `${KHOROS_CONFIG.apiUrl}?q=${encodeURIComponent(q)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${KHOROS_CONFIG.accessToken}`,
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
```

3. **Run the proxy:**
```bash
node server.js
```

4. **Update `.env.local`:**
```env
VITE_KHOROS_API_PROXY=http://localhost:3001/api/posts
```

5. **Update `src/utils/khorosApi.js`:**
Change the URL from:
```javascript
const url = `https://community.comdirect.de/api/2.0/search?q=${encodeURIComponent(query)}`
```

To:
```javascript
const proxyUrl = import.meta.env.VITE_KHOROS_API_PROXY || 
                 'http://localhost:3001/api/posts';
const url = `${proxyUrl}?q=${encodeURIComponent(query)}`
```

---

### Option 2: Contact Khoros Support

Ask Khoros/comdirect to add CORS headers to their API:

**Contact:** Khoros Support or comdirect API team

**Request:**
> Please add the following CORS headers to the community API endpoints:
> ```
> Access-Control-Allow-Origin: http://localhost:3000
> Access-Control-Allow-Origin: https://yourdomain.com
> Access-Control-Allow-Methods: GET, POST, OPTIONS
> Access-Control-Allow-Headers: Authorization, Content-Type
> ```

---

### Option 3: Browser Extension (Development Only)

⚠️ **Only for development testing - NOT for production**

Install a CORS browser extension:
- Chrome: "Allow CORS: Access-Control-Allow-Origin"
- Firefox: "CORS Everywhere"

This temporarily disables CORS in your browser for testing.

---

### Option 4: Use Khoros Widgets/SDKs

Khoros might provide official JavaScript SDKs or embeddable widgets that handle authentication properly:

- Check [Khoros Developer Documentation](https://developer.khoros.com/)
- Look for JavaScript SDK or Community Widgets
- These are designed to work in browsers with proper CORS handling

---

### Option 5: Server-Side Rendering (SSR)

If you're building for production, consider using:
- **Next.js** (React with SSR)
- **Nuxt.js** (Vue with SSR)
- **SvelteKit** (Svelte with SSR)

These frameworks can make API calls server-side, bypassing CORS entirely.

---

## Recommended Solution

**For your current setup:** Use **Option 1 (Backend Proxy Server)**

### Why?
- ✅ Quick to implement
- ✅ Works immediately
- ✅ Keeps your credentials secure server-side
- ✅ No need to wait for Khoros support
- ✅ Production-ready with minor modifications

### Next Steps:

1. Create the proxy server (see Option 1 above)
2. Update environment variables
3. Update the API call URL
4. Test the connection

---

## Alternative: Use the Bulk Data Export

If you don't need real-time data, you can:

1. Request bulk data exports from Khoros
2. Download CSV/JSON files
3. Import them into your application
4. Process locally without API calls

This avoids CORS entirely and works well for analytics dashboards.

---

## Security Notes

🔒 **Important:**

- Never expose your access token in frontend code
- Always use environment variables
- In production, move all API calls to a backend
- Implement rate limiting on your proxy
- Add authentication to your proxy endpoints

---

## Need Help?

If you need assistance implementing the proxy server or have questions:

1. Check the documentation: `KHOROS_API_INTEGRATION.md`
2. Review Khoros docs: https://developer.khoros.com/
3. Contact Khoros support for API access details

---

**Status:** Demo data removed. Application now requires working API connection or will show CORS errors.

**Last Updated:** November 13, 2025

