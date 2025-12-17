# URGENT: Fix redirect_uri_mismatch - Missing JavaScript Origins

## The Problem

Your **Authorized JavaScript origins** section is **EMPTY**. This is required for OAuth to work!

## Immediate Fix

### Step 1: Add Authorized JavaScript Origins

In Google Cloud Console, under **Authorized JavaScript origins**, click **"+ Add URI"** and add:

1. `https://cmdr-analytics.vercel.app` (your production URL - NO trailing slash)
2. `http://localhost:5173` (for local development - NO trailing slash)

**Important:** 
- NO trailing slashes in JavaScript origins
- Use `https://` for production, `http://` for localhost

### Step 2: Verify Authorized Redirect URIs

You already have these (which is good):
- `https://cmdr-analytics.vercel.app/` (with slash)
- `https://cmdr-analytics.vercel.app` (without slash)

**Keep both!** The library might use either format.

### Step 3: Save and Wait

1. Click **"Save"** button at the bottom
2. Wait **5-10 minutes** for Google to propagate the changes
3. Try signing in again

## Why This Happens

The `@react-oauth/google` library's `useGoogleLogin` hook requires:
1. **Authorized JavaScript origins** - Where your app is hosted (currently MISSING!)
2. **Authorized redirect URIs** - Where Google redirects back (you have these)

Without JavaScript origins, Google rejects the OAuth request.

## Quick Checklist

- [ ] Added `https://cmdr-analytics.vercel.app` to **Authorized JavaScript origins**
- [ ] Added `http://localhost:5173` to **Authorized JavaScript origins**
- [ ] Verified redirect URIs are still there (both with and without slash)
- [ ] Clicked **"Save"**
- [ ] Waited 5-10 minutes
- [ ] Tested again

## Still Not Working?

Check the browser console (F12) when you click "Sign in with Google". The error message will show the exact redirect URI Google is expecting. Make sure that exact URI is in your Authorized redirect URIs list.


