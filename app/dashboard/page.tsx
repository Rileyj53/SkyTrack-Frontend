"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarDays, Clock, Plane, Users } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import FlightLogTable from "@/components/flight-log-table"
import FlightLogOverview from "@/components/flight-log-overview"
import { FlightStats } from "@/components/flight-stats"
import { MainNav } from "@/components/main-nav"
import { StudentProgress } from "@/components/student-progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent } from "@/components/ui/card"

// Dynamically import the FlightTrackingMap component to avoid SSR issues
import dynamic from 'next/dynamic'

// Disable SSR for the map component
const FlightTrackingMap = dynamic(
  () => import('@/components/flight-tracking-map').then(mod => mod.FlightTrackingMap),
  { ssr: false }
)

interface UserData {
  user: {
    email: string
    role: string
    school_id: string
    school: {
      name: string
      address: {
        city: string
        state: string
      }
    }
    pilot: {
      first_name: string
      last_name: string
      pilot_type: string
      certifications: string[]
    }
  }
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)

  // Mock data for dashboard statistics
  const stats = {
    totalFlights: "156",
    totalHours: "342",
    activeStudents: "24",
    completionRate: "92"
  }

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        // Use the environment variable for the API URL
        const apiUrl = `${process.env.API_URL}/auth/me`
        console.log('Auth check API URL:', apiUrl)
        
        const response = await fetch(apiUrl, {
          headers: {
            "x-api-key": process.env.API_KEY || "",
            "X-CSRF-Token": localStorage.getItem("csrfToken") || "",
            "Authorization": `Bearer ${token}`
          },
          credentials: "include" // This ensures cookies are sent with the request
        })

        if (!response.ok) {
          throw new Error("Not authenticated")
        }

        const data = await response.json()
        console.log('User data received:', JSON.stringify(data, null, 2))
        console.log('User data structure:', {
          hasUser: !!data.user,
          userKeys: data.user ? Object.keys(data.user) : [],
          hasPilot: data.user?.pilot,
          pilotKeys: data.user?.pilot ? Object.keys(data.user.pilot) : []
        })
        
        // Store the school ID in localStorage for other components to use
        if (data.user && data.user.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
          console.log('Stored school ID in localStorage:', data.user.school_id)
        }
        
        setUserData(data)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    // Set initial tab based on URL hash
    const hash = window.location.hash.replace("#", "")
    if (hash === "flights") {
      setActiveTab("flights")
    }

    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash.replace("#", "")
      if (newHash === "flights") {
        setActiveTab("flights")
      }
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  // Check for tab parameter in URL and set active tab accordingly
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'flights') {
      setActiveTab('flights')
    }
  }, [searchParams])

  // Handle browser navigation events
  useEffect(() => {
    // Function to handle popstate events (back/forward navigation)
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get('tab')
      if (tabParam) {
        setActiveTab(tabParam)
      }
    }

    // Add event listener for popstate events
    window.addEventListener('popstate', handlePopState)
    
    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    
    // Update URL with the new tab value
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    
    // Preserve the edit parameter if it exists
    const editParam = searchParams.get('edit')
    if (editParam) {
      params.set('edit', editParam)
    }
    
    // Update URL without refreshing the page
    router.push(`/dashboard?${params.toString()}`, { scroll: false })
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <DashboardShell>
      <DashboardHeader>
        <MainNav />
        <UserNav />
      </DashboardHeader>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="flights">Flights</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="flex flex-row items-center justify-between space-y-0 p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Total Flights</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Plane className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-row items-center justify-between space-y-0 p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Active Students</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-row items-center justify-between space-y-0 p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Today's Flights</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex flex-row items-center justify-between space-y-0 p-6">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Flight Hours</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardContent className="p-6">
                  <FlightTrackingMap />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardContent className="p-6">
                  <StudentProgress />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="flights" className="space-y-4">
            <FlightLogTable />
          </TabsContent>
          <TabsContent value="students" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardContent className="p-6">
                  <FlightLogOverview />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <FlightStats
                      title="Total Flights"
                      value={stats.totalFlights}
                      description="Total flights completed"
                    />
                    <FlightStats
                      title="Flight Hours"
                      value={stats.totalHours}
                      description="Total flight hours logged"
                    />
                    <FlightStats
                      title="Active Students"
                      value={stats.activeStudents}
                      description="Students with active training"
                    />
                    <FlightStats
                      title="Completion Rate"
                      value={`${stats.completionRate}%`}
                      description="Flight completion rate"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="schedule" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardContent className="p-6">
                  <FlightTrackingMap />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardContent className="p-6">
                  <StudentProgress />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  )
} 