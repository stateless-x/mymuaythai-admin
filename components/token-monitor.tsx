"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, LogOut, Clock } from 'lucide-react'

interface TokenInfo {
  timeRemaining: number
  isExpired: boolean
  expiresAt: Date | null
}

export function TokenMonitor() {
  const { token, refreshToken, logout } = useAuth()
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    timeRemaining: 0,
    isExpired: false,
    expiresAt: null,
  })

  const getTokenInfo = (token: string | null): TokenInfo => {
    if (!token) {
      return { timeRemaining: 0, isExpired: true, expiresAt: null }
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiresAt = new Date(payload.exp * 1000)
      const now = new Date()
      const timeRemaining = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)))
      
      return {
        timeRemaining,
        isExpired: timeRemaining === 0,
        expiresAt,
      }
    } catch (error) {
      return { timeRemaining: 0, isExpired: true, expiresAt: null }
    }
  }

  useEffect(() => {
    const updateTokenInfo = () => {
      setTokenInfo(getTokenInfo(token))
    }

    updateTokenInfo()
    const interval = setInterval(updateTokenInfo, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [token])

  const handleRefreshToken = async () => {
    try {
      await refreshToken()
    } catch (error) {
      console.error('Failed to refresh token:', error)
    }
  }

  const formatTimeRemaining = (minutes: number): string => {
    if (minutes === 0) return 'Expired'
    if (minutes < 60) return `${minutes}m`
    
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const getStatusColor = (minutes: number): string => {
    if (minutes === 0) return 'destructive'
    if (minutes < 15) return 'destructive'
    if (minutes < 60) return 'warning'
    return 'secondary'
  }

  if (!token) return null

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4" />
      <Badge variant={getStatusColor(tokenInfo.timeRemaining) as any}>
        Session: {formatTimeRemaining(tokenInfo.timeRemaining)}
      </Badge>
      
      {tokenInfo.timeRemaining < 60 && tokenInfo.timeRemaining > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshToken}
          className="h-7 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      )}
      
      {tokenInfo.isExpired && (
        <Button
          variant="outline"
          size="sm"
          onClick={logout}
          className="h-7 px-2"
        >
          <LogOut className="h-3 w-3 mr-1" />
          Login Again
        </Button>
      )}
    </div>
  )
} 