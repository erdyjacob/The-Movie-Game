"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Info } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface UserDiagnosticsProps {
  adminToken: string
}

export function UserDiagnostics({ adminToken }: UserDiagnosticsProps) {
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/user-diagnostics", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setDiagnosticResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          User Data Diagnostics
          <Button onClick={runDiagnostics} disabled={isLoading} variant="default" size="sm">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Run Diagnostics
          </Button>
        </CardTitle>
        <CardDescription>Analyze user data storage patterns and inconsistencies</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {diagnosticResults && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Diagnostic Results</AlertTitle>
              <AlertDescription>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <strong>All user-related keys:</strong> {diagnosticResults.counts.allUserRelatedKeys}
                  </div>
                  <div>
                    <strong>Direct user keys:</strong> {diagnosticResults.counts.userKeys}
                  </div>
                  <div>
                    <strong>Users hash keys:</strong> {diagnosticResults.counts.usersHashKeys}
                  </div>
                  <div>
                    <strong>Users hash entries:</strong> {diagnosticResults.counts.usersHashEntries}
                  </div>
                  <div>
                    <strong>Direct user objects:</strong> {diagnosticResults.counts.directUserObjects}
                  </div>
                  <div>
                    <strong>User score objects:</strong> {diagnosticResults.counts.userScoreObjects}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="usersHash">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="usersHash">Users Hash</TabsTrigger>
                <TabsTrigger value="directUsers">Direct User Objects</TabsTrigger>
                <TabsTrigger value="userScores">User Scores</TabsTrigger>
                <TabsTrigger value="allKeys">All Keys</TabsTrigger>
              </TabsList>

              <TabsContent value="usersHash" className="space-y-4">
                <h3 className="text-lg font-medium">Users Hash Content</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Username</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(diagnosticResults.usersHashContent).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            No entries found
                          </TableCell>
                        </TableRow>
                      ) : (
                        Object.entries(diagnosticResults.usersHashContent).map(([userId, username]) => (
                          <TableRow key={userId}>
                            <TableCell className="font-mono text-xs">{userId}</TableCell>
                            <TableCell>{String(username)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="directUsers" className="space-y-4">
                <h3 className="text-lg font-medium">Direct User Objects</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diagnosticResults.directUserObjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            No direct user objects found
                          </TableCell>
                        </TableRow>
                      ) : (
                        diagnosticResults.directUserObjects.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">{item.key}</TableCell>
                            <TableCell className="font-mono text-xs overflow-auto max-w-md">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(item.data, null, 2)}</pre>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="userScores" className="space-y-4">
                <h3 className="text-lg font-medium">User Score Objects</h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {diagnosticResults.userScoreObjects.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                            No user score objects found
                          </TableCell>
                        </TableRow>
                      ) : (
                        diagnosticResults.userScoreObjects.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">{item.key}</TableCell>
                            <TableCell className="font-mono text-xs overflow-auto max-w-md">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(item.data, null, 2)}</pre>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="allKeys" className="space-y-4">
                <h3 className="text-lg font-medium">All User-Related Keys</h3>
                <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                  <ul className="space-y-1 font-mono text-xs">
                    {diagnosticResults.allUserRelatedKeys.map((key: string, index: number) => (
                      <li key={index}>{key}</li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!diagnosticResults && !isLoading && !error && (
          <div className="text-center py-4 text-gray-500">
            Click "Run Diagnostics" to analyze user data storage patterns
          </div>
        )}
      </CardContent>
    </Card>
  )
}
