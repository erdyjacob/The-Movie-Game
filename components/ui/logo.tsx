"use client"

import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Logo({ className, size = "md" }: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Size mappings
  const sizeClasses = {
    sm: "h-8 w-auto",
    md: "h-12 w-auto",
    lg: "h-16 w-auto",
  }

  // Determine if we should use dark mode styling
  const isDark = mounted && (theme === "dark" || resolvedTheme === "dark")

  return (
    <div className={cn(sizeClasses[size], className)}>
      {mounted ? (
        <svg
          viewBox="0 0 800 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          aria-label="The Movie Game Logo"
          role="img"
        >
          {/* SVG content - simplified version for example */}
          <path
            d="M50 200 H750"
            strokeWidth="20"
            stroke={isDark ? "#ffffff" : "#000000"}
            className="transition-colors duration-200"
          />
          <text
            x="400"
            y="150"
            textAnchor="middle"
            fontSize="60"
            fontWeight="bold"
            fill={isDark ? "#ffffff" : "#000000"}
            className="transition-colors duration-200"
          >
            THE MOVIE GAME
          </text>
          <text
            x="400"
            y="250"
            textAnchor="middle"
            fontSize="30"
            fill={isDark ? "#cccccc" : "#333333"}
            className="transition-colors duration-200"
          >
            Connect the stars
          </text>
          {/* Note: This is a simplified placeholder. Replace with your actual SVG paths */}
        </svg>
      ) : (
        <div className={cn("w-full h-full bg-muted/20 animate-pulse rounded")} />
      )}
    </div>
  )
}
