"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { adminUsersApi } from "./api"

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'staff'
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  refreshToken: () => Promise<boolean>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("admin-user")
    const authToken = localStorage.getItem("auth-token")
    
    if (savedUser && authToken) {
      setUser(JSON.parse(savedUser))
      setToken(authToken)
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Authenticate with the admin users API
      console.log('Attempting login with:', { email })
      const response = await adminUsersApi.login({ email, password })
      console.log('Login response:', response)
      console.log('Response keys:', Object.keys(response || {}))
      console.log('Response.success:', response?.success)
      console.log('Response.data:', response?.data)
      
      if (response.success && response.data) {
        console.log('Response.data keys:', Object.keys(response.data || {}))
        console.log('Response.data.user:', response.data.user)
        
        const userData = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.email, // Use email as name since we don't have a name field
          role: response.data.user.role,
        }
        
        console.log('Setting user data:', userData)
        setUser(userData)
        setToken(response.data.accessToken)
        localStorage.setItem("admin-user", JSON.stringify(userData))
        localStorage.setItem("auth-token", response.data.accessToken)
        localStorage.setItem("refresh-token", response.data.refreshToken)
        return true
      }
      
      console.log('Login failed: Invalid response format')
      console.log('Expected: response.success && response.data')
      console.log('Got: success=', response?.success, 'data=', response?.data)
      return false
    } catch (error: any) {
      console.error('Login error details:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      // Re-throw the error so the login page can handle it and show appropriate toast
      throw error
    }
  }

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem("refresh-token")
      if (!refreshTokenValue) {
        logout()
        return false
      }

      const response = await adminUsersApi.refreshToken({ refreshToken: refreshTokenValue })
      
      if (response.success && response.data) {
        setToken(response.data.accessToken)
        localStorage.setItem("auth-token", response.data.accessToken)
        localStorage.setItem("refresh-token", response.data.refreshToken)
        return true
      }
      
      logout()
      return false
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      return false
    }
  }

  const logout = async () => {
    try {
      // Call backend logout to blacklist token
      await adminUsersApi.logout()
    } catch (error) {
      console.error('Logout API error:', error)
      // Continue with local logout even if API fails
    }
    
    // Clear local state
    setUser(null)
    setToken(null)
    localStorage.removeItem("admin-user")
    localStorage.removeItem("auth-token")
    localStorage.removeItem("refresh-token")
  }

  return <AuthContext.Provider value={{ user, token, login, logout, refreshToken, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
