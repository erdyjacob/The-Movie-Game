import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { isValidUsername } from "@/lib/username-validation"

export async function POST(request: Request) {
  try {
    const { username } = await request.json()

    // First validate the username format and check for profanity
    const validation = isValidUsername(username)
    if (!validation.valid) {
      return NextResponse.json({ available: false, message: validation.message }, { status: 400 })
    }

    // Check if username exists in KV store
    const exists = await kv.exists(`username:${username.toLowerCase()}`)

    if (exists) {
      return NextResponse.json({
        available: false,
        message: "This username is already taken",
      })
    }

    return NextResponse.json({ available: true })
  } catch (error) {
    console.error("Error checking username:", error)
    return NextResponse.json(
      { available: false, message: "An error occurred while checking username availability" },
      { status: 500 },
    )
  }
}
