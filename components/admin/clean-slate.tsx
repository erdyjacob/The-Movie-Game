"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function CleanSlate() {
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()

  const handleCleanSlate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (confirmText !== "CONFIRM CLEAN SLATE") {
      setError("Please type 'CONFIRM CLEAN SLATE' to proceed")
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setDebugInfo(null)

      console.log("Sending clean slate request...")

      const response = await fetch("/api/admin/clean-slate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, confirmText }),
      })

      console.log("Response status:", response.status)
      console.log("Response headers:", Object.fromEntries(response.headers.entries()))

      const data = await response.json()
      console.log("Response data:", data)

      if (!response.ok) {
        setDebugInfo({
          status: response.status,
          statusText: response.statusText,
          data: data,
        })
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      setResult(data)

      // Refresh the page after 3 seconds
      setTimeout(() => {
        router.refresh()
      }, 3000)
    } catch (err: any) {
      console.error("Clean slate error:", err)
      setError(err.message || "An error occurred during the clean slate operation")
      setDebugInfo((prev) => ({
        ...prev,
        clientError: err.message,
        timestamp: new Date().toISOString(),
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ CLEAN SLATE OPERATION ⚠️</h2>

      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p className="font-bold text-red-800 mb-2">WARNING: This action is irreversible!</p>
        <p className="text-red-700">
          This will permanently delete ALL user data, including accounts, scores, leaderboards, and game history. The
          system will be reset to a clean state.
        </p>
      </div>

      <form onSubmit={handleCleanSlate}>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Admin Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="confirmText" className="block text-sm font-medium text-gray-700 mb-1">
            Type &quot;CONFIRM CLEAN SLATE&quot; to proceed
          </label>
          <input
            type="text"
            id="confirmText"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Execute Clean Slate Operation"}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {debugInfo && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-md">
          <p className="font-bold">Debug Information:</p>
          <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          <p className="font-bold">Operation Successful!</p>
          <p>Message: {result.message}</p>
          <p>Total keys deleted: {result.totalKeysDeleted}</p>
          {result.details && (
            <details className="mt-2">
              <summary className="cursor-pointer font-medium">View Details</summary>
              <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(result.details, null, 2)}</pre>
            </details>
          )}
          <p className="mt-2 text-sm">Refreshing page in 3 seconds...</p>
        </div>
      )}
    </div>
  )
}
