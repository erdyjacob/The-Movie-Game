import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

// Basic list of offensive words to block
const offensiveWords = [
  // Racial slurs (censored)
  "n****r",
  "k***",
  "c***k",
  "w*****k",
  "g***",
  // Profanity (censored)
  "f**k",
  "s**t",
  "a*****e",
  "b***h",
  "c**t",
  // Other offensive terms (censored)
  "r****d",
  "f****t",
  "d**e",
]

export async function POST(request: Request) {
  try {
    // Check for admin password
    const { password } = await request.json()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Clear existing list
    await redis.del("offensive_words")

    // Add all words
    for (const word of offensiveWords) {
      await redis.sadd("offensive_words", word)
    }

    return NextResponse.json({
      success: true,
      message: `Added ${offensiveWords.length} words to offensive_words list`,
    })
  } catch (error) {
    console.error("Failed to initialize offensive words list:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize offensive words list",
      },
      { status: 500 },
    )
  }
}
