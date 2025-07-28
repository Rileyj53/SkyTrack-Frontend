"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { CalendarIcon, Loader2 } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TimePicker } from "@/components/ui/time-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { 
  User, 
  UserCheck, 
  Plane, 
  Calendar as CalendarIconLucide, 
  Clock, 
  Tag, 
  FileText,
  Check,
  ChevronsUpDown
} from "lucide-react"

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

interface Plane {
  id: string
  registration: string
  type: string
  aircraftModel?: string
  status: string
}

interface NewFlightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFlightCreated: () => void
  students: Student[]
  instructors: Instructor[]
  initialDate?: Date
  userRole?: string
}

export function NewFlightDialog({ 
  open, 
  onOpenChange,
  onFlightCreated,
  students,
  instructors,
  initialDate,
  userRole
}: NewFlightDialogProps) {
  const [loading, setLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [planes, setPlanes] = useState<Plane[]>([])
  const [selectedPlaneId, setSelectedPlaneId] = useState("")
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [selectedInstructorId, setSelectedInstructorId] = useState("")
  const [date, setDate] = useState<Date | undefined>(initialDate)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [flightType, setFlightType] = useState("")
  const [notes, setNotes] = useState("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isPlanePopoverOpen, setIsPlanePopoverOpen] = useState(false)
  const [isStudentPopoverOpen, setIsStudentPopoverOpen] = useState(false)
  const [isInstructorPopoverOpen, setIsInstructorPopoverOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchUserData()
      fetchPlanes()
    }
  }, [open, students, instructors])

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
        },
        credentials: "include"
      })

      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.user) {
          setUserId(data.data.user._id)
          
          // Store user's name for display
          if (data.data.user.first_name && data.data.user.last_name) {
            setCurrentUserName(`${data.data.user.first_name} ${data.data.user.last_name}`)
          }
          
          // For students and members, get their student record directly from the user data
          if (data.data.user.role === 'student' || data.data.user.role === 'member') {
            // The API now provides both student_id and student object
            let studentIdToUse = null;
            
            // First try to use the direct student_id field
            if (data.data.user.student_id) {
              studentIdToUse = data.data.user.student_id;
              console.log('🎓 New Flight Dialog - Using direct student_id:', studentIdToUse);
            }
            // Fall back to the student object if available
            else if (data.data.user.student && data.data.user.student._id) {
              studentIdToUse = data.data.user.student._id;
              console.log('🎓 New Flight Dialog - Using student._id as fallback:', studentIdToUse);
            }
            
            if (studentIdToUse) {
              setStudentId(studentIdToUse);
              setSelectedStudentId(studentIdToUse);
              console.log('🎓 New Flight Dialog - Setting student ID:', studentIdToUse);
            } else {
              console.warn('⚠️ Student user but no student ID found in user data:', data.data.user);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchPlanes = async () => {
    try {
      setIsLoadingData(true)
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY

      if (!organizationId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/planes`,
        {
          headers: {
            "Accept": "application/json",
            "x-api-key": apiKey,
            "Authorization": `Bearer ${token}`,
            "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
          },
          credentials: "include"
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch planes")
      }

      const data = await response.json()
      // Handle the new nested data structure - EXACT COPY from working schedule-dialog.tsx
      if (data.data && Array.isArray(data.data.planes)) {
        setPlanes(data.data.planes)
      } else if (data.data && Array.isArray(data.data)) {
        setPlanes(data.data)
      } else if (Array.isArray(data.planes)) {
        setPlanes(data.planes) // Fallback for old structure
      } else {
        setPlanes([])
      }
    } catch (error) {
      console.error("Error fetching planes:", error)
      toast.error("Failed to load planes")
      setPlanes([])
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleCreate = async () => {
    // For members, skip instructor and flight type validation
    const isMember = userRole === 'member' || userRole === 'club_admin'
    const requiredFields = [date, selectedPlaneId, startTime, endTime]
    
    if (!isMember) {
      requiredFields.push(selectedInstructorId, flightType)
    }
    
    if (requiredFields.some(field => !field)) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setLoading(true)
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY

      console.log('Organization ID:', organizationId)
      console.log('API Key available:', !!apiKey)
      console.log('Token available:', !!token)

      if (!organizationId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      // Combine date and time to create ISO string in local timezone
      const [startHours, startMinutes] = startTime.split(':').map(Number)
      const scheduledStartTime = new Date(date)
      scheduledStartTime.setHours(startHours, startMinutes, 0, 0)

      // Calculate scheduled end time from end time input
      const [endHours, endMinutes] = endTime.split(':').map(Number)
      const scheduledEndTime = new Date(date)
      scheduledEndTime.setHours(endHours, endMinutes, 0, 0)

      // Handle overnight flights (end time is next day)
      if (scheduledEndTime <= scheduledStartTime) {
        scheduledEndTime.setDate(scheduledEndTime.getDate() + 1)
      }

      // Different endpoints and payloads for students/members vs admins/instructors
      const isStudent = userRole === 'student'
      const isMember = userRole === 'member' || userRole === 'club_admin'

      // Ensure API URL is properly defined
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
      if (!apiBaseUrl) {
        console.error('NEXT_PUBLIC_API_URL environment variable is not defined')
        throw new Error('API URL is not configured properly')
      }

      // Properly format the endpoint with trailing slashes removed
      const apiUrl = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl
      const endpoint = (isStudent || isMember)
        ? `${apiUrl}/organizations/${organizationId}/flight_schedule/requests`
        : `${apiUrl}/organizations/${organizationId}/flight_schedule`

      console.log(`Using endpoint: ${endpoint} for ${isStudent || isMember ? 'student/member request' : 'admin/instructor creation'}`)

      // Debug current student ID values
      console.log('Student ID from state:', studentId);
      console.log('Selected Student ID:', selectedStudentId);
      console.log('User role:', userRole);

      // Find the student ID for the current user
      let finalStudentId = selectedStudentId;

      // For student and member users, use the student ID that was set from user data
      if (isStudent || isMember) {
        if (studentId) {
          console.log('Using student ID from user data:', studentId);
          finalStudentId = studentId;
        } else if (userId) {
          console.log('No student ID found, using user ID as fallback:', userId);
          finalStudentId = userId;
        } else {
          console.error('❌ Student/member user but no student ID or user ID found');
          toast.error("Unable to determine your student record. Please contact support.");
          return;
        }
      }

      console.log('Final student ID to use:', finalStudentId);

      // Log students array for debugging
      console.log('Available students:', JSON.stringify(students.map(s => ({ 
        id: s._id, 
        name: s.user_id ? `${s.user_id.first_name} ${s.user_id.last_name}` : 'unknown' 
      }))));

      // Determine which field to use in the request
      const isUsingUserId = (isStudent || isMember) && !studentId && userId && finalStudentId === userId;
      const requestField = isUsingUserId ? 'user_id' : 'student_id';

      console.log(`Using ${requestField} in request:`, finalStudentId);

      const requestBody = {
        plane_id: selectedPlaneId,
        [requestField]: finalStudentId,  // Use the appropriate field name
        scheduled_start_time: scheduledStartTime.toISOString(),
        scheduled_end_time: scheduledEndTime.toISOString(),
        ...(!isMember && { instructor_id: selectedInstructorId }), // Members don't need instructor
        ...(!isMember && { flight_type: flightType }), // Members don't need flight type
        ...(isStudent || isMember
          ? { request_notes: notes } // Students/members send request_notes
          : { status: "scheduled", notes: notes } // Admins/instructors send status and notes
        )
      }

      console.log(`Sending ${isStudent || isMember ? 'flight request' : 'flight creation'} to endpoint: ${endpoint}`)
      console.log('Request payload:', JSON.stringify(requestBody))

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify(requestBody),
        credentials: "include"
      })

      if (!response.ok) {
        console.error(`API request failed with status: ${response.status}`)
        let errorData = {}
        try {
          errorData = await response.json()
          console.error('Error response:', errorData)
        } catch (e) {
          console.error('Could not parse error response as JSON')
        }
        const errorMessage = (errorData as any).message || (errorData as any).error || `Failed to ${isStudent || isMember ? 'request' : 'create'} flight (${response.status})`
        throw new Error(errorMessage)
      }

      const successMessage = (isStudent || isMember)
        ? "Flight request submitted successfully" 
        : "Flight scheduled successfully"
      toast.success(successMessage)
      onFlightCreated()
      onOpenChange(false)
      
      // Reset form
      setSelectedPlaneId("")
      if (!isStudent && !isMember) {
        setSelectedStudentId("")
      }
      if (!isMember) {
        setSelectedInstructorId("")
        setFlightType("")
      }
      setDate(undefined)
      setStartTime("")
      setEndTime("")
      setNotes("")
    } catch (error) {
      console.error("Error creating schedule:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create schedule"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{userRole === 'student' || userRole === 'member' || userRole === 'club_admin' ? 'Request New Flight' : 'Schedule New Flight'}</DialogTitle>
          <DialogDescription>
            {userRole === 'student' || userRole === 'member' || userRole === 'club_admin' ? (
              "Submit a flight request. An instructor will review and schedule your flight."
            ) : (
              "Schedule a new flight for a student or member."
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Column - People & Aircraft */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-semibold">Student</Label>
                </div>
                {userRole === 'student' || userRole === 'member' || userRole === 'club_admin' ? (
                  // Read-only display for students and members
                  <div className="w-full p-3 bg-muted/50 rounded-md border text-sm">
                    {currentUserName || "You"}
                  </div>
                ) : (
                  // Editable dropdown for admins/instructors
                  <Popover open={isStudentPopoverOpen} onOpenChange={setIsStudentPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isStudentPopoverOpen}
                        className="w-full justify-between text-sm font-normal"
                      >
                        <span className="truncate">
                          {selectedStudentId ? 
                            students.find(s => s._id === selectedStudentId && s.user_id?.first_name && s.user_id?.last_name) ? 
                              `${students.find(s => s._id === selectedStudentId)?.user_id.first_name} ${students.find(s => s._id === selectedStudentId)?.user_id.last_name}`
                              : "Select student"
                            : "Select student"
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
                            {students && students.length > 0 ? (
                              students
                                .filter((student) => student.user_id?.first_name && student.user_id?.last_name)
                                .map((student) => (
                                  <CommandItem
                                    key={`student-${student._id}`}
                                    value={student.user_id.first_name}
                                    onSelect={() => {
                                      setSelectedStudentId(student._id)
                                      setIsStudentPopoverOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedStudentId === student._id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {student.user_id.first_name} {student.user_id.last_name}
                                  </CommandItem>
                                ))
                            ) : (
                              <CommandItem value="no-students" disabled>
                                No students available
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </CardContent>
            </Card>

            {/* Instructor Selection - Hidden for students and members/club admins */}
            {userRole !== 'student' && userRole !== 'member' && userRole !== 'club_admin' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-semibold">Instructor</Label>
                </div>
                <Select
                  value={selectedInstructorId}
                  onValueChange={setSelectedInstructorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors
                      .filter((instructor) => instructor.user_id?.first_name && instructor.user_id?.last_name)
                      .map((instructor) => (
                        <SelectItem key={instructor._id} value={instructor._id}>
                          {instructor.user_id.first_name} {instructor.user_id.last_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Flight Type Selection - Hidden for students and members/club admins */}
            {userRole !== 'student' && userRole !== 'member' && userRole !== 'club_admin' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Plane className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-semibold">Flight Type</Label>
                </div>
                <Select
                  value={flightType}
                  onValueChange={setFlightType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select flight type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Training">Training</SelectItem>
                    <SelectItem value="Solo">Solo</SelectItem>
                    <SelectItem value="Cross Country">Cross Country</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                    <SelectItem value="Instrument">Instrument</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Plane className="h-4 w-4 text-purple-600" />
                  <Label className="text-sm font-semibold">Aircraft</Label>
                </div>
                <Popover open={isPlanePopoverOpen} onOpenChange={setIsPlanePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isPlanePopoverOpen}
                      className="w-full justify-between text-sm font-normal"
                    >
                      <span className="truncate">
                        {selectedPlaneId ? 
                          planes.find(p => p.id === selectedPlaneId) ? 
                            (() => {
                              const plane = planes.find(p => p.id === selectedPlaneId)
                              const model = plane?.aircraftModel || ''
                              return `${plane?.registration} - ${plane?.type} ${model}`.trim()
                            })()
                            : "Select aircraft"
                          : "Select aircraft"
                        }
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
                          {isLoadingData ? (
                            <div className="flex items-center gap-2 p-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading planes...
                            </div>
                          ) : planes && planes.length > 0 ? (
                                                        planes
                              .filter((plane) => plane.id && plane.registration) // Filter out invalid planes
                              .map((plane) => {
                                const model = plane.aircraftModel || ''
                                const displayText = `${plane.registration} - ${plane.type} ${model}`.trim()
                                return (
                                  <CommandItem
                                    key={`plane-${plane.id}`}
                                    value={plane.registration}
                                    onSelect={() => {
                                      setSelectedPlaneId(plane.id)
                                      setIsPlanePopoverOpen(false)
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedPlaneId === plane.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {displayText}
                                  </CommandItem>
                                )
                              })
                          ) : (
                            <CommandItem value="no-planes" disabled>
                              No aircraft available
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Schedule Details */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIconLucide className="h-4 w-4 text-orange-600" />
                  <Label className="text-sm font-semibold">Date</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-green-600" />
                  <Label className="text-sm font-semibold">Start Time</Label>
                </div>
                <TimePicker
                  time={startTime}
                  setTime={(time) => time !== null && setStartTime(time)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <Label className="text-sm font-semibold">End Time</Label>
                </div>
                <TimePicker
                  time={endTime}
                  setTime={(time) => time !== null && setEndTime(time)}
                />
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-gray-600" />
                  <Label className="text-sm font-semibold">{userRole === 'student' || userRole === 'member' || userRole === 'club_admin' ? 'Request Notes' : 'Notes'}</Label>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={userRole === 'student' || userRole === 'member' || userRole === 'club_admin' ? "Describe your training needs or special requests..." : "Optional notes"}
                  rows={3}
                  className="resize-none"
                  maxLength={500}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !date || !selectedPlaneId || !startTime || !endTime || (userRole !== 'member' && userRole !== 'club_admin' && (!selectedInstructorId || !flightType))}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {userRole === 'student' || userRole === 'member' || userRole === 'club_admin' ? 'Submitting...' : 'Creating...'}
              </>
            ) : (
              userRole === 'student' || userRole === 'member' || userRole === 'club_admin' ? 'Submit Request' : 'Create Flight'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 