import { validateAnswer, stringSimilarity, findBestMatch } from "../lib/answer-validation"
import { searchActorsByMovie, searchMoviesByActor } from "../lib/tmdb-api"

// Mock the API functions
jest.mock("../lib/tmdb-api", () => ({
  searchActorsByMovie: jest.fn(),
  searchMoviesByActor: jest.fn(),
}))

describe("Answer Validation", () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("stringSimilarity", () => {
    test("returns 1.0 for identical strings", () => {
      expect(stringSimilarity("test", "test")).toBe(1.0)
    })

    test("returns 0.0 for completely different strings", () => {
      expect(stringSimilarity("abcd", "efgh")).toBe(0.0)
    })

    test("handles case insensitivity", () => {
      expect(stringSimilarity("Test", "test")).toBe(1.0)
    })

    test("returns partial similarity for similar strings", () => {
      expect(stringSimilarity("kitten", "sitting")).toBeCloseTo(0.57, 1)
    })
  })

  describe("findBestMatch", () => {
    test("returns null for empty options", () => {
      expect(findBestMatch("test", [])).toBeNull()
    })

    test("finds exact match", () => {
      const options = [
        { id: 1, name: "apple" },
        { id: 2, name: "banana" },
        { id: 3, name: "cherry" },
      ]
      const result = findBestMatch("banana", options)
      expect(result?.id).toBe(2)
      expect(result?.name).toBe("banana")
      expect(result?.similarity).toBe(1.0)
    })

    test("finds close match", () => {
      const options = [
        { id: 1, name: "Tom Hanks" },
        { id: 2, name: "Tom Cruise" },
        { id: 3, name: "Brad Pitt" },
      ]
      const result = findBestMatch("Tom Hank", options)
      expect(result?.id).toBe(1)
    })

    test("returns null if no match is similar enough", () => {
      const options = [
        { id: 1, name: "apple" },
        { id: 2, name: "banana" },
        { id: 3, name: "cherry" },
      ]
      expect(findBestMatch("dragonfruit", options)).toBeNull()
    })
  })

  describe("validateAnswer", () => {
    test("validates actor answer correctly when actor exists", async () => {
      // Mock the API response
      const mockActors = [
        { id: 1, name: "Tom Hanks", profile_path: "/path.jpg" },
        { id: 2, name: "Tim Allen", profile_path: null },
      ]
      ;(searchActorsByMovie as jest.Mock).mockResolvedValue(mockActors)

      const currentItem = {
        id: 100,
        name: "Toy Story",
        image: "/toy-story.jpg",
        type: "movie",
        details: {},
      }

      const result = await validateAnswer(
        "Tom Hanks",
        currentItem,
        "actor",
        new Set([3, 4]), // Used IDs that don't include our test actors
        { includeAnimated: true, includeSequels: true, includeForeign: true },
      )

      expect(result.valid).toBe(true)
      expect(result.item?.id).toBe(1)
      expect(result.item?.name).toBe("Tom Hanks")
      expect(result.item?.type).toBe("actor")
    })

    test("validates movie answer correctly when movie exists", async () => {
      // Mock the API response
      const mockMovies = [
        { id: 100, title: "Toy Story", poster_path: "/path.jpg" },
        { id: 200, title: "Cast Away", poster_path: null },
      ]
      ;(searchMoviesByActor as jest.Mock).mockResolvedValue(mockMovies)

      const currentItem = {
        id: 1,
        name: "Tom Hanks",
        image: "/tom-hanks.jpg",
        type: "actor",
        details: {},
      }

      const result = await validateAnswer(
        "Cast Away",
        currentItem,
        "movie",
        new Set([300, 400]), // Used IDs that don't include our test movies
        { includeAnimated: true, includeSequels: true, includeForeign: true },
      )

      expect(result.valid).toBe(true)
      expect(result.item?.id).toBe(200)
      expect(result.item?.name).toBe("Cast Away")
      expect(result.item?.type).toBe("movie")
    })

    test("rejects when actor is not in the movie", async () => {
      // Mock the API response with no matching actor
      const mockActors = [
        { id: 1, name: "Tom Hanks", profile_path: "/path.jpg" },
        { id: 2, name: "Tim Allen", profile_path: null },
      ]
      ;(searchActorsByMovie as jest.Mock).mockResolvedValue(mockActors)

      const currentItem = {
        id: 100,
        name: "Toy Story",
        image: "/toy-story.jpg",
        type: "movie",
        details: {},
      }

      const result = await validateAnswer(
        "Brad Pitt", // Not in our mock actors
        currentItem,
        "actor",
        new Set([3, 4]),
        { includeAnimated: true, includeSequels: true, includeForeign: true },
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain("is not an actor in this movie")
    })

    test("handles API errors gracefully", async () => {
      // Mock API failure
      ;(searchActorsByMovie as jest.Mock).mockRejectedValue(new Error("API error"))

      const currentItem = {
        id: 100,
        name: "Toy Story",
        image: "/toy-story.jpg",
        type: "movie",
        details: {},
      }

      const result = await validateAnswer("Tom Hanks", currentItem, "actor", new Set([3, 4]), {
        includeAnimated: true,
        includeSequels: true,
        includeForeign: true,
      })

      expect(result.valid).toBe(false)
      expect(result.error).toContain("unexpected error")
    })

    test("validates using selectedItemId when provided", async () => {
      // Mock the API response
      const mockActors = [
        { id: 1, name: "Tom Hanks", profile_path: "/path.jpg" },
        { id: 2, name: "Tim Allen", profile_path: null },
      ]
      ;(searchActorsByMovie as jest.Mock).mockResolvedValue(mockActors)

      const currentItem = {
        id: 100,
        name: "Toy Story",
        image: "/toy-story.jpg",
        type: "movie",
        details: {},
      }

      // Validate with a selectedItemId (simulating dropdown selection)
      const result = await validateAnswer(
        "Tim Allen", // The name doesn't matter as much when we have the ID
        currentItem,
        "actor",
        new Set([3, 4]),
        { includeAnimated: true, includeSequels: true, includeForeign: true },
        2, // Selected ID for Tim Allen
      )

      expect(result.valid).toBe(true)
      expect(result.item?.id).toBe(2)
      expect(result.item?.name).toBe("Tim Allen")
    })
  })
})
