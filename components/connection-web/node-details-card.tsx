"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Node, GraphLink } from "@/lib/types"

interface NodeDetailsCardProps {
  node: Node
  links: GraphLink[]
}

export function NodeDetailsCard({ node, links }: NodeDetailsCardProps) {
  // Helper function to get color for rarity
  function getRarityColor(rarity: string): string {
    switch (rarity) {
      case "legendary":
        return "bg-amber-500 hover:bg-amber-600"
      case "epic":
        return "bg-purple-500 hover:bg-purple-600"
      case "rare":
        return "bg-blue-500 hover:bg-blue-600"
      case "uncommon":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Count connections for this node
  const connectionCount = links.filter((link) => {
    const sourceId = typeof link.source === "string" ? link.source : link.source.id
    const targetId = typeof link.target === "string" ? link.target : link.target.id
    return sourceId === node.id || targetId === node.id
  }).length

  return (
    <Card className="absolute bottom-4 right-4 p-4 w-64 shadow-lg transition-opacity duration-150">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{node.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{node.type}</p>
          {node.rarity && (
            <Badge className={`mt-1 text-white ${getRarityColor(node.rarity)}`}>
              {node.rarity.charAt(0).toUpperCase() + node.rarity.slice(1)}
            </Badge>
          )}
        </div>
      </div>
      <div className="mt-2">
        <p className="text-sm">Discovered {node.count} times</p>
        <p className="text-sm mt-1">Connected to {connectionCount} items</p>
      </div>
    </Card>
  )
}
