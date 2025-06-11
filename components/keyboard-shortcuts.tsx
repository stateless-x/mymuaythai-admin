"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function KeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if no input is focused
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.tagName === "SELECT"
      ) {
        return
      }

      // Check for modifier keys (Ctrl/Cmd)
      const isModifierPressed = event.ctrlKey || event.metaKey

      if (isModifierPressed) {
        switch (event.key.toLowerCase()) {
          case "d":
            event.preventDefault()
            router.push("/admin/dashboard")
            break
          case "t":
            event.preventDefault()
            router.push("/admin/trainers")
            break
          case "g":
            event.preventDefault()
            router.push("/admin/gyms")
            break
          case "k":
            event.preventDefault()
            router.push("/admin/tags")
            break
        }
      }

      // Single key shortcuts
      switch (event.key) {
        case "?":
          event.preventDefault()
          // Show keyboard shortcuts help
          showShortcutsHelp()
          break
      }
    }

    const showShortcutsHelp = () => {
      alert(`Keyboard Shortcuts:
      
Navigation:
• Ctrl/Cmd + D - Dashboard
• Ctrl/Cmd + T - Trainers
• Ctrl/Cmd + G - Gyms  
• Ctrl/Cmd + K - Tags

Help:
• ? - Show this help`)
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [router])

  return null
}
