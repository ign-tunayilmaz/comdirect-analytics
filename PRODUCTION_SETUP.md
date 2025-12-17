# Production Setup Guide

## For GitHub Pages Deployment

The live version on GitHub Pages needs the proxy URL configured as an environment variable during the build process.

### Step 1: Deploy Your Proxy Server

First, deploy your proxy server to a hosting service (Heroku, Vercel, AWS, etc.) and get the production URL.

Example: `https://your-proxy-server.herokuapp.com/api/khoros/posts`

### Step 2: Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VITE_KHOROS_PROXY_URL`
5. Value: Your production proxy URL (e.g., `https://your-proxy-server.herokuapp.com/api/khoros/posts`)
6. Click **Add secret**

### Step 3: Rebuild and Deploy

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is already configured to use this secret. Simply:

1. Push any change to the `master` branch, OR
2. Go to **Actions** tab → **Deploy to GitHub Pages** → **Run workflow**

The build will automatically use the `VITE_KHOROS_PROXY_URL` secret during the build process.

### Step 4: Verify

After deployment, the live version should be able to connect to your proxy server and fetch data from the Khoros API.

## Alternative: Local Build with Environment Variable

If you want to build locally and deploy manually:

```bash
# Set the environment variable
$env:VITE_KHOROS_PROXY_URL="https://your-proxy-server.herokuapp.com/api/khoros/posts"

# Build
npm run build

# Deploy
npm run deploy
```

## Troubleshooting

### Error: "Khoros API is not configured"

This means `VITE_KHOROS_PROXY_URL` is not set during the build. Check:
- ✅ GitHub secret is set correctly
- ✅ Secret name is exactly `VITE_KHOROS_PROXY_URL`
- ✅ Proxy server is deployed and accessible
- ✅ Build logs show the environment variable is being used

### Error: "Failed to fetch" or Connection Refused

This means the proxy server is not running or not accessible:
- ✅ Check proxy server is deployed and running
- ✅ Verify the proxy URL is correct
- ✅ Test the proxy URL directly in a browser: `https://your-proxy-server.herokuapp.com/health`
- ✅ Check CORS settings on your proxy server allow requests from your GitHub Pages domain

## Notes

- Environment variables prefixed with `VITE_` are embedded into the build at build time
- They cannot be changed after the build without rebuilding
- Never commit actual credentials to the repository
- Use GitHub Secrets for sensitive values






