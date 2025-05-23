"use client"

import { useRef, useEffect } from "react"
import * as d3 from "d3"
import type { Node, GraphLink } from "@/lib/types"

interface GraphVisualizationProps {
  nodes: Node[]
  links: GraphLink[]
  loading: boolean
  filterRarity: string | null
  searchResults: Node[]
  searchTerm: string
  onNodeSelect: (node: Node | null) => void
  layoutQuality: "low" | "medium" | "high"
  debugMode: boolean
  zoomLevel: number
  setZoomLevel: (level: number) => void
  initialLoad: boolean
}

export function GraphVisualization({
  nodes,
  links,
  loading,
  filterRarity,
  searchResults,
  searchTerm,
  onNodeSelect,
  layoutQuality,
  debugMode,
  zoomLevel,
  setZoomLevel,
  initialLoad,
}: GraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  // Helper function to get color for rarity
  function getRarityColor(rarity: string): string {
    switch (rarity) {
      case "legendary":
        return "#f59e0b" // amber-500
      case "epic":
        return "#8b5cf6" // purple-500
      case "rare":
        return "#3b82f6" // blue-500
      case "uncommon":
        return "#10b981" // green-500
      default:
        return "#6b7280" // gray-500
    }
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
    const iterations = 10
    const alphaDecay = 0.0228 // Default value

    // Calculate collision radius including text space
    const textHeight = 16 // Height of text label + padding
    const totalNodeHeight = 20 + textHeight
    collisionRadius = 45

    switch (layoutQuality) {
      case "low":
        linkDistance = 80
        chargeStrength = initialLoad ? -2000 : -100 // Significantly increased Phase 1 repulsion
        collisionRadius = 40
        break
      case "medium":
        linkDistance = 120
        chargeStrength = initialLoad ? -3000 : -200 // Significantly increased Phase 1 repulsion
        collisionRadius = 50
        break
      case "high":
        linkDistance = 150
        chargeStrength = initialLoad ? -4000 : -300 // Significantly increased Phase 1 repulsion
        collisionRadius = 60
        break
    }

    // Create a force simulation with adjusted parameters for better layout
    const simulation = d3
      .forceSimulation(filteredNodes)
      .force(
        "link",
        d3
          .forceLink()
          .id((d: any) => d.id)
          .links(filteredLinks)
          .distance((d: any) => {
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
      .force("x", d3.forceX(width / 2).strength(0.07)) // Increased from 0.07
      .force("y", d3.forceY(height / 2).strength(0.07)) // Increased from 0.07
      // Add a new force to minimize edge crossings
      .force("link-repulsion", (alpha: number) => {
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
      .attr("stroke", (d: any) => {
        if (d.source_type === "manual") return "#f97316" // Orange for manual connections
        if (d.source_type === "inferred") return "#4b5563" // Gray for inferred
        return "#2563eb" // Blue for explicit
      })
      .attr("stroke-opacity", 0.8) // Increased opacity for better visibility
      .attr("stroke-width", (d: any) => Math.sqrt(d.value) + 1) // Increased line width
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
      .on("mouseover", (event: any, d: Node) => {
        // Set the selected node
        onNodeSelect(d)

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
        onNodeSelect(null)

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
      .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)

    // Fixed node size
    const nodeRadius = 20

    // Add circles to nodes with fixed size
    node
      .append("circle")
      .attr("r", nodeRadius) // Fixed size for all nodes
      .attr("fill", (d: any) => {
        if (d.rarity) {
          return getRarityColor(d.rarity)
        }
        return d.type === "movie" ? "#3b82f6" : "#10b981"
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)

    // Add images to nodes
    // Define the clipPath for circular images
    const defs = svg.append("defs")

    node.each(function (d: any) {
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
          .attr("href", d.image)
          .attr("x", -nodeRadius)
          .attr("y", -nodeRadius)
          .attr("width", nodeRadius * 2)
          .attr("height", nodeRadius * 2)
          .attr("clip-path", `url(#${clipId})`)
          .attr("preserveAspectRatio", "xMidYMid slice")
      } else {
        // Add icon for nodes without images
        nodeGroup
          .append("text")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("fill", "#fff")
          .attr("font-size", "10px")
          .text((d: any) => (d.type === "movie" ? "🎬" : "👤"))
      }
    })

    // Add text background for better readability
    node
      .append("rect")
      .attr("y", nodeRadius + 2) // Position based on fixed node radius
      .attr("height", 14)
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("fill", "rgba(0, 0, 0, 0.6)")
      .attr("width", (d: any) => {
        // Calculate width based on text length (approximate)
        const displayName = d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name
        return displayName.length * 5 + 10 // Approximate width based on character count
      })
      .attr("x", (d: any) => {
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
      .text((d: any) => {
        // Changed back to 15 characters before truncating
        return d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name
      })

    // Update positions on each tick of the simulation
    simulation.on("tick", () => {
      // Update straight lines
      link
        .attr("x1", (d: any) => (d.source as any).x || 0)
        .attr("y1", (d: any) => (d.source as any).y || 0)
        .attr("x2", (d: any) => (d.target as any).x || 0)
        .attr("y2", (d: any) => (d.target as any).y || 0)

      node.attr("transform", (d: any) => `translate(${d.x || 0},${d.y || 0})`)
    })

    // Run simulation with higher alpha for better initial layout
    simulation.alpha(1).restart()

    // Run multiple iterations for better layout
    for (let i = 0; i < iterations; i++) {
      simulation.tick()
    }

    // Drag functions
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      event.subject.fx = event.subject.x
      event.subject.fy = event.subject.y
    }

    function dragged(event: any) {
      event.subject.fx = event.x
      event.subject.fy = event.y
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0)
      event.subject.fx = null
      event.subject.fy = null
    }

    // Clear selection when clicking on the background
    svg.on("click", () => {
      // Reset node selection
      onNodeSelect(null)

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
  }, [
    nodes,
    links,
    loading,
    filterRarity,
    searchResults,
    searchTerm,
    onNodeSelect,
    layoutQuality,
    debugMode,
    initialLoad,
  ])

  return <svg ref={svgRef} width="100%" height="100%" className="bg-muted/20"></svg>
}
