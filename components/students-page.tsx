"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import { Badge as UIBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNav } from "@/components/main-nav-new"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { ReusableTable, TableColumn, FilterConfig, TableCellRenderers, PaginationConfig, ServerSideConfig } from "@/components/reusable-table"
import { StatsGrid, type StatConfig } from "@/components/StatsGrid"
import { toast } from "sonner"

interface Student {
  _id: string
  organization_id: string
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
  enrollmentDate: string
  program: string
  status: string
  stage: string
  nextMilestone: string
  notes: string
  progress: {
    requirements: Array<{
      name: string
      total_hours: number
      completed_hours: number
      type: string
      _id: string
    }>
    milestones: Array<{
      name: string
      description: string
      order: number
      completed: boolean
      _id: string
    }>
    stages: Array<{
      name: string
      description: string
      order: number
      completed: boolean
      _id: string
    }>
    lastUpdated: string
  }
  studentNotes: any[]
  created_at: string
  updated_at: string
}

interface Program {
  _id: string
  program_name: string
  school_id: string
  requirements: Array<{
    name: string
    hours: number
    type: string
    _id: string
  }>
  milestones: Array<{
    name: string
    description: string
    order: number
    _id: string
  }>
  stages: Array<{
    name: string
    description: string
    order: number
    _id: string
  }>
  description: string
  duration: string
  cost: number
  created_at: string
  updated_at: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
}

// Student-specific statistics configuration with comprehensive coverage
const STUDENT_STATS_CONFIG: StatConfig[] = [
  // Overview Statistics
  {
    id: 'total_students',
    title: 'Total Students',
    icon: 'user',
    enabled: true,
    order: 1,
    dataPath: 'overview.total_students',
    format: 'number'
  },
  {
    id: 'active_students',
    title: 'Active Students',
    icon: 'user',
    enabled: true,
    order: 2,
    dataPath: 'overview.active_students',
    format: 'number'
  },
  {
    id: 'new_enrollments_period',
    title: 'New Enrollments',
    icon: 'user',
    enabled: true,
    order: 3,
    dataPath: 'overview.new_enrollments_period',
    format: 'number'
  },
  {
    id: 'graduated_students_period',
    title: 'Graduated This Period',
    icon: 'user',
    enabled: true,
    order: 4,
    dataPath: 'overview.graduated_students_period',
    format: 'number'
  },
  {
    id: 'completion_rate',
    title: 'Completion Rate',
    icon: 'chart',
    enabled: false,
    order: 5,
    dataPath: 'overview.completion_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'retention_rate',
    title: 'Retention Rate',
    icon: 'chart',
    enabled: false,
    order: 6,
    dataPath: 'overview.retention_rate',
    format: 'percentage',
    suffix: '%'
  },
  
  // Flight Activity
  {
    id: 'total_flights_period',
    title: 'Total Flights',
    icon: 'plane',
    enabled: false,
    order: 7,
    dataPath: 'flight_activity.total_flights_period',
    format: 'number'
  },
  {
    id: 'completed_flights_period',
    title: 'Completed Flights',
    icon: 'plane',
    enabled: false,
    order: 8,
    dataPath: 'flight_activity.completed_flights_period',
    format: 'number'
  },
  {
    id: 'total_hours_period',
    title: 'Total Flight Hours',
    icon: 'clock',
    enabled: false,
    order: 9,
    dataPath: 'flight_activity.total_hours_period',
    format: 'number',
    suffix: ' hrs'
  },
  
  // Performance Metrics
  {
    id: 'overall_on_time_rate',
    title: 'On-Time Rate',
    icon: 'chart',
    enabled: false,
    order: 10,
    dataPath: 'performance_metrics.overall_on_time_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'avg_flights_per_student',
    title: 'Avg Flights/Student',
    icon: 'chart',
    enabled: false,
    order: 11,
    dataPath: 'performance_metrics.avg_flights_per_student',
    format: 'number'
  },
  
  // Progress Tracking
  {
    id: 'overall_progress',
    title: 'Overall Progress',
    icon: 'chart',
    enabled: false,
    order: 12,
    dataPath: 'progress_tracking.overall_progress',
    format: 'percentage',
    suffix: '%'
  },
  
  // Certification Breakdown
  {
    id: 'private_certifications',
    title: 'Private Certifications',
    icon: 'user',
    enabled: false,
    order: 13,
    dataPath: 'certification_breakdown.private',
    format: 'number'
  },
  {
    id: 'instrument_certifications',
    title: 'Instrument Certifications',
    icon: 'user',
    enabled: false,
    order: 14,
    dataPath: 'certification_breakdown.instrument',
    format: 'number'
  }
];

const statusBadgeStyles: Record<string, React.CSSProperties> = {
  active: {
    background: '#c2f0c2',
    border: '2px solid #33cc33',
    color: '#111',
    fontWeight: 500,
  },
  graduated: {
    background: '#b3c6ff',
    border: '2px solid #3366ff',
    color: '#111',
    fontWeight: 500,
  },
  'on hold': {
    background: '#f0b3ff',
    border: '2px solid #cc00ff',
    color: '#111',
    fontWeight: 500,
  },
  discontinued: {
    background: '#fc9c9c',
    border: '2px solid #f90606',
    color: '#111',
    fontWeight: 500,
  },
  pending: {
    background: '#fbfbb6',
    border: '2px solid #f2f20d',
    color: '#111',
    fontWeight: 500,
  },
}

export function StudentsPage() {
  const router = useRouter()
  
  // State for students and pagination
  const [students, setStudents] = useState<Student[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  })
  
  // State for API parameters
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({
    status: "all",
    program: "all",
    stage: "all"
  })
  
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // Programs for the add student dialog
  const [programs, setPrograms] = useState<Program[]>([
    { 
      _id: 'default-1', 
      program_name: 'Private Pilot License',
      school_id: '',
      requirements: [],
      milestones: [],
      stages: [],
      description: 'Complete training program for obtaining a Private Pilot License',
      duration: '6 months',
      cost: 12000,
      created_at: '',
      updated_at: ''
    },
    { 
      _id: 'default-2', 
      program_name: 'Instrument Rating',
      school_id: '',
      requirements: [],
      milestones: [],
      stages: [],
      description: 'Comprehensive training program for obtaining an Instrument Rating',
      duration: '4 months',
      cost: 15000,
      created_at: '',
      updated_at: ''
    },
    { 
      _id: 'default-3', 
      program_name: 'Commercial Pilot License',
      school_id: '',
      requirements: [],
      milestones: [],
      stages: [],
      description: 'Advanced training program for obtaining a Commercial Pilot License',
      duration: '12 months',
      cost: 25000,
      created_at: '',
      updated_at: ''
    }
  ])
  
  // Add student dialog state
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [programsLoading, setProgramsLoading] = useState(false)
  const [newStudent, setNewStudent] = useState({
    contact_email: "",
    program: ""
  })
  const [statsData, setStatsData] = useState<any>(null)

  // Memoized fetch functions to prevent dependency loops
  const fetchStudents = useCallback(async (
    page?: number,
    limit?: number,
    search?: string,
    filterParams?: Record<string, string>
  ) => {
    if (!isAuthenticated) return

    // Use passed parameters or current state
    const actualPage = page ?? currentPage
    const actualLimit = limit ?? pageSize
    const actualSearch = search ?? searchQuery
    const actualFilters = filterParams ?? filters

    try {
      setLoading(true)
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!organizationId || !token) {
        throw new Error("Organization ID or authentication token not found")
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: actualPage.toString(),
        limit: actualLimit.toString()
      })

      if (actualSearch) {
        queryParams.append('search', actualSearch)
      }

      // Add server-side filters (only non-"all" values)
      Object.entries(actualFilters).forEach(([key, value]) => {
        if (value && value !== "all") {
          queryParams.append(key, value)
        }
      })

      const url = `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/students?${queryParams.toString()}`

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setStudents(data.data?.students || [])
        setPagination(data.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: actualLimit
        })
        setError(null)
      } else {
        throw new Error(data.message || 'Failed to fetch students')
      }
    } catch (err) {
      console.error('Error fetching students:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch students'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated]) // Only depend on isAuthenticated

  // Memoized fetch stats function
  const fetchStats = useCallback(async () => {
    try {
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!organizationId || !token) {
        throw new Error("Organization ID or authentication token not found")
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/students/stats?include_financials=true&include_progress=true&range=30`

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setStatsData(data.data?.stats || null)
      } else {
        throw new Error(data.message || 'Failed to fetch stats')
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [])

  // Memoized fetch programs function
  const fetchPrograms = useCallback(async () => {
    try {
      setProgramsLoading(true)
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!organizationId || !token) {
        return // Keep default programs
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/programs`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          credentials: 'include'
        }
      )

      if (response.ok) {
        const data = await response.json()
        const programsArray = Array.isArray(data) ? data : (data.data?.programs || data.programs || [])
        
        if (programsArray.length > 0) {
          setPrograms(programsArray)
        }
      }
    } catch (err) {
      console.error('Error fetching programs:', err)
    } finally {
      setProgramsLoading(false)
    }
  }, [])

  // Check authentication - run only once on mount
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
          throw new Error(`Authentication failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        
        // Store the organization ID in localStorage for other components to use
        if (data.data?.user && data.data.user.organizationId) {
          localStorage.setItem("organizationId", data.data.user.organizationId)
        } else if (data.data?.user && data.data.user.school_id) {
          localStorage.setItem("schoolId", data.data.user.school_id)
        } else if (data.user && data.user.organizationId) {
          localStorage.setItem("organizationId", data.user.organizationId)
        } else if (data.user && data.user.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
        }

        // Get user role from JWT token
        if (token) {
          try {
            const base64Url = token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
            const payload = JSON.parse(jsonPayload)
            setUserRole(payload.role)
          } catch (err) {
            console.error('Error decoding token:', err)
          }
        }

        setIsAuthenticated(true)
        setError(null)
      } catch (error) {
        console.error("Auth check failed:", error)
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
        setError(errorMessage)
        toast.error(errorMessage)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router]) // Only depend on router

  // Fetch initial data when authenticated - only once
  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents() // Use current state values
      fetchPrograms()
      fetchStats()
    }
  }, [isAuthenticated]) // ONLY depend on isAuthenticated

  // Helper function to calculate progress percentage
  const calculateProgress = useCallback((student: Student): number => {
    if (!student.progress?.requirements?.length) return 0
    
    const totalFlightTime = student.progress.requirements.find(req => req.name === "Total Flight Time" || req.name === "Total Instrument Time")
    if (!totalFlightTime || totalFlightTime.total_hours === 0) return 0
    
    return Math.min(Math.round((totalFlightTime.completed_hours / totalFlightTime.total_hours) * 100), 100)
  }, [])

  // Helper function to calculate flight hours
  const calculateFlightHours = useCallback((student: Student): number => {
    if (!student.progress?.requirements?.length) return 0
    
    const totalHoursReq = student.progress.requirements.find(req => req.name === "Total Flight Time" || req.name === "Total Instrument Time")
    return totalHoursReq?.completed_hours || 0
  }, [])

  // Helper function to get current stage
  const getCurrentStage = useCallback((student: Student): string => {
    if (!student.progress?.stages?.length) {
      return student.stage || 'Not Set'
    }

    const sortedStages = [...student.progress.stages].sort((a, b) => a.order - b.order)
    let currentStage = sortedStages.find(stage => !stage.completed)
    
    if (!currentStage) {
      currentStage = sortedStages[sortedStages.length - 1]
    }
    
    return currentStage?.name || student.stage || 'Not Set'
  }, [])

  // Memoized callback functions to prevent recreation
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    fetchStudents(page, pageSize, searchQuery, filters)
  }, [fetchStudents, pageSize, searchQuery, filters])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
    fetchStudents(1, newPageSize, searchQuery, filters)
  }, [fetchStudents, searchQuery, filters])

  const handleFiltersChange = useCallback((newFilters: Record<string, string>) => {
    setFilters(newFilters)
    setCurrentPage(1)
    fetchStudents(1, pageSize, searchQuery, newFilters)
  }, [fetchStudents, pageSize, searchQuery])

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
    fetchStudents(1, pageSize, query, filters)
  }, [fetchStudents, pageSize, filters])

  // Handle add student
  const handleAddStudent = async () => {
    try {
      if (!newStudent.contact_email || !newStudent.program) {
        toast.error("Please fill in all required fields")
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newStudent.contact_email)) {
        toast.error("Please enter a valid email address")
        return
      }

      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!organizationId || !token) {
        throw new Error("Organization ID or authentication token not found")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/students/invite`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify({
            email: newStudent.contact_email,
            program: newStudent.program
          }),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to send student invitation')
      }

      await fetchStudents() // Refresh with current state
      setIsAddingStudent(false)
      setNewStudent({ contact_email: "", program: "" })
      toast.success("Student invitation sent successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send student invitation')
    }
  }

  // Table configuration
  const columns: TableColumn<Student>[] = [
    {
      key: 'student',
      header: 'Student',
      width: '20%',
      render: (student) => (
        <TableCellRenderers.Avatar 
          name={student.user_id ? `${student.user_id.first_name} ${student.user_id.last_name}` : undefined}
          email={student.user_id?.email || student.contact_email}
        />
      )
    },
    {
      key: 'license_number',
      header: 'License #',
      width: '10%',
      render: (student) => (
        <TableCellRenderers.MonospaceText value={student.license_number || 'N/A'} />
      )
    },
    {
      key: 'program',
      header: 'Program',
      width: '15%'
    },
    {
      key: 'stage',
      header: 'Stage', 
      width: '10%',
      render: (student) => (
        <UIBadge variant="outline">{getCurrentStage(student)}</UIBadge>
      )
    },
    {
      key: 'progress',
      header: 'Progress',
      width: '15%',
      align: 'center',
      render: (student) => (
        <TableCellRenderers.Progress value={calculateProgress(student)} />
      )
    },
    {
      key: 'flightHours',
      header: 'Flight Hours',
      width: '10%',
      align: 'center',
      render: (student) => (
        <TableCellRenderers.MonospaceText value={`${calculateFlightHours(student).toFixed(1)} hrs`} />
      )
    },
    {
      key: 'nextMilestone',
      header: 'Next Milestone',
      width: '15%'
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      align: 'center',
      render: (student) => (
        <UIBadge
          style={statusBadgeStyles[student.status.toLowerCase()] || statusBadgeStyles['pending']}
          variant="outline"
        >
          {student.status}
        </UIBadge>
      )
    }
  ]

  // Get unique values for filters
  const uniqueStatuses = [...new Set(students.map(s => s.status))]
  const uniquePrograms = [...new Set(students.map(s => s.program))]
  const uniqueStages = [...new Set(students.map(s => getCurrentStage(s)))]

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        { value: 'Active', label: 'Active' },
        { value: 'Graduated', label: 'Graduated' },
        { value: 'On Hold', label: 'On Hold' },
        { value: 'Discontinued', label: 'Discontinued' },
        { value: 'Pending', label: 'Pending' }
      ],
      defaultValue: 'all',
      serverSide: true
    },
    {
      key: 'program',
      label: 'Program',
      type: 'select',
      options: [
        { value: 'all', label: 'All Programs' },
        ...programs.map(p => ({ value: p.program_name, label: p.program_name }))
      ],
      defaultValue: 'all',
      serverSide: true
    },
    {
      key: 'stage',
      label: 'Stage',
      type: 'select',
      options: [
        { value: 'all', label: 'All Stages' },
        ...uniqueStages.map(stage => ({ value: stage, label: stage }))
      ],
      defaultValue: 'all',
      serverSide: false // Client-side filter for stages
    }
  ]

  // Pagination configuration
  const paginationConfig: PaginationConfig = {
    enabled: true,
    pageSize: pageSize,
    serverSide: true,
    showPageSizeSelector: true,
    pageSizeOptions: [5, 10, 25, 50]
  }

  // Memoized server-side configuration to prevent recreation
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

  const handleRowClick = (student: Student) => {
    router.push(`/students/${student._id}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MainNav />
      </div>
      
      <div className="pt-20 pb-12 px-4">
        <div className="w-full">
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Students</h1>
              </div>
              {(userRole === 'school_admin' || userRole === 'sys_admin') && (
                <Dialog open={isAddingStudent} onOpenChange={(open) => {
                  setIsAddingStudent(open)
                  if (open) {
                    fetchPrograms()
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button style={{ backgroundColor: '#3366ff', color: 'white' }} className="hover:opacity-90 transition-opacity">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Student</DialogTitle>
                      <DialogDescription>
                        Enter the student's email and program to create their account.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="student@example.com"
                          value={newStudent.contact_email}
                          onChange={(e) => setNewStudent({ ...newStudent, contact_email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="program">Program</Label>
                        <Select 
                          value={newStudent.program} 
                          onValueChange={(value) => setNewStudent({ ...newStudent, program: value })}
                          disabled={programsLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={programsLoading ? "Loading programs..." : "Select a program"} />
                          </SelectTrigger>
                          <SelectContent>
                            {programsLoading ? (
                              <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading programs...</div>
                            ) : (
                              programs.map((program) => (
                                <SelectItem key={program._id} value={program.program_name}>
                                  {program.program_name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddingStudent(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddStudent} style={{ backgroundColor: '#3366ff', color: 'white' }} className="hover:opacity-90 transition-opacity">
                        Add Student
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Student Statistics */}
            <StatsGrid 
              title="Student Statistics"
              storageKey="skytrack-student-stats-preferences"
              defaultConfigs={STUDENT_STATS_CONFIG}
              apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/organizations/${typeof window !== 'undefined' ? (localStorage.getItem("organizationId") || localStorage.getItem("schoolId")) : ''}/students/stats?include_financials=true&include_progress=true&range=30`}
              dataPath="data.stats"
              useEnhancedModal={true}
              rawData={statsData}
            />

            {/* Reusable Table */}
            <ReusableTable
              data={students}
              columns={columns}
              loading={loading}
              error={error}
              searchConfig={{
                enabled: true,
                placeholder: "Search students...",
                searchFields: ['user_id.first_name', 'user_id.last_name', 'user_id.email', 'contact_email', 'program', 'nextMilestone', 'license_number'],
                serverSide: true,
                debounceMs: 500
              }}
              filters={filterConfigs}
              pagination={paginationConfig}
              serverSide={serverSideConfig}
              onRowClick={handleRowClick}
              emptyState={{
                title: 'No students found',
                description: 'There are no students enrolled in any programs.',
                searchTitle: 'No students match your search',
                searchDescription: 'Try adjusting your search terms or filters.'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
