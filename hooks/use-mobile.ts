"use client"

import { useState, useEffect } from "react"

/**
 * A hook that returns true if the current viewport width is less than the specified breakpoint
 * @param breakpoint The breakpoint in pixels (default: 768px - standard md breakpoint in Tailwind)
 * @returns boolean indicating if the current viewport is mobile-sized
 */
export function useMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false)

  useEffect(() => {
    // Function to check if window width is less than breakpoint
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Check on mount
    checkMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile)

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [breakpoint])

  return isMobile
}

export default useMobile
