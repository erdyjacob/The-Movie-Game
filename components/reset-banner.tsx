"use client"

import { useEffect, useState } from "react"

export default function ResetBanner() {
  const [isVisible, setIsVisible] = useState(true)

  // Hide banner after 30 seconds or when clicked
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 30000) // 30 seconds

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div
      className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 text-white py-2 mb-4 cursor-pointer overflow-hidden relative"
      onClick={() => setIsVisible(false)}
    >
      <div className="animate-scroll whitespace-nowrap">
        <span className="inline-block px-4">
          🎬 Game Update: All accounts from the beta have been cleared to ensure fair play. Thank you for your
          understanding! Animated movies have also been removed from the game for better balance. Join our Discord for
          updates and community discussions:{" "}
          <a
            href="https://discord.gg/BKEaRwNgbJ"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-purple-200"
            onClick={(e) => e.stopPropagation()}
          >
            discord.gg/BKEaRwNgbJ
          </a>{" "}
          🎮
        </span>
      </div>
    </div>
  )
}
