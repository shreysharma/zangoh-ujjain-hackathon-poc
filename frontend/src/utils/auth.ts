// Authentication utilities
import { config } from '../config/appConfig'
import { getErrorMessage } from './errorMessages'

export const AUTH_CONFIG = {
  loginApiUrl: `${config.api.baseUrl}/login`,
  loginKey: 'indiamart_jwt_token',
  sessionDuration: 60 * 60 * 1000 // 1 hour in milliseconds
}

export const authUtils = {
  // Login with external API
  login: async (username: string, password: string): Promise<{ success: boolean; error?: string; token?: string }> => {
    try {
      console.log('Login URL:', AUTH_CONFIG.loginApiUrl);
      console.log('config.api.baseUrl:', config.api.baseUrl);
      
      // Create query parameters as the backend expects
      const params = new URLSearchParams({
        username: username,
        password: password
      });
      
      const loginUrl = `${AUTH_CONFIG.loginApiUrl}?${params.toString()}`;
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        mode: 'cors'
      })

      if (response.ok) {
        const data = await response.json()
        // Assuming the API returns the JWT token directly or in a token field
        const token = typeof data === 'string' ? data : data.token || data.access_token
        
        if (token) {
          // Store JWT token with timestamp
          const tokenData = {
            token: token,
            timestamp: Date.now(),
            username: username
          }
          localStorage.setItem(AUTH_CONFIG.loginKey, JSON.stringify(tokenData))
          return { success: true, token }
        } else {
          return { success: false, error: 'No token received from server' }
        }
      } else {
        // Use friendly error message instead of raw response
        const friendlyError = getErrorMessage(response.status)
        return { success: false, error: friendlyError.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      // Use friendly error message for network errors
      const friendlyError = getErrorMessage(undefined, 'NETWORK_ERROR')
      return { success: false, error: friendlyError.message }
    }
  },

  // Set login status in localStorage (for backward compatibility)
  setLoginStatus: (isLoggedIn: boolean): void => {
    if (!isLoggedIn) {
      localStorage.removeItem(AUTH_CONFIG.loginKey)
    }
  },

  // Check if user is logged in and session is still valid
  isAuthenticated: (): boolean => {
    try {
      const tokenData = localStorage.getItem(AUTH_CONFIG.loginKey)
      if (!tokenData) return false

      const parsedData = JSON.parse(tokenData)
      
      // Check if token has required fields
      if (!parsedData.token || !parsedData.timestamp) {
        localStorage.removeItem(AUTH_CONFIG.loginKey)
        return false
      }

      // Check if session has expired (1 hour)
      const currentTime = Date.now()
      const timeDifference = currentTime - parsedData.timestamp
      
      if (timeDifference > AUTH_CONFIG.sessionDuration) {
        console.log('Session expired, removing token')
        localStorage.removeItem(AUTH_CONFIG.loginKey)
        return false
      }

      return true
    } catch (error) {
      console.error('Error checking authentication status:', error)
      localStorage.removeItem(AUTH_CONFIG.loginKey)
      return false
    }
  },

  // Get JWT token
  getToken: (): string | null => {
    try {
      const tokenData = localStorage.getItem(AUTH_CONFIG.loginKey)
      if (!tokenData) return null

      const parsedData = JSON.parse(tokenData)
      return parsedData.token || null
    } catch (error) {
      console.error('Error getting token:', error)
      return null
    }
  },

  // Get login data
  getLoginData: () => {
    try {
      const tokenData = localStorage.getItem(AUTH_CONFIG.loginKey)
      return tokenData ? JSON.parse(tokenData) : null
    } catch (error) {
      console.error('Error getting login data:', error)
      return null
    }
  },

  // Logout user
  logout: (): void => {
    localStorage.removeItem(AUTH_CONFIG.loginKey)
  },

  // Get remaining session time in minutes
  getRemainingSessionTime: (): number => {
    try {
      const tokenData = localStorage.getItem(AUTH_CONFIG.loginKey)
      if (!tokenData) return 0

      const parsedData = JSON.parse(tokenData)
      if (!parsedData.timestamp) return 0

      const currentTime = Date.now()
      const timeDifference = currentTime - parsedData.timestamp
      const remainingTime = AUTH_CONFIG.sessionDuration - timeDifference

      return Math.max(0, Math.floor(remainingTime / (1000 * 60))) // Convert to minutes
    } catch (error) {
      console.error('Error getting remaining session time:', error)
      return 0
    }
  }
}