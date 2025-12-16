# No Local Proxy Server Required

## ✅ What Changed

The app now **automatically uses the Vercel serverless function** (`/api/khoros/posts`) instead of requiring a local proxy server. This means:

- ✅ **No need to run `npm run proxy`** on your local machine
- ✅ **Works for your entire team** - no local setup required
- ✅ **Works in both development and production** automatically
- ✅ **No localhost dependency** - everything runs through Vercel

## 🔧 How It Works

1. The app automatically uses `/api/khoros/posts` (Vercel serverless function)
2. The serverless function handles CORS and authentication server-side
3. Credentials are stored securely in Vercel environment variables (not exposed to frontend)

## 📋 Required Vercel Environment Variables

Make sure these are set in your **Vercel Dashboard** → **Settings** → **Environment Variables**:

### Serverless Function Variables (Backend)
These are used by `api/khoros/posts.js`:

- `KHOROS_COMMUNITY_ID` - Your Khoros community ID (e.g., `comdirectbank.prod`)
- `KHOROS_CLIENT_ID` - Your Khoros API client ID
- `KHOROS_ACCESS_TOKEN` - Your Khoros API access token

### Frontend Variables (Optional)
- `VITE_GOOGLE_CLIENT_ID` - For Google Sign-In (if using authentication)
- `VITE_KHOROS_PROXY_URL` - **NOT REQUIRED** anymore (app uses `/api/khoros/posts` automatically)

## 🚀 Deployment

1. **Set environment variables in Vercel** (see above)
2. **Push to GitHub** - Vercel will auto-deploy
3. **That's it!** No local proxy server needed

## 🧪 Local Development

When running locally (`npm run dev`):
- The app will use `http://localhost:5173/api/khoros/posts` (relative path)
- Vite dev server will proxy this to your Vercel serverless function
- **OR** you can still run `npm run proxy` if you want to test with a local proxy

## ⚠️ Important Notes

- The `proxy-server.cjs` file is still in the repo but **not required** for production
- The `VITE_KHOROS_PROXY_URL` environment variable is **optional** - if not set, the app automatically uses `/api/khoros/posts`
- If you do set `VITE_KHOROS_PROXY_URL`, it will override the default behavior (useful for custom proxy setups)

## 🔍 Troubleshooting

### "Cannot determine proxy endpoint" error
- Make sure `api/khoros/posts.js` exists in your project
- Verify Vercel is deploying the serverless function correctly
- Check Vercel deployment logs for any errors

### API calls failing
- Verify `KHOROS_COMMUNITY_ID`, `KHOROS_CLIENT_ID`, and `KHOROS_ACCESS_TOKEN` are set in Vercel
- Check Vercel function logs: **Vercel Dashboard** → **Deployments** → **Functions** → **View Logs**

### Still seeing localhost errors
- Remove `VITE_KHOROS_PROXY_URL` from Vercel environment variables (or set it to your Vercel URL)
- The app will automatically use the serverless function if no proxy URL is configured

