"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"

interface RedisDiagnosticsProps {
  adminToken: string
}

export function RedisDiagnostics({ adminToken }: RedisDiagnosticsProps) {
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [repairResults, setRepairResults] = useState<any>(null)
  const [isRepairing, setIsRepairing] = useState(false)

  const runDiagnostics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/redis-diagnostics", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setDiagnosticData(data.diagnostics)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const repairRedis = async () => {
    if (!confirm("Are you sure you want to attempt to repair Redis data? This will modify data in your database.")) {
      return
    }

    setIsRepairing(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/repair-redis", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setRepairResults(data.results)

      // Refresh diagnostics after repair
      runDiagnostics()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsRepairing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Redis Diagnostics
          <div className="flex gap-2">
            <Button onClick={runDiagnostics} disabled={isLoading} variant="outline" size="sm">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Diagnostics
            </Button>
            <Button onClick={repairRedis} disabled={isRepairing || !diagnosticData} variant="destructive" size="sm">
              {isRepairing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Repair Redis
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Diagnose and repair issues with Redis data storage</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {repairResults && (
          <Alert className="mb-4" variant={repairResults.errors.length > 0 ? "destructive" : "default"}>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Repair Results</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p>
                  <strong>Issues found:</strong> {repairResults.issues.length}
                </p>
                <p>
                  <strong>Fixes applied:</strong> {repairResults.fixes.length}
                </p>
                <p>
                  <strong>Errors:</strong> {repairResults.errors.length}
                </p>
              </div>
              {repairResults.fixes.length > 0 && (
                <div className="mt-2">
                  <p>
                    <strong>Fixes:</strong>
                  </p>
                  <ul className="list-disc pl-5">
                    {repairResults.fixes.map((fix: string, i: number) => (
                      <li key={i}>{fix}</li>
                    ))}
                  </ul>
                </div>
              )}
              {repairResults.errors.length > 0 && (
                <div className="mt-2">
                  <p>
                    <strong>Errors:</strong>
                  </p>
                  <ul className="list-disc pl-5 text-red-500">
                    {repairResults.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {diagnosticData ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Key Counts</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-gray-100 p-2 rounded">
                  <p className="text-sm font-medium">Total Keys</p>
                  <p className="text-2xl">{diagnosticData.keys.counts.total}</p>
                </div>
                {Object.entries(diagnosticData.keys.counts.byPrefix).map(([prefix, count]) => (
                  <div key={prefix} className="bg-gray-100 p-2 rounded">
                    <p className="text-sm font-medium">{prefix} Keys</p>
                    <p className="text-2xl">{count as number}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium">Sample Data</h3>
              <Tabs defaultValue="username" className="mt-2">
                <TabsList>
                  {Object.keys(diagnosticData.samples).map((sampleType) => (
                    <TabsTrigger key={sampleType} value={sampleType}>
                      {sampleType} Sample
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(diagnosticData.samples).map(([sampleType, sample]) => (
                  <TabsContent key={sampleType} value={sampleType} className="mt-2">
                    <div className="bg-gray-100 p-3 rounded">
                      <p className="text-sm font-medium mb-1">Key: {(sample as any).key}</p>
                      <pre className="text-xs bg-gray-200 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify((sample as any).value, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Click "Run Diagnostics" to check Redis data</div>
        )}
      </CardContent>
    </Card>
  )
}
