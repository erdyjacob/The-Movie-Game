"use client"

import { useEffect, useState } from "react"
import { X, Sparkles, Zap, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VersionMigrationToastProps {
  wasCleared: boolean
  previousVersion: string | null
  onDismiss: () => void
}

export function VersionMigrationToast({ wasCleared, previousVersion, onDismiss }: VersionMigrationToastProps) {
  const [isVisible, setIsVisible] = useState(wasCleared)

  useEffect(() => {
    if (wasCleared) {
      // Prevent body scroll when overlay is open
      document.body.style.overflow = "hidden"

      return () => {
        document.body.style.overflow = "unset"
      }
    }
  }, [wasCleared])

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    document.body.style.overflow = "unset"
    onDismiss()
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDismiss} />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-6 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 opacity-20">
            <Sparkles className="h-24 w-24 transform rotate-12" />
          </div>
          <div className="absolute bottom-0 left-0 opacity-10">
            <Zap className="h-16 w-16 transform -rotate-12" />
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Header content */}
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="h-8 w-8 text-yellow-300" />
              <h2 className="text-2xl font-bold">Welcome to v2.0!</h2>
            </div>
            <p className="text-purple-100 text-sm">The Movie Game has been upgraded</p>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              What's New
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                Enhanced game tracking and analytics
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                More challenging ranking system
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                Improved performance and stability
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">•</span>
                Better player statistics and insights
              </li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">Fresh Start Required</h4>
            <p className="text-sm text-purple-700 dark:text-purple-200">
              To ensure everyone has a fair experience with the new features, all player progress has been reset.
              Everyone starts fresh together! 🚀
            </p>
          </div>

          <div className="text-center">
            <Button
              onClick={handleDismiss}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-2 rounded-lg font-medium"
            >
              Let's Play! 🎬
            </Button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Join our Discord for updates and community discussions
          </p>
        </div>
      </div>
    </div>
  )
}
