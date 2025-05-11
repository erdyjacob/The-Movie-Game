"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { Film, User, ZoomIn, ZoomOut, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getRarityColor } from "@/lib/rarity"
import { loadPlayerHistory } from "@/lib/player-history"
import { loadConnections } from "@/lib/connection-tracking"

// Define the node and link types for our graph
interface Node extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: "movie" | "actor"
  image: string | null
  rarity?: string
  count: number
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node
  target: string | Node
  value: number
}

export default function ConnectionWeb() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [filterRarity, setFilterRarity] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<"all" | "movie" | "actor">("all")
  const [connectionCount, setConnectionCount] = useState(0)
  const [showImages] = useState(true)
  const [imageQuality] = useState<"low" | "medium" | "high">("low")

  // Load player history and build the graph data
  useEffect(() => {
    const buildGraphData = () => {
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
        const allLinks: Link[] = validConnections.map((connection) => ({
          source: `movie-${connection.movieId}`,
          target: `actor-${connection.actorId}`,
          value: 1,
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
    }

    buildGraphData()
  }, [])

  // Get image size based on quality setting
  const getImageSize = () => {
    switch (imageQuality) {
      case "low":
        return "w92" // Smallest TMDB size
      case "medium":
        return "w154" // Medium TMDB size
      case "high":
        return "w185" // Larger TMDB size
      default:
        return "w154"
    }
  }

  // Format image URL to use the appropriate size
  const formatImageUrl = (url: string | null) => {
    if (!url) return null

    // If it's a TMDB URL, replace the size parameter
    if (url.includes("image.tmdb.org/t/p/")) {
      return url.replace(/\/w\d+\//, `/${getImageSize()}/`)
    }

    return url
  }

  // Initialize and update the D3 visualization
  useEffect(() => {
    if (!svgRef.current || loading || nodes.length === 0) return

    // Clear any existing visualization
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Apply filters if needed
    let filteredNodes = [...nodes]
    let filteredLinks = [...links]

    if (filterRarity) {
      filteredNodes = filteredNodes.filter((node) => node.rarity === filterRarity)
      // Keep links where at least one end has the filtered rarity
      filteredLinks = filteredLinks.filter((link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id
        const targetId = typeof link.target === "string" ? link.target : link.target.id

        const sourceNode = filteredNodes.find((n) => n.id === sourceId)
        const targetNode = filteredNodes.find((n) => n.id === targetId)

        return sourceNode && targetNode
      })
    }

    if (filterType !== "all") {
      filteredNodes = filteredNodes.filter((node) => node.type === filterType)
      // Keep links where at least one end has the filtered type
      filteredLinks = filteredLinks.filter((link) => {
        const sourceId = typeof link.source === "string" ? link.source : link.source.id
        const targetId = typeof link.target === "string" ? link.target : link.target.id

        const sourceNode = filteredNodes.find((n) => n.id === sourceId)
        const targetNode = filteredNodes.find((n) => n.id === targetId)

        return sourceNode && targetNode
      })
    }

    // Create a zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform)
        setZoomLevel(event.transform.k)
      })

    // Apply zoom behavior to the SVG
    svg.call(zoom)

    // Create a container group for the graph
    const container = svg.append("g").attr("class", "container")

    // Create a force simulation
    const simulation = d3
      .forceSimulation<Node>(filteredNodes)
      .force(
        "link",
        d3
          .forceLink<Node, Link>()
          .id((d) => d.id)
          .links(filteredLinks)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))

    // Create links
    const link = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(filteredLinks)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.value))

    // Create node groups
    const node = container
      .append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(filteredNodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .on("click", (event, d) => {
        setSelectedNode(d)
        event.stopPropagation()
      })
      .call(d3.drag<SVGGElement, Node>().on("start", dragstarted).on("drag", dragged).on("end", dragended))

    // Add circles to nodes
    node
      .append("circle")
      .attr("r", (d) => 10 + (d.count || 1) * 2)
      .attr("fill", (d) => {
        if (d.rarity) {
          return getRarityColor(d.rarity).replace("text-", "").replace("-500", "")
        }
        return d.type === "movie" ? "#3b82f6" : "#10b981"
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)

    // Add images to nodes if showImages is true
    if (showImages) {
      // Define the clipPath for circular images
      const defs = svg.append("defs")

      node.each(function (d) {
        const nodeGroup = d3.select(this)
        const radius = 10 + (d.count || 1) * 2

        // Create a unique ID for each clipPath
        const clipId = `clip-${d.id.replace(/[^a-zA-Z0-9]/g, "-")}`

        // Add clipPath to defs
        defs.append("clipPath").attr("id", clipId).append("circle").attr("r", radius)

        // Only add image if there's a valid URL
        if (d.image) {
          // Create image element
          nodeGroup
            .append("image")
            .attr("xlink:href", formatImageUrl(d.image))
            .attr("x", -radius)
            .attr("y", -radius)
            .attr("width", radius * 2)
            .attr("height", radius * 2)
            .attr("clip-path", `url(#${clipId})`)
            .attr("preserveAspectRatio", "xMidYMid slice")
            .attr("crossorigin", "anonymous") // Add crossorigin attribute
        } else {
          // Add icon for nodes without images
          nodeGroup
            .append("text")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "central")
            .attr("fill", "#fff")
            .attr("font-size", "10px")
            .text((d) => (d.type === "movie" ? "🎬" : "👤"))
        }
      })
    } else {
      // Add icons to nodes if not showing images
      node
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", "#fff")
        .attr("font-size", "10px")
        .text((d) => (d.type === "movie" ? "🎬" : "👤"))
    }

    // Add labels to nodes
    node
      .append("text")
      .attr("dy", (d) => 10 + (d.count || 1) * 2 + 10)
      .attr("text-anchor", "middle")
      .attr("fill", "#333")
      .attr("font-size", "8px")
      .text((d) => (d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name))

    // Update positions on each tick of the simulation
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as Node).x || 0)
        .attr("y1", (d) => (d.source as Node).y || 0)
        .attr("x2", (d) => (d.target as Node).x || 0)
        .attr("y2", (d) => (d.target as Node).y || 0)

      node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`)
    })

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      event.subject.fx = event.x
      event.subject.fy = event.subject.y
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    // Clear selection when clicking on the background
    svg.on("click", () => {
      setSelectedNode(null)
    })

    // Initial zoom to fit
    const initialTransform = d3.zoomIdentity.scale(1)
    svg.call(zoom.transform, initialTransform)

    return () => {
      simulation.stop()
    }
  }, [nodes, links, loading, filterRarity, filterType, showImages, imageQuality])

  // Handle zoom in button
  const handleZoomIn = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
      d3.select(svgRef.current).select("g.container").attr("transform", event.transform)
      setZoomLevel(event.transform.k)
    })
    svg.transition().call(zoom.scaleBy, 1.2)
  }

  // Handle zoom out button
  const handleZoomOut = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
      d3.select(svgRef.current).select("g.container").attr("transform", event.transform)
      setZoomLevel(event.transform.k)
    })
    svg.transition().call(zoom.scaleBy, 0.8)
  }

  // Handle reset view
  const handleResetView = () => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", (event) => {
      d3.select(svgRef.current).select("g.container").attr("transform", event.transform)
      setZoomLevel(event.transform.k)
    })

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    svg.transition().call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1))
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Your Movie Connection Web</h2>
          <p className="text-sm text-muted-foreground">
            {connectionCount} connections between {nodes.filter((n) => n.type === "movie").length} movies and{" "}
            {nodes.filter((n) => n.type === "actor").length} actors
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilterType("all")}>
            All
          </Button>
          <Button
            variant={filterType === "movie" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("movie")}
          >
            <Film className="h-4 w-4 mr-1" />
            Movies
          </Button>
          <Button
            variant={filterType === "actor" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("actor")}
          >
            <User className="h-4 w-4 mr-1" />
            Actors
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <div className="text-sm mb-1">Filter by Rarity:</div>
          <div className="flex flex-wrap gap-2">
            <Badge
              className="cursor-pointer"
              variant={filterRarity === null ? "default" : "outline"}
              onClick={() => setFilterRarity(null)}
            >
              All
            </Badge>
            <Badge
              className="cursor-pointer bg-amber-500 hover:bg-amber-600"
              variant={filterRarity === "legendary" ? "default" : "outline"}
              onClick={() => setFilterRarity("legendary")}
            >
              Legendary
            </Badge>
            <Badge
              className="cursor-pointer bg-purple-500 hover:bg-purple-600"
              variant={filterRarity === "epic" ? "default" : "outline"}
              onClick={() => setFilterRarity("epic")}
            >
              Epic
            </Badge>
            <Badge
              className="cursor-pointer bg-blue-500 hover:bg-blue-600"
              variant={filterRarity === "rare" ? "default" : "outline"}
              onClick={() => setFilterRarity("rare")}
            >
              Rare
            </Badge>
            <Badge
              className="cursor-pointer bg-green-500 hover:bg-green-600"
              variant={filterRarity === "uncommon" ? "default" : "outline"}
              onClick={() => setFilterRarity("uncommon")}
            >
              Uncommon
            </Badge>
            <Badge
              className="cursor-pointer bg-gray-500 hover:bg-gray-600"
              variant={filterRarity === "common" ? "default" : "outline"}
              onClick={() => setFilterRarity("common")}
            >
              Common
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="text-xs w-10 text-center">{Math.round(zoomLevel * 100)}%</div>
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleResetView}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Display options removed for simplicity */}
      <div className="mb-4"></div>

      <div className="relative flex-1 border rounded-lg overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">No connection data available. Play more games to build your web!</p>
          </div>
        ) : (
          <>
            <svg ref={svgRef} width="100%" height="100%" className="bg-muted/20"></svg>
            {selectedNode && (
              <Card className="absolute bottom-4 right-4 p-4 w-64 shadow-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{selectedNode.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{selectedNode.type}</p>
                    {selectedNode.rarity && (
                      <Badge className={`mt-1 ${getRarityColor(selectedNode.rarity)}`}>
                        {selectedNode.rarity.charAt(0).toUpperCase() + selectedNode.rarity.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                    ×
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-sm">Discovered {selectedNode.count} times</p>
                  <p className="text-sm mt-1">
                    Connected to{" "}
                    {
                      links.filter((link) => {
                        const sourceId = typeof link.source === "string" ? link.source : link.source.id
                        const targetId = typeof link.target === "string" ? link.target : link.target.id
                        return sourceId === selectedNode.id || targetId === selectedNode.id
                      }).length
                    }{" "}
                    items
                  </p>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
