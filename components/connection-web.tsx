"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { ZoomIn, ZoomOut, RefreshCw, RotateCw, Bug, Link, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getRarityColor } from "@/lib/rarity"
import { loadPlayerHistory } from "@/lib/player-history"
import { loadConnections, refreshAllConnections, debugConnectionData } from "@/lib/connection-tracking"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AddConnectionDialog } from "./add-connection-dialog"
import { useRouter } from "next/navigation"
import { fetchAndCacheCredits } from "@/lib/tmdb-api"

// Define the node and link types for our graph
interface Node extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: "movie" | "actor"
  image: string | null
  rarity?: string
  count: number
}

interface GraphLink extends d3.SimulationLinkDatum<Node> {
  source: string | Node
  target: string | Node
  value: number
  source_type?: "explicit" | "inferred" | "manual"
}

export default function ConnectionWeb() {
  const router = useRouter()
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [filterRarity, setFilterRarity] = useState<string | null>(null)
  const [connectionCount, setConnectionCount] = useState(0)
  const [showImages] = useState(true)
  const [imageQuality] = useState<"low" | "medium" | "high">("low")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Node[]>([])
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [addConnectionOpen, setAddConnectionOpen] = useState(false)
  const [backgroundFetchActive, setBackgroundFetchActive] = useState(false)
  const [backgroundFetchProgress, setBackgroundFetchProgress] = useState({ current: 0, total: 0 })
  const [layoutQuality, setLayoutQuality] = useState<"low" | "medium" | "high">("medium")

  // Load player history and build the graph data
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
  }

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
  }, [])

  // Handle sync button click
  const handleSync = async () => {
    setSyncing(true)
    setSyncSuccess(null)

    try {
      // Call the refreshAllConnections function to rebuild all connections
      const newConnections = refreshAllConnections()
      console.log(`Synced connections: ${newConnections.length} total`)

      // Rebuild the graph data with the refreshed connections
      buildGraphData()

      setSyncSuccess(true)

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSyncSuccess(null)
      }, 3000)
    } catch (error) {
      console.error("Error syncing connections:", error)
      setSyncSuccess(false)

      // Reset error message after 3 seconds
      setTimeout(() => {
        setSyncSuccess(null)
      }, 3000)
    } finally {
      setSyncing(false)
    }
  }

  // Handle debug button click
  const handleDebug = () => {
    debugConnectionData()
    setDebugMode(!debugMode)
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

  // Handle debug tools button click
  const handleDebugTools = () => {
    router.push("/connection-debug")
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

  // Handle search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    const term = searchTerm.toLowerCase().trim()
    const results = nodes.filter((node) => node.name.toLowerCase().includes(term))
    setSearchResults(results)

    // Highlight search results in the visualization
    if (svgRef.current && results.length > 0) {
      const svg = d3.select(svgRef.current)

      // Reset all nodes and links to normal opacity
      svg.selectAll(".node").style("opacity", 1)
      svg.selectAll(".links line").style("opacity", 0.8) // Increased default opacity

      // If we have search results, highlight them
      if (results.length > 0) {
        const resultIds = new Set(results.map((r) => r.id))

        // Dim nodes that aren't in the results
        svg.selectAll(".node").style("opacity", (d: any) => (resultIds.has(d.id) ? 1 : 0.3))

        // Dim links that don't connect to result nodes
        svg.selectAll(".links line").style("opacity", (d: any) => {
          const sourceId = typeof d.source === "string" ? d.source : d.source.id
          const targetId = typeof d.target === "string" ? d.target : d.target.id
          return resultIds.has(sourceId) || resultIds.has(targetId) ? 1 : 0.2
        })
      }
    }
  }, [searchTerm, nodes])

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

    // Set simulation parameters based on layout quality
    let linkDistance = 100
    let chargeStrength = -300
    let collisionRadius = 45
    let iterations = 10
    let alphaDecay = 0.0228 // Default value

    switch (layoutQuality) {
      case "low":
        linkDistance = 80
        chargeStrength = -200
        collisionRadius = 40
        iterations = 5
        alphaDecay = 0.05 // Faster cooling
        break
      case "medium":
        linkDistance = 120
        chargeStrength = -400
        collisionRadius = 50
        iterations = 20
        alphaDecay = 0.02 // Default-ish
        break
      case "high":
        linkDistance = 150
        chargeStrength = -600
        collisionRadius = 60
        iterations = 50
        alphaDecay = 0.01 // Slower cooling for better layout
        break
    }

    // Create a force simulation with adjusted parameters for better layout
    const simulation = d3
      .forceSimulation<Node>(filteredNodes)
      .force(
        "link",
        d3
          .forceLink<Node, GraphLink>()
          .id((d) => d.id)
          .links(filteredLinks)
          .distance((d) => {
            // Adjust link distance based on node types and connection type
            if (d.source_type === "explicit") return linkDistance * 0.8
            if (d.source_type === "manual") return linkDistance * 0.7
            return linkDistance // Default for inferred
          }),
      )
      .force("charge", d3.forceManyBody().strength(chargeStrength))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(collisionRadius))
      // Add x and y forces to prevent nodes from getting too far from center
      .force("x", d3.forceX(width / 2).strength(0.07))
      .force("y", d3.forceY(height / 2).strength(0.07))
      // Add a new force to minimize edge crossings
      .force("link-repulsion", (alpha) => {
        // This custom force tries to minimize edge crossings
        // by adding repulsion between links
        const linkNodes = filteredLinks.map((l) => ({
          source: typeof l.source === "string" ? l.source : l.source.id,
          target: typeof l.target === "string" ? l.target : l.target.id,
          sourceNode: typeof l.source === "string" ? null : l.source,
          targetNode: typeof l.target === "string" ? null : l.target,
        }))

        // For each pair of links
        for (let i = 0; i < linkNodes.length; i++) {
          const l1 = linkNodes[i]
          if (!l1.sourceNode || !l1.targetNode) continue

          for (let j = i + 1; j < linkNodes.length; j++) {
            const l2 = linkNodes[j]
            if (!l2.sourceNode || !l2.targetNode) continue

            // Skip if links share a node (they will naturally not cross)
            if (
              l1.source === l2.source ||
              l1.source === l2.target ||
              l1.target === l2.source ||
              l1.target === l2.target
            ) {
              continue
            }

            // Calculate midpoints of each link
            const midpoint1 = {
              x: (l1.sourceNode.x! + l1.targetNode.x!) / 2,
              y: (l1.sourceNode.y! + l1.targetNode.y!) / 2,
            }
            const midpoint2 = {
              x: (l2.sourceNode.x! + l2.targetNode.x!) / 2,
              y: (l2.sourceNode.y! + l2.targetNode.y!) / 2,
            }

            // Calculate distance between midpoints
            const dx = midpoint1.x - midpoint2.x
            const dy = midpoint1.y - midpoint2.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            // Apply a small repulsive force between the midpoints
            if (distance > 0 && distance < collisionRadius * 2) {
              const repulsionForce = (alpha * 0.5) / distance
              const moveX = dx * repulsionForce
              const moveY = dy * repulsionForce

              // Move the nodes of the first link away from the second
              if (l1.sourceNode.x && l1.sourceNode.y) {
                l1.sourceNode.x += moveX
                l1.sourceNode.y += moveY
              }
              if (l1.targetNode.x && l1.targetNode.y) {
                l1.targetNode.x += moveX
                l1.targetNode.y += moveY
              }

              // Move the nodes of the second link away from the first
              if (l2.sourceNode.x && l2.sourceNode.y) {
                l2.sourceNode.x -= moveX
                l2.sourceNode.y -= moveY
              }
              if (l2.targetNode.x && l2.targetNode.y) {
                l2.targetNode.x -= moveX
                l2.targetNode.y -= moveY
              }
            }
          }
        }
      })
      .alphaDecay(alphaDecay)

    // Create straight lines with improved visibility
    const link = container
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(filteredLinks)
      .enter()
      .append("line")
      .attr("stroke", (d) => {
        if (d.source_type === "manual") return "#f97316" // Orange for manual connections
        if (d.source_type === "inferred") return "#4b5563" // Gray for inferred
        return "#2563eb" // Blue for explicit
      })
      .attr("stroke-opacity", 0.8) // Increased opacity for better visibility
      .attr("stroke-width", (d) => Math.sqrt(d.value) + 1) // Increased line width
      .style("transition", "opacity 0.3s ease") // Add transition for smooth opacity changes

    // Create node groups
    const node = container
      .append("g")
      .attr("class", "nodes")
      .selectAll(".node")
      .data(filteredNodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .style("transition", "opacity 0.3s ease") // Add transition for smooth opacity changes
      .on("mouseover", (event, d) => {
        // Set the selected node
        setSelectedNode(d)

        // Implement focus mode - highlight the node and its connections
        const currentNodeId = d.id

        // Find connected nodes
        const connectedNodeIds = new Set<string>()
        filteredLinks.forEach((link) => {
          const sourceId = typeof link.source === "string" ? link.source : link.source.id
          const targetId = typeof link.target === "string" ? link.target : link.target.id

          if (sourceId === currentNodeId) {
            connectedNodeIds.add(targetId)
          } else if (targetId === currentNodeId) {
            connectedNodeIds.add(sourceId)
          }
        })

        // Dim unrelated nodes
        svg.selectAll(".node").style("opacity", (n: any) => {
          return n.id === currentNodeId || connectedNodeIds.has(n.id) ? 1 : 0.3
        })

        // Dim unrelated links
        svg.selectAll(".links line").style("opacity", (l: any) => {
          const sourceId = typeof l.source === "string" ? l.source : l.source.id
          const targetId = typeof l.target === "string" ? l.target : l.target.id

          return sourceId === currentNodeId || targetId === currentNodeId ? 1 : 0.2
        })

        event.stopPropagation()
      })
      .on("mouseout", () => {
        // Reset node selection
        setSelectedNode(null)

        // Reset all opacities unless we're filtering by search
        if (!searchTerm.trim()) {
          svg.selectAll(".node").style("opacity", 1)
          svg.selectAll(".links line").style("opacity", 0.8) // Maintain higher opacity
        } else {
          // If we have an active search, maintain the search highlighting
          const resultIds = new Set(searchResults.map((r) => r.id))

          svg.selectAll(".node").style("opacity", (d: any) => (resultIds.has(d.id) ? 1 : 0.3))

          svg.selectAll(".links line").style("opacity", (d: any) => {
            const sourceId = typeof d.source === "string" ? d.source : d.source.id
            const targetId = typeof d.target === "string" ? d.target : d.target.id
            return resultIds.has(sourceId) || resultIds.has(targetId) ? 1 : 0.2
          })
        }
      })
      .call(d3.drag<SVGGElement, Node>().on("start", dragstarted).on("drag", dragged).on("end", dragended))

    // Fixed node size
    const nodeRadius = 20

    // Add circles to nodes with fixed size
    node
      .append("circle")
      .attr("r", nodeRadius) // Fixed size for all nodes
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

        // Create a unique ID for each clipPath
        const clipId = `clip-${d.id.replace(/[^a-zA-Z0-9]/g, "-")}`

        // Add clipPath to defs
        defs.append("clipPath").attr("id", clipId).append("circle").attr("r", nodeRadius)

        // Only add image if there's a valid URL
        if (d.image) {
          // Create image element
          nodeGroup
            .append("image")
            .attr("xlink:href", formatImageUrl(d.image))
            .attr("x", -nodeRadius)
            .attr("y", -nodeRadius)
            .attr("width", nodeRadius * 2)
            .attr("height", nodeRadius * 2)
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

    // Add text background for better readability
    node
      .append("rect")
      .attr("y", nodeRadius + 2) // Position based on fixed node radius
      .attr("height", 14)
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("fill", "rgba(0, 0, 0, 0.6)")
      .attr("width", (d) => {
        // Calculate width based on text length (approximate)
        const displayName = d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name
        return displayName.length * 5 + 10 // Approximate width based on character count
      })
      .attr("x", (d) => {
        const displayName = d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name
        return -(displayName.length * 5 + 10) / 2 // Center the background
      })

    // Add labels to nodes with improved readability
    node
      .append("text")
      .attr("dy", nodeRadius + 12) // Position based on fixed node radius
      .attr("text-anchor", "middle")
      .attr("fill", "#fff") // White text
      .attr("font-size", "10px") // Increased font size
      .attr("font-weight", "500") // Medium weight for better readability
      .text((d) => {
        // Changed back to 15 characters before truncating
        return d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name
      })

    // Update positions on each tick of the simulation
    simulation.on("tick", () => {
      // Update straight lines
      link
        .attr("x1", (d) => (d.source as Node).x || 0)
        .attr("y1", (d) => (d.source as Node).y || 0)
        .attr("x2", (d) => (d.target as Node).x || 0)
        .attr("y2", (d) => (d.target as Node).y || 0)

      node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`)
    })

    // Run simulation with higher alpha for better initial layout
    simulation.alpha(1).restart()

    // Run multiple iterations for better layout
    for (let i = 0; i < iterations; i++) {
      simulation.tick()
    }

    // Drag functions
    function dragstarted(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, Node, Node>) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    // Clear selection when clicking on the background
    svg.on("click", () => {
      // Reset node selection
      setSelectedNode(null)

      // Reset all opacities unless we're filtering by search
      if (!searchTerm.trim()) {
        svg.selectAll(".node").style("opacity", 1)
        svg.selectAll(".links line").style("opacity", 0.8) // Maintain higher opacity
      }
    })

    // Initial zoom to fit
    const initialTransform = d3.zoomIdentity.scale(1)
    svg.call(zoom.transform, initialTransform)

    return () => {
      simulation.stop()
    }
  }, [nodes, links, loading, filterRarity, showImages, imageQuality, searchResults, debugMode, layoutQuality])

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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Clear search
  const clearSearch = () => {
    setSearchTerm("")

    // Reset visualization
    if (svgRef.current) {
      const svg = d3.select(svgRef.current)
      svg.selectAll(".node").style("opacity", 1)
      svg.selectAll(".links line").style("opacity", 0.8) // Maintain higher opacity
    }
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

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Debug Tools button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleDebugTools}>
                  <Wrench className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Connection Debugger</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Add Connection button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={handleAddConnection}>
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add manual connection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Debug button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDebug}
                  className={debugMode ? "border-yellow-500" : ""}
                >
                  <Bug className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Debug connection data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Layout Quality button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={cycleLayoutQuality}
                  className={`relative ${
                    layoutQuality === "high"
                      ? "border-green-500"
                      : layoutQuality === "medium"
                        ? "border-blue-500"
                        : "border-gray-500"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Layout Quality: {layoutQuality}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Sync button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSync}
                  disabled={syncing}
                  className={`relative ${
                    syncSuccess === true ? "border-green-500" : syncSuccess === false ? "border-red-500" : ""
                  }`}
                >
                  <RotateCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncSuccess === true && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></span>
                  )}
                  {syncSuccess === false && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sync connections</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Zoom controls */}
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

      <div className="relative flex-1 border rounded-lg overflow-hidden">
        {loading || syncing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            {syncing && <p className="text-sm text-muted-foreground">Syncing connections...</p>}
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
            <svg ref={svgRef} width="100%" height="100%" className="bg-muted/20"></svg>
            {selectedNode && (
              <Card className="absolute bottom-4 right-4 p-4 w-64 shadow-lg transition-opacity duration-150">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{selectedNode.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{selectedNode.type}</p>
                    {selectedNode.rarity && (
                      <Badge
                        className={`mt-1 text-white ${
                          selectedNode.rarity === "legendary"
                            ? "bg-amber-500 hover:bg-amber-600"
                            : selectedNode.rarity === "epic"
                              ? "bg-purple-500 hover:bg-purple-600"
                              : selectedNode.rarity === "rare"
                                ? "bg-blue-500 hover:bg-blue-600"
                                : selectedNode.rarity === "uncommon"
                                  ? "bg-green-500 hover:bg-green-600"
                                  : "bg-gray-500 hover:bg-gray-600"
                        }`}
                      >
                        {selectedNode.rarity.charAt(0).toUpperCase() + selectedNode.rarity.slice(1)}
                      </Badge>
                    )}
                  </div>
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
