"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { loadPlayerHistory } from "@/lib/player-history"
import { loadConnections, refreshAllConnections } from "@/lib/connection-tracking"
import { fetchAndCacheCredits } from "@/lib/tmdb-api"
import { AddConnectionDialog } from "./add-connection-dialog"
import { GraphVisualization } from "./connection-web/graph-visualization"
import { GraphControls } from "./connection-web/graph-controls"
import { FilterControls } from "./connection-web/filter-controls"
import { NodeDetailsCard } from "./connection-web/node-details-card"
import type { Node, GraphLink } from "@/lib/types"
import { PopcornLoader } from "./popcorn-loader"

export default function ConnectionWeb() {
  const router = useRouter()
  const [nodes, setNodes] = useState<Node[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [filterRarity, setFilterRarity] = useState<string | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Node[]>([])
  const [refreshSuccess, setRefreshSuccess] = useState<boolean | null>(null)
  const [addConnectionOpen, setAddConnectionOpen] = useState(false)
  const [backgroundFetchActive, setBackgroundFetchActive] = useState(false)
  const [backgroundFetchProgress, setBackgroundFetchProgress] = useState({ current: 0, total: 0 })
  const [layoutQuality, setLayoutQuality] = useState<"low" | "medium" | "high">("medium")

  // Build graph data from player history
  const buildGraphData = React.useCallback(() => {
    setLoading(true)

    try {
      // Load player history
      const history = loadPlayerHistory()

      // Load actual connections
      const connections = loadConnections()

      // Create nodes from movies and actors
      const movieNodes: Node[] = history.movies.map((movie) => ({
        id: `movie-${movie.id}`,
        name: movie.name,
        type: "movie",
        image: movie.image,
        rarity: movie.rarity,
        count: movie.count,
      }))

      const actorNodes: Node[] = history.actors.map((actor) => ({
        id: `actor-${actor.id}`,
        name: actor.name,
        type: "actor",
        image: actor.image,
        rarity: actor.rarity,
        count: actor.count,
      }))

      // Combine all nodes
      const allNodes = [...movieNodes, ...actorNodes]

      // Create a set of node IDs for quick lookup
      const nodeIds = new Set(allNodes.map((node) => node.id))

      // Filter connections to only include those where both movie and actor nodes exist
      const validConnections = connections.filter((connection) => {
        const movieId = `movie-${connection.movieId}`
        const actorId = `actor-${connection.actorId}`
        return nodeIds.has(movieId) && nodeIds.has(actorId)
      })

      // Create links based on valid connections
      const allLinks: GraphLink[] = validConnections.map((connection) => ({
        source: `movie-${connection.movieId}`,
        target: `actor-${connection.actorId}`,
        value: 1,
        source_type: connection.source,
      }))

      setConnectionCount(validConnections.length)
      setNodes(allNodes)
      setLinks(allLinks)
    } catch (error) {
      console.error("Error building graph data:", error)
      // Set empty arrays to prevent further errors
      setNodes([])
      setLinks([])
      setConnectionCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // First, build the graph with existing data
    buildGraphData()

    // Then, start the background fetch process
    const fetchMissingCreditsData = async () => {
      try {
        setBackgroundFetchActive(true)
        const history = loadPlayerHistory()

        // Calculate total items to process
        const totalItems = history.movies.length + history.actors.length
        setBackgroundFetchProgress({ current: 0, total: totalItems })

        // Process a limited number of items to avoid overwhelming the browser
        const MAX_ITEMS_TO_PROCESS = 5

        // Process movies first (usually fewer)
        const moviesToProcess = history.movies.slice(0, MAX_ITEMS_TO_PROCESS)
        for (let i = 0; i < moviesToProcess.length; i++) {
          const movie = moviesToProcess[i]
          await fetchAndCacheCredits({ id: movie.id, type: "movie" })
          // Update progress
          setBackgroundFetchProgress((prev) => ({
            current: prev.current + 1,
            total: prev.total,
          }))
          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Then process actors
        const actorsToProcess = history.actors.slice(0, MAX_ITEMS_TO_PROCESS)
        for (let i = 0; i < actorsToProcess.length; i++) {
          const actor = actorsToProcess[i]
          await fetchAndCacheCredits({ id: actor.id, type: "actor" })
          // Update progress
          setBackgroundFetchProgress((prev) => ({
            current: prev.current + 1,
            total: prev.total,
          }))
          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Refresh connections after fetching data
        const newConnections = refreshAllConnections()
        console.log(`Refreshed connections: ${newConnections.length} total`)

        // Rebuild the graph with the new connections
        buildGraphData()
      } catch (error) {
        console.error("Error fetching missing credits data:", error)
      } finally {
        setBackgroundFetchActive(false)
      }
    }

    // Run in the background
    fetchMissingCreditsData()
  }, [buildGraphData])

  // Handle search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const term = searchTerm.toLowerCase().trim()
    const results = nodes.filter((node) => node.name.toLowerCase().includes(term))
    setSearchResults(results)
  }, [searchTerm, nodes])

  // Handle refresh button click
  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshSuccess(null)

    try {
      // Call the refreshAllConnections function to rebuild all connections
      const newConnections = refreshAllConnections()
      console.log(`Refreshed connections: ${newConnections.length} total`)

      // Rebuild the graph data with the refreshed connections
      buildGraphData()

      setRefreshSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setRefreshSuccess(null)
      }, 3000)
    } catch (error) {
      console.error("Error refreshing connections:", error)
      setRefreshSuccess(false)

      // Reset error message after 3 seconds
      setTimeout(() => {
        setRefreshSuccess(null)
      }, 3000)
    } finally {
      // Keep refreshing state for the transition duration
      setTimeout(() => {
        setRefreshing(false)
      }, 2000) // 2 second transition
    }
  }

  // Handle zoom in button
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev * 1.2, 4))
  }

  // Handle zoom out button
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev * 0.8, 0.1))
  }

  // Handle reset view
  const handleResetView = () => {
    setZoomLevel(1)
  }

  // Handle add connection button click
  const handleAddConnection = () => {
    setAddConnectionOpen(true)
  }

  // Handle connection added
  const handleConnectionAdded = () => {
    // Rebuild the graph data to include the new connection
    buildGraphData()
  }

  // Handle layout quality change
  const cycleLayoutQuality = () => {
    if (layoutQuality === "low") {
      setLayoutQuality("medium")
    } else if (layoutQuality === "medium") {
      setLayoutQuality("high")
    } else {
      setLayoutQuality("low")
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h2 className="text-xl font-bold">Your Movie Connection Web</h2>
          <p className="text-sm text-muted-foreground">
            {connectionCount} connections between {nodes.filter((n) => n.type === "movie").length} movies and{" "}
            {nodes.filter((n) => n.type === "actor").length} actors
          </p>
        </div>

        {/* Search box */}
        <div className="relative w-full sm:w-64">
          <div className="flex">
            <Input
              type="text"
              placeholder="Search movies or actors..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pr-8"
            />
            {searchTerm && (
              <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full" onClick={clearSearch}>
                ×
              </Button>
            )}
          </div>
          {searchResults.length > 0 && searchTerm && (
            <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
              <div className="p-2 text-xs text-muted-foreground">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        {/* Rarity filter */}
        <FilterControls filterRarity={filterRarity} onFilterChange={setFilterRarity} />

        {/* Controls */}
        <GraphControls
          zoomLevel={zoomLevel}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetView={handleResetView}
          onRefresh={handleRefresh}
          onAddConnection={handleAddConnection}
          onCycleLayoutQuality={cycleLayoutQuality}
          refreshing={refreshing}
          refreshSuccess={refreshSuccess}
          layoutQuality={layoutQuality}
        />
      </div>

      <div className="relative flex-1 border rounded-lg overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <PopcornLoader />
            {backgroundFetchActive && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Fetching data for connections ({backgroundFetchProgress.current}/{backgroundFetchProgress.total})
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  This may take a moment. You can still use the visualization.
                </p>
              </div>
            )}
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">No connection data available. Play more games to build your web!</p>
          </div>
        ) : (
          <>
            <GraphVisualization
              nodes={nodes}
              links={links}
              loading={loading}
              filterRarity={filterRarity}
              searchResults={searchResults}
              searchTerm={searchTerm}
              onNodeSelect={setSelectedNode}
              layoutQuality={layoutQuality}
              zoomLevel={zoomLevel}
              setZoomLevel={setZoomLevel}
              refreshing={refreshing}
            />
            {selectedNode && <NodeDetailsCard node={selectedNode} links={links} />}
          </>
        )}
      </div>

      {/* Connection type legend */}
      <div className="mt-2 flex items-center justify-end gap-4 text-xs text-muted-foreground">
        <div className="flex items-center">
          <div className="w-4 h-1.5 bg-blue-600 mr-1"></div>
          <span>Explicit connections</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1.5 bg-gray-600 mr-1"></div>
          <span>Inferred connections</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-1.5 bg-orange-500 mr-1"></div>
          <span>Manual connections</span>
        </div>
      </div>

      {/* Add Connection Dialog */}
      <AddConnectionDialog
        open={addConnectionOpen}
        onOpenChange={setAddConnectionOpen}
        onConnectionAdded={handleConnectionAdded}
      />
    </div>
  )
}
