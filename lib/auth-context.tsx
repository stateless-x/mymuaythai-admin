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
    try {
      // Check for existing session
      const savedUser = localStorage.getItem("admin-user")
      const authToken = localStorage.getItem("auth-token")

      if (savedUser && authToken) {
        setUser(JSON.parse(savedUser))
        setToken(authToken)
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error)
      localStorage.removeItem("admin-user")
      localStorage.removeItem("auth-token")
      localStorage.removeItem("refresh-token")
      setUser(null)
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await adminUsersApi.login({ email, password })
      if (response.success && response.data?.user) {
        const userData = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.email,
          role: response.data.user.role,
        }
        
        setUser(userData)
        setToken(response.data.accessToken)
        localStorage.setItem("admin-user", JSON.stringify(userData))
        localStorage.setItem("auth-token", response.data.accessToken)
        localStorage.setItem("refresh-token", response.data.refreshToken)
        return true
      }
      
      return false
    } catch (error: any) {
      // Re-throw the error so the login page can handle it and show appropriate message
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
