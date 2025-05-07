import GameContainer from "@/components/game-container"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gradient-to-b from-background to-muted">
      <GameContainer />
    </main>
  )
}
