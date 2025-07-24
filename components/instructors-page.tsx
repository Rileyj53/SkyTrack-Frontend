"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Clock, Edit2, Save, User, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MainNav } from "@/components/main-nav-new"
import { ReusableTable, TableColumn, FilterConfig, PaginationConfig, ServerSideConfig } from "@/components/reusable-table"
import { StatsGrid, type StatConfig } from "@/components/StatsGrid"

// Instructor-specific statistics configuration
const INSTRUCTOR_STATS_CONFIG: StatConfig[] = [
  // Overview Statistics
  {
    id: 'total_instructors',
    title: 'Total Instructors',
    icon: 'user',
    enabled: true,
    order: 1,
    dataPath: 'overview.total_instructors',
    format: 'number'
  },
  {
    id: 'active_instructors',
    title: 'Active Instructors',
    icon: 'user',
    enabled: true,
    order: 2,
    dataPath: 'overview.active_instructors',
    format: 'number'
  },
  {
    id: 'average_utilization',
    title: 'Average Utilization',
    icon: 'chart',
    enabled: true,
    order: 3,
    dataPath: 'overview.average_utilization',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'avg_primary_rate',
    title: 'Avg Hourly Rate',
    icon: 'coin',
    enabled: true,
    order: 4,
    dataPath: 'hourly_rate_analysis.avgPrimaryRate',
    format: 'currency',
    prefix: '$'
  },
  
  // Additional metrics
  {
    id: 'total_teaching_hours',
    title: 'Teaching Hours',
    icon: 'clock',
    enabled: false,
    order: 5,
    dataPath: 'overview.total_teaching_hours',
    format: 'number',
    suffix: ' hrs'
  },
  {
    id: 'total_flight_hours',
    title: 'Flight Hours',
    icon: 'plane',
    enabled: false,
    order: 6,
    dataPath: 'overview.total_flight_hours',
    format: 'number',
    suffix: ' hrs'
  },
  {
    id: 'avg_students_per_instructor',
    title: 'Students/Instructor',
    icon: 'user',
    enabled: false,
    order: 7,
    dataPath: 'overview.average_students_per_instructor',
    format: 'number'
  },
  {
    id: 'new_instructors_period',
    title: 'New Instructors',
    icon: 'user',
    enabled: false,
    order: 8,
    dataPath: 'overview.new_instructors_period',
    format: 'number'
  },
  
  // Flight activity
  {
    id: 'total_flights_period',
    title: 'Total Flights',
    icon: 'plane',
    enabled: false,
    order: 9,
    dataPath: 'flight_activity.total_flights_period',
    format: 'number'
  },
  {
    id: 'completed_flights_period',
    title: 'Completed Flights',
    icon: 'plane',
    enabled: false,
    order: 10,
    dataPath: 'flight_activity.completed_flights_period',
    format: 'number'
  },
  {
    id: 'total_hours_period',
    title: 'Recent Flight Hours',
    icon: 'clock',
    enabled: false,
    order: 11,
    dataPath: 'flight_activity.total_hours_period',
    format: 'number',
    suffix: ' hrs'
  },
  
  // Performance metrics
  {
    id: 'overall_on_time_rate',
    title: 'On-Time Rate',
    icon: 'chart',
    enabled: false,
    order: 12,
    dataPath: 'performance_metrics.overall_on_time_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'avg_flights_per_instructor',
    title: 'Flights/Instructor',
    icon: 'chart',
    enabled: false,
    order: 13,
    dataPath: 'performance_metrics.avg_flights_per_instructor',
    format: 'number'
  },
  
  // Efficiency metrics
  {
    id: 'average_efficiency_ratio',
    title: 'Efficiency Ratio',
    icon: 'chart',
    enabled: false,
    order: 14,
    dataPath: 'efficiency_metrics.average_efficiency_ratio',
    format: 'number'
  },
  {
    id: 'average_workload_score',
    title: 'Avg Workload Score',
    icon: 'chart',
    enabled: false,
    order: 15,
    dataPath: 'workload_analysis.average_workload_score',
    format: 'number'
  },
  
  // Certification breakdown
  {
    id: 'cfi_count',
    title: 'CFI Count',
    icon: 'user',
    enabled: false,
    order: 16,
    dataPath: 'certification_breakdown.cfi',
    format: 'number'
  },
  {
    id: 'cfii_count',
    title: 'CFII Count',
    icon: 'user',
    enabled: false,
    order: 17,
    dataPath: 'certification_breakdown.cfii',
    format: 'number'
  },
  {
    id: 'mei_count',
    title: 'MEI Count',
    icon: 'user',
    enabled: false,
    order: 18,
    dataPath: 'certification_breakdown.mei',
    format: 'number'
  },
  
  // Hourly rates
  {
    id: 'avg_instrument_rate',
    title: 'Avg Instrument Rate',
    icon: 'coin',
    enabled: false,
    order: 19,
    dataPath: 'hourly_rate_analysis.avgInstrumentRate',
    format: 'currency',
    prefix: '$'
  },
  {
    id: 'avg_advanced_rate',
    title: 'Avg Advanced Rate',
    icon: 'coin',
    enabled: false,
    order: 20,
    dataPath: 'hourly_rate_analysis.avgAdvancedRate',
    format: 'currency',
    prefix: '$'
  },
  {
    id: 'avg_multi_engine_rate',
    title: 'Avg Multi-Engine Rate',
    icon: 'coin',
    enabled: false,
    order: 21,
    dataPath: 'hourly_rate_analysis.avgMultiEngineRate',
    format: 'currency',
    prefix: '$'
  }
];

interface HourlyRates {
  primary: number
  instrument: number
  advanced: number
  multiEngine: number
}

interface EmergencyContact {
  name: string
  relationship: string
  phone: string
}

interface Instructor {
  id: string
  name: string
  email: string
  phone: string
  certifications: string[]
  ratings: string[]
  status: string
  hourlyRates: HourlyRates
  flightHours: number
  teachingHours: number
  availability: string
  students: number
  utilization: number
  specialties: string[]
  license_number: string
  emergency_contact: EmergencyContact
  availability_time: string
  notes: string
  documents: string[]
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  uniqueStatuses?: string[]
  uniqueCertifications?: string[]
}

export function InstructorsPage() {
  const router = useRouter()
  
  // State for instructors and pagination
  const [instructors, setInstructors] = useState<Instructor[]>([])
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
    certification: "all",
    availability: "all"
  })
  
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // State for filter options from API
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([])
  const [uniqueCertifications, setUniqueCertifications] = useState<string[]>([])
  const [uniqueAvailabilities, setUniqueAvailabilities] = useState<string[]>([])
  
  // Add state for instructor stats
  const [statsData, setStatsData] = useState<any>(null)
  
  // Ref to track if initial load has been done
  const initialLoadRef = useRef(false)
  
  // Ref to prevent multiple simultaneous API calls
  const isFetchingRef = useRef(false)
  
  // Ref to track API call ID for debugging
  const apiCallIdRef = useRef(0)

  // Check authentication
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
  }, [router])

  // Fetch instructors data
  const fetchInstructors = useCallback(async (
    page?: number,
    limit?: number,
    search?: string,
    filterParams?: Record<string, string>
  ) => {
    if (!isAuthenticated) return
    
    // Prevent multiple simultaneous API calls
    if (isFetchingRef.current) {
      console.log('🔄 Skipping API call - already fetching')
      return
    }
    
    isFetchingRef.current = true
    const callId = ++apiCallIdRef.current
    console.log(`🚀 [${callId}] Starting API call with params:`, { page, limit, search, filterParams })

    const actualPage = page ?? currentPage
    const actualLimit = limit ?? pageSize
    const actualSearch = search ?? searchQuery
    const actualFilters = filterParams ?? filters

    try {
      setLoading(true)
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token) {
        throw new Error("Organization ID or authentication token not found")
      }

      if (!apiKey) {
        throw new Error("API key is not configured")
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

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/instructors?${queryParams.toString()}`
      
      const response = await fetch(apiUrl, {
        method: 'GET',
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
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        })
        throw new Error(`Failed to fetch instructors: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Transform the API data to match our component's expected format
        const instructorsData = data.data?.instructors || data.instructors || []
        
        if (Array.isArray(instructorsData)) {
          const transformedInstructors = instructorsData.map((instructor: any) => ({
            id: instructor._id,
            name: `${instructor.user_id.first_name} ${instructor.user_id.last_name}`,
            email: instructor.user_id.email,
            phone: instructor.phone,
            certifications: instructor.certifications,
            ratings: instructor.ratings,
            status: instructor.status,
            hourlyRates: instructor.hourlyRates,
            flightHours: instructor.flightHours,
            teachingHours: instructor.teachingHours,
            availability: instructor.availability,
            students: instructor.students,
            utilization: instructor.utilization,
            specialties: instructor.specialties,
            license_number: instructor.license_number,
            emergency_contact: instructor.emergency_contact,
            availability_time: instructor.availability_time,
            notes: instructor.notes,
            documents: instructor.documents
          }))
          setInstructors(transformedInstructors)
        } else {
          setInstructors([])
        }
        
        setPagination(data.data?.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
          limit: actualLimit
        })
        
        // Extract filter options from pagination data
        if (data.data?.pagination) {
          setUniqueStatuses(data.data.pagination.uniqueStatuses || [])
          setUniqueCertifications(data.data.pagination.uniqueCertifications || [])
          setUniqueAvailabilities(data.data.pagination.uniqueAvailabilities || [])
        }
        
        setError(null)
      } else {
        throw new Error(data.message || 'Failed to fetch instructors')
      }
    } catch (err) {
      console.error("Error fetching instructors:", err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch instructors'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
      console.log(`✅ [${callId}] API call completed`)
    }
  }, [isAuthenticated, currentPage, pageSize, searchQuery, filters])

  // Fetch instructor stats
  const fetchStats = useCallback(async () => {
    try {
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token) {
        throw new Error("Organization ID or authentication token not found")
      }

      if (!apiKey) {
        throw new Error("API key is not configured")
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/instructors/stats?include_financials=true&include_workload=true&range=30`

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

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated && !initialLoadRef.current) {
      initialLoadRef.current = true
      fetchInstructors()
      fetchStats() // Add stats fetch
    }
  }, [isAuthenticated, fetchInstructors, fetchStats])

  // Memoized callback functions
  const handlePageChange = useCallback((page: number) => {
    console.log('📄 Page change triggered:', page, 'at', new Date().toISOString())
    setCurrentPage(page)
    fetchInstructors(page, pageSize, searchQuery, filters)
  }, [fetchInstructors, pageSize, searchQuery, filters])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    console.log('📏 Page size change triggered:', newPageSize, 'at', new Date().toISOString())
    setPageSize(newPageSize)
    setCurrentPage(1)
    fetchInstructors(1, newPageSize, searchQuery, filters)
  }, [fetchInstructors, searchQuery, filters])

  const handleFiltersChange = useCallback((newFilters: Record<string, string>) => {
    console.log('🔧 Filter change triggered:', newFilters, 'at', new Date().toISOString())
    setFilters(newFilters)
    setCurrentPage(1)
    fetchInstructors(1, pageSize, searchQuery, newFilters)
  }, [fetchInstructors, pageSize, searchQuery])

  const handleSearchChange = useCallback((query: string) => {
    console.log('🔍 Search change triggered:', query, 'at', new Date().toISOString())
    setSearchQuery(query)
    setCurrentPage(1)
    fetchInstructors(1, pageSize, query, filters)
  }, [fetchInstructors, pageSize, filters])

  // Table configuration
  const columns: TableColumn<Instructor>[] = [
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (instructor) => (
        <Badge 
          variant={instructor.status === "Active" ? "default" : "secondary"}
          className={`${
            instructor.status === "Active" 
              ? "bg-green-100 text-green-800" 
              : ""
          }`}
        >
          {instructor.status}
        </Badge>
      )
    },
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      render: (instructor) => (
        <div>
          <div className="font-medium">{instructor.name}</div>
          <div className="text-xs text-muted-foreground">{instructor.email}</div>
        </div>
      )
    },
    {
      key: 'certifications',
      header: 'Certifications',
      width: '20%',
      render: (instructor) => (
        <div className="flex flex-wrap gap-1">
          {instructor.certifications.map((cert: string) => (
            <Badge key={cert} variant="outline" className="text-xs">
              {cert}
            </Badge>
          ))}
        </div>
      )
    },
    {
      key: 'flightHours',
      header: 'Flight Hours',
      width: '15%',
      render: (instructor) => (
        <div>
          <div>{instructor.flightHours} hrs total</div>
          <div className="text-xs text-muted-foreground">{instructor.teachingHours} hrs teaching</div>
        </div>
      )
    },
    {
      key: 'hourlyRates',
      header: 'Hourly Rates',
      width: '20%',
      render: (instructor) => (
        <div className="space-y-1">
          <div className="text-xs">Primary: ${instructor.hourlyRates.primary.toFixed(2)}/hr</div>
          <div className="text-xs">
            Instrument: ${instructor.hourlyRates.instrument.toFixed(2)}/hr
          </div>
          <div className="text-xs">Advanced: ${instructor.hourlyRates.advanced.toFixed(2)}/hr</div>
          <div className="text-xs">
            Multi-Engine: ${instructor.hourlyRates.multiEngine.toFixed(2)}/hr
          </div>
        </div>
      )
    },
    {
      key: 'utilization',
      header: 'Utilization',
      width: '15%',
      render: (instructor) => (
        <div className="flex items-center gap-2">
          <Progress value={instructor.utilization} className="w-[60px]" />
          <span className="text-xs">{instructor.utilization}%</span>
        </div>
      )
    }
  ]

  // Filter configuration
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'all', label: 'All Statuses' },
        ...uniqueStatuses.map(status => ({ value: status, label: status }))
      ],
      defaultValue: 'all',
      serverSide: true
    },
    {
      key: 'certification',
      label: 'Certification',
      type: 'select',
      options: [
        { value: 'all', label: 'All Certifications' },
        ...uniqueCertifications.map(cert => ({ value: cert, label: cert.toUpperCase() }))
      ],
      defaultValue: 'all',
      serverSide: true
    },
    {
      key: 'availability',
      label: 'Availability',
      type: 'select',
      options: [
        { value: 'all', label: 'All Availabilities' },
        ...uniqueAvailabilities.map(availability => ({ value: availability, label: availability }))
      ],
      defaultValue: 'all',
      serverSide: true
    }
  ], [uniqueStatuses, uniqueCertifications, uniqueAvailabilities])

  // Pagination configuration
  const paginationConfig: PaginationConfig = {
    enabled: true,
    pageSize: pageSize,
    serverSide: true,
    showPageSizeSelector: true,
    pageSizeOptions: [5, 10, 25, 50]
  }

  // Server-side configuration
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

  const handleRowClick = (instructor: Instructor) => {
    // Navigate to instructor details page or open details modal
    console.log('Instructor clicked:', instructor.name)
    // router.push(`/instructors/${instructor.id}`)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <MainNav />
        </div>
        <div className="pt-20 pb-12 px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-destructive">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MainNav />
      </div>
      
      <div className="pt-20 pb-12 px-4">
        <div className="w-full">
          <div className="flex flex-col space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Flight Instructors</h1>
            </div>

            {/* Instructor Statistics with StatsGrid */}
            <StatsGrid 
              title="Instructor Statistics"
              storageKey="skytrack-instructor-stats-preferences"
              defaultConfigs={INSTRUCTOR_STATS_CONFIG}
              apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/organizations/${typeof window !== 'undefined' ? (localStorage.getItem("organizationId") || localStorage.getItem("schoolId")) : ''}/instructors/stats?include_financials=true&include_workload=true&range=30`}
              dataPath="data.stats"
              useEnhancedModal={true}
              rawData={statsData}
            />

            {/* Reusable Table */}
            <ReusableTable
              data={instructors}
              columns={columns}
              loading={loading}
              error={error}
              searchConfig={{
                enabled: true,
                placeholder: "Search instructors...",
                searchFields: ['name', 'email', 'phone', 'certifications', 'ratings', 'specialties'],
                serverSide: true,
                debounceMs: 500
              }}
              filters={filterConfigs}
              pagination={paginationConfig}
              serverSide={serverSideConfig}
              onRowClick={handleRowClick}
              emptyState={{
                title: 'No instructors found',
                description: 'There are no instructors in the system.',
                searchTitle: 'No instructors match your search',
                searchDescription: 'Try adjusting your search terms or filters.'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
