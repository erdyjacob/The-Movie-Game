"use client"

import type React from "react"

// This component is no longer needed as we're handling the username setup directly in the UserProvider
export function UserSetupFlow({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
