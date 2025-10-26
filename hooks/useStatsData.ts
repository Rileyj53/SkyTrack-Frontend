import { useState, useEffect, useCallback } from 'react'

export interface StatsData {
  overview: {
    organization_name: string
    total_students: number
    active_students: number
    total_instructors: number
    active_instructors: number
    total_planes: number
    active_planes: number
    upcoming_lessons: number
    upcoming_lessons_next_7_days: number
  }
  flight_operations: {
    total_flights_period: number
    completed_flights: number
    completion_rate: number
    recent_flights_7_days: number
    schedule_adherence_percentage: number
    avg_delay_minutes: number
    flight_status_breakdown: Array<{
      _id: string
      count: number
      totalScheduledDuration: number
      totalActualDuration: number
      avgScheduledDuration: number
      avgActualDuration: number | null
    }>
    flight_type_breakdown: Array<{
      _id: string
      count: number
      totalDuration: number
      avgDuration: number | null
    }>
    peak_operating_hours: Array<{
      _id: number
      count: number
      percentage: number
    }>
  }
  aircraft_efficiency: {
    plane_status_breakdown: Array<{
      _id: string
      count: number
    }>
    detailed_plane_stats: Array<{
      _id: string
      count: number
      totalHours: number
      avgUtilization: number | null
      avgHoursPerMonth: number | null
    }>
    maintenance_alerts: {
      count: number
      overdue_count: number
      upcoming_count: number
      alerts: any[]
    }
    recent_maintenance_activity: any[]
    maintenance_status_breakdown: any[]
    maintenance_types_breakdown: any[]
    aircraft_utilization: Array<{
      _id: string
      registration: string
      total_hours: number
      recentFlightsCount: number
      recentFlightHours: number
    }>
    average_utilization_rate: number
  }
  instructor_efficiency: {
    instructor_status_breakdown: Array<{
      _id: string
      count: number
      totalTeachingHours: number
      totalFlightHours: number
      avgUtilization: number
      totalStudents: number
    }>
    total_teaching_hours: number
    total_flight_hours: number
    average_utilization: number
    total_students_taught: number
    instructor_workload: Array<{
      _id: string
      contact_email: string
      teachingHours: number
      students: number
      utilization: number
      recentFlightsCount: number
    }>
    avg_students_per_instructor: number
  }
  student_metrics: {
    student_status_breakdown: Array<{
      _id: string
      count: number
    }>
    new_enrollments_period: number
    students_by_program: Array<{
      _id: string
      count: number
      active: number
    }>
  }
  operational_metrics: {
    total_scheduled_hours: number
    total_actual_hours: number
    average_flight_duration: number
    capacity_utilization: number
    efficiency_ratio: number
  }
  upcoming_schedule: {
    next_7_days: any[]
  }
}

export interface StatsResponse {
  success: boolean
  message: string
  data: {
    stats: StatsData
    metadata: {
      organization_id: string
      organization_name: string
      time_range_days: number
      start_date: string
      end_date: string
      includes_financials: boolean
      generated_at: string
      processing_time_ms: number
    }
  }
  auditId: string
  timestamp: string
}

export function useStatsData() {
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchStats = useCallback(async (forceRefresh = false) => {
    // Don't fetch if we recently fetched and it's not a forced refresh
    if (lastFetch && !forceRefresh) {
      const timeSinceLastFetch = Date.now() - lastFetch.getTime()
      if (timeSinceLastFetch < 60000) { // 1 minute cache
        return
      }
    }

    try {
      setLoading(true)
      setError(null)
      
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token) {
        throw new Error("Organization ID or authentication token not found")
      }

      if (!apiKey) {
        throw new Error("API key is not configured")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/stats`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          credentials: 'include'
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Stats API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`)
      }

      const responseData: StatsResponse = await response.json()
      
      if (!responseData.success) {
        throw new Error(responseData.message || 'Failed to fetch stats')
      }

      setStatsData(responseData.data.stats)
      setLastFetch(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching stats'
      setError(errorMessage)
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }, [lastFetch])

  // Auto-fetch on mount
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Helper function to get a specific stat value by path
  const getStatValue = useCallback((path: string): number | string | null => {
    if (!statsData) return null
    
    const keys = path.split('.')
    let current: any = { stats: statsData }
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return null
      }
    }
    
    return current
  }, [statsData])

  // Helper function to format stat values
  const formatStatValue = useCallback((value: number | string | null, format?: string, suffix?: string, prefix?: string): string => {
    if (value === null || value === undefined) return 'N/A'
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    
    if (isNaN(numValue)) return 'N/A'
    
    let formatted = ''
    
    switch (format) {
      case 'percentage':
        formatted = numValue.toFixed(1)
        break
      case 'currency':
        formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(numValue)
        break
      case 'duration':
        formatted = numValue.toFixed(0)
        break
      case 'number':
      default:
        formatted = new Intl.NumberFormat('en-US').format(numValue)
        break
    }
    
    return `${prefix || ''}${formatted}${suffix || ''}`
  }, [])

  return {
    statsData,
    loading,
    error,
    lastFetch,
    fetchStats,
    getStatValue,
    formatStatValue
  }
} 