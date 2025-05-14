"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminShortcut() {
  const router = useRouter()

  useEffect(() => {
    // Secret key combination: Ctrl+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault()
        router.push("/admin")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router])

  return null // This component doesn't render anything
}
