"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Settings, Check } from "lucide-react"
import type { Difficulty, GameFilters } from "@/lib/types"

interface GameModifiersProps {
  difficulty: Difficulty
  setDifficulty: (difficulty: Difficulty) => void
  filters: GameFilters
  setFilters: (filters: GameFilters) => void
  disabled?: boolean
}

export default function GameModifiers({
  difficulty,
  setDifficulty,
  filters,
  setFilters,
  disabled = false,
}: GameModifiersProps) {
  const [open, setOpen] = useState(false)

  const handleFilterChange = (key: keyof GameFilters) => {
    setFilters({
      ...filters,
      [key]: !filters[key],
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2" disabled={disabled}>
          <Settings size={16} />
          <span>Game Modifiers</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setDifficulty("easy")}
          >
            <span>Easy</span>
            {difficulty === "easy" && <Check size={16} />}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setDifficulty("medium")}
          >
            <span>Medium</span>
            {difficulty === "medium" && <Check size={16} />}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setDifficulty("hard")}
          >
            <span>Hard</span>
            {difficulty === "hard" && <Check size={16} />}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuLabel className="mt-2">Movie Filters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="animated" className="text-sm cursor-pointer">
              Include Animated Movies
            </Label>
            <Switch
              id="animated"
              checked={filters.includeAnimated}
              onCheckedChange={() => handleFilterChange("includeAnimated")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sequels" className="text-sm cursor-pointer">
              Include Movie Sequels
            </Label>
            <Switch
              id="sequels"
              checked={filters.includeSequels}
              onCheckedChange={() => handleFilterChange("includeSequels")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="foreign" className="text-sm cursor-pointer">
              Include Foreign Films
            </Label>
            <Switch
              id="foreign"
              checked={filters.includeForeign}
              onCheckedChange={() => handleFilterChange("includeForeign")}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
