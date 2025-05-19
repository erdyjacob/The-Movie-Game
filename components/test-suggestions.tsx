"use client"

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// This is a simple test component to verify suggestions are working
export default function TestSuggestions() {
  const [search, setSearch] = useState("")
  const [suggestions, setSuggestions] = useState([
    { id: 1, name: "Tom Hanks", image: "https://image.tmdb.org/t/p/w500/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg" },
    { id: 2, name: "Tom Cruise", image: "https://image.tmdb.org/t/p/w500/8qBylBsQf4llkGrWR3qAsOtOU8O.jpg" },
    { id: 3, name: "Tom Hardy", image: "https://image.tmdb.org/t/p/w500/4CR1D9VUX9Z8Zs39OMSrYj6W59Y.jpg" },
  ])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const handleSuggestionClick = (suggestion: { id: number; name: string; image: string | null }) => {
    setSearch(suggestion.name)
    setShowSuggestions(false)
  }

  return (
    <div className="p-8 bg-[#0f172a] text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Test Suggestions</h1>

      <div className="max-w-md mx-auto">
        <div className="relative">
          <Input
            type="text"
            placeholder="Type 'tom' to see suggestions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              if (e.target.value.toLowerCase().includes("tom")) {
                setShowSuggestions(true)
              } else {
                setShowSuggestions(false)
              }
            }}
            onFocus={() => {
              if (search.toLowerCase().includes("tom")) {
                setShowSuggestions(true)
              }
            }}
            ref={inputRef}
            className="w-full bg-[#0d1425] border-gray-700 h-12 text-white mb-4"
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-[#0d1425] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
              style={{ top: "100%" }}
            >
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="flex items-center gap-2 p-2 hover:bg-[#1a2234] cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="h-8 w-8 bg-gray-800 flex items-center justify-center rounded">
                    {suggestion.image && (
                      <img src={suggestion.image || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <span className="text-white truncate">{suggestion.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <Button onClick={() => setShowSuggestions(!showSuggestions)}>
            {showSuggestions ? "Hide Suggestions" : "Show Suggestions"}
          </Button>
        </div>
      </div>
    </div>
  )
}
