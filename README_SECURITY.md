# Security Guidelines

## ⚠️ Important: Before Publishing to GitHub

This repository contains code that connects to the Khoros API. **DO NOT** commit sensitive credentials to the repository.

## What to Check Before Publishing:

1. **No hardcoded credentials** in code files
2. **No `.env` files** committed (they're in `.gitignore`)
3. **No API keys or tokens** in documentation examples
4. **Use environment variables** for all sensitive data

## Required Environment Variables:

### For Proxy Server (`proxy-server.cjs`):
Create a `.env` file in the root directory:
```
KHOROS_COMMUNITY_ID=comdirectbank.prod
KHOROS_CLIENT_ID=your_client_id_here
KHOROS_ACCESS_TOKEN=your_access_token_here
```

### For Frontend (`.env.local`):
```
VITE_KHOROS_COMMUNITY_ID=comdirectbank.prod
VITE_KHOROS_CLIENT_ID=your_client_id_here
VITE_KHOROS_ACCESS_TOKEN=your_access_token_here
VITE_KHOROS_PROXY_URL=http://localhost:3001/api/khoros/posts
```

## Files That Should NOT Contain Real Credentials:

- ✅ `proxy-server.cjs` - Uses environment variables
- ✅ `src/utils/khorosApi.js` - Uses environment variables
- ✅ Documentation files - Use placeholder values only
- ❌ `.env` files - Should be in `.gitignore` (already configured)

## If You Accidentally Committed Credentials:

1. **Immediately rotate/revoke** the exposed credentials
2. **Remove from git history** using `git filter-branch` or BFG Repo-Cleaner
3. **Force push** to update the remote repository
4. **Notify** your team/API provider if credentials were exposed

## Safe to Publish:

- ✅ Source code (without credentials)
- ✅ Documentation (with placeholder values)
- ✅ Configuration examples
- ✅ Package files
- ✅ Build outputs (if needed)

