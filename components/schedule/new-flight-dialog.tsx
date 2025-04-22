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
    console.log("NewFlightDialog - Students received:", students)
    console.log("NewFlightDialog - Instructors received:", instructors)
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
    if (!date || !selectedPlaneId || !selectedStudentId || !selectedInstructorId || !startTime || !endTime) {
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

      // Format the date in YYYY-MM-DD format without timezone conversion
      const formattedDate = format(date, "yyyy-MM-dd")

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/schedules`,
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
            school_id: schoolId,
            plane_id: selectedPlaneId,
            instructor_id: selectedInstructorId,
            student_id: selectedStudentId,
            date: formattedDate,
            start_time: startTime,
            end_time: endTime,
            flight_type: flightType,
            status: "scheduled",
            notes: notes
          }),
          credentials: "include"
        }
      )

      if (!response.ok) {
        throw new Error("Failed to create schedule")
      }

      toast.success("Flight scheduled successfully")
      onFlightCreated()
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating schedule:", error)
      toast.error("Failed to create schedule")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule New Flight</DialogTitle>
          <DialogDescription>
            {date ? format(date, "EEEE, MMMM d, yyyy") : "Select a date"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
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
            <Label>Student</Label>
            <Select 
              value={selectedStudentId} 
              onValueChange={setSelectedStudentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students && students.length > 0 ? (
                  students.map((student) => (
                    <SelectItem key={student._id} value={student._id}>
                      {student.user_id.first_name} {student.user_id.last_name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>No students available</SelectItem>
                )}
              </SelectContent>
            </Select>
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
                {(instructors || []).map((instructor) => (
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
                {isLoadingData ? (
                  <div className="flex items-center gap-2 p-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading planes...
                  </div>
                ) : planes.map((plane) => (
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
            <Label>Time</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <TimePicker
                  time={startTime}
                  setTime={(time) => time !== null && setStartTime(time)}
                />
              </div>
              <div className="flex-1">
                <TimePicker
                  time={endTime}
                  setTime={(time) => time !== null && setEndTime(time)}
                />
              </div>
            </div>
          </div>
          <div className="col-span-2 grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this flight..."
              className="min-h-[80px]"
            />
          </div>
        </div>
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
            disabled={loading || !date || !selectedPlaneId || !selectedStudentId || !selectedInstructorId || !startTime || !endTime}
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