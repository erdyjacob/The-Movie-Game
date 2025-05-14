"use client"

import { useState } from "react"
import TestDataLoader from "@/test-data-loader"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const [showLoader, setShowLoader] = useState(false)

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
          </Link>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Developer Tools</h2>
          <p className="text-gray-600 mb-4">These tools are for development and testing purposes only.</p>

          <Button onClick={() => setShowLoader(!showLoader)} variant="secondary" className="mb-4">
            {showLoader ? "Hide Test Data Loader" : "Show Test Data Loader"}
          </Button>

          {showLoader && (
            <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-md">
              <h3 className="text-lg font-medium mb-2">Test Data Loader</h3>
              <p className="text-sm text-gray-500 mb-4">
                This will populate the game with mock data for testing purposes.
              </p>
              <TestDataLoader />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
