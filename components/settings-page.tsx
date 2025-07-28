"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SettingsIcon, GraduationCap, BarChart3 } from "lucide-react"

import { MainNav } from "@/components/main-nav-new"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SettingsGeneral } from "@/components/settings-general"
import { SettingsPrograms } from "@/components/settings-programs"
import { SettingsStatistics } from "@/components/settings-statistics"

export function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("general")
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
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
        
        // Extract and store user role
        const role = data.data?.user?.role || data.user?.role
        if (role) {
          setUserRole(role)
          localStorage.setItem("userRole", role)
          console.log('User role:', role)
        }
        
        // Store the organization ID in localStorage for other components to use
        if (data.data?.user?.organizationId) {
          localStorage.setItem("organizationId", data.data.user.organizationId)
          console.log('Stored organization ID in localStorage:', data.data.user.organizationId)
        } else if (data.data?.user?.school_id) {
          // Fallback for legacy data
          localStorage.setItem("schoolId", data.data.user.school_id)
          console.log('Stored legacy school ID in localStorage:', data.data.user.school_id)
        } else if (data.user?.organizationId) {
          localStorage.setItem("organizationId", data.user.organizationId)
          console.log('Stored organization ID in localStorage:', data.user.organizationId)
        } else if (data.user?.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
          console.log('Stored legacy school ID in localStorage:', data.user.school_id)
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
    <div style={{ padding: 'var(--mantine-spacing-md)', height: '100vh' }}>
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MainNav />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)', gap: 'var(--mantine-spacing-sm)', paddingTop: '3rem' }}>
        <div className="flex flex-col space-y-4">

          <Tabs defaultValue="general" className="space-y-4" onValueChange={setActiveTab}>
            <TabsList className={`grid ${userRole === 'school_admin' ? 'grid-cols-3 md:w-[400px]' : 'grid-cols-1 md:w-[150px]'}`}>
              <TabsTrigger value="general">
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline-block">General</span>
              </TabsTrigger>
              {userRole === 'school_admin' && (
                <TabsTrigger value="programs">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline-block">Programs</span>
                </TabsTrigger>
              )}
              {userRole === 'school_admin' && (
                <TabsTrigger value="statistics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline-block">Statistics</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="general">
              <SettingsGeneral />
            </TabsContent>

            {userRole === 'school_admin' && (
              <TabsContent value="programs">
                <SettingsPrograms />
              </TabsContent>
            )}

            {userRole === 'school_admin' && (
              <TabsContent value="statistics">
                <SettingsStatistics />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
}
