"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div className="p-6 border rounded-lg bg-red-50 text-red-800">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-lg font-medium">Something went wrong</h3>
            </div>
            <p className="mb-4">
              There was an error loading this component. You can try resetting your achievements or clearing your
              browser cache.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Clear localStorage
                  localStorage.removeItem("movieGameAchievements")
                  // Reload the page
                  window.location.reload()
                }}
              >
                Reset Data & Reload
              </Button>
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
