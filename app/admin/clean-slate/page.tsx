import { CleanSlate } from "@/components/admin/clean-slate"

export default function CleanSlatePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">System Reset - Clean Slate</h1>
      <CleanSlate />
    </div>
  )
}
