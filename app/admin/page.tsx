"use client"

import { GamesPlayedVerification } from "@/components/admin/games-played-verification"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { AdminNavigation } from "@/components/admin/admin-navigation"
import { TestingSuiteLayout } from "@/components/admin/testing-suite-layout"
import { useState } from "react"

export default function AdminPage() {
  const password = process.env.ADMIN_PASSWORD || "default_admin_password"
  const [activeTab, setActiveTab] = useState("leaderboard")

  return (
    <Tabs defaultValue="testing" className="w-[400px]">
      <AdminNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <TabsContent value="testing">
        <TestingSuiteLayout adminPassword={password}>
          <GamesPlayedVerification adminPassword={password} />
        </TestingSuiteLayout>
      </TabsContent>
    </Tabs>
  )
}
