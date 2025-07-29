"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { addDays, format, startOfMonth, endOfMonth, startOfWeek as dateFnsStartOfWeek, endOfWeek, parseISO } from "date-fns"
import { Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

// Helper function to replace startOfWeek
const startOfWeek = (date: Date, options: { weekStartsOn: number }) => {
  const day = date.getDay()
  const diff = (day < options.weekStartsOn ? 7 : 0) + day - options.weekStartsOn
  return addDays(date, -diff)
}


import { MainNav } from "@/components/main-nav-new"
import { ScheduleCalendar } from "@/components/schedule-calendar"
import { ScheduleHeader } from "@/components/schedule-header"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { NewFlightDialog } from "@/components/schedule/new-flight-dialog"
import { Card, CardContent } from "@/components/ui/card"
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
  const [view, setView] = useState<"day" | "week" | "month" | "aircraft">("week")
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [students, setStudents] = useState<Record<string, Student>>({})
  const [instructors, setInstructors] = useState<Record<string, Instructor>>({})
  const [allStudents, setAllStudents] = useState<Record<string, Student>>({})
  const [allInstructors, setAllInstructors] = useState<Record<string, Instructor>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [newFlightDialogOpen, setNewFlightDialogOpen] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    student: "all",
    instructor: "all",
    status: "all"
  })
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

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
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token || !apiKey) return null

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/students/${studentId}`,
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
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token || !apiKey) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/instructors`,
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
      
      if (data.success && data.data && data.data.instructors && Array.isArray(data.data.instructors)) {
        const instructorsMap: Record<string, Instructor> = {}
        data.data.instructors.forEach((instructor: Instructor) => {
          instructorsMap[instructor._id] = instructor
        })
        setAllInstructors(instructorsMap)
        setInstructors(instructorsMap)
      } else if (data.success && data.data && Array.isArray(data.data)) {
        // Fallback: if the data array is directly under data
        const instructorsMap: Record<string, Instructor> = {}
        data.data.forEach((instructor: Instructor) => {
          instructorsMap[instructor._id] = instructor
        })
        setAllInstructors(instructorsMap)
        setInstructors(instructorsMap)
      } else {
        console.error('Invalid instructors response format:', data)
        if (!data.success) {
          console.error(`API Error: ${data.message || 'Failed to fetch instructors'}`)
        } else {
          console.error("Invalid data format received from API - instructors not found")
        }
      }
    } catch (err) {
      console.error("Error fetching instructors:", err)
    }
  }

  const fetchAllStudents = async (): Promise<void> => {
    try {
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token || !apiKey) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/students`,
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
      
      if (data.success && data.data && data.data.students && Array.isArray(data.data.students)) {
        const studentsMap: Record<string, Student> = {}
        data.data.students.forEach((student: Student) => {
          if (student && student._id) {
            studentsMap[student._id] = student
          }
        })
        
        setAllStudents(studentsMap)
        setStudents(studentsMap)
      } else {
        console.error('Invalid students response format:', data)
        if (!data.success) {
          console.error(`API Error: ${data.message || 'Failed to fetch students'}`)
        } else {
          console.error("Invalid data format received from API - students not found")
        }
      }
    } catch (err) {
      console.error("Error fetching all students:", err)
    }
  }

  // Helper function to calculate date ranges for different views
  const getDateRange = useCallback((date: Date, viewType: "day" | "week" | "month" | "aircraft") => {
    switch (viewType) {
      case "month":
        return {
          start: startOfMonth(date),
          end: endOfMonth(date)
        }
      case "week":
        const days = []
        for (let i = -3; i <= 3; i++) {
          days.push(addDays(date, i))
        }
        return {
          start: days[0],
          end: days[6]
        }
      case "day":
        return {
          start: date,
          end: date
        }
      case "aircraft":
        return {
          start: date,
          end: date
        }
      default:
        return {
          start: date,
          end: date
        }
    }
  }, [])

  const fetchSchedules = async (start: Date, end: Date, isRetry: boolean = false, isTransition: boolean = false) => {
    try {
      if (!isRetry && !isTransition) {
        setLoading(true)
      }
      setError(null)
      
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token) {
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
      
      // For students, add user_id parameter to filter their flights only
      if (userRole === 'student' && userId) {
        params.append("user_id", userId)
        console.log('🎓 Schedule Student view: Adding user_id filter:', userId)
      }
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/flight_schedule?${params.toString()}`
      
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
      
      if (data.success && data.data && data.data.schedules && Array.isArray(data.data.schedules)) {
        setSchedules(data.data.schedules)
        
        // Extract student and instructor data from the populated response for current schedules
        const currentStudentsMap: Record<string, Student> = {}
        const currentInstructorsMap: Record<string, Instructor> = {}
        
        data.data.schedules.forEach((schedule: Schedule) => {
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
        console.error('Invalid response format:', data)
        if (!data.success) {
          setError(`API Error: ${data.message || 'Unknown error occurred'}`)
        } else {
          setError("Invalid data format received from API - schedules not found")
        }
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
    
    const { start, end } = getDateRange(currentDate, view)
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
        
        // Store the organization ID in localStorage for other components to use
        if (data.data && data.data.user && data.data.user.organizationId) {
          localStorage.setItem("organizationId", data.data.user.organizationId)
        } else if (data.data && data.data.user && data.data.user.school_id) {
          // Fallback for legacy data
          localStorage.setItem("schoolId", data.data.user.school_id)
        }
        
        // Set user role and ID for role-based filtering
        if (data.data && data.data.user) {
          setUserRole(data.data.user.role)
          setUserId(data.data.user._id)
          console.log('Schedule - User role:', data.data.user.role)
          console.log('Schedule - User ID:', data.data.user._id)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    if (!isInitialLoad) return
    
    const loadData = async () => {
      // For students, members, and club admins, only load instructors (no need for students data)
      // For admins/instructors, load both students and instructors for full access
      if (userRole === 'student' || userRole === 'member' || userRole === 'club_admin') {
        await fetchInstructors()
      } else {
        await Promise.all([fetchAllStudents(), fetchInstructors()])
      }
      
      // Then load schedules for initial load
      const { start, end } = getDateRange(currentDate, view)
      fetchSchedules(start, end)
      setIsInitialLoad(false)
    }
    
    loadData()
  }, [isInitialLoad, getDateRange, currentDate, view, userRole, userId]) // Dependencies for initial load including user role

  // Separate effect for filter changes (not view/date changes which are handled manually)
  useEffect(() => {
    // Skip if this is the initial load
    if (isInitialLoad) return
    
    const { start, end } = getDateRange(currentDate, view)
    fetchSchedules(start, end, false, true)
  }, [filters, isInitialLoad, currentDate, view, getDateRange, userRole, userId])

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate)
    
    // Fetch new data with transition loading
    const { start, end } = getDateRange(newDate, view)
    fetchSchedules(start, end, false, true)
  }

  const handleViewChange = (newView: "day" | "week" | "month" | "aircraft") => {
    setView(newView)
    
    // Fetch new data with transition loading
    const { start, end } = getDateRange(currentDate, newView)
    fetchSchedules(start, end, false, true)
  }

  const handleFlightCreated = () => {
    const { start, end } = getDateRange(currentDate, view)
    
    // Only refresh schedules since complete lists don't change
    fetchSchedules(start, end, false, true)
  }

  // Since filtering is now handled server-side, we can use schedules directly
  const filteredSchedules = schedules

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  return (
    <div style={{ padding: 'var(--mantine-spacing-md)', height: '100vh' }}>
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MainNav />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)', gap: 'var(--mantine-spacing-sm)', paddingTop: '3rem' }}>
        {/* Header section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          userRole={userRole || undefined}
        />

        {/* Main content area - flexible */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minHeight: '0' }}>
          <Card className="h-full">
            <CardContent className="p-0 h-full">
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
                  <div className="text-center text-[#f90606] dark:text-[#f90606]">
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
                <div className="h-full">
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}