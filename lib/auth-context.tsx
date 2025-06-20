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
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("admin-user")
    const authToken = localStorage.getItem("auth-token")
    
    if (savedUser && authToken) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Authenticate with the admin users API
      const response = await adminUsersApi.login({ email, password })
      
      if (response.success && response.data) {
        const user = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.email, // Use email as name since we don't have a name field
          role: response.data.role,
        }
        
        setUser(user)
        localStorage.setItem("admin-user", JSON.stringify(user))
        localStorage.setItem("auth-token", "admin-session") // Simple session token
        return true
      }
      
      return false
    } catch (error: any) {
      console.error('Login error:', error)
      // Re-throw the error so the login page can handle it and show appropriate toast
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("admin-user")
    localStorage.removeItem("auth-token")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
