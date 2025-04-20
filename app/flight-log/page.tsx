"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import FlightLogTable from "@/components/flight-log-table"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"

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
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
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