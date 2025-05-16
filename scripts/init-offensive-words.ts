import { redis } from "../lib/redis"

// Basic list of offensive words to block
// This is a minimal example - you would want a more comprehensive list
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
  // Add more as needed
]

async function initOffensiveWords() {
  try {
    // Clear existing list
    await redis.del("offensive_words")

    // Add all words
    for (const word of offensiveWords) {
      await redis.sadd("offensive_words", word)
    }

    console.log(`Added ${offensiveWords.length} words to offensive_words list`)
  } catch (error) {
    console.error("Failed to initialize offensive words list:", error)
  }
}

// Run the function
initOffensiveWords()
