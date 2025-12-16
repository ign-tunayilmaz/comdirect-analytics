/**
 * Authentication utilities
 * Only allows Ignitetech email addresses
 */

const AUTH_KEY = 'comdirect_analytics_auth'
const IGNITETECH_DOMAIN = 'ignitetech.com'

/**
 * Check if email is from Ignitetech domain
 */
export const isIgnitetechEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  
  const normalizedEmail = email.trim().toLowerCase()
  return normalizedEmail.endsWith(`@${IGNITETECH_DOMAIN}`)
}

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Login with email
 * @param {string} email - User email
 * @returns {Object} { success: boolean, message: string }
 */
export const login = (email) => {
  if (!email || typeof email !== 'string') {
    return { success: false, message: 'Email is required' }
  }

  const trimmedEmail = email.trim()

  // Validate email format
  if (!isValidEmail(trimmedEmail)) {
    return { success: false, message: 'Please enter a valid email address' }
  }

  // Check if email is from Ignitetech
  if (!isIgnitetechEmail(trimmedEmail)) {
    return { 
      success: false, 
      message: `Only Ignitetech email addresses (@${IGNITETECH_DOMAIN}) are allowed` 
    }
  }

  // Store authentication
  const authData = {
    email: trimmedEmail,
    loginTime: new Date().toISOString(),
    isAuthenticated: true,
    loginMethod: 'email'
  }

  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
    return { success: true, message: 'Login successful', email: trimmedEmail }
  } catch (error) {
    console.error('Error saving authentication:', error)
    return { success: false, message: 'Failed to save authentication. Please try again.' }
  }
}

/**
 * Login with Google OAuth
 * @param {Object} credentialResponse - Google OAuth credential response
 * @returns {Promise<Object>} { success: boolean, message: string, email?: string }
 */
export const loginWithGoogle = async (credentialResponse) => {
  try {
    // Decode the JWT token to get user info
    const token = credentialResponse.credential
    
    // Split the JWT token (header.payload.signature)
    const parts = token.split('.')
    if (parts.length !== 3) {
      return { success: false, message: 'Invalid Google credential format' }
    }

    // Decode the payload (base64url)
    const payload = parts[1]
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    
    const email = decoded.email
    const name = decoded.name || decoded.given_name || 'User'
    const picture = decoded.picture || null

    if (!email) {
      return { success: false, message: 'No email found in Google account' }
    }

    // Validate email is from Ignitetech
    if (!isIgnitetechEmail(email)) {
      return { 
        success: false, 
        message: `Only Ignitetech email addresses (@${IGNITETECH_DOMAIN}) are allowed. Your Google account (${email}) is not authorized.` 
      }
    }

    // Store authentication
    const authData = {
      email: email.toLowerCase().trim(),
      name: name,
      picture: picture,
      loginTime: new Date().toISOString(),
      isAuthenticated: true,
      loginMethod: 'google',
      googleId: decoded.sub
    }

    localStorage.setItem(AUTH_KEY, JSON.stringify(authData))
    return { 
      success: true, 
      message: 'Login successful', 
      email: email.toLowerCase().trim(),
      name: name,
      picture: picture
    }
  } catch (error) {
    console.error('Error processing Google login:', error)
    return { 
      success: false, 
      message: 'Failed to process Google login. Please try again.' 
    }
  }
}

/**
 * Logout user
 */
export const logout = () => {
  try {
    localStorage.removeItem(AUTH_KEY)
    return { success: true, message: 'Logged out successfully' }
  } catch (error) {
    console.error('Error during logout:', error)
    return { success: false, message: 'Error during logout' }
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  try {
    const authData = localStorage.getItem(AUTH_KEY)
    if (!authData) return false

    const parsed = JSON.parse(authData)
    
    // Verify it's still a valid Ignitetech email
    if (!parsed.email || !isIgnitetechEmail(parsed.email)) {
      logout()
      return false
    }

    return parsed.isAuthenticated === true
  } catch (error) {
    console.error('Error checking authentication:', error)
    return false
  }
}

/**
 * Get current user email
 * @returns {string|null}
 */
export const getCurrentUser = () => {
  try {
    const authData = localStorage.getItem(AUTH_KEY)
    if (!authData) return null

    const parsed = JSON.parse(authData)
    return parsed.email || null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get current user name
 * @returns {string|null}
 */
export const getCurrentUserName = () => {
  try {
    const authData = localStorage.getItem(AUTH_KEY)
    if (!authData) return null

    const parsed = JSON.parse(authData)
    return parsed.name || null
  } catch (error) {
    console.error('Error getting current user name:', error)
    return null
  }
}

/**
 * Get current user picture
 * @returns {string|null}
 */
export const getCurrentUserPicture = () => {
  try {
    const authData = localStorage.getItem(AUTH_KEY)
    if (!authData) return null

    const parsed = JSON.parse(authData)
    return parsed.picture || null
  } catch (error) {
    console.error('Error getting current user picture:', error)
    return null
  }
}

/**
 * Get authentication data
 * @returns {Object|null}
 */
export const getAuthData = () => {
  try {
    const authData = localStorage.getItem(AUTH_KEY)
    if (!authData) return null

    return JSON.parse(authData)
  } catch (error) {
    console.error('Error getting auth data:', error)
    return null
  }
}

