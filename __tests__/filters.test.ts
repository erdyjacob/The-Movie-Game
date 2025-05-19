import {
  isLikelySequel,
  isForeignFilm,
  isDocumentary,
  isAnimatedMovie,
  isTooNicheMovie,
  isTooNicheActor,
  filterMovie,
} from "../lib/filters"
import type { TMDBMovie, TMDBActor, GameFilters } from "@/lib/types"

describe("Movie Filters", () => {
  // Test isLikelySequel
  test("isLikelySequel identifies sequels correctly", () => {
    const sequel1: TMDBMovie = {
      id: 1,
      title: "Star Wars 2",
      belongs_to_collection: { id: 10, name: "Star Wars Collection" },
    } as TMDBMovie
    const sequel2: TMDBMovie = { id: 2, title: "The Avengers 2: Age of Ultron" } as TMDBMovie
    const sequel3: TMDBMovie = { id: 3, title: "Fast and Furious Part 2" } as TMDBMovie
    const nonSequel: TMDBMovie = { id: 4, title: "Inception" } as TMDBMovie

    expect(isLikelySequel(sequel1)).toBe(true)
    expect(isLikelySequel(sequel2)).toBe(true)
    expect(isLikelySequel(sequel3)).toBe(true)
    expect(isLikelySequel(nonSequel)).toBe(false)
  })

  // Test isForeignFilm
  test("isForeignFilm identifies foreign films correctly", () => {
    const foreignFilm: TMDBMovie = { id: 1, title: "Parasite", original_language: "ko" } as TMDBMovie
    const englishFilm: TMDBMovie = { id: 2, title: "The Godfather", original_language: "en" } as TMDBMovie

    expect(isForeignFilm(foreignFilm)).toBe(true)
    expect(isForeignFilm(englishFilm)).toBe(false)
  })

  // Test isDocumentary
  test("isDocumentary identifies documentaries correctly", () => {
    const docWithGenreIds: TMDBMovie = { id: 1, title: "Planet Earth", genre_ids: [99, 28] } as TMDBMovie
    const docWithGenres: TMDBMovie = {
      id: 2,
      title: "March of the Penguins",
      genres: [{ id: 99, name: "Documentary" }],
    } as TMDBMovie
    const docWithKeywords: TMDBMovie = {
      id: 3,
      title: "The Making of Star Wars",
      overview: "A behind the scenes documentary about the making of Star Wars",
      genre_ids: [28],
    } as TMDBMovie
    const nonDoc: TMDBMovie = { id: 4, title: "The Matrix", genre_ids: [28, 878] } as TMDBMovie

    expect(isDocumentary(docWithGenreIds)).toBe(true)
    expect(isDocumentary(docWithGenres)).toBe(true)
    expect(isDocumentary(docWithKeywords)).toBe(true)
    expect(isDocumentary(nonDoc)).toBe(false)
  })

  // Test isAnimatedMovie
  test("isAnimatedMovie identifies animated movies correctly", () => {
    const animatedWithGenreIds: TMDBMovie = { id: 1, title: "Toy Story", genre_ids: [16, 10751] } as TMDBMovie
    const animatedWithGenres: TMDBMovie = {
      id: 2,
      title: "Frozen",
      genres: [{ id: 16, name: "Animation" }],
    } as TMDBMovie
    const nonAnimated: TMDBMovie = { id: 3, title: "Jurassic Park", genre_ids: [28, 12, 878] } as TMDBMovie

    expect(isAnimatedMovie(animatedWithGenreIds)).toBe(true)
    expect(isAnimatedMovie(animatedWithGenres)).toBe(true)
    expect(isAnimatedMovie(nonAnimated)).toBe(false)
  })

  // Test isTooNicheMovie
  test("isTooNicheMovie identifies niche movies correctly", () => {
    const nicheMovie1: TMDBMovie = { id: 1, title: "Unknown Film", popularity: 0.5, vote_count: 50 } as TMDBMovie
    const nicheMovie2: TMDBMovie = {
      id: 2,
      title: "Obscure Movie",
      popularity: 2.0,
      vote_count: 80,
      poster_path: null,
    } as TMDBMovie
    const popularMovie: TMDBMovie = {
      id: 3,
      title: "Blockbuster",
      popularity: 50.0,
      vote_count: 5000,
      poster_path: "/path.jpg",
    } as TMDBMovie

    expect(isTooNicheMovie(nicheMovie1)).toBe(true)
    expect(isTooNicheMovie(nicheMovie2)).toBe(true)
    expect(isTooNicheMovie(popularMovie)).toBe(false)
  })

  // Test isTooNicheActor
  test("isTooNicheActor identifies niche actors correctly", () => {
    const nicheActor1: TMDBActor = { id: 1, name: "Unknown Actor", popularity: 0.5 } as TMDBActor
    const nicheActor2: TMDBActor = { id: 2, name: "Obscure Actor", popularity: 2.0, profile_path: null } as TMDBActor
    const popularActor: TMDBActor = {
      id: 3,
      name: "Famous Actor",
      popularity: 20.0,
      profile_path: "/path.jpg",
    } as TMDBActor

    expect(isTooNicheActor(nicheActor1)).toBe(true)
    expect(isTooNicheActor(nicheActor2)).toBe(true)
    expect(isTooNicheActor(popularActor)).toBe(false)
  })

  // Test filterMovie
  test("filterMovie applies all filters correctly", () => {
    const recentlyUsedMovieIds = [5, 6]
    const recentlyUsedFranchises = ["star wars", "marvel"]
    const filters: GameFilters = {
      includeAnimated: false,
      includeSequels: false,
      includeForeign: false,
    }

    // Movie that should be filtered out (animated)
    const animatedMovie: TMDBMovie = {
      id: 1,
      title: "Toy Story",
      genre_ids: [16, 10751],
      popularity: 50.0,
      vote_count: 5000,
      poster_path: "/path.jpg",
      original_language: "en",
    } as TMDBMovie

    // Movie that should be filtered out (sequel)
    const sequelMovie: TMDBMovie = {
      id: 2,
      title: "The Avengers 2",
      genre_ids: [28, 12],
      popularity: 50.0,
      vote_count: 5000,
      poster_path: "/path.jpg",
      original_language: "en",
    } as TMDBMovie

    // Movie that should be filtered out (foreign)
    const foreignMovie: TMDBMovie = {
      id: 3,
      title: "Parasite",
      genre_ids: [18, 53],
      popularity: 50.0,
      vote_count: 5000,
      poster_path: "/path.jpg",
      original_language: "ko",
    } as TMDBMovie

    // Movie that should be filtered out (recently used)
    const recentlyUsedMovie: TMDBMovie = {
      id: 5,
      title: "Inception",
      genre_ids: [28, 878],
      popularity: 50.0,
      vote_count: 5000,
      poster_path: "/path.jpg",
      original_language: "en",
    } as TMDBMovie

    // Movie that should be filtered out (franchise)
    const franchiseMovie: TMDBMovie = {
      id: 7,
      title: "Star Wars: A New Hope",
      genre_ids: [28, 878],
      popularity: 50.0,
      vote_count: 5000,
      poster_path: "/path.jpg",
      original_language: "en",
    } as TMDBMovie

    // Movie that should pass all filters
    const goodMovie: TMDBMovie = {
      id: 8,
      title: "The Shawshank Redemption",
      genre_ids: [18, 80],
      popularity: 50.0,
      vote_count: 5000,
      poster_path: "/path.jpg",
      original_language: "en",
    } as TMDBMovie

    expect(filterMovie(animatedMovie, filters, recentlyUsedMovieIds, recentlyUsedFranchises)).toBe(false)
    expect(filterMovie(sequelMovie, filters, recentlyUsedMovieIds, recentlyUsedFranchises)).toBe(false)
    expect(filterMovie(foreignMovie, filters, recentlyUsedMovieIds, recentlyUsedFranchises)).toBe(false)
    expect(filterMovie(recentlyUsedMovie, filters, recentlyUsedMovieIds, recentlyUsedFranchises)).toBe(false)
    expect(filterMovie(franchiseMovie, filters, recentlyUsedMovieIds, recentlyUsedFranchises)).toBe(false)
    expect(filterMovie(goodMovie, filters, recentlyUsedMovieIds, recentlyUsedFranchises)).toBe(true)

    // Test with different filter settings
    const inclusiveFilters: GameFilters = {
      includeAnimated: true,
      includeSequels: true,
      includeForeign: true,
    }

    expect(filterMovie(animatedMovie, inclusiveFilters, recentlyUsedMovieIds, recentlyUsedFranchises)).toBe(true)
    expect(filterMovie(sequelMovie, inclusiveFilters, recentlyUsedMovieIds, recentlyUsedFranchises)).toBe(false) // Still filtered due to franchise
    expect(filterMovie(foreignMovie, inclusiveFilters, recentlyUsedMovieIds, recentlyUsedFranchises)).toBe(true)
  })
})
