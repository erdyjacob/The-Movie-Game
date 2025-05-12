"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { addManualConnection } from "@/lib/connection-tracking"
import { loadPlayerHistory } from "@/lib/player-history"

interface AddConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnectionAdded: () => void
}

export function AddConnectionDialog({ open, onOpenChange, onConnectionAdded }: AddConnectionDialogProps) {
  const [selectedMovie, setSelectedMovie] = useState<string | undefined>()
  const [selectedActor, setSelectedActor] = useState<string | undefined>()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Load player history to get discovered movies and actors
  const playerHistory = typeof window !== "undefined" ? loadPlayerHistory() : { movies: [], actors: [] }

  // Sort movies and actors alphabetically
  const sortedMovies = [...playerHistory.movies].sort((a, b) => a.name.localeCompare(b.name))
  const sortedActors = [...playerHistory.actors].sort((a, b) => a.name.localeCompare(b.name))

  const handleAddConnection = async () => {
    if (!selectedMovie || !selectedActor) {
      setResult({
        success: false,
        message: "Please select both a movie and an actor",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      // Parse the selected values
      const [movieId, movieName] = selectedMovie.split("|")
      const [actorId, actorName] = selectedActor.split("|")

      // Add the connection
      const result = await addManualConnection(Number.parseInt(movieId), Number.parseInt(actorId), movieName, actorName)

      setResult(result)

      // If successful, notify parent component
      if (result.success) {
        setTimeout(() => {
          onConnectionAdded()
          onOpenChange(false)
          setSelectedMovie(undefined)
          setSelectedActor(undefined)
          setResult(null)
        }, 1500)
      }
    } catch (error) {
      console.error("Error adding connection:", error)
      setResult({
        success: false,
        message: "An error occurred while adding the connection",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false)
      setSelectedMovie(undefined)
      setSelectedActor(undefined)
      setResult(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Connection</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="movie">Movie</Label>
            <Select value={selectedMovie} onValueChange={setSelectedMovie} disabled={isLoading}>
              <SelectTrigger id="movie">
                <SelectValue placeholder="Select a movie" />
              </SelectTrigger>
              <SelectContent>
                {sortedMovies.map((movie) => (
                  <SelectItem key={movie.id} value={`${movie.id}|${movie.name}`}>
                    {movie.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="actor">Actor</Label>
            <Select value={selectedActor} onValueChange={setSelectedActor} disabled={isLoading}>
              <SelectTrigger id="actor">
                <SelectValue placeholder="Select an actor" />
              </SelectTrigger>
              <SelectContent>
                {sortedActors.map((actor) => (
                  <SelectItem key={actor.id} value={`${actor.id}|${actor.name}`}>
                    {actor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAddConnection} disabled={!selectedMovie || !selectedActor || isLoading}>
            {isLoading ? "Verifying..." : "Add Connection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
