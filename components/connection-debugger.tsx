"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadPlayerHistory } from "@/lib/player-history"
import {
  inspectCacheForMovie,
  inspectCacheForActor,
  testInferConnection,
  forceRefreshMovieCredits,
  forceRefreshActorCredits,
} from "@/lib/connection-tracking"
import { Loader2, RefreshCw } from "lucide-react"

export function ConnectionDebugger() {
  const [playerHistory, setPlayerHistory] = useState<any>({ movies: [], actors: [] })
  const [selectedMovie, setSelectedMovie] = useState<any>(null)
  const [selectedActor, setSelectedActor] = useState<any>(null)
  const [movieSearchTerm, setMovieSearchTerm] = useState("")
  const [actorSearchTerm, setActorSearchTerm] = useState("")
  const [filteredMovies, setFilteredMovies] = useState<any[]>([])
  const [filteredActors, setFilteredActors] = useState<any[]>([])
  const [movieCacheData, setMovieCacheData] = useState<any>(null)
  const [actorCacheData, setActorCacheData] = useState<any>(null)
  const [inferenceResult, setInferenceResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [refreshingMovie, setRefreshingMovie] = useState(false)
  const [refreshingActor, setRefreshingActor] = useState(false)
  const [debugLog, setDebugLog] = useState<string[]>([])

  // Load player history on component mount
  useEffect(() => {
    const history = loadPlayerHistory()
    setPlayerHistory(history)
    setFilteredMovies(history.movies.slice(0, 10))
    setFilteredActors(history.actors.slice(0, 10))
  }, [])

  // Filter movies based on search term
  useEffect(() => {
    if (!movieSearchTerm.trim()) {
      setFilteredMovies(playerHistory.movies.slice(0, 10))
      return
    }

    const term = movieSearchTerm.toLowerCase()
    const filtered = playerHistory.movies.filter((movie: any) => movie.name.toLowerCase().includes(term)).slice(0, 10)
    setFilteredMovies(filtered)
  }, [movieSearchTerm, playerHistory.movies])

  // Filter actors based on search term
  useEffect(() => {
    if (!actorSearchTerm.trim()) {
      setFilteredActors(playerHistory.actors.slice(0, 10))
      return
    }

    const term = actorSearchTerm.toLowerCase()
    const filtered = playerHistory.actors.filter((actor: any) => actor.name.toLowerCase().includes(term)).slice(0, 10)
    setFilteredActors(filtered)
  }, [actorSearchTerm, playerHistory.actors])

  // Handle movie selection
  const handleSelectMovie = async (movie: any) => {
    setSelectedMovie(movie)
    setLoading(true)
    setDebugLog((prev) => [...prev, `Inspecting cache for movie: ${movie.name} (ID: ${movie.id})`])

    try {
      const cacheData = await inspectCacheForMovie(movie.id)
      setMovieCacheData(cacheData)

      if (cacheData.movieDetails) {
        setDebugLog((prev) => [...prev, `✅ Found movie details in cache`])
      } else {
        setDebugLog((prev) => [...prev, `❌ Movie details not found in cache`])
      }

      if (cacheData.movieCredits) {
        setDebugLog((prev) => [
          ...prev,
          `✅ Found movie credits in cache with ${cacheData.movieCredits.cast?.length || 0} cast members`,
        ])
      } else {
        setDebugLog((prev) => [...prev, `❌ Movie credits not found in cache`])
      }
    } catch (error) {
      console.error("Error inspecting movie cache:", error)
      setDebugLog((prev) => [...prev, `❌ Error inspecting movie cache: ${error}`])
    } finally {
      setLoading(false)
    }

    // If both movie and actor are selected, test inference
    if (selectedActor) {
      testInferenceConnection(movie.id, selectedActor.id)
    }
  }

  // Handle actor selection
  const handleSelectActor = async (actor: any) => {
    setSelectedActor(actor)
    setLoading(true)
    setDebugLog((prev) => [...prev, `Inspecting cache for actor: ${actor.name} (ID: ${actor.id})`])

    try {
      const cacheData = await inspectCacheForActor(actor.id)
      setActorCacheData(cacheData)

      if (cacheData.actorDetails) {
        setDebugLog((prev) => [...prev, `✅ Found actor details in cache`])
      } else {
        setDebugLog((prev) => [...prev, `❌ Actor details not found in cache`])
      }

      if (cacheData.actorCredits) {
        setDebugLog((prev) => [
          ...prev,
          `✅ Found actor credits in cache with ${cacheData.actorCredits.cast?.length || 0} movies`,
        ])
      } else {
        setDebugLog((prev) => [...prev, `❌ Actor credits not found in cache`])
      }
    } catch (error) {
      console.error("Error inspecting actor cache:", error)
      setDebugLog((prev) => [...prev, `❌ Error inspecting actor cache: ${error}`])
    } finally {
      setLoading(false)
    }

    // If both movie and actor are selected, test inference
    if (selectedMovie) {
      testInferenceConnection(selectedMovie.id, actor.id)
    }
  }

  // Test inference connection
  const testInferenceConnection = async (movieId: number, actorId: number) => {
    setLoading(true)
    setDebugLog((prev) => [...prev, `Testing inference connection between movie ID ${movieId} and actor ID ${actorId}`])

    try {
      const result = await testInferConnection(movieId, actorId)
      setInferenceResult(result)

      if (result.connectionExists) {
        setDebugLog((prev) => [...prev, `✅ Connection already exists in localStorage`])
      } else {
        setDebugLog((prev) => [...prev, `ℹ️ Connection does not exist in localStorage`])
      }

      if (result.foundInMovieCredits) {
        setDebugLog((prev) => [...prev, `✅ Actor found in movie credits`])
      } else {
        setDebugLog((prev) => [...prev, `❌ Actor not found in movie credits`])
      }

      if (result.foundInActorCredits) {
        setDebugLog((prev) => [...prev, `✅ Movie found in actor credits`])
      } else {
        setDebugLog((prev) => [...prev, `❌ Movie not found in actor credits`])
      }

      if (result.wouldBeInferred) {
        setDebugLog((prev) => [...prev, `✅ Connection would be inferred`])
      } else {
        setDebugLog((prev) => [...prev, `❌ Connection would NOT be inferred: ${result.reason}`])
      }
    } catch (error) {
      console.error("Error testing inference connection:", error)
      setDebugLog((prev) => [...prev, `❌ Error testing inference: ${error}`])
    } finally {
      setLoading(false)
    }
  }

  // Force refresh movie credits
  const handleRefreshMovieCredits = async () => {
    if (!selectedMovie) return

    setRefreshingMovie(true)
    setDebugLog((prev) => [...prev, `Forcing refresh of movie credits for ${selectedMovie.name}`])

    try {
      const result = await forceRefreshMovieCredits(selectedMovie.id)

      if (result.success) {
        setDebugLog((prev) => [...prev, `✅ Successfully refreshed movie credits`])
        // Re-inspect cache
        handleSelectMovie(selectedMovie)
      } else {
        setDebugLog((prev) => [...prev, `❌ Failed to refresh movie credits: ${result.message}`])
      }
    } catch (error) {
      console.error("Error refreshing movie credits:", error)
      setDebugLog((prev) => [...prev, `❌ Error refreshing movie credits: ${error}`])
    } finally {
      setRefreshingMovie(false)
    }
  }

  // Force refresh actor credits
  const handleRefreshActorCredits = async () => {
    if (!selectedActor) return

    setRefreshingActor(true)
    setDebugLog((prev) => [...prev, `Forcing refresh of actor credits for ${selectedActor.name}`])

    try {
      const result = await forceRefreshActorCredits(selectedActor.id)

      if (result.success) {
        setDebugLog((prev) => [...prev, `✅ Successfully refreshed actor credits`])
        // Re-inspect cache
        handleSelectActor(selectedActor)
      } else {
        setDebugLog((prev) => [...prev, `❌ Failed to refresh actor credits: ${result.message}`])
      }
    } catch (error) {
      console.error("Error refreshing actor credits:", error)
      setDebugLog((prev) => [...prev, `❌ Error refreshing actor credits: ${error}`])
    } finally {
      setRefreshingActor(false)
    }
  }

  // Clear debug log
  const clearDebugLog = () => {
    setDebugLog([])
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Connection Debugger</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Movie Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Movie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="movie-search">Search Movies</Label>
                <Input
                  id="movie-search"
                  value={movieSearchTerm}
                  onChange={(e) => setMovieSearchTerm(e.target.value)}
                  placeholder="Type to search..."
                />
              </div>

              <div className="h-60 overflow-y-auto border rounded-md p-2">
                {filteredMovies.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No movies found</p>
                ) : (
                  <ul className="space-y-2">
                    {filteredMovies.map((movie) => (
                      <li key={movie.id}>
                        <Button
                          variant={selectedMovie?.id === movie.id ? "default" : "outline"}
                          className="w-full justify-start text-left"
                          onClick={() => handleSelectMovie(movie)}
                        >
                          {movie.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedMovie && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedMovie.name}</p>
                  <p className="text-sm text-muted-foreground">ID: {selectedMovie.id}</p>
                  <div className="mt-2 flex justify-between">
                    <Button size="sm" variant="outline" onClick={handleRefreshMovieCredits} disabled={refreshingMovie}>
                      {refreshingMovie ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Credits
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actor Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Actor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="actor-search">Search Actors</Label>
                <Input
                  id="actor-search"
                  value={actorSearchTerm}
                  onChange={(e) => setActorSearchTerm(e.target.value)}
                  placeholder="Type to search..."
                />
              </div>

              <div className="h-60 overflow-y-auto border rounded-md p-2">
                {filteredActors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No actors found</p>
                ) : (
                  <ul className="space-y-2">
                    {filteredActors.map((actor) => (
                      <li key={actor.id}>
                        <Button
                          variant={selectedActor?.id === actor.id ? "default" : "outline"}
                          className="w-full justify-start text-left"
                          onClick={() => handleSelectActor(actor)}
                        >
                          {actor.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedActor && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="font-medium">{selectedActor.name}</p>
                  <p className="text-sm text-muted-foreground">ID: {selectedActor.id}</p>
                  <div className="mt-2 flex justify-between">
                    <Button size="sm" variant="outline" onClick={handleRefreshActorCredits} disabled={refreshingActor}>
                      {refreshingActor ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Refresh Credits
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results and Debug Info */}
      <Tabs defaultValue="inference" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="inference">Inference Results</TabsTrigger>
          <TabsTrigger value="cache">Cache Data</TabsTrigger>
          <TabsTrigger value="log">Debug Log</TabsTrigger>
        </TabsList>

        <TabsContent value="inference">
          <Card>
            <CardHeader>
              <CardTitle>Inference Results</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !selectedMovie || !selectedActor ? (
                <p className="text-center text-muted-foreground py-4">
                  Select both a movie and an actor to test inference
                </p>
              ) : !inferenceResult ? (
                <p className="text-center text-muted-foreground py-4">No inference data available</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium mb-2">Connection Status</h3>
                      <p className={inferenceResult.connectionExists ? "text-green-500" : "text-amber-500"}>
                        {inferenceResult.connectionExists
                          ? "✅ Connection already exists"
                          : "ℹ️ Connection does not exist"}
                      </p>
                    </div>

                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium mb-2">Inference Result</h3>
                      <p className={inferenceResult.wouldBeInferred ? "text-green-500" : "text-red-500"}>
                        {inferenceResult.wouldBeInferred
                          ? "✅ Connection would be inferred"
                          : "❌ Connection would NOT be inferred"}
                      </p>
                      {!inferenceResult.wouldBeInferred && (
                        <p className="text-sm text-muted-foreground mt-2">Reason: {inferenceResult.reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium mb-2">Movie Credits Check</h3>
                      <p className={inferenceResult.foundInMovieCredits ? "text-green-500" : "text-red-500"}>
                        {inferenceResult.foundInMovieCredits
                          ? "✅ Actor found in movie credits"
                          : "❌ Actor NOT found in movie credits"}
                      </p>
                    </div>

                    <div className="p-4 border rounded-md">
                      <h3 className="font-medium mb-2">Actor Credits Check</h3>
                      <p className={inferenceResult.foundInActorCredits ? "text-green-500" : "text-red-500"}>
                        {inferenceResult.foundInActorCredits
                          ? "✅ Movie found in actor credits"
                          : "❌ Movie NOT found in actor credits"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Recommendation</h3>
                    {inferenceResult.connectionExists ? (
                      <p>Connection already exists, no action needed.</p>
                    ) : inferenceResult.wouldBeInferred ? (
                      <p>
                        Connection should be inferred during the next refresh. Try clicking the sync button in the
                        Connection Web.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <p>To fix this connection:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          {!inferenceResult.foundInMovieCredits && (
                            <li>Refresh the movie credits for {selectedMovie.name}</li>
                          )}
                          {!inferenceResult.foundInActorCredits && (
                            <li>Refresh the actor credits for {selectedActor.name}</li>
                          )}
                          <li>If refreshing doesn't work, add the connection manually</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache">
          <Card>
            <CardHeader>
              <CardTitle>Cache Data</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Movie Cache Data */}
                  <div>
                    <h3 className="font-medium mb-2">Movie Cache Data</h3>
                    {!selectedMovie ? (
                      <p className="text-center text-muted-foreground py-4">Select a movie to view cache data</p>
                    ) : !movieCacheData ? (
                      <p className="text-center text-muted-foreground py-4">No cache data available</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-3 border rounded-md">
                          <h4 className="font-medium">Movie Details</h4>
                          {movieCacheData.movieDetails ? (
                            <div className="mt-2">
                              <p className="text-sm text-green-500">✅ Found in cache</p>
                              <p className="text-sm mt-1">Title: {movieCacheData.movieDetails.title}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-red-500 mt-2">❌ Not found in cache</p>
                          )}
                        </div>

                        <div className="p-3 border rounded-md">
                          <h4 className="font-medium">Movie Credits</h4>
                          {movieCacheData.movieCredits ? (
                            <div className="mt-2">
                              <p className="text-sm text-green-500">
                                ✅ Found in cache with {movieCacheData.movieCredits.cast?.length || 0} cast members
                              </p>
                              {selectedActor && (
                                <p className="text-sm mt-1">
                                  {movieCacheData.actorInCredits
                                    ? `✅ ${selectedActor.name} found in credits`
                                    : `❌ ${selectedActor.name} NOT found in credits`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-red-500 mt-2">❌ Not found in cache</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actor Cache Data */}
                  <div>
                    <h3 className="font-medium mb-2">Actor Cache Data</h3>
                    {!selectedActor ? (
                      <p className="text-center text-muted-foreground py-4">Select an actor to view cache data</p>
                    ) : !actorCacheData ? (
                      <p className="text-center text-muted-foreground py-4">No cache data available</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-3 border rounded-md">
                          <h4 className="font-medium">Actor Details</h4>
                          {actorCacheData.actorDetails ? (
                            <div className="mt-2">
                              <p className="text-sm text-green-500">✅ Found in cache</p>
                              <p className="text-sm mt-1">Name: {actorCacheData.actorDetails.name}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-red-500 mt-2">❌ Not found in cache</p>
                          )}
                        </div>

                        <div className="p-3 border rounded-md">
                          <h4 className="font-medium">Actor Credits</h4>
                          {actorCacheData.actorCredits ? (
                            <div className="mt-2">
                              <p className="text-sm text-green-500">
                                ✅ Found in cache with {actorCacheData.actorCredits.cast?.length || 0} movies
                              </p>
                              {selectedMovie && (
                                <p className="text-sm mt-1">
                                  {actorCacheData.movieInCredits
                                    ? `✅ ${selectedMovie.name} found in credits`
                                    : `❌ ${selectedMovie.name} NOT found in credits`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-red-500 mt-2">❌ Not found in cache</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Debug Log</CardTitle>
              <Button variant="outline" size="sm" onClick={clearDebugLog}>
                Clear Log
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto border rounded-md p-3 bg-muted font-mono text-sm">
                {debugLog.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">No log entries</p>
                ) : (
                  <div className="space-y-1">
                    {debugLog.map((entry, index) => (
                      <div key={index} className="pb-1 border-b border-border last:border-0">
                        {entry}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
