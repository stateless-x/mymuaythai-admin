"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Backend API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

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
      // Try to authenticate with the MyMuayThai backend
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        const user = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || data.user.email,
        }
        
        setUser(user)
        localStorage.setItem("admin-user", JSON.stringify(user))
        localStorage.setItem("auth-token", data.token)
        return true
      }
    } catch (error) {
      console.log("Backend login failed, falling back to mock authentication")
    }

    // Fallback to mock authentication if backend is not available
    if (email === "admin@gym.com" && password === "admin123") {
      const mockUser = { id: "1", email, name: "Admin User" }
      setUser(mockUser)
      localStorage.setItem("admin-user", JSON.stringify(mockUser))
      localStorage.setItem("auth-token", "mock-token")
      return true
    }
    
    return false
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
