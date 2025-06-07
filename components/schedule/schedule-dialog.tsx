"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { 
  CalendarIcon, 
  Loader2, 
  Trash2, 
  User, 
  UserCheck, 
  Plane, 
  Clock, 
  Calendar as CalendarIconLucide,
  FileText,
  Tag,
  ChevronsUpDown,
  Check,
  AlertTriangle
} from "lucide-react"

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
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

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
  _id: string
  registration: string
  type: string
  model?: string
  status: string
}

interface Schedule {
  _id: string
  school_id: {
    _id: string
    name: string
  }
  plane_id: {
    _id: string
    registration: string
    type?: string
    model?: string
  }
  instructor_id: {
    _id: string
    user_id: {
      first_name: string
      last_name: string
    }
  }
  student_id: {
    _id: string
    user_id: {
      first_name: string
      last_name: string
    }
  }
  scheduled_start_time: string
  scheduled_end_time: string
  scheduled_duration: number
  flight_type: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
}

interface ScheduleDialogProps {
  schedule: Schedule | null
  student: Student | null
  instructor: Instructor | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onScheduleUpdate: () => void
}

export function ScheduleDialog({ 
  schedule, 
  student, 
  instructor, 
  open, 
  onOpenChange,
  onScheduleUpdate 
}: ScheduleDialogProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [duration, setDuration] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [conflictError, setConflictError] = useState<string | null>(null)
  const [planes, setPlanes] = useState<Plane[]>([])
  const [selectedPlaneId, setSelectedPlaneId] = useState("")
  const [flightType, setFlightType] = useState("")
  const [notes, setNotes] = useState("")
  const [selectedInstructorId, setSelectedInstructorId] = useState("")

  // Sanitize notes input to prevent XSS
  const sanitizeInput = (input: string) => {
    // Remove script tags, event handlers, and other potentially dangerous content
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/data:/gi, '')
      .trim()
  }

  const handleNotesChange = (value: string) => {
    const sanitized = sanitizeInput(value)
    setNotes(sanitized)
  }
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [date, setDate] = useState<Date | undefined>(undefined)



  // Fetch planes when dialog opens
  useEffect(() => {
    if (open) {
      fetchPlanes()
      fetchInstructors()
    }
  }, [open])

  // Update state when schedule changes
  useEffect(() => {
    if (schedule) {
      // Convert UTC scheduled_start_time to local date and time
      const startDateTime = new Date(schedule.scheduled_start_time)
      const endDateTime = new Date(startDateTime.getTime() + schedule.scheduled_duration * 60 * 60 * 1000)
      setDate(startDateTime)
      setStartTime(format(startDateTime, 'HH:mm'))
      setEndTime(format(endDateTime, 'HH:mm'))
      setDuration(schedule.scheduled_duration)
      setSelectedPlaneId(schedule.plane_id._id || schedule.plane_id.id)
      setFlightType(schedule.flight_type)
      setNotes(schedule.notes || "")
      setSelectedInstructorId(schedule.instructor_id._id)
    }
  }, [schedule])

  // Exit editing mode when dialog closes
  useEffect(() => {
    if (!open && isEditing) {
      setIsEditing(false)
      setConflictError(null) // Clear conflict errors when dialog closes
    }
  }, [open, isEditing])

  // Clear conflict error when starting to edit
  useEffect(() => {
    if (isEditing) {
      setConflictError(null)
    }
  }, [isEditing])

  const fetchPlanes = async () => {
    try {
      setIsLoadingData(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY

      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes`,
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
      setPlanes(Array.isArray(data.planes) ? data.planes : [])
    } catch (error) {
      console.error("Error fetching planes:", error)
      toast.error("Failed to load planes")
      setPlanes([])
    } finally {
      setIsLoadingData(false)
    }
  }

  const fetchInstructors = async () => {
    try {
      setIsLoadingData(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY

      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/instructors`,
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
        throw new Error("Failed to fetch instructors")
      }

      const data = await response.json()
      // Handle both possible response formats
      if (Array.isArray(data)) {
        setInstructors(data)
      } else if (data.instructors && Array.isArray(data.instructors)) {
        setInstructors(data.instructors)
      } else {
        setInstructors([])
      }
    } catch (error) {
      console.error("Error fetching instructors:", error)
      toast.error("Failed to load instructors")
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSave = async () => {
    if (!schedule || !date) return

    try {
      setLoading(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY

      if (!schoolId || !token || !apiKey) {
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

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule/${schedule._id}`,
        {
          method: "PUT",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "Authorization": `Bearer ${token}`,
            "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify({
            plane_id: selectedPlaneId,
            instructor_id: selectedInstructorId,
            student_id: schedule.student_id._id,
            scheduled_start_time: scheduledStartTime.toISOString(),
            scheduled_end_time: scheduledEndTime.toISOString(),
            flight_type: flightType,
            status: schedule.status,
            notes: notes
          }),
          credentials: "include"
        }
      )

      if (!response.ok) {
        if (response.status === 409) {
          // Handle scheduling conflict
          let conflictMessage = "Scheduling conflict detected."
          try {
            const errorData = await response.json()
            if (errorData.message) {
              conflictMessage = errorData.message
            } else if (errorData.error) {
              conflictMessage = errorData.error
            } else if (errorData.details) {
              conflictMessage = errorData.details
            }
          } catch (parseError) {
            console.error("Error parsing conflict response:", parseError)
          }
          setConflictError(conflictMessage)
          toast.error("Scheduling conflict detected")
          return
        } else if (response.status === 400) {
          // Handle validation errors (like invalid time range)
          let validationMessage = "Invalid schedule data."
          try {
            const errorData = await response.json()
            if (errorData.error) {
              validationMessage = errorData.error
            } else if (errorData.message) {
              validationMessage = errorData.message
            } else if (errorData.details) {
              validationMessage = errorData.details
            }
          } catch (parseError) {
            console.error("Error parsing validation response:", parseError)
          }
          setConflictError(validationMessage)
          toast.error("Invalid schedule data")
          return
        } else {
          throw new Error(`Failed to update schedule: ${response.status} ${response.statusText}`)
        }
      }

      toast.success("Schedule updated successfully")
      setIsEditing(false)
      setConflictError(null) // Clear any previous conflict errors
      onScheduleUpdate()
    } catch (error) {
      console.error("Error updating schedule:", error)
      toast.error("Failed to update schedule")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!schedule) return

    try {
      setIsDeleting(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY

      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule/${schedule._id}`,
        {
          method: "DELETE",
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
        throw new Error("Failed to delete schedule")
      }

      toast.success("Schedule deleted successfully")
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onScheduleUpdate()
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast.error("Failed to delete schedule")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!schedule) return null

  const formatDisplayTime = (dateTimeString: string) => {
    const dateTime = new Date(dateTimeString)
    return format(dateTime, 'h:mm a')
  }

  const formatDisplayDate = (dateTimeString: string) => {
    const dateTime = new Date(dateTimeString)
    return format(dateTime, 'MMM d, yyyy')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl border-0">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIconLucide className="h-5 w-5 text-blue-600" />
                Flight Schedule
              </div>
              {!isEditing && (
                <div className="flex gap-2 mr-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Error Alert */}
          {conflictError && (
            <Alert variant="destructive" className="mx-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <div className="font-medium mb-1">
                  {conflictError.toLowerCase().includes('conflict') ? 'Scheduling Conflict' : 
                   conflictError.toLowerCase().includes('end time') ? 'Invalid Time Range' : 
                   'Schedule Error'}
                </div>
                <div className="text-xs opacity-90">
                  {conflictError.toLowerCase().includes('end time') ? 
                    'End time must be after start time' :
                    conflictError.toLowerCase().includes('conflict') ?
                      'A resource is already scheduled during this time' :
                      conflictError
                  }
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - People & Aircraft */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-semibold">Student</Label>
                  </div>
                  <p className="text-sm font-medium">
                    {student ? `${student.user_id.first_name} ${student.user_id.last_name}` : 'Loading...'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <UserCheck className="h-4 w-4 text-green-600" />
                    <Label className="text-sm font-semibold">Instructor</Label>
                  </div>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between text-sm font-normal"
                        >
                          <span className="truncate">
                            {selectedInstructorId ? 
                              instructors.find(i => i._id === selectedInstructorId)?.user_id ? 
                                `${instructors.find(i => i._id === selectedInstructorId)?.user_id.first_name} ${instructors.find(i => i._id === selectedInstructorId)?.user_id.last_name}`
                                : "Select instructor"
                              : "Select instructor"
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
                              {instructors && instructors.length > 0 ? (
                                instructors.map((inst) => (
                                  <CommandItem
                                    key={`instructor-${inst._id}`}
                                    value={`${inst.user_id.first_name} ${inst.user_id.last_name}`}
                                    onSelect={() => setSelectedInstructorId(inst._id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedInstructorId === inst._id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {inst.user_id.first_name} {inst.user_id.last_name}
                                  </CommandItem>
                                ))
                              ) : (
                                <CommandItem value="no-instructors" disabled>
                                  {isLoadingData ? "Loading instructors..." : "No instructors available"}
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <p className="text-sm font-medium">
                      {instructor ? `${instructor.user_id.first_name} ${instructor.user_id.last_name}` : 'Loading...'}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Plane className="h-4 w-4 text-purple-600" />
                    <Label className="text-sm font-semibold">Aircraft</Label>
                  </div>
                  {isEditing ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between text-sm font-normal"
                        >
                          <span className="truncate">
                            {selectedPlaneId ? 
                              planes.find(p => p._id === selectedPlaneId || p.id === selectedPlaneId) ? 
                                (() => {
                                  const plane = planes.find(p => p._id === selectedPlaneId || p.id === selectedPlaneId)
                                  const typeModel = [plane?.type, plane?.model].filter(Boolean).join(' ')
                                  return `${plane?.registration} - ${typeModel}`
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
                              {planes && planes.length > 0 ? (
                                planes.map((plane) => {
                                  const planeId = plane._id || plane.id
                                  const typeModel = [plane.type, plane.model].filter(Boolean).join(' ')
                                  const displayText = `${plane.registration} - ${typeModel}`
                                  return (
                                    <CommandItem
                                      key={`plane-${planeId}`}
                                      value={displayText}
                                      onSelect={() => setSelectedPlaneId(planeId)}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedPlaneId === planeId ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {displayText}
                                    </CommandItem>
                                  )
                                })
                              ) : (
                                <CommandItem value="no-planes" disabled>
                                  {isLoadingData ? "Loading aircraft..." : "No aircraft available"}
                                </CommandItem>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">{schedule.plane_id.registration}</p>
                      <p className="text-xs text-muted-foreground">{schedule.plane_id.type} {schedule.plane_id.model || ''}</p>
                    </div>
                  )}
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
                  {isEditing ? (
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
                  ) : (
                    <p className="text-sm font-medium">{formatDisplayDate(schedule.scheduled_start_time)}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-green-600" />
                    <Label className="text-sm font-semibold">Start Time</Label>
                  </div>
                  {isEditing ? (
                    <TimePicker
                      time={startTime}
                      setTime={setStartTime}
                    />
                  ) : (
                    <p className="text-sm font-medium">{formatDisplayTime(schedule.scheduled_start_time)}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <Label className="text-sm font-semibold">End Time</Label>
                  </div>
                  {isEditing ? (
                    <TimePicker
                      time={endTime}
                      setTime={setEndTime}
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {formatDisplayTime(new Date(new Date(schedule.scheduled_start_time).getTime() + schedule.scheduled_duration * 60 * 60 * 1000).toISOString())}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    <Label className="text-sm font-semibold">Duration</Label>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.25"
                        min="0.25"
                        max="8"
                        value={duration}
                        className="w-24 bg-muted/50"
                        readOnly
                        disabled
                      />
                      <span className="text-xs text-muted-foreground">hours (calculated by backend)</span>
                    </div>
                  ) : (
                    <p className="text-sm font-medium">{schedule.scheduled_duration} hours</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-pink-600" />
                    <Label className="text-sm font-semibold">Flight Type</Label>
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={flightType}
                        onChange={(e) => setFlightType(e.target.value)}
                        placeholder="Enter flight type..."
                        className="w-full"
                      />
                      <div className="flex flex-wrap gap-1">
                        {["Training", "Solo", "Checkride", "Cross-Country", "Maintenance"].map((type) => (
                          <Button
                            key={type}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setFlightType(type)}
                            className="h-6 px-2 text-xs"
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-sm">
                      {schedule.flight_type}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Notes Section */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-gray-600" />
                <Label className="text-sm font-semibold">Notes</Label>
              </div>
              {isEditing ? (
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Optional notes"
                  rows={3}
                  className="resize-none"
                  maxLength={500}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {schedule.notes || 'No notes added'}
                </p>
              )}
            </CardContent>
          </Card>

          {isEditing && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading || !date}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Flight Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this flight schedule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><strong>Student:</strong> {student ? `${student.user_id.first_name} ${student.user_id.last_name}` : 'Loading...'}</p>
            <p><strong>Date:</strong> {formatDisplayDate(schedule.scheduled_start_time)}</p>
            <p><strong>Time:</strong> {formatDisplayTime(schedule.scheduled_start_time)}</p>
            <p><strong>Aircraft:</strong> {schedule.plane_id.registration}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 