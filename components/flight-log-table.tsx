"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, Plane, User, ArrowLeft, X, Pencil, Save, AlertTriangle, ArrowUpDown, Filter, ChevronDown, ChevronUp, Check, ChevronsUpDown, Search, HelpCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { TimePicker } from "@/components/ui/time-picker"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

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
  _id: string
  registration: string
  type: string
  aircraftModel: string
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

export default function FlightLogTable({ className }: FlightLogTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [flights, setFlights] = useState<FlightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<FlightLog | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  })
  const [startTime, setStartTime] = useState<string | null>(null)
  const [endTime, setEndTime] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedFlight, setEditedFlight] = useState<FlightLog | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loadingInstructors, setLoadingInstructors] = useState(false)
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [loadingAircraft, setLoadingAircraft] = useState(false)
  
  // Filter state
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedAircraft, setSelectedAircraft] = useState<string>("all")
  const [selectedInstructor, setSelectedInstructor] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<string>("all")
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Handle end date validation
  const handleEndDateChange = (date: Date | null) => {
    if (date && selectedDate && date < selectedDate) {
      // If end date is before start date, reset it
      toast.error("End date cannot be before start date")
      setSelectedEndDate(null)
    } else {
      setSelectedEndDate(date)
    }
  }

  // Handle start date validation
  const handleStartDateChange = (date: Date | null) => {
    setSelectedDate(date)
    // If there's an existing end date and it's now before the new start date, reset end date
    if (date && selectedEndDate && selectedEndDate < date) {
      setSelectedEndDate(null)
      toast.info("End date reset because it was before the new start date")
    }
  }
  
  // Combobox open states
  const [aircraftOpen, setAircraftOpen] = useState(false)
  const [instructorOpen, setInstructorOpen] = useState(false)
  const [studentOpen, setStudentOpen] = useState(false)
  
  // Search help tooltip state
  const [searchHelpOpen, setSearchHelpOpen] = useState(false)
  
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);

  const formatDate = (dateString: string) => {
    try {
      // Extract just the date part (YYYY-MM-DD) from the ISO string
      const datePart = dateString.split('T')[0]
      const [year, month, day] = datePart.split('-')
      
      // Return in MM/DD/YYYY format
      return `${month}/${day}/${year}`
    } catch (err) {
      console.error('Error formatting date:', err)
      return dateString // Return original date if parsing fails
    }
  }

  const formatDateForAPI = (date: Date | null) => {
    if (!date) return null
    // Convert local date to UTC to ensure we get the full day range
    // When user selects a date, we want all flights for that date in their timezone
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get UTC date range for a local date to ensure we capture all flights for that day
  const getUTCDateRange = (localDate: Date | null) => {
    if (!localDate) return { startDate: null, endDate: null }
    
    // Start of day in local timezone
    const startOfDay = new Date(localDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    // End of day in local timezone  
    const endOfDay = new Date(localDate)
    endOfDay.setHours(23, 59, 59, 999)
    
    // Convert to UTC ISO strings and extract date parts
    const startDateUTC = startOfDay.toISOString().split('T')[0]
    const endDateUTC = endOfDay.toISOString().split('T')[0]
    
    return { startDate: startDateUTC, endDate: endDateUTC }
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
      return time // Return original time if parsing fails
    }
  }

  const formatTimeForAPI = (time: string | null) => {
    if (!time) return null
    return time // Already in HH:MM format
  }

  // Helper functions to get display names for selected values
  const getAircraftDisplayName = (aircraftId: string) => {
    if (aircraftId === "all") return "All aircraft"
    const plane = aircraft.find(p => p._id === aircraftId)
    return plane ? `${plane.registration} - ${plane.type}` : "Select aircraft"
  }

  const getInstructorDisplayName = (instructorId: string) => {
    if (instructorId === "all") return "All instructors"
    const instructor = instructors.find(i => i._id === instructorId)
    return instructor ? `${instructor.user_id.first_name} ${instructor.user_id.last_name}` : "Select instructor"
  }

  const getStudentDisplayName = (studentId: string) => {
    if (studentId === "all") return "All students"
    const student = students.find(s => s._id === studentId)
    return student ? `${student.user_id.first_name} ${student.user_id.last_name}` : "Select student"
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

      let apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule`
      
      // Build query parameters
      const params = new URLSearchParams()
      
      // Add date filters
      if (selectedDate) {
        const { startDate, endDate } = getUTCDateRange(selectedDate)
        if (startDate && endDate) {
          params.append("start_date", startDate)
          if (selectedEndDate) {
            const { endDate: endDateRange } = getUTCDateRange(selectedEndDate)
            if (endDateRange) {
              params.append("end_date", endDateRange)
            }
          } else {
            params.append("end_date", endDate)
          }
        }
      }
      
      // Add other filters
      if (selectedStatus && selectedStatus !== "all") {
        params.append("status", selectedStatus.toLowerCase())
      }
      if (selectedAircraft && selectedAircraft !== "all") {
        params.append("plane_id", selectedAircraft)
      }
      if (selectedInstructor && selectedInstructor !== "all") {
        params.append("instructor_id", selectedInstructor)
      }
      if (selectedStudent && selectedStudent !== "all") {
        params.append("student_id", selectedStudent)
      }
      
      // Add time range if specified - note: the new API doesn't support time filtering
      // but we can filter locally after fetching data
      
      // Append query parameters to URL
      if (params.toString()) {
        apiUrl += `?${params.toString()}`
      }
      
      console.log('Fetching flight logs from:', apiUrl)
      
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
          console.log('Raw schedules count:', data.schedules.length)
          
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
        
        console.log('Transformed flights:', transformedFlights)
        console.log('Selected date:', selectedDate?.toLocaleDateString('en-CA'))
        console.log('Selected end date:', selectedEndDate?.toLocaleDateString('en-CA'))
        
        // Apply local date and time filtering
        let filteredFlights = transformedFlights
        
        // Filter by date range (if we have both selectedDate and selectedEndDate, use range; otherwise use single date)
        if (selectedDate) {
          if (selectedEndDate) {
            // Date range filtering
            const startDateStr = selectedDate.toLocaleDateString('en-CA') // YYYY-MM-DD format
            const endDateStr = selectedEndDate.toLocaleDateString('en-CA') // YYYY-MM-DD format
            filteredFlights = filteredFlights.filter(flight => {
              return flight.date >= startDateStr && flight.date <= endDateStr
            })
          } else {
            // Single date filtering
            const selectedDateStr = selectedDate.toLocaleDateString('en-CA') // YYYY-MM-DD format
            filteredFlights = filteredFlights.filter(flight => flight.date === selectedDateStr)
          }
        }
        
        // Apply time filtering if specified
        if (startTime || endTime) {
          filteredFlights = filteredFlights.filter(flight => {
            const flightTime = flight.start_time
            if (!flightTime) return true
            
            const flightMinutes = convertTimeToMinutes(flightTime)
            
            if (startTime) {
              const startMinutes = convertTimeToMinutes(startTime)
              if (flightMinutes < startMinutes) return false
            }
            
            if (endTime) {
              const endMinutes = convertTimeToMinutes(endTime)
              if (flightMinutes > endMinutes) return false
            }
            
            return true
          })
        }
        
        console.log('Final filtered flights:', filteredFlights)
        setFlights(filteredFlights)
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

  // Helper function to convert time string to minutes for comparison
  const convertTimeToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Helper function to capitalize status for display
  const capitalizeStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  // Convert local date and time to UTC ISO string
  const convertLocalToUTC = (localDate: string, localTime: string): string => {
    // Create a date object from local date and time
    const localDateTime = new Date(`${localDate}T${localTime}:00`)
    return localDateTime.toISOString()
  }

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token) {
        toast.error("School ID or authentication token not found")
        return
      }

      if (!apiKey) {
        toast.error("API key is not configured")
        return
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students`
      
      console.log('Fetching students from:', apiUrl)
      
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
        throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Students data:', data)
      
      if (data.students && Array.isArray(data.students)) {
        setStudents(data.students)
      } else {
        toast.error("Invalid data format received from API")
      }
    } catch (err) {
      console.error("Error fetching students:", err)
      toast.error(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchInstructors = async () => {
    try {
      setLoadingInstructors(true);
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      if (!schoolId || !token) {
        toast.error("School ID or authentication token not found");
        return;
      }

      if (!apiKey) {
        toast.error("API key is not configured");
        return;
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/instructors`;
      
      console.log('Fetching instructors from:', apiUrl);
      
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
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        });
        throw new Error(`Failed to fetch instructors: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Instructors data:', data);
      
      if (Array.isArray(data)) {
        setInstructors(data);
      } else {
        toast.error("Invalid data format received from API");
      }
    } catch (err) {
      console.error("Error fetching instructors:", err);
      toast.error(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoadingInstructors(false);
    }
  };

  const fetchAircraft = async () => {
    try {
      setLoadingAircraft(true);
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      if (!schoolId || !token) {
        toast.error("School ID or authentication token not found");
        return;
      }

      if (!apiKey) {
        toast.error("API key is not configured");
        return;
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes`;
      
      console.log('Fetching aircraft from:', apiUrl);
      
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
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        });
        throw new Error(`Failed to fetch aircraft: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Aircraft data:', data);
      
      if (Array.isArray(data)) {
        setAircraft(data);
      } else if (data.planes && Array.isArray(data.planes)) {
        setAircraft(data.planes);
      } else {
        toast.error("Invalid data format received from API");
      }
    } catch (err) {
      console.error("Error fetching aircraft:", err);
      toast.error(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoadingAircraft(false);
    }
  };

  useEffect(() => {
    fetchStudents()
    fetchInstructors()
    fetchAircraft()
  }, [])

  useEffect(() => {
    fetchFlightLogs()
  }, [selectedDate, selectedEndDate, selectedStatus, selectedAircraft, selectedInstructor, selectedStudent, startTime, endTime])

  // Check for edit parameter in URL and enter edit mode if found
  useEffect(() => {
    const editFlightId = searchParams.get('edit')
    if (editFlightId && flights.length > 0) {
      const flightToEdit = flights.find(flight => flight._id === editFlightId)
      if (flightToEdit) {
        setSelectedFlight(flightToEdit)
        setEditedFlight({...flightToEdit})
        setIsEditing(true)
        
        // Fetch students and instructors when entering edit mode
        fetchStudents()
        fetchInstructors()
        
        // Remove the edit parameter from the URL without refreshing the page
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]edit=[^&]+(&|$)/, '$1')
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [searchParams, flights])

  // Enhanced search function with multiple improvements
  const enhancedSearch = (flight: FlightLog, query: string) => {
    if (!query.trim()) return true;
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    const searchableText = [
      flight._id,
      flight.student_name,
      flight.plane_reg,
      flight.instructor,
      flight.type,
      flight.status,
      flight.date,
      flight.start_time,
      `${flight.duration}h`,
      `${flight.duration} hours`,
      formatDate(flight.date), // Formatted date like "06/06/2025"
      formatTime(flight.start_time), // Formatted time like "3:00 AM"
    ].join(' ').toLowerCase();
    
    // Support for different search modes
    if (query.startsWith('"') && query.endsWith('"')) {
      // Exact phrase search
      const phrase = query.slice(1, -1).toLowerCase();
      return searchableText.includes(phrase);
    }
    
    if (query.includes(' AND ')) {
      // AND search: all terms must match
      const andTerms = query.toLowerCase().split(' and ').map(t => t.trim());
      return andTerms.every(term => searchableText.includes(term));
    }
    
    if (query.includes(' OR ')) {
      // OR search: any term can match
      const orTerms = query.toLowerCase().split(' or ').map(t => t.trim());
      return orTerms.some(term => searchableText.includes(term));
    }
    
    // Default: any search term can match (partial matching)
    return searchTerms.some(term => searchableText.includes(term));
  };

  // Sort flights based on enhanced search and sort configuration
  const filteredAndSortedFlights = flights
    .filter((flight) => enhancedSearch(flight, searchQuery))
    .sort((a, b) => {
      if (!sortConfig) return 0;
      
      const { key, direction } = sortConfig;
      
      // Handle different data types
      if (key === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return direction === 'ascending' ? dateA - dateB : dateB - dateA;
      }
      
      if (key === 'start_time') {
        const [hoursA, minutesA] = a.start_time.split(':').map(Number);
        const [hoursB, minutesB] = b.start_time.split(':').map(Number);
        const timeA = hoursA * 60 + minutesA;
        const timeB = hoursB * 60 + minutesB;
        return direction === 'ascending' ? timeA - timeB : timeB - timeA;
      }
      
      if (key === 'duration') {
        return direction === 'ascending' 
          ? a.duration - b.duration 
          : b.duration - a.duration;
      }
      
      // For string values
      const valueA = a[key as keyof FlightLog]?.toString().toLowerCase() || '';
      const valueB = b[key as keyof FlightLog]?.toString().toLowerCase() || '';
      
      if (valueA < valueB) return direction === 'ascending' ? -1 : 1;
      if (valueA > valueB) return direction === 'ascending' ? 1 : -1;
      return 0;
    });

  const handleSort = (key: string) => {
    setSortConfig((currentConfig) => {
      if (currentConfig?.key === key) {
        // Toggle direction if same key
        return {
          key,
          direction: currentConfig.direction === 'ascending' ? 'descending' : 'ascending',
        };
      }
      // Default to ascending for new sort
      return { key, direction: 'ascending' };
    });
  };

  const handleViewDetails = (flight: FlightLog) => {
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

  const handleBackToList = () => {
    setSelectedFlight(null)
  }

  const handleApplyFilters = () => {
    fetchFlightLogs()
  }

  const handleResetFilters = () => {
    setSelectedDate(new Date())
    setSelectedEndDate(null)
    setStartTime(null)
    setEndTime(null)
    setSelectedStatus("all")
    setSelectedAircraft("all")
    setSelectedInstructor("all")
    setSelectedStudent("all")
    // Close any open comboboxes
    setAircraftOpen(false)
    setInstructorOpen(false)
    setStudentOpen(false)
  }

  const handleEditClick = () => {
    if (selectedFlight) {
      setEditedFlight({...selectedFlight})
      setIsEditing(true)
      setShowWarning(false)
      fetchStudents() // Fetch students when entering edit mode
      fetchInstructors() // Fetch instructors when entering edit mode
    }
  }

  const handleSaveEdit = async () => {
    if (!editedFlight) return

    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token) {
        toast.error("School ID or authentication token not found")
        return
      }

      if (!apiKey) {
        toast.error("API key is not configured")
        return
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule/${editedFlight._id}`
      
      console.log('Updating flight log:', apiUrl)
      
      const response = await fetch(apiUrl, {
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
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        })
        throw new Error(`Failed to update flight log: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Updated flight log:', data)
      
      // Update the flight in the list
      setFlights(flights.map(flight => 
        flight._id === editedFlight._id ? editedFlight : flight
      ))
      
      // Update the selected flight
      setSelectedFlight(editedFlight)
      
      // Exit edit mode
      setIsEditing(false)
      setShowWarning(false)
      
      toast.success("Flight log updated successfully")
    } catch (err) {
      console.error("Error updating flight log:", err)
      toast.error(err instanceof Error ? err.message : "An unknown error occurred")
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedFlight(null)
    setShowWarning(false)
  }

  const handleInputChange = (field: keyof FlightLog, value: any) => {
    if (editedFlight) {
      setEditedFlight({
        ...editedFlight,
        [field]: value
      })
    }
  }

  const handleStudentChange = (studentId: string) => {
    if (!editedFlight) return
    
    const selectedStudent = students.find(student => student._id === studentId)
    if (selectedStudent) {
      setEditedFlight({
        ...editedFlight,
        student_id: selectedStudent._id,
        student_name: `${selectedStudent.user_id.first_name} ${selectedStudent.user_id.last_name}`
      })
    }
  }

  const handleInstructorChange = (instructorId: string) => {
    if (!editedFlight) return
    
    const selectedInstructor = instructors.find(instructor => instructor._id === instructorId)
    if (selectedInstructor) {
      setEditedFlight({
        ...editedFlight,
        instructor_id: selectedInstructor._id,
        instructor: `${selectedInstructor.user_id.first_name} ${selectedInstructor.user_id.last_name}`
      })
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedFlight) return;
    
    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      if (!schoolId || !token) {
        toast.error("School ID or authentication token not found");
        return;
      }

      if (!apiKey) {
        toast.error("API key is not configured");
        return;
      }

      const updatedFlight = { ...selectedFlight, status: newStatus };
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule/${selectedFlight._id}`;
      
      console.log('Updating flight status:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          status: newStatus.toLowerCase()
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        });
        throw new Error(`Failed to update flight status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Updated flight status:', data);
      
      // Update the flight in the list
      setFlights(flights.map(flight => 
        flight._id === selectedFlight._id ? updatedFlight : flight
      ));
      
      // Update the selected flight
      setSelectedFlight(updatedFlight);
      
      toast.success("Flight status updated successfully");
    } catch (err) {
      console.error("Error updating flight status:", err);
      toast.error(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Flight Log</CardTitle>
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
          <CardTitle>Flight Log</CardTitle>
          <CardDescription>Error loading flight data</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`grid ${selectedFlight ? 'grid-cols-1 md:grid-cols-2 gap-4' : 'grid-cols-1'} ${className}`}>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Flight Log</CardTitle>
          <CardDescription>Complete flight log for the school</CardDescription>
      </CardHeader>
      <CardContent>
          {showWarning && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Editing in progress</AlertTitle>
              <AlertDescription>
                You are currently editing a flight. Please save or cancel your changes before selecting another flight.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {/* Header with Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search flights..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9 w-full sm:w-[300px] pl-10 pr-10 dark:bg-muted/50"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip open={searchHelpOpen} onOpenChange={setSearchHelpOpen}>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 w-9 p-0"
                          onClick={() => setSearchHelpOpen(!searchHelpOpen)}
                          onMouseEnter={() => setSearchHelpOpen(true)}
                          onMouseLeave={() => setSearchHelpOpen(false)}
                        >
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-2 text-sm">
                          <div className="font-medium">Search Tips:</div>
                          <div>• Search by: student name, aircraft, instructor, status, date, time</div>
                          <div>• <code>"exact phrase"</code> - for exact matches</div>
                          <div>• <code>term AND term</code> - both must match</div>
                          <div>• <code>term OR term</code> - either can match</div>
                          <div>• Examples: <code>David N166</code>, <code>"Solo"</code>, <code>Scheduled OR Completed</code></div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {!selectedFlight && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-9 px-3 gap-2 whitespace-nowrap"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {showFilters ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {searchQuery ? (
                  <>
                    {filteredAndSortedFlights.length} of {flights.length} flight{flights.length !== 1 ? 's' : ''} 
                    {filteredAndSortedFlights.length !== flights.length && (
                      <span className="text-blue-600 dark:text-blue-400"> (filtered)</span>
                    )}
                  </>
                ) : (
                  `${flights.length} flight${flights.length !== 1 ? 's' : ''} found`
                )}
              </div>
            </div>

            {/* Collapsible Filters */}
            {!selectedFlight && showFilters && (
              <div className="space-y-4 p-4 border rounded-lg dark:border-muted-foreground/20 bg-muted/20 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Start Date</Label>
                    <DatePicker
                      date={selectedDate}
                      setDate={handleStartDateChange}
                      className="dark:bg-muted/50 h-8"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">End Date</Label>
                    <DatePicker
                      date={selectedEndDate}
                      setDate={handleEndDateChange}
                      className="dark:bg-muted/50 h-8"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Status</Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="h-8 dark:bg-muted/50 text-xs">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in-flight">In Flight</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Aircraft Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Aircraft</Label>
                    <Popover open={aircraftOpen} onOpenChange={setAircraftOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={aircraftOpen}
                          className="h-8 w-full justify-between dark:bg-muted/50 text-xs font-normal border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="truncate">{getAircraftDisplayName(selectedAircraft)}</span>
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search aircraft..." className="h-9" />
                          <CommandEmpty>No aircraft found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              <CommandItem
                                key="all-aircraft"
                                value="all"
                                onSelect={() => {
                                  setSelectedAircraft("all")
                                  setAircraftOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedAircraft === "all" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                All aircraft
                              </CommandItem>
                              {aircraft.map((plane, index) => (
                                <CommandItem
                                  key={plane._id || `aircraft-${index}`}
                                  value={`${plane.registration} ${plane.type} ${plane.aircraftModel}`}
                                  onSelect={() => {
                                    setSelectedAircraft(plane._id)
                                    setAircraftOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedAircraft === plane._id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {plane.registration} - {plane.type}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Instructor Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Instructor</Label>
                    <Popover open={instructorOpen} onOpenChange={setInstructorOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={instructorOpen}
                          className="h-8 w-full justify-between dark:bg-muted/50 text-xs font-normal border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="truncate">{getInstructorDisplayName(selectedInstructor)}</span>
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search instructors..." className="h-9" />
                          <CommandEmpty>No instructors found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              <CommandItem
                                key="all-instructors"
                                value="all"
                                onSelect={() => {
                                  setSelectedInstructor("all")
                                  setInstructorOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedInstructor === "all" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                All instructors
                              </CommandItem>
                              {instructors.map((instructor, index) => (
                                <CommandItem
                                  key={instructor._id || `instructor-${index}`}
                                  value={`${instructor.user_id.first_name} ${instructor.user_id.last_name}`}
                                  onSelect={() => {
                                    setSelectedInstructor(instructor._id)
                                    setInstructorOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedInstructor === instructor._id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {instructor.user_id.first_name} {instructor.user_id.last_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Student Filter */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Student</Label>
                    <Popover open={studentOpen} onOpenChange={setStudentOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={studentOpen}
                          className="h-8 w-full justify-between dark:bg-muted/50 text-xs font-normal border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        >
                          <span className="truncate">{getStudentDisplayName(selectedStudent)}</span>
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search students..." className="h-9" />
                          <CommandEmpty>No students found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              <CommandItem
                                key="all-students"
                                value="all"
                                onSelect={() => {
                                  setSelectedStudent("all")
                                  setStudentOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedStudent === "all" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                All students
                              </CommandItem>
                              {students.map((student, index) => (
                                <CommandItem
                                  key={student._id || `student-${index}`}
                                  value={`${student.user_id.first_name} ${student.user_id.last_name}`}
                                  onSelect={() => {
                                    setSelectedStudent(student._id)
                                    setStudentOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedStudent === student._id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {student.user_id.first_name} {student.user_id.last_name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Time Range and Actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Time:</Label>
                    <TimePicker
                      time={startTime}
                      setTime={setStartTime}
                      onApply={handleApplyFilters}
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <TimePicker
                      time={endTime}
                      setTime={setEndTime}
                      onApply={handleApplyFilters}
                    />
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleResetFilters}
                    className="h-8 text-xs dark:border-muted-foreground/20"
                  >
                    Reset All
                  </Button>
                </div>
              </div>
            )}
            <div className="rounded-md border dark:border-muted-foreground/20">
        <Table>
          <TableHeader>
                  <TableRow className="dark:border-muted-foreground/20">
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {sortConfig?.key === 'date' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                        {sortConfig?.key === 'date' && sortConfig.direction === 'ascending' && (
                          <span className="text-xs">↑</span>
                        )}
                        {sortConfig?.key === 'date' && sortConfig.direction === 'descending' && (
                          <span className="text-xs">↓</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('start_time')}
                    >
                      <div className="flex items-center gap-1">
                        Time
                        {sortConfig?.key === 'start_time' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                        {sortConfig?.key === 'start_time' && sortConfig.direction === 'ascending' && (
                          <span className="text-xs">↑</span>
                        )}
                        {sortConfig?.key === 'start_time' && sortConfig.direction === 'descending' && (
                          <span className="text-xs">↓</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('plane_reg')}
                    >
                      <div className="flex items-center gap-1">
                        Aircraft
                        {sortConfig?.key === 'plane_reg' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                        {sortConfig?.key === 'plane_reg' && sortConfig.direction === 'ascending' && (
                          <span className="text-xs">↑</span>
                        )}
                        {sortConfig?.key === 'plane_reg' && sortConfig.direction === 'descending' && (
                          <span className="text-xs">↓</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('student_name')}
                    >
                      <div className="flex items-center gap-1">
                        Student
                        {sortConfig?.key === 'student_name' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                        {sortConfig?.key === 'student_name' && sortConfig.direction === 'ascending' && (
                          <span className="text-xs">↑</span>
                        )}
                        {sortConfig?.key === 'student_name' && sortConfig.direction === 'descending' && (
                          <span className="text-xs">↓</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('instructor')}
                    >
                      <div className="flex items-center gap-1">
                        Instructor
                        {sortConfig?.key === 'instructor' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                        {sortConfig?.key === 'instructor' && sortConfig.direction === 'ascending' && (
                          <span className="text-xs">↑</span>
                        )}
                        {sortConfig?.key === 'instructor' && sortConfig.direction === 'descending' && (
                          <span className="text-xs">↓</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('duration')}
                    >
                      <div className="flex items-center gap-1">
                        Duration
                        {sortConfig?.key === 'duration' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                        {sortConfig?.key === 'duration' && sortConfig.direction === 'ascending' && (
                          <span className="text-xs">↑</span>
                        )}
                        {sortConfig?.key === 'duration' && sortConfig.direction === 'descending' && (
                          <span className="text-xs">↓</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {sortConfig?.key === 'status' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                        {sortConfig?.key === 'status' && sortConfig.direction === 'ascending' && (
                          <span className="text-xs">↑</span>
                        )}
                        {sortConfig?.key === 'status' && sortConfig.direction === 'descending' && (
                          <span className="text-xs">↓</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        {sortConfig?.key === 'type' && (
                          <ArrowUpDown className="h-3 w-3" />
                        )}
                        {sortConfig?.key === 'type' && sortConfig.direction === 'ascending' && (
                          <span className="text-xs">↑</span>
                        )}
                        {sortConfig?.key === 'type' && sortConfig.direction === 'descending' && (
                          <span className="text-xs">↓</span>
                        )}
                      </div>
                    </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                  {filteredAndSortedFlights.length > 0 ? (
                    filteredAndSortedFlights.map((flight) => (
                      <TableRow 
                        key={flight._id}
                        className={`cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30 dark:border-muted-foreground/20 ${
                          selectedFlight?._id === flight._id ? 'bg-muted/50 dark:bg-muted/30' : ''
                        }`}
                        onClick={() => handleViewDetails(flight)}
                      >
                        <TableCell>{formatDate(flight.date)}</TableCell>
                        <TableCell>{formatTime(flight.start_time)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Plane className="h-4 w-4 text-primary dark:text-primary/80" strokeWidth={2.5} />
                            {flight.plane_reg}
                          </div>
                        </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground dark:text-muted-foreground/80" />
                            {flight.student_name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground dark:text-muted-foreground/80" />
                            {flight.instructor}
                  </div>
                </TableCell>
                <TableCell>{flight.duration} hrs</TableCell>
                <TableCell>
                                  <Badge
                    variant={flight.status === "Completed" ? "default" : "secondary"}
                    className={(() => {
                              return `${
                                flight.status === "Completed" 
                                  ? "bg-green-500/80 hover:bg-green-500/90 text-white" 
                                  : flight.status === "In Flight" || flight.status === "In-flight"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : flight.status === "Preparing"
                                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    : flight.status === "Scheduled"
                                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                    : flight.status === "Cancelled" || flight.status === "Canceled"
                                      ? "bg-red-100 text-red-800 hover:bg-red-200"
                                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                              }`
                            })()}
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
                      <TableCell colSpan={9} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Plane className="h-12 w-12 text-muted-foreground/50" strokeWidth={1.5} />
                          <p className="text-lg font-medium text-muted-foreground">No flights found</p>
                          <p className="text-sm text-muted-foreground/80">Try adjusting your filters or search criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedFlight && (
        <Card className="h-full">
          <CardHeader className="border-b dark:border-muted-foreground/20 pb-3">
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleCancelEdit}
                      className="dark:border-muted-foreground/20"
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={handleSaveEdit}
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2 dark:border-muted-foreground/20"
                      onClick={handleEditClick}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleBackToList}
                      className="hover:bg-muted dark:hover:bg-muted/30"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isEditing ? (
              <div className="space-y-3">
                <div className="grid gap-3">
                  <div className="space-y-2 p-2.5 rounded-lg bg-muted/30 dark:bg-muted/20">
                    <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Flight Information</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label htmlFor="date" className="text-xs">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={editedFlight?.date || ''}
                          onChange={(e) => handleInputChange('date', e.target.value)}
                          className="dark:bg-muted/50 h-7 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="start_time" className="text-xs">Start Time</Label>
                        <Input
                          id="start_time"
                          type="time"
                          value={editedFlight?.start_time || ''}
                          onChange={(e) => handleInputChange('start_time', e.target.value)}
                          className="dark:bg-muted/50 h-7 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="duration" className="text-xs">Duration (hours)</Label>
                        <Input
                          id="duration"
                          type="number"
                          step="0.1"
                          min="0"
                          value={editedFlight?.duration || 0}
                          onChange={(e) => handleInputChange('duration', parseFloat(e.target.value))}
                          className="dark:bg-muted/50 h-7 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="type" className="text-xs">Type</Label>
                        <Input
                          id="type"
                          value={editedFlight?.type || ''}
                          onChange={(e) => handleInputChange('type', e.target.value)}
                          className="dark:bg-muted/50 h-7 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2 p-2.5 rounded-lg bg-muted/30 dark:bg-muted/20">
                      <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Aircraft</h3>
                      <div className="space-y-1">
                        <Label htmlFor="plane_reg" className="text-xs">Registration</Label>
                        <Input
                          id="plane_reg"
                          value={editedFlight?.plane_reg || ''}
                          onChange={(e) => handleInputChange('plane_reg', e.target.value)}
                          className="dark:bg-muted/50 h-7 text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 p-2.5 rounded-lg bg-muted/30 dark:bg-muted/20">
                      <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Student</h3>
                      <div className="space-y-1">
                        <Label htmlFor="student" className="text-xs">Select Student</Label>
                        <Select
                          value={editedFlight?.student_id || ''}
                          onValueChange={handleStudentChange}
                        >
                          <SelectTrigger className="dark:bg-muted/50 h-7 text-sm">
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student._id} value={student._id}>
                                {student.user_id.first_name} {student.user_id.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2 p-2.5 rounded-lg bg-muted/30 dark:bg-muted/20">
                      <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Instructor</h3>
                      <div className="space-y-1">
                        <Label htmlFor="instructor" className="text-xs">Select Instructor</Label>
                        <Select
                          value={editedFlight?.instructor_id || ''}
                          onValueChange={handleInstructorChange}
                        >
                          <SelectTrigger className="dark:bg-muted/50 h-7 text-sm">
                            <SelectValue placeholder="Select an instructor" />
                          </SelectTrigger>
                          <SelectContent>
                            {instructors.map((instructor) => (
                              <SelectItem key={instructor._id} value={instructor._id}>
                                {instructor.user_id.first_name} {instructor.user_id.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2 p-2.5 rounded-lg bg-muted/30 dark:bg-muted/20">
                      <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Status</h3>
                      <div className="space-y-1">
                        <Label className="text-xs">Current Status</Label>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={editedFlight?.status === "Completed" ? "default" : "secondary"}
                            className={`text-sm px-2 py-0.5 ${
                              editedFlight?.status === "Completed" 
                                ? "bg-green-500/80 hover:bg-green-500/90 text-white" 
                                : editedFlight?.status === "In Flight" || editedFlight?.status === "In-flight"
                                  ? "bg-green-100 text-green-800 hover:bg-green-200"
                                  : editedFlight?.status === "Preparing"
                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                  : editedFlight?.status === "Scheduled"
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                  : editedFlight?.status === "Cancelled" || editedFlight?.status === "Canceled"
                                    ? "bg-red-100 text-red-800 hover:bg-red-200"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            {editedFlight?.status}
                          </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                Change
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Select Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleInputChange('status', "Scheduled")}>
                                <Badge className="bg-blue-100 text-blue-800 mr-2">Scheduled</Badge>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleInputChange('status', "Preparing")}>
                                <Badge className="bg-yellow-100 text-yellow-800 mr-2">Preparing</Badge>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleInputChange('status', "In Flight")}>
                                <Badge className="bg-green-100 text-green-800 mr-2">In Flight</Badge>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleInputChange('status', "Completed")}>
                                <Badge className="bg-green-500/80 mr-2">Completed</Badge>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleInputChange('status', "Canceled")}>
                                <Badge className="bg-red-100 text-red-800 mr-2">Canceled</Badge>
                              </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-2 p-3 rounded-lg bg-muted/30 dark:bg-muted/20">
                    <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Flight Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground dark:text-muted-foreground/80">Start Time</h4>
                        <p className="text-sm font-medium">{formatTime(selectedFlight.start_time)}</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground dark:text-muted-foreground/80">Duration</h4>
                        <p className="text-sm font-medium">{selectedFlight.duration} hours</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-medium text-muted-foreground dark:text-muted-foreground/80">Type</h4>
                        <p className="text-sm font-medium">{selectedFlight.type}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-3 rounded-lg bg-muted/30 dark:bg-muted/20">
                    <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Aircraft</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                        <Plane className="h-3.5 w-3.5 text-primary dark:text-primary/80" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground dark:text-muted-foreground/80">Registration</h4>
                        <p className="text-sm font-medium">{selectedFlight.plane_reg}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-3 rounded-lg bg-muted/30 dark:bg-muted/20">
                    <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Student</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                        <User className="h-3.5 w-3.5 text-primary dark:text-primary/80" />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground dark:text-muted-foreground/80">Name</h4>
                        <p className="text-sm font-medium">{selectedFlight.student_name}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-3 rounded-lg bg-muted/30 dark:bg-muted/20">
                    <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Instructor</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20">
                        <User className="h-3.5 w-3.5 text-primary dark:text-primary/80" />
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground dark:text-muted-foreground/80">Name</h4>
                        <p className="text-sm font-medium">{selectedFlight.instructor}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-3 rounded-lg bg-muted/30 dark:bg-muted/20">
                    <h3 className="text-sm font-medium text-muted-foreground dark:text-muted-foreground/80">Status</h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={selectedFlight.status === "Completed" ? "default" : "secondary"}
                        className={`text-sm px-3 py-1 ${
                          selectedFlight.status === "Completed" 
                            ? "bg-green-500/80 hover:bg-green-500/90 text-white" 
                            : selectedFlight.status === "In Flight" || selectedFlight.status === "In-flight"
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : selectedFlight.status === "Preparing"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : selectedFlight.status === "Scheduled"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                              : selectedFlight.status === "Cancelled" || selectedFlight.status === "Canceled"
                                ? "bg-red-100 text-red-800 hover:bg-red-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {selectedFlight.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            Change Status
            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Select Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange("Scheduled")}>
                            <Badge className="bg-blue-100 text-blue-800 mr-2">Scheduled</Badge>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange("Preparing")}>
                            <Badge className="bg-yellow-100 text-yellow-800 mr-2">Preparing</Badge>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange("In Flight")}>
                            <Badge className="bg-green-100 text-green-800 mr-2">In Flight</Badge>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange("Completed")}>
                            <Badge className="bg-green-500/80 mr-2">Completed</Badge>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange("Canceled")}>
                            <Badge className="bg-red-100 text-red-800 mr-2">Canceled</Badge>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
          </div>
        )}
      </CardContent>
    </Card>
      )}
    </div>
  )
}
