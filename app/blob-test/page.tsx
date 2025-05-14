"use client"

import type React from "react"

import { useState } from "react"
import { put } from "@vercel/blob/client"
import Image from "next/image"
import Link from "next/link"

export default function BlobTestPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadedBlobs, setUploadedBlobs] = useState<Array<{ url: string; filename: string }>>([])
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setUploading(true)

    try {
      const form = event.currentTarget
      const fileInput = form.elements.namedItem("file") as HTMLInputElement
      const file = fileInput.files?.[0]

      if (!file) {
        throw new Error("No file selected")
      }

      // Get the file extension
      const fileExtension = file.name.split(".").pop() || ""
      const uniqueFilename = `test-upload-${Date.now()}.${fileExtension}`

      // Upload to Vercel Blob using the put method
      const blob = await put(uniqueFilename, file, {
        access: "public",
      })

      // Add to the list of uploaded blobs
      setUploadedBlobs((prev) => [...prev, { url: blob.url, filename: blob.pathname }])

      // Reset the form
      form.reset()
    } catch (err) {
      console.error("Error uploading to Vercel Blob:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Vercel Blob Test</h1>
        <p className="text-gray-600 mb-4">
          This page tests your Vercel Blob configuration without affecting the main game.
        </p>
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back to game
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Test Image</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              Select an image to upload
            </label>
            <input
              type="file"
              id="file"
              name="file"
              accept="image/*"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              required
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload to Blob"}
          </button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>

      {uploadedBlobs.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Uploaded Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadedBlobs.map((blob, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="relative h-48 mb-2">
                  <Image
                    src={blob.url || "/placeholder.svg"}
                    alt={`Uploaded image ${index + 1}`}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <p className="text-sm text-gray-500 truncate">{blob.filename}</p>
                <a
                  href={blob.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  View full size
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium mb-2">Next Steps</h3>
        <p className="text-gray-600 mb-2">
          If you can successfully upload and view images here, your Vercel Blob configuration is working correctly!
        </p>
        <p className="text-gray-600">
          You can now proceed with implementing the data caching layer for your movie game.
        </p>
      </div>
    </div>
  )
}
