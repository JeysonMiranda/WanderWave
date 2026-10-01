import { useState, useEffect, useCallback } from 'react'
import { AuthContext } from './AuthContextObject'
import { authAPI } from '../services/api'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('wanderwave_token') || null)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Logout handler
  const logout = useCallback(() => {
    localStorage.removeItem('wanderwave_token')
    setToken(null)
    setUser(null)
  }, [])

  // Verify and hydrate existing session from backend on page load
  useEffect(() => {
    let isMounted = true

    async function loadUserSession() {
      const storedToken = localStorage.getItem('wanderwave_token')
      if (!storedToken) {
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        const response = await authAPI.getMe()
        if (isMounted && response.success && response.user) {
          setUser(response.user)
          setToken(storedToken)
        } else if (isMounted) {
          logout()
        }
      } catch (error) {
        console.warn('[AuthContext] Session expired or invalid token:', error.message)
        if (isMounted) {
          logout()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadUserSession()

    return () => {
      isMounted = false
    }
  }, [logout])

  // Login handler
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password })
    if (response.success && response.token) {
      localStorage.setItem('wanderwave_token', response.token)
      setToken(response.token)
      setUser(response.user)
      return response
    }
    throw new Error(response.message || 'Login failed')
  }

  // Register handler
  const register = async (name, email, password, membershipTier) => {
    const response = await authAPI.register({
      name,
      email,
      password,
      membershipTier,
    })
    if (response.success && response.token) {
      localStorage.setItem('wanderwave_token', response.token)
      setToken(response.token)
      setUser(response.user)
      return response
    }
    throw new Error(response.message || 'Registration failed')
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
