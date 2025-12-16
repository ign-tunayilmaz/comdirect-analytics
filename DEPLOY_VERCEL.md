# Deploy to Vercel - Complete Guide

Vercel is the **recommended** deployment platform for this project because:
- ✅ Free tier with generous limits
- ✅ Supports both React frontend and serverless API functions
- ✅ Automatic deployments from GitHub
- ✅ Built-in environment variable management
- ✅ Fast global CDN
- ✅ No server management needed

## Prerequisites

1. **GitHub account** (if deploying from GitHub)
2. **Vercel account** - Sign up at [vercel.com](https://vercel.com) (free)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Easiest)

1. **Push your code to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Project**:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**:
   Click "Environment Variables" and add:
   
   **For the API Proxy (Serverless Functions):**
   ```
   KHOROS_COMMUNITY_ID = comdirectbank.prod
   KHOROS_CLIENT_ID = your_client_id_here
   KHOROS_ACCESS_TOKEN = your_access_token_here
   ```
   
   **For the Frontend:**
   ```
   VITE_KHOROS_PROXY_URL = https://your-project-name.vercel.app/api/khoros/posts
   ```
   
   ⚠️ **Important**: You'll need to deploy first to get the URL, then update this variable and redeploy.

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

6. **Update Proxy URL** (after first deployment):
   - Go to Project Settings → Environment Variables
   - Update `VITE_KHOROS_PROXY_URL` with your actual Vercel URL
   - Redeploy (or it will auto-deploy on next push)

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Link to existing project or create new
   - Confirm settings
   - Add environment variables when prompted

4. **Set Environment Variables**:
   ```bash
   vercel env add KHOROS_COMMUNITY_ID
   vercel env add KHOROS_CLIENT_ID
   vercel env add KHOROS_ACCESS_TOKEN
   vercel env add VITE_KHOROS_PROXY_URL
   ```

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

## Project Structure for Vercel

Your project is already configured correctly:

```
comdirect-analytics/
├── api/
│   └── khoros/
│       └── posts.js          # Serverless function (auto-deployed)
├── src/                      # React app
├── vercel.json               # Vercel configuration ✅
├── vite.config.js
└── package.json
```

The `api/` folder structure automatically creates serverless functions in Vercel:
- `api/khoros/posts.js` → `https://your-app.vercel.app/api/khoros/posts`

## Environment Variables Setup

### Required Variables

**For Serverless Functions** (in Vercel Dashboard → Settings → Environment Variables):

| Variable | Description | Example |
|----------|-------------|---------|
| `KHOROS_COMMUNITY_ID` | Khoros community ID | `comdirectbank.prod` |
| `KHOROS_CLIENT_ID` | Khoros API client ID | `your_client_id` |
| `KHOROS_ACCESS_TOKEN` | Khoros API access token | `your_token` |

**For Frontend Build**:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_KHOROS_PROXY_URL` | Your Vercel API endpoint | `https://your-app.vercel.app/api/khoros/posts` |

### Setting Environment Variables

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Key**: Variable name
   - **Value**: Variable value
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**

⚠️ **Note**: After adding `VITE_KHOROS_PROXY_URL`, you need to **redeploy** for the frontend to use it.

## Testing Your Deployment

1. **Test the API endpoint**:
   ```
   https://your-app.vercel.app/api/khoros/posts?fromDate=20251201&toDate=20251216
   ```

2. **Test the health endpoint** (if you add one):
   ```
   https://your-app.vercel.app/api/khoros/posts
   ```

3. **Test the frontend**:
   - Visit `https://your-app.vercel.app`
   - Try fetching data
   - Check browser console for errors

## Troubleshooting

### Error: "Khoros API is not configured"

**Solution**: 
- Check environment variables are set in Vercel Dashboard
- Make sure variables are added to **all environments** (Production, Preview, Development)
- Redeploy after adding variables

### Error: "Failed to fetch" or CORS error

**Solution**:
- Verify `VITE_KHOROS_PROXY_URL` is set correctly
- Make sure it points to your Vercel API endpoint: `https://your-app.vercel.app/api/khoros/posts`
- Redeploy frontend after updating the variable

### API returns 401/403

**Solution**:
- Verify `KHOROS_CLIENT_ID` and `KHOROS_ACCESS_TOKEN` are correct
- Check credentials haven't expired
- Make sure variables are set in Vercel (not just locally)

### Build fails

**Solution**:
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18 by default)

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

1. **Push to main/master branch** → Deploys to production
2. **Push to other branches** → Creates preview deployment
3. **Pull requests** → Creates preview deployment for testing

## Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel handles SSL certificates automatically

## Cost

- **Free Tier**: 
  - 100GB bandwidth/month
  - 100 serverless function invocations/day
  - Unlimited deployments
  - Perfect for development and small projects

- **Pro Tier** ($20/month):
  - More bandwidth
  - More function invocations
  - Team features

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Set environment variables
3. ✅ Test the API endpoint
4. ✅ Test the frontend
5. ✅ Share your live URL!

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)

---

**Ready to deploy?** Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository!

