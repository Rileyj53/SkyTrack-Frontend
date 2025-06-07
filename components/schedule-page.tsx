"use client"

import { useState, useEffect, useMemo } from "react"
import { addDays, format, startOfMonth, endOfMonth, startOfWeek as dateFnsStartOfWeek, endOfWeek, parseISO } from "date-fns"
import { Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

// Helper function to replace startOfWeek
const startOfWeek = (date: Date, options: { weekStartsOn: number }) => {
  const day = date.getDay()
  const diff = (day < options.weekStartsOn ? 7 : 0) + day - options.weekStartsOn
  return addDays(date, -diff)
}

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MainNav } from "@/components/main-nav"
import { ScheduleCalendar } from "@/components/schedule-calendar"
import { ScheduleHeader } from "@/components/schedule-header"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { NewFlightDialog } from "@/components/schedule/new-flight-dialog"
import { toast } from "sonner"

interface Student {
  _id: string
  user_id: {
    first_name: string
    last_name: string
  }
}

interface Instructor {
  _id: string
  user_id: {
    first_name: string
    last_name: string
  }
}

interface Filters {
  student: string
  instructor: string
  status: string
}

interface Schedule {
  _id: string
  school_id: {
    _id: string
    name: string
  }
  plane_id: {
    _id: string
    registration: string
    type?: string
    model?: string
  }
  instructor_id: {
    _id: string
    user_id: {
      first_name: string
      last_name: string
    }
  }
  student_id: {
    _id: string
    user_id: {
      first_name: string
      last_name: string
    }
  }
  scheduled_start_time: string
  scheduled_end_time: string
  scheduled_duration: number
  flight_type: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
}

export function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [students, setStudents] = useState<Record<string, Student>>({})
  const [instructors, setInstructors] = useState<Record<string, Instructor>>({})
  const [allStudents, setAllStudents] = useState<Record<string, Student>>({})
  const [allInstructors, setAllInstructors] = useState<Record<string, Instructor>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [newFlightDialogOpen, setNewFlightDialogOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    student: "all",
    instructor: "all",
    status: "all"
  })

  const weekDays = useMemo(() => {
    if (view === "month") {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      const days = []
      let current = startOfWeek(start, { weekStartsOn: 1 })
      while (current <= endOfWeek(end, { weekStartsOn: 1 })) {
        days.push(current)
        current = addDays(current, 1)
      }
      return days
    } else if (view === "week") {
      // Center the selected date with 3 days before and after
      const days = []
      for (let i = -3; i <= 3; i++) {
        days.push(addDays(currentDate, i))
      }
      return days
    } else {
      return [currentDate]
    }
  }, [currentDate, view])

  const fetchStudent = async (studentId: string) => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) return null

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students/${studentId}`,
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "Authorization": `Bearer ${token}`,
            "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
          },
          credentials: "include"
        }
      )

      if (!response.ok) return null

      const data = await response.json()
      return data
    } catch (err) {
      console.error("Error fetching student:", err)
      return null
    }
  }

  const fetchInstructors = async (): Promise<void> => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/instructors`,
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "Authorization": `Bearer ${token}`,
            "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
          },
          credentials: "include"
        }
      )

      if (!response.ok) return

      const data = await response.json()
      const instructorsMap: Record<string, Instructor> = {}
      data.forEach((instructor: Instructor) => {
        instructorsMap[instructor._id] = instructor
      })
      setAllInstructors(instructorsMap)
      setInstructors(instructorsMap)
    } catch (err) {
      console.error("Error fetching instructors:", err)
    }
  }

  const fetchAllStudents = async (): Promise<void> => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students`,
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "Authorization": `Bearer ${token}`,
            "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
          },
          credentials: "include"
        }
      )

      if (!response.ok) {
        console.error("Failed to fetch students:", response.status, response.statusText)
        return
      }

      const data = await response.json()
      
      // Handle both possible response formats
      const studentsArray = Array.isArray(data) ? data : (data.students || [])
      
      const studentsMap: Record<string, Student> = {}
      studentsArray.forEach((student: Student) => {
        if (student && student._id) {
          studentsMap[student._id] = student
        }
      })
      
      setAllStudents(studentsMap)
      setStudents(studentsMap)
    } catch (err) {
      console.error("Error fetching all students:", err)
    }
  }

  const fetchSchedules = async (start: Date, end: Date, isRetry: boolean = false) => {
    try {
      if (!isRetry) {
        setLoading(true)
      }
      setError(null)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token) {
        throw new Error("Please sign in again to continue")
      }

      if (!apiKey) {
        throw new Error("Application configuration error. Please contact support.")
      }

      const startDate = format(start, "yyyy-MM-dd")
      const endDate = format(end, "yyyy-MM-dd")
      
      // Build query parameters
      const params = new URLSearchParams()
      params.append("start_date", startDate)
      params.append("end_date", endDate)
      
      // Add filter parameters if they're not "all"
      if (filters.status !== "all") {
        params.append("status", filters.status.toLowerCase())
      }
      if (filters.instructor !== "all") {
        params.append("instructor_id", filters.instructor)
      }
      if (filters.student !== "all") {
        params.append("student_id", filters.student)
      }
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule?${params.toString()}`
      
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
        },
        credentials: "include"
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Your session has expired. Please sign in again.")
        } else if (response.status === 403) {
          throw new Error("You don't have permission to view schedules.")
        } else if (response.status >= 500) {
          throw new Error("Server error. Please try again in a moment.")
        } else {
          throw new Error(`Failed to load schedules (${response.status})`)
        }
      }

      const data = await response.json()
      
      if (data.schedules && Array.isArray(data.schedules)) {
        setSchedules(data.schedules)
        
        // Extract student and instructor data from the populated response for current schedules
        const currentStudentsMap: Record<string, Student> = {}
        const currentInstructorsMap: Record<string, Instructor> = {}
        
        data.schedules.forEach((schedule: Schedule) => {
          if (schedule.student_id && schedule.student_id._id && schedule.student_id.user_id) {
            currentStudentsMap[schedule.student_id._id] = {
              _id: schedule.student_id._id,
              user_id: schedule.student_id.user_id
            }
          }
          if (schedule.instructor_id && schedule.instructor_id._id && schedule.instructor_id.user_id) {
            currentInstructorsMap[schedule.instructor_id._id] = {
              _id: schedule.instructor_id._id,
              user_id: schedule.instructor_id.user_id
            }
          }
        })
        
        // Update current schedule-specific data only (preserve complete lists)
        setStudents(currentStudentsMap)
        setInstructors(currentInstructorsMap)
        setRetryCount(0) // Reset retry count on success
      } else {
        setSchedules([])
      }
    } catch (err) {
      console.error("Error fetching schedules:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to load schedules"
      setError(errorMessage)
      
      // Only show toast for non-retry attempts to avoid spam
      if (!isRetry) {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    
    let start: Date
    let end: Date

    switch (view) {
      case "month":
        start = startOfMonth(currentDate)
        end = endOfMonth(currentDate)
        break
      case "week":
        start = weekDays[0]
        end = weekDays[6]
        break
      case "day":
        start = currentDate
        end = currentDate
        break
      default:
        start = currentDate
        end = currentDate
    }

    fetchSchedules(start, end, true)
  }

  const router = useRouter()

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
        
        // Store the school ID in localStorage for other components to use
        if (data.user && data.user.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const loadData = async () => {
      // First load students and instructors
      await Promise.all([fetchAllStudents(), fetchInstructors()])
      
      // Then load schedules
      let start: Date
      let end: Date

      switch (view) {
        case "month":
          start = startOfMonth(currentDate)
          end = endOfMonth(currentDate)
          break
        case "week":
          start = weekDays[0] // Use the first day of our weekDays array
          end = weekDays[6] // Use the last day of our weekDays array
          break
        case "day":
          start = currentDate
          end = currentDate
          break
        default:
          start = currentDate
          end = currentDate
      }

      fetchSchedules(start, end)
    }
    
    loadData()
  }, [currentDate, view, filters])

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate)
  }

  const handleViewChange = (newView: "day" | "week" | "month") => {
    setView(newView)
  }

  const handleFlightCreated = () => {
    let start: Date
    let end: Date

    switch (view) {
      case "month":
        start = startOfMonth(currentDate)
        end = endOfMonth(currentDate)
        break
      case "week":
        start = weekDays[0] // Use the first day of our weekDays array
        end = weekDays[6] // Use the last day of our weekDays array
        break
      case "day":
        start = currentDate
        end = currentDate
        break
      default:
        start = currentDate
        end = currentDate
    }

    // Only refresh schedules since complete lists don't change
    fetchSchedules(start, end)
  }

  // Since filtering is now handled server-side, we can use schedules directly
  const filteredSchedules = schedules

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader>
        <MainNav />
        <UserNav />
      </DashboardHeader>
      <DashboardShell>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Flight Schedule</h1>
              <p className="text-muted-foreground">
                Manage flight schedules, instructor assignments, and aircraft availability.
              </p>
            </div>
          </div>

          <ScheduleHeader 
            currentDate={currentDate} 
            onDateChange={handleDateChange} 
            view={view} 
            onViewChange={handleViewChange}
            students={Object.values(allStudents)}
            instructors={Object.values(allInstructors)}
            onFlightCreated={handleFlightCreated}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loading 
                  size="lg" 
                  text="Loading schedules..."
                />
                {retryCount > 0 && (
                  <span className="text-xs text-muted-foreground">Attempt {retryCount + 1}</span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="text-center text-red-600 dark:text-red-400">
                <p className="font-medium">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetry}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    'Try Again'
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && (
            <ScheduleCalendar
              currentDate={currentDate}
              view={view}
              weekDays={weekDays}
              schedules={filteredSchedules}
              students={students}
              instructors={instructors}
              onScheduleUpdate={handleFlightCreated}
              onDateChange={handleDateChange}
              onViewChange={handleViewChange}
            />
          )}
        </div>
      </DashboardShell>
    </div>
  )
}
