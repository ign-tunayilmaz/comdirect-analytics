# Fix Google OAuth redirect_uri_mismatch Error

## Problem
You're getting `Error 400: redirect_uri_mismatch` when trying to sign in with Google.

## Solution

The `@react-oauth/google` library uses the current page URL as the redirect URI. You need to add the correct URIs to your Google Cloud Console.

### Step 1: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID (Comdirect Analytics)
4. Update the following:

#### Authorized JavaScript origins
Add these URIs (click "+ Add URI" for each):
- `https://cmdr-analytics.vercel.app` (your production URL - **NO trailing slash**)
- `http://localhost:5173` (for local development)

#### Authorized redirect URIs
Add these URIs (click "+ Add URI" for each):
- `https://cmdr-analytics.vercel.app` (your production URL - **NO trailing slash**)
- `https://cmdr-analytics.vercel.app/` (with trailing slash - add both!)
- `http://localhost:5173` (for local development)
- `http://localhost:5173/` (with trailing slash)

**Important Notes:**
- Remove the trailing slash from the one you have: `https://cmdr-analytics.vercel.app/` → `https://cmdr-analytics.vercel.app`
- Add both versions (with and without trailing slash) to be safe
- Make sure there are NO trailing slashes in JavaScript origins
- The protocol must match exactly (https for production, http for localhost)

### Step 2: Save and Wait

1. Click **"Save"** at the bottom
2. **Wait 5-10 minutes** for changes to propagate (Google says it can take up to a few hours, but usually it's faster)

### Step 3: Test Again

1. Try signing in again
2. If it still doesn't work, wait a bit longer and try again
3. Clear your browser cache if needed

## Why This Happens

The `@react-oauth/google` library's `useGoogleLogin` hook uses the current page URL as the redirect URI. When you're on:
- `https://cmdr-analytics.vercel.app` → Google expects this exact URL
- `https://cmdr-analytics.vercel.app/` → Google treats this as a different URL

That's why you need both versions in the redirect URIs list.

## Quick Checklist

- [ ] Added `https://cmdr-analytics.vercel.app` to Authorized JavaScript origins
- [ ] Added `https://cmdr-analytics.vercel.app` to Authorized redirect URIs (no slash)
- [ ] Added `https://cmdr-analytics.vercel.app/` to Authorized redirect URIs (with slash)
- [ ] Added `http://localhost:5173` for local development (both origins and redirects)
- [ ] Clicked "Save"
- [ ] Waited 5-10 minutes
- [ ] Tested again

## Still Not Working?

1. **Check the exact error in browser console** - it will show what redirect URI Google is expecting
2. **Verify your Vercel URL** - make sure it matches exactly what's in Google Console
3. **Check for typos** - URLs are case-sensitive
4. **Try incognito mode** - to rule out cache issues

