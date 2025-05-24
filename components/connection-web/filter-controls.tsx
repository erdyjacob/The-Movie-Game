"use client"

import { Badge } from "@/components/ui/badge"

interface FilterControlsProps {
  filterRarity: string | null
  onFilterChange: (rarity: string | null) => void
}

export function FilterControls({ filterRarity, onFilterChange }: FilterControlsProps) {
  return (
    <div className="flex-1">
      <div className="flex flex-wrap gap-2">
        <Badge
          className="cursor-pointer"
          variant={filterRarity === null ? "default" : "outline"}
          onClick={() => onFilterChange(null)}
        >
          All
        </Badge>
        <Badge
          className="cursor-pointer bg-amber-500 hover:bg-amber-600"
          variant={filterRarity === "legendary" ? "default" : "outline"}
          onClick={() => onFilterChange("legendary")}
        >
          Legendary
        </Badge>
        <Badge
          className="cursor-pointer bg-purple-500 hover:bg-purple-600"
          variant={filterRarity === "epic" ? "default" : "outline"}
          onClick={() => onFilterChange("epic")}
        >
          Epic
        </Badge>
        <Badge
          className="cursor-pointer bg-blue-500 hover:bg-blue-600"
          variant={filterRarity === "rare" ? "default" : "outline"}
          onClick={() => onFilterChange("rare")}
        >
          Rare
        </Badge>
        <Badge
          className="cursor-pointer bg-green-500 hover:bg-green-600"
          variant={filterRarity === "uncommon" ? "default" : "outline"}
          onClick={() => onFilterChange("uncommon")}
        >
          Uncommon
        </Badge>
        <Badge
          className="cursor-pointer bg-gray-500 hover:bg-gray-600"
          variant={filterRarity === "common" ? "default" : "outline"}
          onClick={() => onFilterChange("common")}
        >
          Common
        </Badge>
      </div>
    </div>
  )
}
