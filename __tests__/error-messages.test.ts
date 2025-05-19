import { generateNotFoundErrorMessage } from "../lib/answer-validation"

describe("Error Message Generation", () => {
  test("generates correct error message for actor not found", () => {
    const message = generateNotFoundErrorMessage("Brad Pitt", "actor", {
      id: 1,
      name: "Inception",
      type: "movie",
      image: null,
      details: {},
    })

    expect(message).toBe("Brad Pitt is not an actor in Inception")
  })

  test("generates correct error message for movie not found", () => {
    const message = generateNotFoundErrorMessage("Inception", "movie", {
      id: 1,
      name: "Leonardo DiCaprio",
      type: "actor",
      image: null,
      details: {},
    })

    expect(message).toBe("Inception is not a movie that Leonardo DiCaprio appeared in")
  })
})
