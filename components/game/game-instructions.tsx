import { AlertTriangle } from "lucide-react"

interface GameInstructionsProps {
  instructionText: string
  error: string | null
}

export function GameInstructions({ instructionText, error }: GameInstructionsProps) {
  return (
    <div className="text-center mb-4">
      <h3 className="text-xl font-semibold mb-2">{instructionText}</h3>
      {error && (
        <p className="text-destructive flex items-center justify-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </p>
      )}
    </div>
  )
}
