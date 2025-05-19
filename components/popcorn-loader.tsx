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
      {/* Popcorn emoji with bounce and shake animation */}
      <div className="mb-2">
        <span
          className={cn("inline-block animate-[bounce_1s_infinite,shake_0.5s_infinite]", {
            "text-lg": size === "sm",
            "text-2xl": size === "md",
            "text-3xl": size === "lg",
          })}
          style={{
            animation: "bounce 1s infinite, shake 0.3s infinite",
            transformOrigin: "center bottom",
          }}
          aria-hidden="true"
        >
          🍿
        </span>
      </div>

      {/* Text with animated dots */}
      <p className={cn("font-medium", sizeClasses[size])}>Popping corn{dots}</p>
    </div>
  )
}
