"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import FlightLogTable from "@/components/flight-log-table"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
  }
}

export default function FlightLogPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/me`
        const response = await fetch(apiUrl, {
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
        
        if (data.user && data.user.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader>
          <MainNav />
          <UserNav />
        </DashboardHeader>
        <DashboardShell>
          <div className="container min-w-[1024px] 3xl:max-w-[2100px]">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filters Skeleton */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-9 w-64" />
                  <Skeleton className="h-4 w-24" />
                </div>
                
                {/* Filter Bar Skeleton */}
                <div className="grid grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>

                {/* Table Header Skeleton */}
                <div className="rounded-md border">
                  <div className="border-b p-4">
                    <div className="grid grid-cols-9 gap-4">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </div>
                  
                  {/* Table Rows Skeleton */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="border-b p-4 last:border-b-0">
                      <div className="grid grid-cols-9 gap-4 items-center">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-4 w-14" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              
              </CardContent>
            </Card>
          </div>
        </DashboardShell>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader>
        <MainNav />
        <UserNav />
      </DashboardHeader>
      <DashboardShell>
        <div className="container min-w-[1024px] 3xl:max-w-[2100px]">
          <FlightLogTable />
        </div>
      </DashboardShell>
    </div>
  )
} 