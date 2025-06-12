"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Plane, User, ArrowLeft } from "lucide-react"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

interface FlightLogOverviewProps {
  className?: string
}

export default function FlightLogOverview({ className }: FlightLogOverviewProps) {
  const router = useRouter()
  const [flights, setFlights] = useState<FlightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<FlightLog | null>(null)

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch (err) {
      return time // Return original time if parsing fails
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch (err) {
      return dateString // Return original date if parsing fails
    }
  }

  // Helper function to capitalize status for display
  const capitalizeStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  const fetchFlightLogs = async () => {
    try {
      setLoading(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token) {
        setError("School ID or authentication token not found")
        setLoading(false)
        return
      }

      if (!apiKey) {
        setError("API key is not configured")
        setLoading(false)
        return
      }

      // Get today's date range in UTC to ensure we capture all flights for today in local timezone
      const today = new Date()
      const startOfDay = new Date(today)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)
      
      const startDateUTC = startOfDay.toISOString().split('T')[0]
      const endDateUTC = endOfDay.toISOString().split('T')[0]
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule?start_date=${startDateUTC}&end_date=${endDateUTC}`
      
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
        throw new Error(`Failed to fetch flight logs: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Flight logs data:', data)
      
      if (data.schedules && Array.isArray(data.schedules)) {
        // Transform the schedule data to match our FlightLog interface
        const transformedFlights: FlightLog[] = data.schedules.map((schedule: any) => {
          // Parse UTC time and convert to local time for display
          const utcDateTime = schedule.scheduled_start_time ? new Date(schedule.scheduled_start_time) : null
          
          return {
            _id: schedule._id,
            date: utcDateTime ? utcDateTime.toLocaleDateString('en-CA') : '', // YYYY-MM-DD format in local time
            start_time: utcDateTime ? 
              utcDateTime.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
              }) : '',
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
            school_id: schedule.school_id?._id || schoolId,
            created_at: schedule.created_at || '',
            updated_at: schedule.updated_at || ''
          }
        })
        
        // Filter flights to only show today's flights in local timezone
        const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format
        const todaysFlights = transformedFlights.filter(flight => flight.date === todayStr)
        
        setFlights(todaysFlights)
      } else {
        setError("Invalid data format received from API")
      }
    } catch (err) {
      console.error("Error fetching flight logs:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlightLogs()
  }, [])

  const handleViewAllFlights = () => {
    // Navigate to the flight log page
    router.push('/flight-log')
  }

  const handleViewDetails = (flight: FlightLog) => {
    setSelectedFlight(flight)
  }

  const handleBackToList = () => {
    setSelectedFlight(null)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Today's Flights</CardTitle>
          <CardDescription>Loading flight data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">Loading flight logs...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Today's Flights</CardTitle>
          <CardDescription>Error loading flight data</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (selectedFlight) {
    return (
      <Card className={className}>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBackToList}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-2xl">Flight Details</CardTitle>
              <CardDescription className="text-base">
                {selectedFlight.plane_reg} • {formatDate(selectedFlight.date)} • {formatTime(selectedFlight.start_time)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                <h3 className="text-sm font-medium text-muted-foreground">Flight Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground">Start Time</h4>
                    <p className="text-sm font-medium">{formatTime(selectedFlight.start_time)}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground">Duration</h4>
                    <p className="text-sm font-medium">{selectedFlight.duration} hours</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground">Type</h4>
                    <p className="text-sm font-medium">{selectedFlight.type}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                <h3 className="text-sm font-medium text-muted-foreground">Participants</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Student</h4>
                      <p className="text-sm font-medium">{selectedFlight.student_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Instructor</h4>
                      <p className="text-sm font-medium">{selectedFlight.instructor}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                <h3 className="text-sm font-medium text-muted-foreground">Aircraft</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Plane className="h-4 w-4 text-primary" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Registration</h4>
                    <p className="text-sm font-medium">{selectedFlight.plane_reg}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 p-4 rounded-lg bg-muted/30">
                <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                <Badge
                  variant={selectedFlight.status === "Completed" ? "default" : "secondary"}
                  className={`text-sm px-3 py-1 text-black border ${
                    selectedFlight.status === "Completed" 
                      ? "bg-[#b3c6ff] border-[#809fff]" 
                      : selectedFlight.status === "In-progress"
                        ? "bg-[#c2f0c2] border-[#99e699]"
                        : selectedFlight.status === "Preparing"
                          ? "bg-[#fbfbb6] border-[#f9f986]"
                        : selectedFlight.status === "Scheduled"
                          ? "bg-[#f0b3ff] border-[#e580ff]"
                        : selectedFlight.status === "Cancelled" || selectedFlight.status === "Canceled"
                          ? "bg-[#fc9c9c] border-[#fb6a6a]"
                          : "bg-[#f0b3ff] border-[#e580ff]"
                  }`}
                >
                  {selectedFlight.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show only the next 4 flights
  const displayedFlights = flights
    .sort((a, b) => {
      // Define status priority
      const getStatusPriority = (status: string) => {
        if (status === "Preparing" || status === "In Flight") return 0;
        if (status === "Scheduled") return 1;
        if (status === "Completed") return 2;
        return 3; // Any other status
      };
      
      // Sort by status priority
      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same priority, sort by start time
      return a.start_time.localeCompare(b.start_time);
    })
    .slice(0, 4);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Today's Flights</CardTitle>
        <CardDescription>Overview of upcoming flights</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Aircraft</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedFlights.length > 0 ? (
              displayedFlights.map((flight) => (
                <TableRow 
                  key={flight._id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleViewDetails(flight)}
                >
                  <TableCell>{formatTime(flight.start_time)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Plane className="h-5 w-5 text-primary" strokeWidth={2.5} />
                      {flight.plane_reg}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {flight.student_name}
                    </div>
                  </TableCell>
                  <TableCell>{flight.duration} hrs</TableCell>
                  <TableCell>
                    <Badge
                      variant={flight.status === "Completed" ? "default" : "secondary"}
                      className={`text-black border ${
                        flight.status === "Completed" 
                          ? "bg-[#b3c6ff] border-[#809fff]" 
                          : flight.status === "In-progress"
                            ? "bg-[#c2f0c2] border-[#99e699]"
                            : flight.status === "Preparing"
                              ? "bg-[#fbfbb6] border-[#f9f986]"
                            : flight.status === "Scheduled"
                              ? "bg-[#f0b3ff] border-[#e580ff]"
                            : flight.status === "Cancelled" || flight.status === "Canceled"
                              ? "bg-[#fc9c9c] border-[#fb6a6a]"
                              : "bg-[#f0b3ff] border-[#e580ff]"
                      }`}
                    >
                      {flight.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{flight.type}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-4 py-6">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/20">
                      <Plane className="h-8 w-8 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No flights scheduled today</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        All aircraft are grounded today. Check back tomorrow for upcoming flight schedules.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleViewAllFlights}
                      className="mt-2"
                    >
                      View All Flights
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
        {displayedFlights.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleViewAllFlights}>
              View All Flights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 