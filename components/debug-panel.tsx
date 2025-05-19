"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DebugPanelProps {
  data: any
  title?: string
}

export function DebugPanel({ data, title = "Debug Info" }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={() => setIsOpen(!isOpen)} className="bg-red-600 hover:bg-red-700">
        {isOpen ? "Hide Debug" : "Show Debug"}
      </Button>

      {isOpen && (
        <div className="mt-2 p-4 bg-black/90 text-white rounded-lg w-96 max-h-96 overflow-auto">
          <h3 className="text-lg font-bold mb-2">{title}</h3>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
