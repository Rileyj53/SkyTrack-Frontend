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
  school_id: string
  plane_id: string
  instructor_id: string
  student_id: string
  date: string
  start_time: string
  end_time: string
  flight_type: string
  status: string
  notes: string
  created_by: string
  created_at: string
  updated_at: string
}

export function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [students, setStudents] = useState<Record<string, Student>>({})
  const [instructors, setInstructors] = useState<Record<string, Instructor>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const fetchInstructors = async () => {
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
      setInstructors(instructorsMap)
    } catch (err) {
      console.error("Error fetching instructors:", err)
    }
  }

  const fetchAllStudents = async () => {
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
      console.log("Students API response:", data)
      
      // Handle both possible response formats
      const studentsArray = Array.isArray(data) ? data : (data.students || [])
      
      const studentsMap: Record<string, Student> = {}
      studentsArray.forEach((student: Student) => {
        if (student && student._id) {
          studentsMap[student._id] = student
        }
      })
      
      console.log("Processed students:", studentsMap)
      setStudents(studentsMap)
    } catch (err) {
      console.error("Error fetching all students:", err)
    }
  }

  const fetchSchedules = async (start: Date, end: Date) => {
    try {
      setLoading(true)
      setError(null)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!apiKey) {
        throw new Error("API key is not configured")
      }

      const startDate = format(start, "yyyy-MM-dd")
      const endDate = format(end, "yyyy-MM-dd")
      
      console.log('Fetching schedules for:', { startDate, endDate }) // Debug log
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/schedules?startDate=${startDate}&endDate=${endDate}`
      
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
        throw new Error(`Failed to fetch schedules: ${response.status}`)
      }

      const data = await response.json()
      console.log('Received schedules:', data.schedules) // Debug log
      
      setSchedules(data.schedules || [])

      // Fetch student details for each unique student
      const uniqueStudentIds = [...new Set(data.schedules?.map((s: Schedule) => s.student_id) || [])]
      const newStudents: Record<string, Student> = {}
      
      await Promise.all(
        (uniqueStudentIds as string[]).map(async (studentId: string) => {
          const student = await fetchStudent(studentId)
          if (student) {
            newStudents[studentId] = student
          }
        })
      )
      
      setStudents(newStudents)

      // Fetch all instructors
      await fetchInstructors()
    } catch (err) {
      console.error("Error fetching schedules:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      toast.error("Failed to load schedules")
    } finally {
      setLoading(false)
    }
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
        console.log('User data received:', JSON.stringify(data, null, 2))
        
        // Store the school ID in localStorage for other components to use
        if (data.user && data.user.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
          console.log('Stored school ID in localStorage:', data.user.school_id)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
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
    fetchAllStudents()
    fetchInstructors()
  }, [currentDate, view])

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate)
  }

  const handleViewChange = (newView: "day" | "week" | "month") => {
    console.log("Changing view to:", newView);
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

    fetchSchedules(start, end)
  }

  // Filter schedules based on current filters
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      if (filters.student !== "all" && schedule.student_id !== filters.student) return false
      if (filters.instructor !== "all" && schedule.instructor_id !== filters.instructor) return false
      if (filters.status !== "all" && schedule.status !== filters.status) return false
      return true
    })
  }, [schedules, filters])

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
            students={Object.values(students)}
            instructors={Object.values(instructors)}
            onFlightCreated={handleFlightCreated}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading schedules...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center py-8">
              <div className="text-center text-red-500">{error}</div>
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
