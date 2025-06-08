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
  model: string
  year: number
  status: string
  location: string
  notes: string
}

interface NewFlightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFlightCreated: () => void
  students: Student[]
  instructors: Instructor[]
  initialDate?: Date
}

export function NewFlightDialog({ 
  open, 
  onOpenChange,
  onFlightCreated,
  students,
  instructors,
  initialDate
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

  useEffect(() => {
    if (open) {
      fetchPlanes()
    }
  }, [open, students, instructors])

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

  const handleCreate = async () => {
    if (!date || !selectedPlaneId || !selectedStudentId || !selectedInstructorId || !startTime || !endTime || !flightType) {
      toast.error("Please fill in all required fields")
      return
    }

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
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule`,
        {
          method: "POST",
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
            student_id: selectedStudentId,
            scheduled_start_time: scheduledStartTime.toISOString(),
            scheduled_end_time: scheduledEndTime.toISOString(),
            flight_type: flightType,
            status: "scheduled",
            notes: notes
          }),
          credentials: "include"
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.message || errorData.error || `Failed to create schedule (${response.status})`
        throw new Error(errorMessage)
      }

      toast.success("Flight scheduled successfully")
      onFlightCreated()
      onOpenChange(false)
      
      // Reset form
      setSelectedPlaneId("")
      setSelectedStudentId("")
      setSelectedInstructorId("")
      setDate(undefined)
      setStartTime("")
      setEndTime("")
      setFlightType("")
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
          <DialogTitle>Schedule New Flight</DialogTitle>
          <DialogDescription>
            {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
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
                                  value={`${student.user_id.first_name} ${student.user_id.last_name}`}
                                  onSelect={() => setSelectedStudentId(student._id)}
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
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="h-4 w-4 text-green-600" />
                  <Label className="text-sm font-semibold">Instructor</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between text-sm font-normal"
                    >
                      <span className="truncate">
                        {selectedInstructorId ? 
                          instructors.find(i => i._id === selectedInstructorId && i.user_id?.first_name && i.user_id?.last_name) ? 
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
                            instructors
                              .filter((instructor) => instructor.user_id?.first_name && instructor.user_id?.last_name)
                              .map((instructor) => (
                                <CommandItem
                                  key={`instructor-${instructor._id}`}
                                  value={`${instructor.user_id.first_name} ${instructor.user_id.last_name}`}
                                  onSelect={() => setSelectedInstructorId(instructor._id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedInstructorId === instructor._id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {instructor.user_id.first_name} {instructor.user_id.last_name}
                                </CommandItem>
                              ))
                          ) : (
                            <CommandItem value="no-instructors" disabled>
                              No instructors available
                            </CommandItem>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Plane className="h-4 w-4 text-purple-600" />
                  <Label className="text-sm font-semibold">Aircraft</Label>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between text-sm font-normal"
                    >
                      <span className="truncate">
                        {selectedPlaneId ? 
                          planes.find(p => p.id === selectedPlaneId) ? 
                            (() => {
                              const plane = planes.find(p => p.id === selectedPlaneId)
                              return `${plane?.registration} - ${plane?.type} ${plane?.model}`
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
                            planes.map((plane) => {
                              const displayText = `${plane.registration} - ${plane.type} ${plane.model}`
                              return (
                                <CommandItem
                                  key={`plane-${plane.id}`}
                                  value={displayText}
                                  onSelect={() => setSelectedPlaneId(plane.id)}
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

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-pink-600" />
                  <Label className="text-sm font-semibold">Flight Type</Label>
                </div>
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
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={3}
              className="resize-none"
              maxLength={500}
            />
          </CardContent>
        </Card>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading || !date || !selectedPlaneId || !selectedStudentId || !selectedInstructorId || !startTime || !endTime || !flightType}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Flight'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 