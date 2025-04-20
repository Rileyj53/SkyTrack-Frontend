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

  const fetchFlightLogs = async () => {
    try {
      setLoading(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.API_KEY
      
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

      const apiUrl = `${process.env.API_URL}/schools/${schoolId}/flight-logs/today`
      
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
      
      if (data.flightLogs && Array.isArray(data.flightLogs)) {
        setFlights(data.flightLogs)
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
                  className={`text-sm px-3 py-1 ${
                    selectedFlight.status === "Completed" 
                      ? "bg-green-500/80 hover:bg-green-500/90" 
                      : selectedFlight.status === "In Flight"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : selectedFlight.status === "Preparing"
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                        : selectedFlight.status === "Scheduled"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                        : selectedFlight.status === "Canceled"
                          ? "bg-red-100 text-red-800 hover:bg-red-200"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
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
                      className={`${
                        flight.status === "Completed" 
                          ? "bg-green-500/80 hover:bg-green-500/90" 
                          : flight.status === "In Flight"
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : flight.status === "Preparing"
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            : flight.status === "Scheduled"
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            : flight.status === "Canceled"
                              ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
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
                <TableCell colSpan={7} className="text-center py-4">
                  No flights found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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