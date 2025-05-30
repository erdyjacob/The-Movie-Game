"use client"

import { X } from "lucide-react"
import { useState } from "react"

export default function ResetBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="relative bg-gradient-to-r from-purple-600 to-violet-600 text-white py-2 overflow-hidden rounded-lg">
      {/* Scrolling text with immediate visibility */}
      <div className="whitespace-nowrap animate-marquee-fast">
        <span className="inline-block px-4 text-sm font-medium">
          🎬 Beta Reset Notice: We've cleared all accounts to implement major improvements to the game system. Thank you
          for your understanding! For more information and updates, join our Discord community:
          <a
            href="https://discord.gg/m83p5e4W"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-purple-200 ml-1 font-semibold"
          >
            discord.gg/m83p5e4W
          </a>{" "}
          • New features include enhanced tracking, improved leaderboards, and better progression! 🎬
        </span>
        {/* Duplicate for seamless loop */}
        <span className="inline-block px-4 text-sm font-medium ml-8">
          🎬 Beta Reset Notice: We've cleared all accounts to implement major improvements to the game system. Thank you
          for your understanding! For more information and updates, join our Discord community:
          <a
            href="https://discord.gg/m83p5e4W"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-purple-200 ml-1 font-semibold"
          >
            discord.gg/m83p5e4W
          </a>{" "}
          • New features include enhanced tracking, improved leaderboards, and better progression! 🎬
        </span>
      </div>

      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-white/20 rounded-full p-1 transition-colors"
        aria-label="Close banner"
      >
        <X size={16} />
      </button>
    </div>
  )
}
