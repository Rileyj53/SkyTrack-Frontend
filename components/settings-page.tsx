"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plane, School, SettingsIcon, Users } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsInstructors } from "@/components/settings-instructors"
import { SettingsAircraft } from "@/components/settings-aircraft"
import { SettingsStudents } from "@/components/settings-students"
import { SettingsGeneral } from "@/components/settings-general"

export function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("general")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch(`${process.env.API_URL}/auth/me`, {
          headers: {
            "x-api-key": process.env.API_KEY || "",
            "X-CSRF-Token": localStorage.getItem("csrfToken") || "",
            "Authorization": `Bearer ${token}`
          },
          credentials: "include"
        })

        if (!response.ok) {
          throw new Error("Not authenticated")
        }

        const data = await response.json()
        console.log('User data received:', JSON.stringify(data, null, 2))
        
        // Store the school ID in localStorage for other components to use
        if (data.user && data.user.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
          console.log('Stored school ID in localStorage:', data.user.school_id)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader>
        <MainNav />
        <UserNav />
      </DashboardHeader>
      <DashboardShell>
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your flight school settings, users, aircraft, and more.</p>
          </div>

          <Tabs defaultValue="general" className="space-y-4" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 md:w-[600px]">
              <TabsTrigger value="general">
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline-block">General</span>
              </TabsTrigger>
              <TabsTrigger value="instructors">
                <Users className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline-block">Instructors</span>
              </TabsTrigger>
              <TabsTrigger value="aircraft">
                <Plane className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline-block">Aircraft</span>
              </TabsTrigger>
              <TabsTrigger value="students">
                <School className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline-block">Students</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <SettingsGeneral />
            </TabsContent>

            <TabsContent value="instructors">
              <SettingsInstructors />
            </TabsContent>

            <TabsContent value="aircraft">
              <SettingsAircraft />
            </TabsContent>

            <TabsContent value="students">
              <SettingsStudents />
            </TabsContent>
          </Tabs>
        </div>
      </DashboardShell>
    </div>
  )
}
