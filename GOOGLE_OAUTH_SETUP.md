# Google OAuth Setup Guide

This guide will help you set up Google OAuth for the "Sign in with Google" feature.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "Comdirect Analytics")
5. Click **"Create"**

## Step 2: Enable Google+ API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"People API"**
3. Click on it and click **"Enable"**

**Note:** Google+ API is deprecated, but we'll use the newer **Google Identity Services** which doesn't require a separate API. The OAuth consent screen setup is still needed.

## Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (unless you have a Google Workspace account)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: Comdirect Analytics
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click **"Save and Continue"**
6. On **"Scopes"** page, click **"Save and Continue"** (no scopes needed for basic email)
7. On **"Test users"** page, you can add test users (optional for development)
8. Click **"Save and Continue"**
9. Review and click **"Back to Dashboard"**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Choose **"Web application"** as the application type
4. Fill in:
   - **Name**: Comdirect Analytics Web Client
   - **Authorized JavaScript origins**:
     - For local development: `http://localhost:5173`
     - For production: `https://your-domain.com` (your Vercel/deployment URL)
   - **Authorized redirect URIs**:
     - For local development: `http://localhost:5173`
     - For production: `https://your-domain.com`
5. Click **"Create"**
6. **Copy the Client ID** - you'll need this!

## Step 5: Add Client ID to Your Project

### For Local Development

Create or update `.env.local` file in your project root:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### For Production (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Key**: `VITE_GOOGLE_CLIENT_ID`
   - **Value**: Your Google OAuth Client ID
   - **Environment**: Production, Preview, Development (select all)
4. Click **"Save"**
5. **Redeploy** your application for the changes to take effect

## Step 6: Update Authorized Origins (After Deployment)

Once you have your production URL:

1. Go back to Google Cloud Console → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Add your production URL to **Authorized JavaScript origins**:
   - `https://your-app.vercel.app`
4. Add your production URL to **Authorized redirect URIs**:
   - `https://your-app.vercel.app`
5. Click **"Save"**

## Security Notes

⚠️ **Important Security Considerations:**

1. **Client ID is Public**: The OAuth Client ID is safe to expose in frontend code. It's designed to be public.

2. **Email Domain Restriction**: The app still validates that only `@ignitetech.com` emails can access the application, even with Google OAuth.

3. **HTTPS Required**: In production, Google OAuth requires HTTPS. Vercel provides this automatically.

4. **Environment Variables**: Never commit `.env.local` to git. It's already in `.gitignore`.

## Testing

1. **Local Testing**:
   - Start your dev server: `npm run dev`
   - Go to the login page
   - Click "Sign in with Google"
   - You should see the Google sign-in popup

2. **Production Testing**:
   - Deploy to Vercel
   - Make sure `VITE_GOOGLE_CLIENT_ID` is set in Vercel environment variables
   - Test the Google sign-in button

## Troubleshooting

### Error: "Invalid client ID"

- Check that `VITE_GOOGLE_CLIENT_ID` is set correctly
- Make sure there are no extra spaces or quotes
- Restart your dev server after adding the environment variable

### Error: "redirect_uri_mismatch"

- Check that your current URL (localhost:5173 or production URL) is in the **Authorized redirect URIs** list
- Make sure the protocol matches (http vs https)

### Error: "Access blocked: This app's request is invalid"

- Your OAuth consent screen might not be configured
- Make sure you've completed the OAuth consent screen setup
- For production, you may need to submit your app for verification (if using external users)

### Google Sign-In Button Not Showing

- Check browser console for errors
- Verify `VITE_GOOGLE_CLIENT_ID` is loaded (check in browser DevTools → Application → Environment Variables)
- Make sure the GoogleOAuthProvider is wrapping your App component

## Production Checklist

- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Production URL added to Authorized JavaScript origins
- [ ] Production URL added to Authorized redirect URIs
- [ ] `VITE_GOOGLE_CLIENT_ID` set in Vercel environment variables
- [ ] Application redeployed after adding environment variable
- [ ] Tested Google sign-in in production

## Support

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [React OAuth Google Library](https://www.npmjs.com/package/@react-oauth/google)


