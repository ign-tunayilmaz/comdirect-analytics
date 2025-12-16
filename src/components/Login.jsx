import React, { useState, useEffect } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import { BarChart3, AlertCircle } from 'lucide-react'

// Check if Google OAuth is configured
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const isGoogleOAuthEnabled = !!GOOGLE_CLIENT_ID

function Login({ onLoginSuccess }) {
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Show error if Google OAuth is not configured
  useEffect(() => {
    if (!isGoogleOAuthEnabled) {
      setError('Google Sign-In is not configured. Please contact your administrator.')
    }
  }, [])

  // Initialize Google login hook (will only work if GoogleOAuthProvider is present)
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      if (!isGoogleOAuthEnabled) {
        setError('Google Sign-In is not configured. Please contact your administrator.')
        return
      }

      setError('')
      setSuccess('')
      setGoogleLoading(true)

      try {
        // Fetch user info from Google using the access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        })

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info from Google')
        }

        const userInfo = await userInfoResponse.json()

        // Use the userInfo directly
        const email = userInfo.email
        const name = userInfo.name || userInfo.given_name || 'User'
        const picture = userInfo.picture || null

        if (!email) {
          throw new Error('No email found in Google account')
        }

        // Validate email is from Ignitetech
        if (!email.toLowerCase().endsWith('@ignitetech.com')) {
          setError(`Only Ignitetech email addresses (@ignitetech.com) are allowed. Your Google account (${email}) is not authorized.`)
          setGoogleLoading(false)
          return
        }

        // Store authentication
        const authData = {
          email: email.toLowerCase().trim(),
          name: name,
          picture: picture,
          loginTime: new Date().toISOString(),
          isAuthenticated: true,
          loginMethod: 'google',
          googleId: userInfo.id
        }

        localStorage.setItem('comdirect_analytics_auth', JSON.stringify(authData))
        
        setSuccess('Login successful')
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess(email.toLowerCase().trim(), name, picture)
          }
        }, 500)
      } catch (err) {
        console.error('Google login error:', err)
        setError(err.message || 'Failed to process Google login. Please try again.')
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed. Please try again.')
      setGoogleLoading(false)
    },
  })

  const handleGoogleLogin = () => {
    if (!isGoogleOAuthEnabled) {
      setError('Google Sign-In is not configured. Please contact your administrator.')
      return
    }
    googleLogin()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-comdirect-dark via-gray-900 to-comdirect-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-comdirect-yellow rounded-full mb-4">
            <BarChart3 className="w-8 h-8 text-comdirect-dark" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Comdirect Analytics</h1>
          <p className="text-gray-400">Community Insights Tool</p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Sign In
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sign in with your Ignitetech Google account to access the analytics dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start space-x-2">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          {/* Google Sign-In Button - Required for authentication */}
          <button
            onClick={handleGoogleLogin}
            disabled={!isGoogleOAuthEnabled || googleLoading}
            className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-sm mt-4"
          >
            {googleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-semibold mb-1">Secure Authentication Required</p>
                <p>This application is only accessible to Ignitetech employees. You must sign in with your Ignitetech Google account (@ignitetech.com) to access the dashboard.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Comdirect Community Analytics v1.0.2
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

