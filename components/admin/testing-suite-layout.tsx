"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trophy, Users, Database, CheckCircle, Clock, Target, AlertTriangle } from "lucide-react"

interface TestingSuiteLayoutProps {
  children: React.ReactNode
  adminPassword: string
}

export function TestingSuiteLayout({ children, adminPassword }: TestingSuiteLayoutProps) {
  const upcomingTools = [
    {
      icon: Trophy,
      title: "Score Verification",
      description: "Comprehensive score calculation and leaderboard accuracy testing",
      category: "Data Integrity",
      priority: "High",
    },
    {
      icon: Users,
      title: "User Data Integrity",
      description: "Validate user profiles, achievements, and account consistency",
      category: "Data Validation",
      priority: "Medium",
    },
    {
      icon: Database,
      title: "Performance Testing",
      description: "Load testing, response time analysis, and system benchmarks",
      category: "Performance",
      priority: "Medium",
    },
    {
      icon: CheckCircle,
      title: "Achievement Verification",
      description: "Verify achievement unlocks and progression tracking accuracy",
      category: "Feature Testing",
      priority: "Low",
    },
    {
      icon: Clock,
      title: "Real-time Monitoring",
      description: "Continuous monitoring and alerting for system health",
      category: "Monitoring",
      priority: "High",
    },
    {
      icon: Target,
      title: "API Testing Suite",
      description: "Automated testing of all API endpoints and responses",
      category: "Integration",
      priority: "Medium",
    },
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "destructive"
      case "Medium":
        return "secondary"
      case "Low":
        return "outline"
      default:
        return "outline"
    }
  }

  if (!adminPassword) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">
            Please enter your admin password to access the testing and verification suite.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Testing & Verification Suite
          </CardTitle>
          <CardDescription>
            Comprehensive testing tools to verify data integrity, system performance, and feature reliability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Active Testing Tools */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Active Testing Tools</h3>
              <div className="space-y-4">{children}</div>
            </div>

            <Separator />

            {/* Upcoming Testing Tools */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Planned Testing Tools</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcomingTools.map((tool, index) => {
                  const IconComponent = tool.icon
                  return (
                    <Card key={index} className="border-dashed hover:border-solid transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-muted p-2 mt-1">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-sm">{tool.title}</h4>
                              <Badge variant={getPriorityColor(tool.priority)} className="text-xs">
                                {tool.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                            <Badge variant="outline" className="text-xs">
                              {tool.category}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Testing Guidelines */}
            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-4">Testing Guidelines</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Best Practices</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Run verification tests during low-traffic periods</li>
                      <li>• Always backup data before running repair operations</li>
                      <li>• Monitor system performance during testing</li>
                      <li>• Document any issues found for future reference</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Safety Measures</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• All tests are read-only by default</li>
                      <li>• Repair operations require explicit confirmation</li>
                      <li>• Automatic rollback for failed operations</li>
                      <li>• Comprehensive logging for audit trails</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
