"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { ButtonProps } from "@/components/ui/button"

interface AnimatedButtonProps extends ButtonProps {
  children: React.ReactNode
  onClick: () => void
}

export function AnimatedButton({
  children,
  onClick,
  variant = "default",
  size = "default",
  className,
  ...props
}: AnimatedButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      className={cn(
        "transition-all duration-200",
        "hover:shadow-sm hover:brightness-105",
        "active:brightness-95",
        "focus:ring-2 focus:ring-offset-1 focus:ring-primary/40",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
