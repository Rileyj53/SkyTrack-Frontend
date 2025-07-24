"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { Plane, User, X, Pencil, Save, AlertTriangle, Trash2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { ReusableTable, TableColumn, FilterConfig, PaginationConfig, ServerSideConfig } from "@/components/reusable-table"

interface Student {
  _id: string
  school_id: string
  user_id: {
    _id: string
    email: string
    first_name: string
    last_name: string
    role: string
  }
  contact_email: string
  phone: string
  certifications: string[]
  license_number: string
  emergency_contact: {
    name: string
    relationship: string
    phone: string
  }
  created_at: string
  updated_at: string
}

interface Instructor {
  _id: string
  school_id: string
  user_id: {
    _id: string
    email: string
    first_name: string
    last_name: string
    role: string
  }
  contact_email: string
  phone: string
  certifications: string[]
  license_number: string
  specialties: string[]
  created_at: string
  updated_at: string
}

interface Aircraft {
  id: string
  registration: string
  type: string
  model?: string
  aircraftModel?: string
  status: string
}

interface FlightLog {
  _id: string
  date: string
  start_time: string
  plane_reg: string
  plane_id: string
  student_name: string
  student_id: string
  instructor: string
  instructor_id: string
  duration: number
  type: string
  status: string
  school_id: string
  created_at: string
  updated_at: string
}

interface FlightLogTableProps {
  className?: string
}

interface PaginationInfo {
  totalCount: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
}

export default function FlightLogTable({ className }: FlightLogTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Core data state
  const [flights, setFlights] = useState<FlightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true) // Separate state for initial load
  const [filterLoading, setFilterLoading] = useState(false) // Loading state for filters/search
  const [error, setError] = useState<string | null>(null)
  
  // Request tracking to prevent race conditions
  const currentRequestId = useRef<string>('')
  const [pagination, setPagination] = useState<PaginationInfo>({
    totalCount: 0,
    totalPages: 1,
    currentPage: 1,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  })

  // Details view state
  const [selectedFlight, setSelectedFlight] = useState<FlightLog | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedFlight, setEditedFlight] = useState<FlightLog | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter and search state  
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({
    start_date: (() => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })(), // Default to today in local timezone
    end_date: (() => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    })(), // Default to today in local timezone
    start_time: "",
    end_time: "",
    status: "all",
    aircraft: "all", 
    instructor: "all",
    student: "all"
  })

  // Note: Date and time filters are now handled through the main filters system

  // Supporting data
  const [students, setStudents] = useState<Student[]>([])
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Format helpers
  const formatDate = (dateString: string) => {
    try {
      const datePart = dateString.split('T')[0]
      const [year, month, day] = datePart.split('-')
      return `${month}/${day}/${year}`
    } catch (err) {
      console.error('Error formatting date:', err)
      return dateString
    }
  }

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      })
    } catch (err) {
      console.error('Error formatting time:', err)
      return time
    }
  }

  const capitalizeStatus = (status: string): string => {
    if (status.toLowerCase() === 'in-progress') {
      return 'In-Progress'
    }
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  const getUTCDateRange = (localDate: Date | null) => {
    if (!localDate) return { startDate: null, endDate: null }
    
    const startOfDay = new Date(localDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(localDate)
    endOfDay.setHours(23, 59, 59, 999)
    
    const startDateUTC = startOfDay.toISOString().split('T')[0]
    const endDateUTC = endOfDay.toISOString().split('T')[0]
    
    return { startDate: startDateUTC, endDate: endDateUTC }
  }

  const convertTimeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  const convertLocalToUTC = (localDate: string, localTime: string): string => {
    const localDateTime = new Date(`${localDate}T${localTime}:00`)
    return localDateTime.toISOString()
  }

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
            'X-CSRF-Token': localStorage.getItem('csrfToken') || '',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Not authenticated')
        }

        const data = await response.json()
        if (data.success && data.data) {
          if (data.data.user && data.data.user.organizationId) {
            localStorage.setItem('organizationId', data.data.user.organizationId)
          } else if (data.data.user && data.data.user.school_id) {
            localStorage.setItem('schoolId', data.data.user.school_id)
          }
          setIsAuthenticated(true)
        } else {
          throw new Error(data.message || 'Failed to fetch user data')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  // Fetch supporting data
  const fetchStudents = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token || !apiKey) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/students`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.students) {
          setStudents(data.data.students)
        }
      }
    } catch (err) {
      console.error("Error fetching students:", err)
    }
  }, [isAuthenticated])

  const fetchInstructors = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token || !apiKey) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/instructors`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.instructors) {
          setInstructors(data.data.instructors)
        } else if (data.success && Array.isArray(data.data)) {
          setInstructors(data.data)
        }
      }
    } catch (err) {
      console.error("Error fetching instructors:", err)
    }
  }, [isAuthenticated])

  const fetchAircraft = useCallback(async () => {
    if (!isAuthenticated) return
    
    try {
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token || !apiKey) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/planes`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.planes) {
          setAircraft(data.data.planes)
        } else if (data.success && Array.isArray(data.data)) {
          setAircraft(data.data)
        }
      }
    } catch (err) {
      console.error("Error fetching aircraft:", err)
    }
  }, [isAuthenticated])

  // Fetch flights function
  const fetchFlightLogs = useCallback(async (
    page?: number,
    limit?: number,
    search?: string,
    filterParams?: Record<string, string>
  ) => {
    if (!isAuthenticated) return

    const actualPage = page ?? currentPage
    const actualLimit = limit ?? pageSize
    const actualSearch = search ?? searchQuery
    const actualFilters = filterParams ?? filters
    
    // Create a unique request ID to track this specific request
    const requestId = `${actualPage}-${actualLimit}-${actualSearch}-${JSON.stringify(actualFilters)}`
    currentRequestId.current = requestId

    try {
      // Set appropriate loading state
      if (initialLoading) {
        setLoading(true)
        setInitialLoading(true)
      } else {
        setFilterLoading(true)
        // Don't clear flights immediately - keep current data until new data arrives
      }
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token || !apiKey) {
        throw new Error("Missing authentication credentials")
      }

      const params = new URLSearchParams({
        page: actualPage.toString(),
        limit: actualLimit.toString()
      })

      // Add search
      if (actualSearch) {
        params.append('search', actualSearch)
      }

      // Add filters (excluding date/time filters which are handled separately)
      Object.entries(actualFilters).forEach(([key, value]) => {
        if (value && value !== "all" && !['start_date', 'end_date', 'start_time', 'end_time'].includes(key)) {
          // Map filter keys to API parameters
          const apiKey = key === 'aircraft' ? 'plane_id' : 
                        key === 'instructor' ? 'instructor_id' :
                        key === 'student' ? 'student_id' : key
          params.append(apiKey, value)
        }
      })

      // Add date filters from main filters
      if (actualFilters.start_date && actualFilters.start_date !== '') {
        params.append("start_date", actualFilters.start_date)
      }
      if (actualFilters.end_date && actualFilters.end_date !== '') {
        params.append("end_date", actualFilters.end_date)
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/flight_schedule?${params.toString()}`
      console.log('🌐 API URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch flight logs: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 API Response:', data)
      
      // Check if this response is still relevant (prevent race conditions)
      if (currentRequestId.current !== requestId) {
        console.log('🔄 Ignoring outdated response for request:', requestId)
        return
      }
      
      if (data.success && data.data?.schedules) {
        // Update pagination
        if (data.data.pagination) {
          setPagination({
            totalCount: data.data.pagination.total || data.data.pagination.totalCount || 0,
            totalPages: data.data.pagination.pages || 1,
            currentPage: data.data.pagination.page || actualPage,
            hasNextPage: data.data.pagination.hasNext || false,
            hasPrevPage: data.data.pagination.hasPrev || false,
            limit: actualLimit
          })
        }

        // Transform data with proper timezone conversion
        let transformedFlights = data.data.schedules.map((schedule: any) => {
          // Convert UTC datetime to local timezone
          const utcDateTime = schedule.scheduled_start_time ? new Date(schedule.scheduled_start_time) : null
          
          // Get local date and time (JavaScript automatically converts UTC to local timezone)
          let localDate = '';
          let localTime = '';
          
          if (utcDateTime) {
            // Format date as YYYY-MM-DD in local timezone
            const year = utcDateTime.getFullYear()
            const month = String(utcDateTime.getMonth() + 1).padStart(2, '0')
            const day = String(utcDateTime.getDate()).padStart(2, '0')
            localDate = `${year}-${month}-${day}`
            
            // Format time as HH:MM in local timezone
            const hours = String(utcDateTime.getHours()).padStart(2, '0')
            const minutes = String(utcDateTime.getMinutes()).padStart(2, '0')
            localTime = `${hours}:${minutes}`
          }
          
          // Debug: Log the structure of student_id and instructor_id for the first few flights
          if (data.data.schedules.indexOf(schedule) < 3) {
            console.log('🔍 Flight data structure:', {
              id: schedule._id,
              student_id: schedule.student_id,
              instructor_id: schedule.instructor_id
            })
          }

          const transformedFlight = {
            _id: schedule._id,
            date: localDate,
            start_time: localTime,
            plane_reg: schedule.plane_id?.registration || 'N/A',
            plane_id: schedule.plane_id?._id || '',
            student_name: schedule.student_id ? 
              `${schedule.student_id.user_id?.first_name || ''} ${schedule.student_id.user_id?.last_name || ''}`.trim() : 'N/A',
            student_id: schedule.student_id?._id || '',
            instructor: schedule.instructor_id ? 
              `${schedule.instructor_id.user_id?.first_name || ''} ${schedule.instructor_id.user_id?.last_name || ''}`.trim() : 'N/A',
            instructor_id: schedule.instructor_id?._id || '',
            duration: schedule.scheduled_duration || 0,
            type: schedule.flight_type || 'Training',
            status: capitalizeStatus(schedule.status || 'scheduled'),
            school_id: schedule.school_id?._id || organizationId,
            created_at: schedule.created_at || '',
            updated_at: schedule.updated_at || ''
          }
          

          
          return transformedFlight
        })

        // Apply local time filtering if specified
        if (actualFilters.start_time || actualFilters.end_time) {
          transformedFlights = transformedFlights.filter((flight: FlightLog) => {
            const flightTime = flight.start_time
            if (!flightTime) return true
            
            const flightMinutes = convertTimeToMinutes(flightTime)
            
            if (actualFilters.start_time) {
              const startMinutes = convertTimeToMinutes(actualFilters.start_time)
              if (flightMinutes < startMinutes) return false
            }
            
            if (actualFilters.end_time) {
              const endMinutes = convertTimeToMinutes(actualFilters.end_time)
              if (flightMinutes > endMinutes) return false
            }
            
            return true
          })
        }

        setFlights(transformedFlights)
        setError(null)
        // Clear loading states
        if (initialLoading) {
          setInitialLoading(false)
        }
        setFilterLoading(false)
      } else {
        throw new Error(data.message || 'Failed to fetch flights')
      }
    } catch (err) {
      console.error('Error fetching flights:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch flights'
      setError(errorMessage)
      toast.error(errorMessage)
      // Clear loading states even on error
      if (initialLoading) {
        setInitialLoading(false)
      }
      setFilterLoading(false)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Load supporting data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents()
      fetchInstructors()
      fetchAircraft()
    }
  }, [isAuthenticated, fetchStudents, fetchInstructors, fetchAircraft])

  // Load initial flights data (only once when authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      // Use the current filters state for initial load
      fetchFlightLogs(1, 25, '', filters)
    }
  }, [isAuthenticated, fetchFlightLogs]) // Remove filters from dependency to prevent infinite loop

  // Handle URL edit parameter
  useEffect(() => {
    const editFlightId = searchParams.get('edit')
    if (editFlightId && flights.length > 0) {
      const flightToEdit = flights.find(flight => flight._id === editFlightId)
      if (flightToEdit) {
        setSelectedFlight(flightToEdit)
        setEditedFlight({...flightToEdit})
        setIsEditing(true)
        
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]edit=[^&]+(&|$)/, '$1')
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [searchParams, flights])

  // Memoized server-side config handlers
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    fetchFlightLogs(page, pageSize, searchQuery, filters)
  }, [fetchFlightLogs, pageSize, searchQuery, filters])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
    fetchFlightLogs(1, newPageSize, searchQuery, filters)
  }, [fetchFlightLogs, searchQuery, filters])

  const handleFiltersChange = useCallback((newFilters: Record<string, string>) => {
    console.log('🔄 Filter change received:', newFilters)
    setFilters(newFilters)
    setCurrentPage(1)
    fetchFlightLogs(1, pageSize, searchQuery, newFilters)
  }, [fetchFlightLogs, pageSize, searchQuery])

  const handleSearchChange = useCallback((newSearchQuery: string) => {
    setSearchQuery(newSearchQuery)
    setCurrentPage(1)
    fetchFlightLogs(1, pageSize, newSearchQuery, filters)
  }, [fetchFlightLogs, pageSize, filters])

  // Table configuration
  const columns: TableColumn<FlightLog>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Date',
      width: '110px',
      render: (flight) => <span className="font-medium">{formatDate(flight.date)}</span>,
      sortable: true
    },
    {
      key: 'start_time',
      header: 'Time',
      width: '90px',
      render: (flight) => formatTime(flight.start_time),
      sortable: true
    },
    {
      key: 'plane_reg',
      header: 'Aircraft',
      width: '130px',
      render: (flight) => (
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={2.5} />
          <span className="font-mono text-sm truncate">{flight.plane_reg}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'student_name',
      header: 'Student',
      width: '150px',
      render: (flight) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate text-sm">{flight.student_name}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'instructor',
      header: 'Instructor',
      width: '150px',
      render: (flight) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate text-sm">{flight.instructor}</span>
        </div>
      ),
      sortable: true
    },
    {
      key: 'duration',
      header: 'Duration',
      width: '100px',
      render: (flight) => {
        // Format duration to show reasonable decimal places
        const formattedDuration = flight.duration % 1 === 0 
          ? flight.duration.toString() 
          : flight.duration.toFixed(1)
        return <span className="font-medium">{formattedDuration} hrs</span>
      },
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (flight) => (
        <div
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors ${
            flight.status === "Completed" 
              ? "bg-[#b3c6ff] text-black hover:bg-[#809fff] border border-[#809fff]" 
              : flight.status === "In-Progress"
                ? "bg-[#c2f0c2] text-black hover:bg-[#99e699] border border-[#99e699]"
                : flight.status === "Preparing"
                  ? "bg-[#fbfbb6] text-black hover:bg-[#f9f986] border border-[#f9f986]"
                : flight.status === "Scheduled"
                  ? "bg-[#f0b3ff] text-black hover:bg-[#e580ff] border border-[#e580ff]"
                : flight.status === "Cancelled" || flight.status === "Canceled"
                  ? "bg-[#fc9c9c] text-black hover:bg-[#fb6a6a] border border-[#fb6a6a]"
                : "bg-[#d5d5dd] text-[#73738c] hover:bg-[#b9b9c6] border border-[#b9b9c6]"
          }`}
        >
          {flight.status}
        </div>
      ),
      sortable: true
    },
    {
      key: 'type',
      header: 'Type',
      width: '140px',
      render: (flight) => (
        <span className="text-sm truncate block" title={flight.type}>
          {flight.type}
        </span>
      ),
      sortable: true
    }
  ], [])

  const filterConfigs: FilterConfig[] = useMemo(() => {
    console.log('🔧 Building filter configs...')
    return [
    {
      key: 'start_date',
      label: 'Start Date',
      type: 'date',
      defaultValue: (() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })(), // Default to today in local timezone
      serverSide: true
    },
    {
      key: 'end_date',
      label: 'End Date',
      type: 'date',
      defaultValue: (() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      })(), // Default to today in local timezone
      serverSide: true
    },
    {
      key: 'start_time',
      label: 'Start Time',
      type: 'time',
      defaultValue: '',
      serverSide: true
    },
    {
      key: 'end_time',
      label: 'End Time',
      type: 'time',
      defaultValue: '',
      serverSide: true
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'preparing', label: 'Preparing' },
        { value: 'in-progress', label: 'In-Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' }
      ],
      defaultValue: 'all',
      serverSide: true
    },
    {
      key: 'aircraft',
      label: 'Aircraft',
      type: 'select',
      options: [
        { value: 'all', label: 'All Aircraft' },
        ...aircraft.map(plane => ({
          value: plane.id,
          label: `${plane.registration} - ${plane.type}`
        }))
      ],
      defaultValue: 'all',
      serverSide: true
    },
    {
      key: 'instructor',
      label: 'Instructor',
      type: 'select',
      options: [
        { value: 'all', label: 'All Instructors' },
        ...instructors
          .filter(instructor => instructor.user_id?.first_name && instructor.user_id?.last_name)
          .map(instructor => ({
            value: instructor._id,
            label: `${instructor.user_id.first_name} ${instructor.user_id.last_name}`
          }))
      ],
      defaultValue: 'all',
      serverSide: true
    },
    {
      key: 'student',
      label: 'Student',
      type: 'select',
      options: [
        { value: 'all', label: 'All Students' },
        ...students
          .filter(student => student.user_id?.first_name && student.user_id?.last_name)
          .map(student => ({
            value: student._id,
            label: `${student.user_id.first_name} ${student.user_id.last_name}`
          }))
      ],
      defaultValue: 'all',
      serverSide: true
    }
  ]
  }, [aircraft, instructors, students])

  const paginationConfig: PaginationConfig = {
    enabled: true,
    serverSide: true,
    showPageSizeSelector: true,
    pageSizeOptions: [5, 10, 25, 50, 100]
  }

  const serverSideConfig: ServerSideConfig = useMemo(() => ({
    totalItems: pagination.totalCount,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
    onFiltersChange: handleFiltersChange,
    onSearchChange: handleSearchChange
  }), [
    pagination.totalCount,
    pagination.currentPage,
    pagination.totalPages,
    handlePageChange,
    handlePageSizeChange,
    handleFiltersChange,
    handleSearchChange
  ])

  // Row click handler
  const handleRowClick = (flight: FlightLog) => {
    if (isEditing) {
      if (selectedFlight && flight._id !== selectedFlight._id) {
        setShowWarning(true)
        toast.warning("Please save or cancel your current edits before viewing another flight")
        return
      }
    }
    setSelectedFlight(flight)
    setShowWarning(false)
  }

  // Edit handlers
  const handleEditClick = () => {
    if (selectedFlight) {
      setEditedFlight({...selectedFlight})
      setIsEditing(true)
      setShowWarning(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editedFlight) return

    try {
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token || !apiKey) {
        toast.error("Missing authentication credentials")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/flight_schedule/${editedFlight._id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          scheduled_start_time: convertLocalToUTC(editedFlight.date, editedFlight.start_time),
          scheduled_duration: editedFlight.duration,
          flight_type: editedFlight.type,
          status: editedFlight.status.toLowerCase(),
          student_id: editedFlight.student_id,
          instructor_id: editedFlight.instructor_id,
          plane_id: editedFlight.plane_id
        }),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to update flight: ${response.status}`)
      }

      setFlights(flights.map(flight => 
        flight._id === editedFlight._id ? editedFlight : flight
      ))
      setSelectedFlight(editedFlight)
      setIsEditing(false)
      setShowWarning(false)
      
      toast.success("Flight updated successfully")
    } catch (err) {
      console.error("Error updating flight:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update flight")
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedFlight(null)
    setShowWarning(false)
  }

  const handleDeleteFlight = async () => {
    if (!selectedFlight) return

    try {
      setIsDeleting(true)
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token || !apiKey) {
        toast.error("Missing authentication credentials")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/flight_schedule/${selectedFlight._id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete flight: ${response.status}`)
      }

      setFlights(flights.filter(flight => flight._id !== selectedFlight._id))
      setSelectedFlight(null)
      setIsEditing(false)
      setEditedFlight(null)
      setShowWarning(false)
      
      toast.success("Flight deleted successfully")
    } catch (err) {
      console.error("Error deleting flight:", err)
      toast.error(err instanceof Error ? err.message : "Failed to delete flight")
    } finally {
      setIsDeleting(false)
    }
  }

  // Date and time filtering is now handled through the main filters system

  if (error) {
    return (
      <div className={`w-full h-full ${className}`}>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Flight Log</CardTitle>
            <CardDescription>Error loading flight data</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="text-center text-destructive">{error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <div className={`h-full ${selectedFlight ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}`}>
        {/* Main Table */}
        <div className="h-full">
          {showWarning && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Editing in progress</AlertTitle>
              <AlertDescription>
                You are currently editing a flight. Please save or cancel your changes before selecting another flight.
              </AlertDescription>
            </Alert>
          )}



          <ReusableTable
            data={flights}
            columns={columns}
            loading={initialLoading}
            filterLoading={filterLoading}
            error={error}
            searchConfig={{
              enabled: true,
              placeholder: "Search flights...",
              searchFields: ['student_name', 'plane_reg', 'instructor', 'type', 'status'],
              serverSide: true,
              debounceMs: 500
            }}
            filters={filterConfigs}
            pagination={paginationConfig}
            serverSide={serverSideConfig}
            onRowClick={handleRowClick}
            emptyState={{
              title: 'No flights found',
              description: 'There are no flight logs to display at the moment.',
              searchTitle: 'No results found',
              searchDescription: 'No flights match your search criteria.'
            }}
          />
        </div>

        {/* Details Panel */}
        {selectedFlight && (
          <Card className="h-full">
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Flight Details</CardTitle>
                  <CardDescription className="text-sm">
                    {selectedFlight.plane_reg} • {formatDate(selectedFlight.date)} • {formatTime(selectedFlight.start_time)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Flight Log</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this flight log? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteFlight}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Flight
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={handleEditClick}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedFlight(null)}>
                        <X className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={editedFlight?.date || ''}
                        onChange={(e) => setEditedFlight(prev => prev ? {...prev, date: e.target.value} : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={editedFlight?.start_time || ''}
                        onChange={(e) => setEditedFlight(prev => prev ? {...prev, start_time: e.target.value} : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (hrs)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editedFlight?.duration || 0}
                        onChange={(e) => setEditedFlight(prev => prev ? {...prev, duration: parseFloat(e.target.value)} : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Input
                        value={editedFlight?.type || ''}
                        onChange={(e) => setEditedFlight(prev => prev ? {...prev, type: e.target.value} : null)}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Student</h4>
                      <p className="text-sm font-semibold">{selectedFlight.student_name}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Instructor</h4>
                      <p className="text-sm font-semibold">{selectedFlight.instructor}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Duration</h4>
                      <p className="text-sm font-semibold">{selectedFlight.duration} hrs</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                      <p className="text-sm font-semibold">{selectedFlight.type}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
