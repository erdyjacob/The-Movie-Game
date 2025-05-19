"use client"

import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RefreshCw, RotateCw, Bug, Link, Wrench } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface GraphControlsProps {
  zoomLevel: number
  onZoomIn: () => void
  onZoomOut: () => void
  onResetView: () => void
  onSync: () => void
  onDebug: () => void
  onAddConnection: () => void
  onDebugTools: () => void
  onCycleLayoutQuality: () => void
  syncing: boolean
  syncSuccess: boolean | null
  debugMode: boolean
  layoutQuality: "low" | "medium" | "high"
}

export function GraphControls({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetView,
  onSync,
  onDebug,
  onAddConnection,
  onDebugTools,
  onCycleLayoutQuality,
  syncing,
  syncSuccess,
  debugMode,
  layoutQuality,
}: GraphControlsProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Debug Tools button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={onDebugTools}>
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
            <Button variant="outline" size="icon" onClick={onAddConnection}>
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
            <Button variant="outline" size="icon" onClick={onDebug} className={debugMode ? "border-yellow-500" : ""}>
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
              onClick={onCycleLayoutQuality}
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
              onClick={onSync}
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
      <Button variant="outline" size="icon" onClick={onZoomOut}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <div className="text-xs w-10 text-center">{Math.round(zoomLevel * 100)}%</div>
      <Button variant="outline" size="icon" onClick={onZoomIn}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onResetView}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  )
}
