// List of common profanity words to filter
// This is a very basic list - in production you might want to use a more comprehensive library
const PROFANITY_LIST = [
  // Common profanity
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "cunt",
  "damn",
  "dick",
  "fuck",
  "fucking",
  "shit",
  "piss",
  "pussy",
  "cock",
  "whore",
  "slut",
  "tits",
  "boobs",
  "penis",
  "vagina",

  // Racist slurs and offensive terms
  "nigger",
  "nigga",
  "negro",
  "chink",
  "gook",
  "spic",
  "wetback",
  "beaner",
  "kike",
  "kyke",
  "heeb",
  "jap",
  "paki",
  "towelhead",
  "raghead",
  "camel",
  "jockey",
  "redskin",
  "injun",
  "coon",
  "cracker",
  "honky",
  "whitey",
  "gringo",
  "dago",
  "wop",
  "mick",
  "polack",
  "kraut",
  "nazi",
  "hitler",
  "kkk",
  "lynch",
  "slave",

  // Homophobic slurs
  "fag",
  "faggot",
  "dyke",
  "homo",
  "queer",
  "tranny",
  "trannie",

  // Ableist slurs
  "retard",
  "retarded",
  "spaz",
  "spastic",
  "cripple",
  "midget",
  "mongol",
  "mongoloid",

  // Religious slurs
  "kaffir",
  "kafir",
  "infidel",
  "heathen",
  "jihad",
  "terrorist",

  // Other offensive terms
  "pedo",
  "pedophile",
  "rapist",
  "rape",
  "molest",
  "incest",
  "suicide",
  "kill",
  "murder",
  "holocaust",
  "genocide",
]

// Common character substitutions in leetspeak
const LEET_SUBSTITUTIONS: Record<string, string> = {
  "0": "o",
  "1": "i",
  "2": "z",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  $: "s",
  "+": "t",
  "!": "i",
  "(": "c",
  ")": "o",
  "[": "c",
  "]": "o",
  "{": "c",
  "}": "o",
  "|": "i",
  "/": "l",
  "\\": "l",
  "<": "c",
  ">": "o",
  "*": "a",
  "&": "a",
  "%": "o",
  "^": "a",
  "#": "h",
  _: " ",
}

// Escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Convert leetspeak to normal text
function normalizeLeetspeak(text: string): string {
  let normalized = text.toLowerCase()

  // Replace each leetspeak character with its normal equivalent
  for (const [leet, normal] of Object.entries(LEET_SUBSTITUTIONS)) {
    // Escape the leet character for regex safety
    const escapedLeet = escapeRegExp(leet)
    normalized = normalized.replace(new RegExp(escapedLeet, "g"), normal)
  }

  return normalized
}

// Check for common variations of profane words
function checkWordVariations(word: string): string[] {
  const variations: string[] = [word]

  // Add common variations
  if (word.includes("a")) variations.push(word.replace(/a/g, "4"))
  if (word.includes("e")) variations.push(word.replace(/e/g, "3"))
  if (word.includes("i")) variations.push(word.replace(/i/g, "1"))
  if (word.includes("o")) variations.push(word.replace(/o/g, "0"))
  if (word.includes("s")) variations.push(word.replace(/s/g, "5"))

  return variations
}

// Generate regex patterns for profanity detection
function generateProfanityPatterns(): RegExp[] {
  const patterns: RegExp[] = []

  for (const word of PROFANITY_LIST) {
    // Escape the word for regex safety
    const escapedWord = escapeRegExp(word)

    // Create pattern for exact word match
    patterns.push(new RegExp(`\\b${escapedWord}\\b`, "i"))

    // Create pattern for word embedded in other text
    patterns.push(new RegExp(escapedWord, "i"))

    // Create patterns for common variations
    const variations = checkWordVariations(word)
    for (const variation of variations) {
      if (variation !== word) {
        const escapedVariation = escapeRegExp(variation)
        patterns.push(new RegExp(`\\b${escapedVariation}\\b`, "i"))
        patterns.push(new RegExp(escapedVariation, "i"))
      }
    }
  }

  return patterns
}

// Pre-generate patterns for better performance
const PROFANITY_PATTERNS = generateProfanityPatterns()

export function containsProfanity(text: string): boolean {
  // Check original text against patterns
  if (PROFANITY_PATTERNS.some((pattern) => pattern.test(text.toLowerCase()))) {
    return true
  }

  // Normalize the text (convert leetspeak to normal text)
  const normalizedText = normalizeLeetspeak(text.toLowerCase())

  // Check normalized text against patterns
  return PROFANITY_PATTERNS.some((pattern) => pattern.test(normalizedText))
}

export function isValidUsername(username: string): { valid: boolean; message?: string } {
  // Check if username is empty
  if (!username || username.trim() === "") {
    return { valid: false, message: "Username cannot be empty" }
  }

  // Check if username is too short
  if (username.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters long" }
  }

  // Check if username is too long
  if (username.length > 20) {
    return { valid: false, message: "Username cannot exceed 20 characters" }
  }

  // Check if username contains only allowed characters
  const validCharsRegex = /^[a-zA-Z0-9_-]+$/
  if (!validCharsRegex.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers, underscores, and hyphens" }
  }

  // Check for profanity
  if (containsProfanity(username)) {
    return { valid: false, message: "Username contains inappropriate language" }
  }

  return { valid: true }
}
