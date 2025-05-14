import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as HandleUploadBody

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not defined")
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 })
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname: string, clientPayload?: string) => {
        // Optional: Validate the upload request
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
          tokenPayload: JSON.stringify({
            // Optional: Add additional metadata
            timestamp: Date.now(),
          }),
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Error in blob upload:", error)
    return NextResponse.json({ error: "Error uploading to Vercel Blob", details: String(error) }, { status: 500 })
  }
}

// Required for streaming responses
export const config = {
  api: {
    bodyParser: false,
  },
}
