"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, ZoomIn, ZoomOut, RotateCcw, Plus, Settings } from "lucide-react"

interface GraphControlsProps {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onRefresh: () => void
  onAddConnection: () => void
  onCycleLayoutQuality: () => void
  refreshing: boolean
  refreshSuccess: boolean | null
  layoutQuality: "low" | "medium" | "high"
}

export function GraphControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetView,
  onRefresh,
  onAddConnection,
  onCycleLayoutQuality,
  refreshing,
  refreshSuccess,
  layoutQuality,
}: GraphControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Zoom controls */}
      <div className="flex items-center gap-1 border rounded-md">
        <Button variant="ghost" size="sm" onClick={onZoomOut} disabled={zoomLevel <= 0.1}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="px-2 text-xs text-muted-foreground min-w-[3rem] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <Button variant="ghost" size="sm" onClick={onZoomIn} disabled={zoomLevel >= 4}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* Reset view */}
      <Button variant="outline" size="sm" onClick={onResetView}>
        <RotateCcw className="h-4 w-4 mr-1" />
        Reset
      </Button>

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
