"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle, Info } from "lucide-react"
import type { ReactNode } from "react"

interface TestingSuiteLayoutProps {
  adminPassword: string
  children: ReactNode
}

export function TestingSuiteLayout({ adminPassword, children }: TestingSuiteLayoutProps) {
  const testingTools = [
    {
      id: "games-played",
      name: "Games Played Statistics Verification",
      description: "Verify the accuracy and consistency of games played counts across all systems",
      status: "active",
      priority: "high",
    },
    {
      id: "score-verification",
      name: "Score Verification",
      description: "Comprehensive score calculation and leaderboard accuracy testing",
      status: "planned",
      priority: "medium",
    },
    {
      id: "user-data-integrity",
      name: "User Data Integrity",
      description: "Validate user profiles, achievements, and historical data consistency",
      status: "planned",
      priority: "medium",
    },
    {
      id: "performance-testing",
      name: "Performance Testing",
      description: "Load testing, response time analysis, and system performance benchmarks",
      status: "planned",
      priority: "low",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "planned":
        return <Clock className="h-4 w-4 text-yellow-400" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-600 text-white">Active</Badge>
      case "planned":
        return <Badge className="bg-yellow-600 text-white">Planned</Badge>
      default:
        return <Badge className="bg-gray-600 text-white">Inactive</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-600 text-white">Medium</Badge>
      case "low":
        return <Badge variant="secondary">Low</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Testing & Verification Suite
          </CardTitle>
          <CardDescription className="text-gray-400">
            Comprehensive testing tools to verify data integrity, system performance, and feature reliability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {testingTools.map((tool) => (
              <Card key={tool.id} className="bg-gray-700 border-gray-600">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(tool.status)}
                      <CardTitle className="text-sm text-white">{tool.name}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(tool.status)}
                      {getPriorityBadge(tool.priority)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-400">{tool.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Active Testing Tools</CardTitle>
          <CardDescription className="text-gray-400">
            Currently available testing and verification tools
          </CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Info className="h-5 w-5 text-blue-400" />
            Testing Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-white mb-2">Before Testing</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Ensure admin password is entered</li>
                <li>• Backup critical data if needed</li>
                <li>• Review test scope and impact</li>
                <li>• Check system load and timing</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">During Testing</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Monitor test progress closely</li>
                <li>• Document any anomalies</li>
                <li>• Avoid concurrent operations</li>
                <li>• Be prepared to stop if needed</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">After Testing</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Review all test results</li>
                <li>• Address identified issues</li>
                <li>• Update documentation</li>
                <li>• Schedule follow-up tests</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Best Practices</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Run tests during low traffic</li>
                <li>• Test incrementally</li>
                <li>• Keep detailed logs</li>
                <li>• Validate repairs thoroughly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
