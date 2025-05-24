"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Plus, Settings } from "lucide-react"

interface GraphControlsProps {
  onRefresh: () => void
  onAddConnection: () => void
  onCycleLayoutQuality: () => void
  refreshing: boolean
  refreshSuccess: boolean | null
  layoutQuality: "low" | "medium" | "high"
}

export function GraphControls({
  onRefresh,
  onAddConnection,
  onCycleLayoutQuality,
  refreshing,
  refreshSuccess,
  layoutQuality,
}: GraphControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Refresh button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={refreshing}
        className={`${
          refreshSuccess === true
            ? "border-green-500 text-green-600"
            : refreshSuccess === false
              ? "border-red-500 text-red-600"
              : ""
        }`}
      >
        <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
        {refreshing ? "Refreshing..." : "Refresh"}
      </Button>

      {/* Layout quality toggle */}
      <Button variant="outline" size="sm" onClick={onCycleLayoutQuality}>
        <Settings className="h-4 w-4 mr-1" />
        {layoutQuality.charAt(0).toUpperCase() + layoutQuality.slice(1)}
      </Button>

      {/* Add connection */}
      <Button variant="outline" size="sm" onClick={onAddConnection}>
        <Plus className="h-4 w-4 mr-1" />
        Add
      </Button>
    </div>
  )
}
