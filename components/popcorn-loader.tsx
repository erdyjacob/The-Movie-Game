"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface PopcornLoaderProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PopcornLoader({ size = "md", className }: PopcornLoaderProps) {
  const [dots, setDots] = useState("")

  // Animate the dots to create a "popping" effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return ""
        return prev + "."
      })
    }, 400)

    return () => clearInterval(interval)
  }, [])

  // Size classes
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      {/* Popcorn emoji with bounce animation */}
      <div className="animate-bounce mb-2">
        <span
          className={cn("text-2xl", {
            "text-xl": size === "sm",
            "text-3xl": size === "lg",
          })}
        >
          🍿
        </span>
      </div>

      {/* Text with animated dots */}
      <p className={cn("font-medium", sizeClasses[size])}>Popping corn{dots}</p>
    </div>
  )
}
