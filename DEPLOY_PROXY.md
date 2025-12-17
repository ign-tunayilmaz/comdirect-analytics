# How to Deploy the Proxy Server

GitHub Pages only serves static files, so you **cannot** deploy the Node.js proxy server there. You need to deploy it to a service that supports Node.js servers.

## Option 1: Vercel (Recommended - Easiest & Free)

Vercel supports serverless functions and is perfect for this use case.

### Steps:

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Create `api/khoros/posts.js`** in your project root:
   ```javascript
   // api/khoros/posts.js
   const axios = require('axios');
   
   module.exports = async (req, res) => {
     // Enable CORS
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
   
     if (req.method === 'OPTIONS') {
       return res.status(200).end();
     }
   
     const { fromDate, toDate } = req.query;
     
     if (!fromDate || !toDate) {
       return res.status(400).json({ 
         error: 'Missing required parameters: fromDate and toDate (format: YYYYMMDD)' 
       });
     }
   
     const KHOROS_CONFIG = {
       communityId: process.env.KHOROS_COMMUNITY_ID || 'comdirectbank.prod',
       clientId: process.env.KHOROS_CLIENT_ID,
       accessToken: process.env.KHOROS_ACCESS_TOKEN,
       baseUrl: 'https://eu.api.lithium.com/lsi-data/v1/data/export/community'
     };
   
     if (!KHOROS_CONFIG.clientId || !KHOROS_CONFIG.accessToken) {
       return res.status(500).json({ 
         error: 'Khoros API credentials not configured' 
       });
     }
   
     try {
       const url = `${KHOROS_CONFIG.baseUrl}/${KHOROS_CONFIG.communityId}?fromDate=${fromDate}&toDate=${toDate}`;
       const basicAuth = Buffer.from(`${KHOROS_CONFIG.accessToken}:`).toString('base64');
   
       const response = await axios({
         method: 'GET',
         url: url,
         headers: {
           'client-id': KHOROS_CONFIG.clientId,
           'Authorization': `Basic ${basicAuth}`,
           'Accept': 'text/csv',
         },
       });
   
       // Parse CSV and return JSON (same logic as proxy-server.cjs)
       const csvData = response.data;
       const lines = csvData.split('\n').filter(line => line.trim());
       const dataLines = lines.slice(1);
       
       // ... (add CSV parsing logic from proxy-server.cjs)
       
       res.json({ records: [] }); // Replace with parsed data
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   };
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   Follow the prompts and add your environment variables when asked.

4. **Set Environment Variables in Vercel Dashboard**:
   - Go to your project on Vercel
   - Settings → Environment Variables
   - Add:
     - `KHOROS_COMMUNITY_ID`
     - `KHOROS_CLIENT_ID`
     - `KHOROS_ACCESS_TOKEN`

5. **Get your proxy URL**: `https://your-project.vercel.app/api/khoros/posts`

---

## Option 2: Railway (Simple & Free Tier Available)

1. **Go to** [railway.app](https://railway.app)
2. **Create new project** → **Deploy from GitHub repo**
3. **Select your repository**
4. **Add environment variables**:
   - `KHOROS_COMMUNITY_ID`
   - `KHOROS_CLIENT_ID`
   - `KHOROS_ACCESS_TOKEN`
5. **Set start command**: `node proxy-server.cjs`
6. **Deploy** - Railway will give you a URL like `https://your-app.railway.app`

---

## Option 3: Render (Free Tier Available)

1. **Go to** [render.com](https://render.com)
2. **New** → **Web Service**
3. **Connect your GitHub repository**
4. **Configure**:
   - **Name**: `comdirect-proxy`
   - **Environment**: `Node`
   - **Build Command**: (leave empty)
   - **Start Command**: `node proxy-server.cjs`
5. **Add Environment Variables**:
   - `KHOROS_COMMUNITY_ID`
   - `KHOROS_CLIENT_ID`
   - `KHOROS_ACCESS_TOKEN`
   - `PORT` (Render sets this automatically, but you can set it)
6. **Deploy** - Get URL like `https://comdirect-proxy.onrender.com`

---

## Option 4: Heroku (Classic, but requires credit card for free tier)

1. **Install Heroku CLI**
2. **Login**: `heroku login`
3. **Create app**: `heroku create comdirect-proxy`
4. **Set environment variables**:
   ```bash
   heroku config:set KHOROS_COMMUNITY_ID=comdirectbank.prod
   heroku config:set KHOROS_CLIENT_ID=your_client_id
   heroku config:set KHOROS_ACCESS_TOKEN=your_token
   ```
5. **Deploy**: `git push heroku master`
6. **Get URL**: `https://comdirect-proxy.herokuapp.com`

---

## After Deploying Proxy Server

1. **Update GitHub Secret**:
   - Go to your GitHub repo → Settings → Secrets
   - Update `VITE_KHOROS_PROXY_URL` with your deployed proxy URL
   - Example: `https://your-proxy.vercel.app/api/khoros/posts`

2. **Redeploy GitHub Pages**:
   - Push a commit or manually trigger the workflow
   - The build will use the new proxy URL

---

## Quick Test

Test your deployed proxy:
```bash
curl "https://your-proxy-url.com/api/khoros/posts?fromDate=20251101&toDate=20251130"
```

Or visit in browser:
```
https://your-proxy-url.com/health
```

---

## Recommended: Vercel

Vercel is the easiest option because:
- ✅ Free tier is generous
- ✅ Automatic deployments from GitHub
- ✅ Serverless functions (no server management)
- ✅ Fast and reliable
- ✅ Easy environment variable management





