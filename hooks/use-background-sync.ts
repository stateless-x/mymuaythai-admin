import { useEffect, useRef, useCallback } from 'react'

interface UseBackgroundSyncOptions {
  interval?: number // Sync interval in milliseconds (default: 30 seconds)
  enabled?: boolean // Whether background sync is enabled
  onlyWhenVisible?: boolean // Only sync when tab is visible
}

export function useBackgroundSync(
  syncFunction: () => Promise<void> | void,
  options: UseBackgroundSyncOptions = {}
) {
  const {
    interval = 30 * 1000, // 30 seconds
    enabled = true,
    onlyWhenVisible = true
  } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isVisibleRef = useRef(true)

  const sync = useCallback(async () => {
    if (!enabled) return
    if (onlyWhenVisible && !isVisibleRef.current) return

    try {
      await syncFunction()
    } catch (error) {
      console.warn('Background sync failed:', error)
    }
  }, [syncFunction, enabled, onlyWhenVisible])

  // Handle visibility change
  useEffect(() => {
    if (!onlyWhenVisible) return

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
      
      // Sync immediately when tab becomes visible
      if (isVisibleRef.current && enabled) {
        sync()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [sync, enabled, onlyWhenVisible])

  // Set up interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(sync, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [sync, interval, enabled])

  // Manual sync function
  const manualSync = useCallback(() => {
    return sync()
  }, [sync])

  return { manualSync }
} 