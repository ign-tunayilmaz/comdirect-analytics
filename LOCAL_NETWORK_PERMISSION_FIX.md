# Fix: Local Network Permission Request

## The Problem

Your browser is asking for permission to "search for and connect to devices on your local network" when visiting `cmdr-analytics.vercel.app`.

## Why This Happens

This happens when your production app (on Vercel) is trying to access `localhost` URLs. This typically occurs when:

1. **`VITE_KHOROS_PROXY_URL` is set to `http://localhost:3001`** in production
2. The app tries to make requests to localhost from a remote site
3. Browsers block this and ask for permission (for security)

## The Solution

### Step 1: Check Your Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Check `VITE_KHOROS_PROXY_URL`

### Step 2: Update the Proxy URL

**❌ Wrong (causes local network permission):**
```
VITE_KHOROS_PROXY_URL=http://localhost:3001/api/khoros/posts
```

**✅ Correct (for production):**
```
VITE_KHOROS_PROXY_URL=https://cmdr-analytics.vercel.app/api/khoros/posts
```

### Step 3: Verify Your Vercel API Endpoint

Your Vercel deployment should have the API endpoint at:
```
https://cmdr-analytics.vercel.app/api/khoros/posts
```

Test it by visiting:
```
https://cmdr-analytics.vercel.app/api/khoros/posts?fromDate=20251201&toDate=20251216
```

### Step 4: Update and Redeploy

1. Update `VITE_KHOROS_PROXY_URL` in Vercel to use your production URL
2. **Redeploy** your application
3. The local network permission request should disappear

## Why This Matters

- **Security**: Browsers prevent websites from accessing your local network without permission
- **User Experience**: Permission popups are confusing and unnecessary
- **Functionality**: localhost URLs don't work from remote sites anyway

## Quick Checklist

- [ ] `VITE_KHOROS_PROXY_URL` in Vercel points to `https://cmdr-analytics.vercel.app/api/khoros/posts`
- [ ] No localhost URLs in production environment variables
- [ ] Vercel API endpoint is working (test the URL above)
- [ ] Application redeployed after fixing the variable
- [ ] Local network permission popup no longer appears

## For Local Development

Keep localhost URLs in your `.env.local` file (which is not deployed):
```env
VITE_KHOROS_PROXY_URL=http://localhost:3001/api/khoros/posts
```

This is fine for local development, but **never use localhost URLs in production**.


