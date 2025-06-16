import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  key: string
}

interface UseCachedDataOptions {
  staleTime?: number // How long data is considered fresh (default: 5 minutes)
  cacheTime?: number // How long to keep data in cache (default: 10 minutes)
  refetchOnWindowFocus?: boolean
}

const cache = new Map<string, CacheEntry<any>>()

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions = {}
) {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus = true
  } = options

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const lastFetchTime = useRef<number>(0)

  const getCachedData = useCallback(() => {
    const cached = cache.get(key)
    if (!cached) return null
    
    const now = Date.now()
    const isExpired = now - cached.timestamp > cacheTime
    
    if (isExpired) {
      cache.delete(key)
      return null
    }
    
    return cached
  }, [key, cacheTime])

  const isStale = useCallback(() => {
    const cached = getCachedData()
    if (!cached) return true
    
    const now = Date.now()
    return now - cached.timestamp > staleTime
  }, [getCachedData, staleTime])

  const fetchData = useCallback(async (force = false) => {
    // Don't fetch if we have fresh data and not forcing
    if (!force && !isStale()) {
      const cached = getCachedData()
      if (cached) {
        setData(cached.data)
        return cached.data
      }
    }

    // Prevent duplicate requests
    const now = Date.now()
    if (now - lastFetchTime.current < 1000 && !force) {
      return data
    }

    setIsLoading(true)
    setError(null)
    lastFetchTime.current = now

    try {
      const result = await fetcher()
      
      // Cache the result
      cache.set(key, {
        data: result,
        timestamp: now,
        key
      })
      
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [key, fetcher, isStale, getCachedData, data])

  // Initial load
  useEffect(() => {
    const cached = getCachedData()
    if (cached && !isStale()) {
      setData(cached.data)
    } else {
      fetchData()
    }
  }, [key]) // Only depend on key to avoid infinite loops

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      if (isStale()) {
        fetchData()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchData, refetchOnWindowFocus, isStale])

  // Mutate function for optimistic updates
  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    const updatedData = typeof newData === 'function' 
      ? (newData as (prev: T | null) => T)(data)
      : newData

    setData(updatedData)
    
    // Update cache
    cache.set(key, {
      data: updatedData,
      timestamp: Date.now(),
      key
    })
  }, [key, data])

  // Force refresh
  const refresh = useCallback(() => {
    return fetchData(true)
  }, [fetchData])

  // Invalidate cache
  const invalidate = useCallback(() => {
    cache.delete(key)
    setData(null)
  }, [key])

  return {
    data,
    isLoading,
    error,
    mutate,
    refresh,
    invalidate,
    isStale: isStale()
  }
} 