"use client"

import type React from "react"
import Image from "next/image"
import { Film, User } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import type { ItemType, Difficulty } from "@/lib/types"

interface Suggestion {
  id: number
  name: string
  image: string | null
}

interface SuggestionsDropdownProps {
  suggestions: Suggestion[]
  showSuggestions: boolean
  onSuggestionClick: (suggestion: Suggestion) => void
  expectedType: ItemType
  difficulty: Difficulty
  suggestionsRef: React.RefObject<HTMLDivElement>
}

export function SuggestionsDropdown({
  suggestions,
  showSuggestions,
  onSuggestionClick,
  expectedType,
  difficulty,
  suggestionsRef,
}: SuggestionsDropdownProps) {
  const isMobile = useMobile()

  if (!showSuggestions || !suggestions.length) {
    return null
  }

  return (
    <div
      ref={suggestionsRef}
      id="suggestions-dropdown"
      className="absolute z-50 w-full mt-1 bg-[#0d1425] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
      style={{ top: "100%" }}
      role="listbox"
    >
      {suggestions.map((suggestion) => (
        <div
          key={suggestion.id}
          className="flex items-center gap-2 p-2 hover:bg-[#1a2234] cursor-pointer"
          onClick={() => onSuggestionClick(suggestion)}
          role="option"
          aria-selected="false"
        >
          {suggestion.image ? (
            <div className="relative h-8 w-8 overflow-hidden rounded flex-shrink-0">
              <Image
                src={suggestion.image || "/placeholder.svg"}
                alt=""
                fill
                className={cn("object-cover", difficulty === "medium" && "filter blur-[1px]")}
              />
            </div>
          ) : (
            <div className="h-8 w-8 bg-gray-800 flex items-center justify-center rounded flex-shrink-0">
              {expectedType === "movie" ? (
                <Film size={isMobile ? 12 : 16} className="text-gray-400" />
              ) : (
                <User size={isMobile ? 12 : 16} className="text-gray-400" />
              )}
            </div>
          )}
          <span className="text-white truncate">{suggestion.name}</span>
        </div>
      ))}
    </div>
  )
}
