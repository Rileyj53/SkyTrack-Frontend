"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { toast } from "sonner"
import { CalendarIcon, Loader2, Trash2 } from "lucide-react"

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
  id: string
  registration: string
  type: string
  model: string
  year: number
  status: string
  location: string
  notes: string
}

interface Schedule {
  _id: string
  date: string
  start_time: string
  end_time: string
  flight_type: string
  status: string
  student_id: string
  instructor_id: string
  plane_id: string
  notes: string
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
  const [startTime, setStartTime] = useState(schedule?.start_time || "")
  const [endTime, setEndTime] = useState(schedule?.end_time || "")
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [planes, setPlanes] = useState<Plane[]>([])
  const [selectedPlaneId, setSelectedPlaneId] = useState(schedule?.plane_id || "")
  const [flightType, setFlightType] = useState(schedule?.flight_type || "")
  const [notes, setNotes] = useState(schedule?.notes || "")
  const [selectedInstructorId, setSelectedInstructorId] = useState(schedule?.instructor_id || "")
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [date, setDate] = useState<Date | undefined>(() => {
    if (!schedule?.date) return undefined;
    // Get YYYY-MM-DD from the string and construct date parts
    const [year, month, day] = schedule.date.substring(0, 10).split('-').map(Number);
    // Create date with explicit year/month/day in local time
    return new Date(year, month - 1, day);
  })

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
      setStartTime(schedule.start_time)
      setEndTime(schedule.end_time)
      setSelectedPlaneId(schedule.plane_id)
      setFlightType(schedule.flight_type)
      setNotes(schedule.notes)
      setSelectedInstructorId(schedule.instructor_id)
    }
  }, [schedule])

  // Update date when schedule changes
  useEffect(() => {
    if (schedule?.date) {
      // Get YYYY-MM-DD from the string and construct date parts
      const [year, month, day] = schedule.date.substring(0, 10).split('-').map(Number);
      // Create date with explicit year/month/day in local time
      setDate(new Date(year, month - 1, day));
    }
  }, [schedule?.date])

  const fetchPlanes = async () => {
    try {
      setIsLoadingData(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.API_KEY

      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      const response = await fetch(
        `${process.env.API_URL}/schools/${schoolId}/planes`,
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
      const apiKey = process.env.API_KEY

      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      const response = await fetch(
        `${process.env.API_URL}/schools/${schoolId}/instructors`,
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
      setInstructors(data)
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
      const apiKey = process.env.API_KEY

      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      // Format the date in YYYY-MM-DD format without timezone conversion
      const formattedDate = format(date, "yyyy-MM-dd")

      const response = await fetch(
        `${process.env.API_URL}/schools/${schoolId}/schedules/${schedule._id}`,
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
            date: formattedDate,
            start_time: startTime,
            end_time: endTime,
            plane_id: selectedPlaneId,
            flight_type: flightType,
            notes: notes,
            instructor_id: selectedInstructorId
          }),
          credentials: "include"
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update schedule")
      }

      toast.success("Schedule updated successfully")
      onScheduleUpdate()
      onOpenChange(false)
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
      const apiKey = process.env.API_KEY

      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      const response = await fetch(
        `${process.env.API_URL}/schools/${schoolId}/schedules/${schedule._id}`,
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
      onScheduleUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting schedule:", error)
      toast.error("Failed to delete schedule")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!schedule || !student || !instructor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Flight Schedule</DialogTitle>
          <DialogDescription>
            {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Student</Label>
            <div className="text-sm">
              {student.user_id.first_name} {student.user_id.last_name}
            </div>
          </div>
          {isEditing ? (
            <>
              <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label>Instructor</Label>
                <Select 
                  value={selectedInstructorId} 
                  onValueChange={setSelectedInstructorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructor" />
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
              <div className="grid gap-2">
                <Label>Plane</Label>
                <Select 
                  value={selectedPlaneId} 
                  onValueChange={setSelectedPlaneId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plane" />
                  </SelectTrigger>
                  <SelectContent>
                    {planes.map((plane) => (
                      <SelectItem key={plane.id} value={plane.id}>
                        {plane.registration} - {plane.model} ({plane.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="flight-type">Flight Type</Label>
                <Input
                  id="flight-type"
                  value={flightType}
                  onChange={(e) => setFlightType(e.target.value)}
                  placeholder="Enter flight type (e.g., Dual, Solo, Checkride)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="start-time">Start Time</Label>
                <TimePicker
                  time={startTime}
                  setTime={(time) => time !== null && setStartTime(time)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-time">End Time</Label>
                <TimePicker
                  time={endTime}
                  setTime={(time) => time !== null && setEndTime(time)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this flight..."
                  className="min-h-[100px]"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label>Instructor</Label>
                <div className="text-sm">
                  {instructor.user_id.first_name} {instructor.user_id.last_name}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Plane</Label>
                <div className="text-sm">
                  {isLoadingData ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading planes...
                    </div>
                  ) : planes && planes.length > 0 
                    ? (planes.find(p => p.id === schedule.plane_id)?.registration || 'Unknown plane')
                    : 'No planes available'}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Time</Label>
                <div className="text-sm">
                  {format(new Date(`2000-01-01T${schedule.start_time}`), "h:mm a")} - {format(new Date(`2000-01-01T${schedule.end_time}`), "h:mm a")}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <div className="text-sm capitalize">
                  {schedule.status}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Flight Type</Label>
                <div className="text-sm capitalize">
                  {schedule.flight_type}
                </div>
              </div>
              {schedule.notes && (
                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <div className="text-sm whitespace-pre-wrap">
                    {schedule.notes}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter className="flex justify-between">
          {isEditing ? (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false)
                    setShowDeleteConfirm(false)
                  }}
                  disabled={loading || isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={loading || isDeleting || !date}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
              {showDeleteConfirm ? (
                <div className="flex gap-2">
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
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Confirm Delete
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading || isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
            >
              Edit Schedule
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 