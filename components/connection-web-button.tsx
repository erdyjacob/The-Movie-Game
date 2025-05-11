"use client"

import { Button } from "@/components/ui/button"
import { Network } from "lucide-react"
import Link from "next/link"

interface ConnectionWebButtonProps {
  className?: string
  size?: "default" | "sm" | "lg"
  variant?: "default" | "outline" | "secondary" | "ghost"
}

export default function ConnectionWebButton({
  className,
  size = "default",
  variant = "outline",
}: ConnectionWebButtonProps) {
  return (
    <Link href="/connection-web">
      <Button variant={variant} size={size} className={className}>
        <Network className="h-4 w-4 mr-2" />
        <span>Connection Web</span>
      </Button>
    </Link>
  )
}
