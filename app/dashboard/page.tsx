"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarDays, Clock, Plane, Users } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
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
    _id: string
    email: string
    first_name: string
    last_name: string
    role: string
    school_id: string
    isActive: boolean
    emailVerified: boolean
    mfaEnabled: boolean
    mfaVerified: boolean
    createdAt: string
    updatedAt: string
    school: {
      _id: string
      name: string
      address: {
        street: string
        city: string
        state: string
        zip: string
        country: string
      }
      airport: string
      phone: string
      email: string
      website: string
    }
    student: any | null
    instructor: any | null
  }
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)

  // Get the user's first name or fall back to email username
  const firstName = userData?.user?.first_name || 
                   (userData?.user?.email ? userData.user.email.split('@')[0] : "") || 
                   ""

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
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/me`
        console.log('Auth check API URL:', apiUrl)
        
        const response = await fetch(apiUrl, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
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
          firstName: data.user?.first_name,
          lastName: data.user?.last_name,
          email: data.user?.email,
          role: data.user?.role
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
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <DashboardHeader>
          <MainNav />
          <UserNav />
        </DashboardHeader>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6 mt-[64px]">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            {firstName && (
              <p className="text-sm text-muted-foreground">Welcome back, {firstName}!</p>
            )}
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="live-tracking">Live Tracking</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FlightStats
                title="Daily Flight Hours"
                value="24.5"
                description="Today's flights"
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              />
              <FlightStats
                title="Students in Session"
                value="8"
                description="Currently training"
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
              />
              <FlightStats
                title="Aircraft Utilization"
                value="78%"
                description="12% increase"
                icon={<Plane className="h-4 w-4 text-muted-foreground" />}
              />
              <FlightStats
                title="Upcoming Flights"
                value="9"
                description="Next 2 days"
                icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
              />
            </div>

            {/* Flight Tracking Map */}
            <FlightTrackingMap />

            {/* Recent Flights and Student Progress */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <div className="col-span-4">
                <FlightLogOverview />
              </div>
              <div className="col-span-3">
                <StudentProgress />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="live-tracking" className="space-y-4">
            <FlightTrackingMap />
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