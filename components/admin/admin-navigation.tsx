"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, Database, TrendingUp, CheckCircle, Bell, Activity, Shield } from "lucide-react"

interface AdminNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  hasNotifications?: boolean
}

export function AdminNavigation({ activeTab, onTabChange, hasNotifications = false }: AdminNavigationProps) {
  const navigationItems = [
    {
      id: "leaderboard",
      label: "Leaderboard",
      icon: Trophy,
      description: "Manage leaderboard data and rankings",
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      description: "Manage users and handle moderation",
    },
    {
      id: "scores",
      label: "Score Management",
      icon: Trophy,
      description: "Score diagnostics and repair tools",
    },
    {
      id: "monitoring",
      label: "Monitoring",
      icon: Database,
      description: "System monitoring and diagnostics",
    },
    {
      id: "achievements",
      label: "Achievements",
      icon: Shield,
      description: "Achievement system management",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: TrendingUp,
      description: "Game analytics and insights",
    },
    {
      id: "testing",
      label: "Testing & Verification",
      icon: CheckCircle,
      description: "Data integrity and system testing",
      badge: "New",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
        <div className="flex items-center gap-2">
          {hasNotifications && (
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Alerts
              <Badge variant="destructive" className="ml-2">
                3
              </Badge>
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            System Status
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid w-full grid-cols-7 h-auto p-1">
          {navigationItems.map((item) => {
            const IconComponent = item.icon
            return (
              <TabsTrigger
                key={item.id}
                value={item.id}
                className="flex flex-col items-center gap-1 p-3 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <div className="flex items-center gap-1">
                  <IconComponent className="h-4 w-4" />
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      <div className="text-sm text-muted-foreground">
        {navigationItems.find((item) => item.id === activeTab)?.description}
      </div>
    </div>
  )
}
