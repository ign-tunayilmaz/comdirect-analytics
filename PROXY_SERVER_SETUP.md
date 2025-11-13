# Backend Proxy Server Setup

## Why You Need This

Web browsers block "cross-origin" requests (CORS) for security. When your React app (running on `localhost:3000`) tries to call the Khoros API (on `eu.api.lithium.com`), the browser blocks it.

**This is NORMAL and happens with most enterprise APIs.**

The solution: A simple backend server that calls the API for you (servers don't have CORS restrictions).

---

## Quick Setup (5 minutes)

### Step 1: Install Dependencies

Axios is already installed in your project, but if needed:

```bash
npm install express cors axios
```

**Note:** We use `axios` because it works reliably with CommonJS (`.cjs`) files.

### Step 2: Start the Proxy Server

Open a **new terminal window** (keep your React app running in the other one) and run:

```bash
node proxy-server.cjs
```

**Note:** The file is `.cjs` (not `.js`) because your project uses ES modules.

You should see:

```
🚀 ============================================
✅ Khoros API Proxy Server running on port 3001
📡 Endpoint: http://localhost:3001/api/khoros/posts
🔧 Health Check: http://localhost:3001/health
============================================
```

### Step 3: Restart Your React App

1. Stop the React dev server (if running)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 4: Test It!

1. Go to your browser at `http://localhost:3000`
2. Navigate to the Data Collector page
3. Click **"Collect Posts"**
4. You should now see **real data** from the Khoros API!

---

## Verification

### Check if Proxy is Running

Open browser and go to:
```
http://localhost:3001/health
```

You should see:
```json
{
  "status": "ok",
  "message": "Khoros API Proxy Server is running",
  "timestamp": "2025-11-13T..."
}
```

### Check Browser Console

When you collect posts, you should see:
```
🔄 Using proxy server to bypass CORS
📡 API Request URL: http://localhost:3001/api/khoros/posts?fromDate=...&toDate=...
✅ Khoros API Response received
```

### Check Proxy Server Console

You should see:
```
📡 Proxying request to Khoros API: 20251014 to 20251113
🔗 Request URL: https://eu.api.lithium.com/lsi-data/v1/data/export/community/...
✅ Successfully fetched data from Khoros API
```

---

## Troubleshooting

### Error: "Cannot find module 'express'"

**Solution:** Install dependencies:
```bash
npm install express cors node-fetch
```

### Error: "Port 3001 already in use"

**Solution:** Kill the process using port 3001:
```bash
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process

# Or change the port in proxy-server.js (line 84):
const PORT = process.env.PORT || 3002;  // Use 3002 instead
```

Then update `.env.local`:
```
VITE_KHOROS_PROXY_URL=http://localhost:3002/api/khoros/posts
```

### Proxy server starts but React app still gets CORS error

**Solution:** Make sure you restarted the React dev server after updating `.env.local`

1. Stop React dev server (Ctrl+C)
2. Start again: `npm run dev`
3. Hard refresh browser (Ctrl+Shift+R)

### API returns 401 or 403 error

**Solution:** Your credentials may be incorrect or expired. Check:
- `proxy-server.js` lines 18-22 have correct credentials
- Access token is still valid (contact Khoros support)

---

## How It Works

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │         │    Proxy    │         │  Khoros API │
│ (localhost  │────────>│   Server    │────────>│             │
│    :3000)   │   ✅    │ (localhost  │   ✅    │ (eu.api     │
│             │<────────│    :3001)   │<────────│  .lithium   │
│  React App  │         │  Node.js    │         │    .com)    │
└─────────────┘         └─────────────┘         └─────────────┘
 No CORS Issue          No CORS Issue          Real API Data
```

1. Your React app calls the proxy at `localhost:3001`
2. Proxy adds authentication headers
3. Proxy calls the real Khoros API
4. Proxy returns the data to your React app
5. No CORS errors! ✅

---

## Production Deployment

For production, you'll need to:

1. **Deploy the proxy server** to a hosting service:
   - Heroku
   - AWS Lambda
   - Vercel Serverless Functions
   - DigitalOcean
   - etc.

2. **Update environment variable** with production proxy URL:
   ```
   VITE_KHOROS_PROXY_URL=https://your-proxy-server.com/api/khoros/posts
   ```

3. **Secure the proxy**:
   - Add rate limiting
   - Add API key authentication
   - Restrict allowed origins
   - Use environment variables for credentials (don't commit them!)

---

## Security Notes

🔒 **Important:**

- The `proxy-server.js` file contains your API credentials
- **DO NOT** commit this file to public repositories
- Add `proxy-server.js` to `.gitignore` if sharing code
- In production, use environment variables
- Consider adding authentication to your proxy endpoints

---

## Alternative: Use Khoros Official SDKs

If Khoros provides official JavaScript SDKs or widgets, they may handle CORS properly. Check:
- https://developer.khoros.com/
- Khoros documentation
- Contact Khoros support

---

**Status:** Proxy server ready to use! Start it with `node proxy-server.js`

**Last Updated:** November 13, 2025

