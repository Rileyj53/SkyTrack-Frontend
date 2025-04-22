"use client"

import { useState, useEffect } from "react"
import { format, addDays, addWeeks, addMonths, startOfWeek } from "date-fns"
import { CalendarIcon, ChevronLeft, ChevronRight, Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NewFlightDialog } from "@/components/schedule/new-flight-dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

interface ScheduleHeaderProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  view: "day" | "week" | "month"
  onViewChange: (view: "day" | "week" | "month") => void
  students: any[]
  instructors: any[]
  onFlightCreated: () => void
  filters: {
    student: string
    instructor: string
    status: string
  }
  onFilterChange: (filters: {
    student: string
    instructor: string
    status: string
  }) => void
}

export function ScheduleHeader({ 
  currentDate, 
  onDateChange, 
  view, 
  onViewChange,
  students,
  instructors,
  onFlightCreated,
  filters,
  onFilterChange
}: ScheduleHeaderProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isNewFlightOpen, setIsNewFlightOpen] = useState(false)

  useEffect(() => {
    console.log("ScheduleHeader - Students received:", students)
    console.log("ScheduleHeader - Instructors received:", instructors)
  }, [students, instructors])

  // Format the date display based on the current view
  const getDateDisplay = () => {
    if (view === "day") {
      return format(currentDate, "MMMM d, yyyy")
    } else if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 6 }) // Start from Saturday
      const weekEnd = addDays(weekStart, 6) // End on Friday
      return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`
    } else {
      return format(currentDate, "MMMM yyyy")
    }
  }

  // Navigation functions
  const goToPrevious = () => {
    if (view === "day") {
      onDateChange(addDays(currentDate, -1))
    } else if (view === "week") {
      onDateChange(addDays(currentDate, -7))
    } else {
      onDateChange(addMonths(currentDate, -1))
    }
  }

  const goToNext = () => {
    if (view === "day") {
      onDateChange(addDays(currentDate, 1))
    } else if (view === "week") {
      onDateChange(addDays(currentDate, 7))
    } else {
      onDateChange(addMonths(currentDate, 1))
    }
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={goToPrevious}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="min-w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {getDateDisplay()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date)
                  setIsCalendarOpen(false)
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" onClick={goToNext}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next</span>
        </Button>
        <Button variant="ghost" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
              {Object.values(filters).some(v => v !== "") && (
                <Badge variant="secondary" className="ml-2">
                  {Object.values(filters).filter(v => v !== "").length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuLabel>Filter Schedules</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <div className="p-2 space-y-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select
                  value={filters.student}
                  onValueChange={(value) => onFilterChange({ ...filters, student: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
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

              <div className="space-y-2">
                <Label>Instructor</Label>
                <Select
                  value={filters.instructor}
                  onValueChange={(value) => onFilterChange({ ...filters, instructor: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Instructors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Instructors</SelectItem>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor._id} value={instructor._id}>
                        {instructor.user_id.first_name} {instructor.user_id.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => onFilterChange({ ...filters, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => onFilterChange({
                    student: "all",
                    instructor: "all",
                    status: "all"
                  })}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Select value={view} onValueChange={(value: "day" | "week" | "month") => onViewChange(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>View</SelectLabel>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button onClick={() => setIsNewFlightOpen(true)}>
          New Flight
        </Button>

        <NewFlightDialog
          open={isNewFlightOpen}
          onOpenChange={setIsNewFlightOpen}
          onFlightCreated={() => {
            onFlightCreated()
            setIsNewFlightOpen(false)
          }}
          students={students}
          instructors={instructors}
          initialDate={currentDate}
        />
      </div>
    </div>
  )
}
