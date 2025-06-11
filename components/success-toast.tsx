"use client"

import { useState, useEffect } from "react"
import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SuccessToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function SuccessToast({ message, isVisible, onClose, duration = 3000 }: SuccessToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing toast state
export function useSuccessToast() {
  const [isVisible, setIsVisible] = useState(false)
  const [message, setMessage] = useState("")

  const showToast = (msg: string) => {
    setMessage(msg)
    setIsVisible(true)
  }

  const hideToast = () => {
    setIsVisible(false)
  }

  return {
    isVisible,
    message,
    showToast,
    hideToast,
  }
}
