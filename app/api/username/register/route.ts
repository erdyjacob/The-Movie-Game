import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { isValidUsername } from "@/lib/username-validation"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  try {
    const { username } = await request.json()

    // First validate the username format and check for profanity
    const validation = isValidUsername(username)
    if (!validation.valid) {
      return NextResponse.json({ success: false, message: validation.message }, { status: 400 })
    }

    // Check if username exists in KV store
    const exists = await kv.exists(`username:${username.toLowerCase()}`)

    if (exists) {
      return NextResponse.json({
        success: false,
        message: "This username is already taken",
      })
    }

    // Generate a unique user ID
    const userId = nanoid()

    // Store the username with the user ID
    await kv.set(`username:${username.toLowerCase()}`, userId)
    await kv.set(`user:${userId}`, {
      username,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      userId,
      username,
    })
  } catch (error) {
    console.error("Error registering username:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while registering the username" },
      { status: 500 },
    )
  }
}
