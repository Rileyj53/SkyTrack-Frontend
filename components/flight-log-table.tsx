"use client"

import { useEffect, useState } from "react"
import { MoreHorizontal, Plane, User, ArrowLeft, X, Pencil, Save, AlertTriangle, ArrowUpDown, Filter, ChevronDown, ChevronUp, Check, ChevronsUpDown, Search, HelpCircle, Trash2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
  model: string
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
  const [isDeleting, setIsDeleting] = useState(false)
  
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
    const plane = aircraft.find(p => p.id === aircraftId)
    if (plane) {
      const typeModel = [plane.type, plane.model].filter(Boolean).join(' ')
      return `${plane.registration} - ${typeModel}`
    }
    return "Select aircraft"
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
      
      if (data.planes && Array.isArray(data.planes)) {
        setAircraft(data.planes);
      } else if (Array.isArray(data)) {
        setAircraft(data);
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
        
        // Fetch students, instructors, and aircraft when entering edit mode
        fetchStudents()
        fetchInstructors()
        fetchAircraft()
        
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
      fetchAircraft() // Fetch aircraft when entering edit mode
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

  const handleDeleteFlight = async () => {
    if (!selectedFlight) return

    try {
      setIsDeleting(true)
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

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule/${selectedFlight._id}`
      
      console.log('Deleting flight log:', apiUrl)
      
      const response = await fetch(apiUrl, {
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
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        })
        throw new Error(`Failed to delete flight log: ${response.status} ${response.statusText}`)
      }

      console.log('Flight log deleted successfully')
      
      // Remove the flight from the list
      setFlights(flights.filter(flight => flight._id !== selectedFlight._id))
      
      // Go back to list view
      setSelectedFlight(null)
      setIsEditing(false)
      setEditedFlight(null)
      setShowWarning(false)
      
      toast.success("Flight log deleted successfully")
    } catch (err) {
      console.error("Error deleting flight log:", err)
      toast.error(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsDeleting(false)
    }
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

  const handleAircraftChange = (aircraftId: string) => {
    if (!editedFlight) return
    
    const selectedAircraft = aircraft.find(plane => plane.id === aircraftId)
    if (selectedAircraft) {
      setEditedFlight({
        ...editedFlight,
        plane_id: selectedAircraft.id,
        plane_reg: selectedAircraft.registration
      })
    }
  }

  // Helper function to get the correct plane_id for the dropdown
  const getSelectedPlaneId = (flight: FlightLog | null) => {
    if (!flight || aircraft.length === 0) return ''
    
    // First try to match by plane_id
    if (flight.plane_id && aircraft.find(plane => plane.id === flight.plane_id)) {
      return flight.plane_id
    }
    
    // Fallback: try to match by registration
    if (flight.plane_reg) {
      const matchedPlane = aircraft.find(plane => plane.registration === flight.plane_reg)
      if (matchedPlane) {
        return matchedPlane.id
      }
    }
    
    return ''
  }

  // Helper function to get the display text for the selected aircraft
  const getSelectedPlaneDisplay = (flight: FlightLog | null) => {
    if (!flight || aircraft.length === 0) return null
    
    const selectedId = getSelectedPlaneId(flight)
    if (selectedId) {
      const selectedPlane = aircraft.find(p => p.id === selectedId)
      if (selectedPlane) {
        const typeModel = [selectedPlane.type, selectedPlane.model].filter(Boolean).join(' ')
        return `${selectedPlane.registration} - ${typeModel}`
      }
    }
    
    // Fallback to showing the registration from the flight data
    if (flight.plane_reg && flight.plane_reg !== 'N/A') {
      return flight.plane_reg
    }
    
    return null
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

  // Render the component structure immediately to prevent blank screen
  // Show loading state only within the table body area

  if (error) {
  return (
    <Card className={className}>
      <CardHeader>
          <CardTitle>Flight Log</CardTitle>
          <CardDescription>Error loading flight data</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
                        <div className="text-center text-[#f90606]">{error}</div>
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
                      <span className="text-[#3366ff] dark:text-[#3366ff]"> (filtered)</span>
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
                                  key={plane.id || `aircraft-${index}`}
                                  value={`${plane.registration} ${plane.type} ${plane.model}`}
                                  onSelect={() => {
                                    setSelectedAircraft(plane.id)
                                    setAircraftOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedAircraft === plane.id ? "opacity-100" : "opacity-0"
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
                  {loading ? (
                    <>
                      {Array.from({ length: 8 }).map((_, i) => (
                        <TableRow key={i} className="dark:border-muted-foreground/20">
                          <TableCell>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-16" />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-4 rounded" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-4 rounded" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-4 rounded" />
                              <Skeleton className="h-4 w-28" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-14" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-12" />
                          </TableCell>
                          <TableCell>
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  ) : filteredAndSortedFlights.length > 0 ? (
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
                                  ? "bg-[#33cc33]/80 hover:bg-[#33cc33]/90 text-white" 
                                  : flight.status === "In Flight" || flight.status === "In-flight"
                                    ? "bg-[#c2f0c2] text-[#33cc33] hover:bg-[#99e699]"
                                    : flight.status === "Preparing"
                                      ? "bg-[#fbfbb6] text-[#f2f20d] hover:bg-[#f9f986]"
                                    : flight.status === "Scheduled"
                                      ? "bg-[#b3c6ff] text-[#3366ff] hover:bg-[#809fff]"
                                    : flight.status === "Cancelled" || flight.status === "Canceled"
                                      ? "bg-[#fc9c9c] text-[#f90606] hover:bg-[#fb6a6a]"
                                      : "bg-[#d5d5dd] text-[#73738c] hover:bg-[#b9b9c6]"
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="flex items-center gap-2"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-md">
                        <AlertDialogHeader>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                              <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                              <AlertDialogTitle className="text-lg font-semibold">Delete Flight Log</AlertDialogTitle>
                            </div>
                          </div>
                          <AlertDialogDescription className="text-sm text-muted-foreground mt-4">
                            Are you sure you want to delete this flight log? This action cannot be undone and will permanently remove all flight data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        
                        {/* Flight Details Card */}
                        <div className="my-4 p-4 rounded-lg bg-muted/30 border border-muted">
                          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                            <Plane className="h-4 w-4 text-muted-foreground" />
                            Flight Details
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Date:</span>
                              <span className="font-medium">{formatDate(selectedFlight?.date || '')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Time:</span>
                              <span className="font-medium">{formatTime(selectedFlight?.start_time || '')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Aircraft:</span>
                              <span className="font-medium font-mono">{selectedFlight?.plane_reg}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Student:</span>
                              <span className="font-medium">{selectedFlight?.student_name}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground">Instructor:</span>
                              <span className="font-medium">{selectedFlight?.instructor}</span>
                            </div>
                          </div>
                        </div>

                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="flex-1">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteFlight}
                            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/50"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Flight
                              </>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
              <div className="space-y-4">
                {/* Flight Information Header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#b3c6ff]/20 to-[#809fff]/20 dark:from-[#3366ff]/20 dark:to-[#3366ff]/10 rounded-lg border border-[#809fff]/30 dark:border-[#3366ff]/30">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3366ff]/10 dark:bg-[#3366ff]/20">
                      <Plane className="h-4 w-4 text-[#3366ff] dark:text-[#3366ff]" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-[#3366ff] dark:text-[#b3c6ff]">Flight Information</h3>
                      <p className="text-xs text-[#3366ff]/80 dark:text-[#809fff]">Edit flight details</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#3366ff]"></div>
                        <Label htmlFor="date" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</Label>
                      </div>
                      <Input
                        id="date"
                        type="date"
                        value={editedFlight?.date || ''}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-2 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#809fff]"></div>
                        <Label htmlFor="start_time" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Time</Label>
                      </div>
                      <Input
                        id="start_time"
                        type="time"
                        value={editedFlight?.start_time || ''}
                        onChange={(e) => handleInputChange('start_time', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-2 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#33cc33]"></div>
                        <Label htmlFor="duration" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration (HRS)</Label>
                      </div>
                      <Input
                        id="duration"
                        type="number"
                        step="0.1"
                        min="0"
                        value={editedFlight?.duration || 0}
                        onChange={(e) => handleInputChange('duration', parseFloat(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-2 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#cc00ff]"></div>
                        <Label htmlFor="type" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</Label>
                      </div>
                      <Input
                        id="type"
                        value={editedFlight?.type || ''}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Aircraft Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#c2f0c2]/20 to-[#99e699]/20 dark:from-[#33cc33]/20 dark:to-[#33cc33]/10 rounded-lg border border-[#99e699]/30 dark:border-[#33cc33]/30">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#33cc33]/10 dark:bg-[#33cc33]/20">
                      <Plane className="h-4 w-4 text-[#33cc33] dark:text-[#33cc33]" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-[#33cc33] dark:text-[#c2f0c2]">Aircraft</h3>
                      <p className="text-xs text-[#33cc33]/80 dark:text-[#99e699]">Aircraft registration details</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 p-3 rounded-md bg-card border">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#33cc33]"></div>
                      <Label htmlFor="aircraft" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registration</Label>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="h-8 w-full justify-between text-sm font-mono font-normal"
                        >
                          <span className="truncate">
                            {getSelectedPlaneDisplay(editedFlight) || (loadingAircraft ? "Loading aircraft..." : "Select aircraft")}
                          </span>
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command>
                          <CommandInput placeholder="Search aircraft..." className="h-9" />
                          <CommandEmpty>No aircraft found.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {loadingAircraft ? (
                                <CommandItem value="loading" disabled>
                                  Loading aircraft...
                                </CommandItem>
                              ) : aircraft.length === 0 ? (
                                <CommandItem value="no-aircraft" disabled>
                                  No aircraft available
                                </CommandItem>
                              ) : (
                                aircraft.map((plane) => {
                                  const typeModel = [plane.type, plane.model].filter(Boolean).join(' ')
                                  const displayText = `${plane.registration} - ${typeModel}`
                                  return (
                                    <CommandItem
                                      key={plane.id}
                                      value={displayText}
                                      onSelect={() => handleAircraftChange(plane.id)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          getSelectedPlaneId(editedFlight) === plane.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {displayText}
                                    </CommandItem>
                                  )
                                })
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                {/* Flight Crew Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#ffe0b3]/20 to-[#ffcc80]/20 dark:from-[#ff9900]/20 dark:to-[#ff9900]/10 rounded-lg border border-[#ffcc80]/30 dark:border-[#ff9900]/30">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#ff9900]/10 dark:bg-[#ff9900]/20">
                      <User className="h-4 w-4 text-[#ff9900] dark:text-[#ff9900]" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-[#ff9900] dark:text-[#ffe0b3]">Flight Crew</h3>
                      <p className="text-xs text-[#ff9900]/80 dark:text-[#ffcc80]">Student and instructor assignment</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#ff9900]"></div>
                        <Label htmlFor="student" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Student</Label>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="h-8 w-full justify-between text-sm font-normal"
                          >
                            <span className="truncate">
                              {editedFlight?.student_id ? 
                                students.find(s => s._id === editedFlight.student_id)?.user_id ? 
                                  `${students.find(s => s._id === editedFlight.student_id)?.user_id.first_name} ${students.find(s => s._id === editedFlight.student_id)?.user_id.last_name}`
                                  : "Select a student"
                                : "Select a student"
                              }
                            </span>
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search students..." className="h-9" />
                            <CommandEmpty>No students found.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {students.map((student) => (
                                  <CommandItem
                                    key={student._id}
                                    value={`${student.user_id.first_name} ${student.user_id.last_name}`}
                                    onSelect={() => handleStudentChange(student._id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        editedFlight?.student_id === student._id ? "opacity-100" : "opacity-0"
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
                    
                    <div className="space-y-2 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#ffcc80]"></div>
                        <Label htmlFor="instructor" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Instructor</Label>
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="h-8 w-full justify-between text-sm font-normal"
                          >
                            <span className="truncate">
                              {editedFlight?.instructor_id ? 
                                instructors.find(i => i._id === editedFlight.instructor_id)?.user_id ? 
                                  `${instructors.find(i => i._id === editedFlight.instructor_id)?.user_id.first_name} ${instructors.find(i => i._id === editedFlight.instructor_id)?.user_id.last_name}`
                                  : "Select an instructor"
                                : "Select an instructor"
                              }
                            </span>
                            <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Search instructors..." className="h-9" />
                            <CommandEmpty>No instructors found.</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                {instructors.map((instructor) => (
                                  <CommandItem
                                    key={instructor._id}
                                    value={`${instructor.user_id.first_name} ${instructor.user_id.last_name}`}
                                    onSelect={() => handleInstructorChange(instructor._id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        editedFlight?.instructor_id === instructor._id ? "opacity-100" : "opacity-0"
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
                  </div>
                </div>
                
                {/* Status Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-lg border border-violet-100 dark:border-violet-800/30">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 dark:bg-violet-400/10">
                      <AlertTriangle className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-violet-900 dark:text-violet-100">Flight Status</h3>
                      <p className="text-xs text-violet-700 dark:text-violet-300">Current status and actions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-md bg-card border">
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Status</h4>
                      <Badge
                        variant={editedFlight?.status === "Completed" ? "default" : "secondary"}
                        className={`text-xs px-3 py-1 font-medium ${
                          editedFlight?.status === "Completed" 
                            ? "bg-[#33cc33]/90 hover:bg-[#33cc33] text-white border-[#33cc33]" 
                            : editedFlight?.status === "In Flight" || editedFlight?.status === "In-flight"
                              ? "bg-[#c2f0c2] text-[#33cc33] hover:bg-[#99e699] border-[#99e699]"
                              : editedFlight?.status === "Preparing"
                                ? "bg-[#fbfbb6] text-[#f2f20d] hover:bg-[#f9f986] border-[#f9f986]"
                              : editedFlight?.status === "Scheduled"
                                ? "bg-[#b3c6ff] text-[#3366ff] hover:bg-[#809fff] border-[#809fff]"
                              : editedFlight?.status === "Cancelled" || editedFlight?.status === "Canceled"
                                ? "bg-[#fc9c9c] text-[#f90606] hover:bg-[#fb6a6a] border-[#fb6a6a]"
                              : "bg-[#d5d5dd] text-[#73738c] hover:bg-[#b9b9c6] border-[#b9b9c6]"
                        }`}
                      >
                        {editedFlight?.status}
                      </Badge>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          Change Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs">Update Flight Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleInputChange('status', "Scheduled")} className="flex items-center gap-2 py-1.5">
                          <Badge className="bg-[#b3c6ff] text-[#3366ff] border-[#809fff] text-xs">Scheduled</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleInputChange('status', "Preparing")} className="flex items-center gap-2 py-1.5">
                          <Badge className="bg-[#fbfbb6] text-[#f2f20d] border-[#f9f986] text-xs">Preparing</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleInputChange('status', "In Flight")} className="flex items-center gap-2 py-1.5">
                          <Badge className="bg-[#c2f0c2] text-[#33cc33] border-[#99e699] text-xs">In Flight</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleInputChange('status', "Completed")} className="flex items-center gap-2 py-1.5">
                          <Badge className="bg-[#33cc33]/90 text-white border-[#33cc33] text-xs">Completed</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleInputChange('status', "Canceled")} className="flex items-center gap-2 py-1.5">
                          <Badge className="bg-[#fc9c9c] text-[#f90606] border-[#fb6a6a] text-xs">Canceled</Badge>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Flight Information Header */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#b3c6ff]/20 to-[#809fff]/20 dark:from-[#3366ff]/20 dark:to-[#3366ff]/10 rounded-lg border border-[#809fff]/30 dark:border-[#3366ff]/30">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3366ff]/10 dark:bg-[#3366ff]/20">
                      <Plane className="h-4 w-4 text-[#3366ff] dark:text-[#3366ff]" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-[#3366ff] dark:text-[#b3c6ff]">Flight Information</h3>
                      <p className="text-xs text-[#3366ff]/80 dark:text-[#809fff]">Primary flight details</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Time</h4>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatTime(selectedFlight.start_time)}</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration</h4>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{selectedFlight.duration} hrs</p>
                    </div>
                    <div className="space-y-1 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</h4>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{selectedFlight.type}</p>
                    </div>
                  </div>
                </div>
                
                {/* Aircraft Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 dark:bg-emerald-400/10">
                      <Plane className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Aircraft</h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">Aircraft registration details</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 p-3 rounded-md bg-card border">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registration</h4>
                    </div>
                    <p className="text-sm font-semibold text-foreground font-mono">{selectedFlight.plane_reg}</p>
                  </div>
                </div>
                
                {/* People Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 dark:bg-amber-400/10">
                      <User className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100">Flight Crew</h3>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Student and instructor information</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500"></div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Student</h4>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{selectedFlight.student_name}</p>
                    </div>
                    
                    <div className="space-y-1 p-3 rounded-md bg-card border">
                      <div className="flex items-center gap-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Instructor</h4>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{selectedFlight.instructor}</p>
                    </div>
                  </div>
                </div>
                
                {/* Status Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-lg border border-violet-100 dark:border-violet-800/30">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 dark:bg-violet-400/10">
                      <AlertTriangle className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-violet-900 dark:text-violet-100">Flight Status</h3>
                      <p className="text-xs text-violet-700 dark:text-violet-300">Current status and actions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-md bg-card border">
                    <div className="space-y-1">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Status</h4>
                      <Badge
                        variant={selectedFlight.status === "Completed" ? "default" : "secondary"}
                        className={`text-xs px-3 py-1 font-medium ${
                          selectedFlight.status === "Completed" 
                            ? "bg-[#33cc33]/90 hover:bg-[#33cc33] text-white border-[#33cc33]" 
                            : selectedFlight.status === "In Flight" || selectedFlight.status === "In-flight"
                              ? "bg-[#c2f0c2] text-[#33cc33] hover:bg-[#99e699] border-[#99e699]"
                              : selectedFlight.status === "Preparing"
                                ? "bg-[#fbfbb6] text-[#f2f20d] hover:bg-[#f9f986] border-[#f9f986]"
                              : selectedFlight.status === "Scheduled"
                                ? "bg-[#b3c6ff] text-[#3366ff] hover:bg-[#809fff] border-[#809fff]"
                              : selectedFlight.status === "Cancelled" || selectedFlight.status === "Canceled"
                                ? "bg-[#fc9c9c] text-[#f90606] hover:bg-[#fb6a6a] border-[#fb6a6a]"
                              : "bg-[#d5d5dd] text-[#73738c] hover:bg-[#b9b9c6] border-[#b9b9c6]"
                        }`}
                      >
                        {selectedFlight.status}
                      </Badge>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs">
                          Change Status
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs">Update Flight Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange("Scheduled")} className="flex items-center gap-2 py-1.5">
                          <Badge className="bg-[#b3c6ff] text-[#3366ff] border-[#809fff] text-xs">Scheduled</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange("Preparing")} className="flex items-center gap-2 py-1.5">
                          <Badge className="bg-[#fbfbb6] text-[#f2f20d] border-[#f9f986] text-xs">Preparing</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange("In Flight")} className="flex items-center gap-2 py-1.5">
                          <Badge className="bg-[#c2f0c2] text-[#33cc33] border-[#99e699] text-xs">In Flight</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange("Completed")} className="flex items-center gap-2 py-1.5">
                          <Badge className="bg-[#33cc33]/90 text-white border-[#33cc33] text-xs">Completed</Badge>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange("Canceled")} className="flex items-center gap-2 py-1.5">
                          <Badge className="bg-[#fc9c9c] text-[#f90606] border-[#fb6a6a] text-xs">Canceled</Badge>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
