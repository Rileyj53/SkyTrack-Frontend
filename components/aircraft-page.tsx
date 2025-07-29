"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plane, Clock, Wrench, AlertTriangle, MoreHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNav } from "@/components/main-nav-new"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ReusableTable, TableColumn, FilterConfig, TableCellRenderers, PaginationConfig, ServerSideConfig } from "@/components/reusable-table"
import { StatsGrid, type StatConfig } from "@/components/StatsGrid"

interface HourlyRates {
  wet: number
  dry: number
  block: number
  instruction: number
  weekend: number
  solo: number
  checkride: number
}

interface SpecialRate {
  _id: string
  name: string
  discount: number
  description: string
}

interface Aircraft {
  id: string
  registration: string
  type: string
  model: string
  year: number
  engineHours: number
  lastMaintenance: string
  nextMaintenance: string
  status: string
  hourlyRates: HourlyRates
  specialRates: SpecialRate[]
  utilization: number
  location: string
  notes: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNextPage: boolean
  hasPrevPage: boolean
  limit: number
  uniqueLocations?: string[]
  uniqueTypes?: string[]
}

// Aircraft-specific statistics configuration
const AIRCRAFT_STATS_CONFIG: StatConfig[] = [
  // Overview Statistics
  {
    id: 'total_planes',
    title: 'Total Aircraft',
    icon: 'plane',
    enabled: true,
    order: 1,
    dataPath: 'overview.total_planes',
    format: 'number'
  },
  {
    id: 'active_planes',
    title: 'Active Aircraft',
    icon: 'plane',
    enabled: true,
    order: 2,
    dataPath: 'overview.active_planes',
    format: 'number'
  },
  {
    id: 'total_flight_hours',
    title: 'Total Flight Hours',
    icon: 'clock',
    enabled: true,
    order: 3,
    dataPath: 'overview.total_flight_hours',
    format: 'number',
    suffix: ' hrs'
  },
  {
    id: 'average_utilization_rate',
    title: 'Avg. Utilization',
    icon: 'chart',
    enabled: true,
    order: 4,
    dataPath: 'overview.average_utilization_rate',
    format: 'percentage',
    suffix: '%'
  },
  
  // Fleet Operations
  {
    id: 'total_flights',
    title: 'Total Flights',
    icon: 'plane',
    enabled: false,
    order: 5,
    dataPath: 'flight_operations.total_flights',
    format: 'number'
  },
  {
    id: 'completed_flights',
    title: 'Completed Flights',
    icon: 'plane',
    enabled: false,
    order: 6,
    dataPath: 'flight_operations.completed_flights',
    format: 'number'
  },
  {
    id: 'average_on_time_rate',
    title: 'On-Time Rate',
    icon: 'chart',
    enabled: false,
    order: 7,
    dataPath: 'overview.average_on_time_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'average_completion_rate',
    title: 'Completion Rate',
    icon: 'chart',
    enabled: false,
    order: 8,
    dataPath: 'flight_operations.average_completion_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'inactive_planes',
    title: 'Inactive Aircraft',
    icon: 'plane',
    enabled: false,
    order: 9,
    dataPath: 'overview.inactive_planes',
    format: 'number'
  },
  
  // Status Breakdown
  {
    id: 'available_planes',
    title: 'Available Aircraft',
    icon: 'plane',
    enabled: false,
    order: 10,
    dataPath: 'plane_status_breakdown[0].count',
    format: 'number'
  },
  
  // Efficiency Metrics
  {
    id: 'average_efficiency',
    title: 'Avg. Efficiency',
    icon: 'chart',
    enabled: false,
    order: 11,
    dataPath: 'operational_efficiency.efficiency_insights.average_efficiency',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'high_efficiency_count',
    title: 'High Efficiency AC',
    icon: 'chart',
    enabled: false,
    order: 12,
    dataPath: 'operational_efficiency.efficiency_insights.high_efficiency_count',
    format: 'number'
  },
  {
    id: 'low_efficiency_count',
    title: 'Low Efficiency AC',
    icon: 'chart',
    enabled: false,
    order: 13,
    dataPath: 'operational_efficiency.efficiency_insights.low_efficiency_count',
    format: 'number'
  },
  
  // Age Analysis
  {
    id: 'avg_fleet_age',
    title: 'Avg. Fleet Age',
    icon: 'calendar',
    enabled: false,
    order: 14,
    dataPath: 'aircraft_age_analysis.age_categories[0].avgAge',
    format: 'number',
    suffix: ' yrs'
  },
  
  // Schedule Adherence
  {
    id: 'average_on_time_rate_schedule',
    title: 'Schedule Adherence',
    icon: 'calendar',
    enabled: false,
    order: 15,
    dataPath: 'schedule_adherence.average_on_time_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'avg_delay_minutes',
    title: 'Avg. Delay',
    icon: 'clock',
    enabled: false,
    order: 16,
    dataPath: 'schedule_adherence.adherence_by_plane[0].avgDelayMinutes',
    format: 'number',
    suffix: ' min'
  },
  
  // Type breakdown
  {
    id: 'cessna_172_count',
    title: 'Cessna 172 Count',
    icon: 'plane',
    enabled: false,
    order: 17,
    dataPath: 'plane_type_breakdown[0].count',
    format: 'number'
  },
  
  // Financial metrics
  {
    id: 'total_revenue',
    title: 'Total Revenue',
    icon: 'coin',
    enabled: false,
    order: 18,
    dataPath: 'financial_metrics.total_revenue',
    format: 'currency',
    prefix: '$'
  },
  {
    id: 'avg_revenue_per_plane',
    title: 'Avg Revenue/Aircraft',
    icon: 'coin',
    enabled: false,
    order: 19,
    dataPath: 'financial_metrics.average_revenue_per_plane',
    format: 'currency',
    prefix: '$'
  }
];

export function AircraftPage() {
  const router = useRouter()
  
  // State for aircraft and pagination
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
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
    type: "all",
    location: "all"
  })
  
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  // State for filter options from API
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([])
  const [uniqueTypes, setUniqueTypes] = useState<string[]>([])
  
  // Add state for aircraft stats
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

  // Fetch aircraft data
  const fetchAircraft = useCallback(async (
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
    console.log(`📊 [${callId}] Current state:`, { currentPage, pageSize, searchQuery, filters, isAuthenticated })

    const actualPage = page ?? currentPage
    const actualLimit = limit ?? pageSize
    const actualSearch = search ?? searchQuery
    const actualFilters = filterParams ?? filters
    
    console.log(`🔍 [${callId}] Using actual values:`, { actualPage, actualLimit, actualSearch, actualFilters })

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

      const url = `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/planes?${queryParams.toString()}`

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
        throw new Error(`Failed to fetch aircraft: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setAircraft(data.data?.planes || [])
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
          setUniqueLocations(data.data.pagination.uniqueLocations || [])
          setUniqueTypes(data.data.pagination.uniqueTypes || [])
        }
        
        setError(null)
      } else {
        throw new Error(data.message || 'Failed to fetch aircraft')
      }
    } catch (err) {
      console.error('Error fetching aircraft:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch aircraft'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
      console.log(`✅ [${callId}] API call completed`)
    }
  }, [isAuthenticated, currentPage, pageSize, searchQuery, filters])

  // Fetch aircraft stats
  const fetchStats = useCallback(async () => {
    try {
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!organizationId || !token) {
        throw new Error("Organization ID or authentication token not found")
      }

      const url = `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/planes/stats?include_financials=true&include_maintenance=true`

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

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated && !initialLoadRef.current) {
      initialLoadRef.current = true
      fetchAircraft()
      fetchStats() // Add stats fetch
    }
  }, [isAuthenticated, fetchAircraft, fetchStats])

  // Memoized callback functions
  const handlePageChange = useCallback((page: number) => {
    console.log('📄 Page change triggered:', page, 'at', new Date().toISOString())
    setCurrentPage(page)
    fetchAircraft(page, pageSize, searchQuery, filters)
  }, [fetchAircraft, pageSize, searchQuery, filters])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    console.log('📏 Page size change triggered:', newPageSize, 'at', new Date().toISOString())
    setPageSize(newPageSize)
    setCurrentPage(1)
    fetchAircraft(1, newPageSize, searchQuery, filters)
  }, [fetchAircraft, searchQuery, filters])

  const handleFiltersChange = useCallback((newFilters: Record<string, string>) => {
    console.log('🔧 Filter change triggered:', newFilters, 'at', new Date().toISOString())
    setFilters(newFilters)
    setCurrentPage(1)
    fetchAircraft(1, pageSize, searchQuery, newFilters)
  }, [fetchAircraft, pageSize, searchQuery])

  const handleSearchChange = useCallback((query: string) => {
    console.log('🔍 Search change triggered:', query, 'at', new Date().toISOString())
    setSearchQuery(query)
    setCurrentPage(1)
    fetchAircraft(1, pageSize, query, filters)
  }, [fetchAircraft, pageSize, filters])

  // Get unique values for filters
  const uniqueStatuses = [...new Set(aircraft.map(a => a.status))]

  // Table configuration
  const columns: TableColumn<Aircraft>[] = [
    {
      key: 'registration',
      header: 'Registration',
      width: '15%',
      render: (aircraft) => (
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary flex-shrink-0" strokeWidth={2.5} />
          <span className="font-mono text-sm font-medium">{aircraft.registration}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type/Model',
      width: '20%',
      render: (aircraft) => (
        <div>
          <div className="font-medium">{aircraft.type}</div>
          <div className="text-xs text-muted-foreground">{aircraft.model}</div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (aircraft) => (
        <Badge
          variant="outline"
          className={`${
            aircraft.status === "Available"
              ? "bg-green-500/10 text-green-700 border-green-500/20"
              : aircraft.status === "Maintenance"
                ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
                : "bg-red-500/10 text-red-700 border-red-500/20"
          }`}
        >
          {aircraft.status}
        </Badge>
      )
    },
    {
      key: 'engineHours',
      header: 'Engine Hours',
      width: '12%',
      render: (aircraft) => (
        <TableCellRenderers.MonospaceText value={`${aircraft.engineHours} hrs`} />
      )
    },
    {
      key: 'location',
      header: 'Location',
      width: '15%',
      render: (aircraft) => (
        <span className="text-sm">{aircraft.location}</span>
      )
    },
    {
      key: 'utilization',
      header: 'Utilization',
      width: '15%',
      render: (aircraft) => (
        <div className="flex items-center gap-2">
          <Progress value={aircraft.utilization} className="w-[60px] h-2" />
          <span className="text-xs font-medium">{aircraft.utilization}%</span>
        </div>
      )
    },
    {
      key: 'nextMaintenance',
      header: 'Next Maintenance',
      width: '15%',
      render: (aircraft) => (
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {aircraft.nextMaintenance ? new Date(aircraft.nextMaintenance).toLocaleDateString() : 'N/A'}
          </span>
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
        { value: 'Available', label: 'Available' },
        { value: 'Maintenance', label: 'Maintenance' },
        { value: 'Out of Service', label: 'Out of Service' }
      ],
      defaultValue: 'all',
      serverSide: true
    },
    {
      key: 'type',
      label: 'Aircraft Type',
      type: 'select',
      options: [
        { value: 'all', label: 'All Types' },
        ...uniqueTypes.map(type => ({ value: type, label: type }))
      ],
      defaultValue: 'all',
      serverSide: true
    },
    {
      key: 'location',
      label: 'Location',
      type: 'select',
      options: [
        { value: 'all', label: 'All Locations' },
        ...uniqueLocations.map(location => ({ value: location, label: location }))
      ],
      defaultValue: 'all',
      serverSide: true
    }
  ], [uniqueTypes, uniqueLocations])

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

  const handleRowClick = (aircraft: Aircraft) => {
    // Navigate to aircraft details page or open details modal
    console.log('Aircraft clicked:', aircraft.registration)
    // router.push(`/aircraft/${aircraft.id}`)
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
            <h1 className="text-3xl font-bold tracking-tight">Aircraft</h1>
            </div>

            {/* Aircraft Statistics with StatsGrid */}
            <StatsGrid 
              title="Fleet Statistics"
              storageKey="skytrack-aircraft-stats-preferences"
              defaultConfigs={AIRCRAFT_STATS_CONFIG}
              apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/organizations/${typeof window !== 'undefined' ? (localStorage.getItem("organizationId") || localStorage.getItem("schoolId")) : ''}/planes/stats?include_financials=true&include_maintenance=true`}
              dataPath="data.stats"
              useEnhancedModal={true}
              rawData={statsData}
            />

            {/* Reusable Table */}
            <ReusableTable
              data={aircraft}
              columns={columns}
              loading={loading}
              error={error}
              searchConfig={{
                enabled: true,
                placeholder: "Search aircraft...",
                searchFields: ['registration', 'type', 'model', 'location', 'status'],
                serverSide: true,
                debounceMs: 500
              }}
              filters={filterConfigs}
              pagination={paginationConfig}
              serverSide={serverSideConfig}
              onRowClick={handleRowClick}
              emptyState={{
                title: 'No aircraft found',
                description: 'There are no aircraft in the fleet.',
                searchTitle: 'No aircraft match your search',
                searchDescription: 'Try adjusting your search terms or filters.'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
