import ConnectionWeb from "@/components/connection-web"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function ConnectionWebPage() {
  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8">
      <div className="container mx-auto max-w-6xl h-[calc(100vh-2rem)]">
        <div className="mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Game</span>
            </Button>
          </Link>
        </div>
        <ConnectionWeb />
      </div>
    </main>
  )
}
