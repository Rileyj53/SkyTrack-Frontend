"use client"

// Simple format function to replace date-fns format
const format = (date: Date, formatStr: string) => {
  const options: Intl.DateTimeFormatOptions = {}

  if (formatStr.includes("yyyy")) {
    options.year = "numeric"
  }

  if (formatStr.includes("MMMM")) {
    options.month = "long"
  } else if (formatStr.includes("MMM")) {
    options.month = "short"
  } else if (formatStr.includes("MM")) {
    options.month = "2-digit"
  }

  if (formatStr.includes("d")) {
    options.day = "numeric"
  }

  if (formatStr.includes("EEEE")) {
    options.weekday = "long"
  } else if (formatStr.includes("EEE")) {
    options.weekday = "short"
  }

  return new Intl.DateTimeFormat("en-US", options).format(date)
}

import { Plane, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"
import { MonthView } from "@/components/schedule/month-view"
import { WeekView } from "@/components/schedule/week-view"
import { DayView } from "@/components/schedule/day-view"

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

interface Schedule {
  _id: string
  school_id: string
  plane_id: string
  instructor_id: string
  student_id: string
  date: string
  start_time: string
  end_time: string
  flight_type: string
  status: string
  notes: string
  created_by: string
  created_at: string
  updated_at: string
}

interface ScheduleCalendarProps {
  currentDate: Date
  view: "day" | "week" | "month"
  weekDays: Date[]
  schedules: Schedule[]
  students: Record<string, Student>
  instructors: Record<string, Instructor>
  onScheduleUpdate?: () => void
  onDateChange: (date: Date) => void
  onViewChange: (view: "day" | "week" | "month") => void
}

// Mock scheduled flights data
const scheduledFlights = [
  {
    id: "SCH-001",
    date: "2023-04-15",
    startTime: "09:00",
    endTime: "11:00",
    aircraft: "C172 (N12345)",
    student: "Alex Johnson",
    instructor: "Michael Smith",
    type: "Training",
    status: "Confirmed",
  },
  {
    id: "SCH-002",
    date: "2023-04-15",
    startTime: "13:00",
    endTime: "15:00",
    aircraft: "PA-28 (N54321)",
    student: "Sarah Williams",
    instructor: "Jennifer Davis",
    type: "Cross-Country",
    status: "Confirmed",
  },
  {
    id: "SCH-003",
    date: "2023-04-16",
    startTime: "10:00",
    endTime: "11:30",
    aircraft: "C152 (N67890)",
    student: "David Miller",
    instructor: "Michael Smith",
    type: "Training",
    status: "Confirmed",
  },
  {
    id: "SCH-004",
    date: "2023-04-16",
    startTime: "14:00",
    endTime: "16:00",
    aircraft: "C172 (N12345)",
    student: "Emily Brown",
    instructor: "Jennifer Davis",
    type: "Check Ride",
    status: "Pending",
  },
  {
    id: "SCH-005",
    date: "2023-04-17",
    startTime: "09:30",
    endTime: "12:30",
    aircraft: "PA-28 (N54321)",
    student: "James Wilson",
    instructor: "Robert Taylor",
    type: "Cross-Country",
    status: "Confirmed",
  },
  {
    id: "SCH-006",
    date: "2023-04-17",
    startTime: "13:30",
    endTime: "15:00",
    aircraft: "C152 (N67890)",
    student: "Alex Johnson",
    instructor: "Michael Smith",
    type: "Training",
    status: "Confirmed",
  },
  {
    id: "SCH-007",
    date: "2023-04-18",
    startTime: "11:00",
    endTime: "13:00",
    aircraft: "C172 (N12345)",
    student: "Sarah Williams",
    instructor: "Jennifer Davis",
    type: "Training",
    status: "Confirmed",
  },
  {
    id: "SCH-008",
    date: "2023-04-19",
    startTime: "10:00",
    endTime: "12:00",
    aircraft: "PA-28 (N54321)",
    student: "David Miller",
    instructor: "Robert Taylor",
    type: "Cross-Country",
    status: "Pending",
  },
  {
    id: "SCH-009",
    date: "2023-04-20",
    startTime: "14:00",
    endTime: "16:00",
    aircraft: "C152 (N67890)",
    student: "Emily Brown",
    instructor: "Michael Smith",
    type: "Check Ride",
    status: "Confirmed",
  },
  {
    id: "SCH-010",
    date: "2023-04-21",
    startTime: "09:00",
    endTime: "11:00",
    aircraft: "C172 (N12345)",
    student: "James Wilson",
    instructor: "Jennifer Davis",
    type: "Training",
    status: "Confirmed",
  },
]

// Time slots for the day view
const timeSlots = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 8 // Start at 8 AM
  return `${hour.toString().padStart(2, "0")}:00`
})

export function ScheduleCalendar({
  currentDate,
  view,
  weekDays,
  schedules,
  students,
  instructors,
  onScheduleUpdate,
  onDateChange,
  onViewChange
}: ScheduleCalendarProps) {
  
  // Debug logging
  console.log('ScheduleCalendar Props:', {
    currentDate,
    view,
    schedulesCount: schedules.length,
    schedules,
    studentsCount: Object.keys(students).length,
    instructorsCount: Object.keys(instructors).length
  })

  // Format date to string for comparison with scheduled flights
  const formatDateString = (date: Date) => {
    return format(date, "yyyy-MM-dd")
  }

  // Get flights for a specific date
  const getFlightsForDate = (date: Date) => {
    const dateString = formatDateString(date)
    return scheduledFlights.filter((flight) => flight.date === dateString)
  }

  // Get the time position for a flight (for day view)
  const getTimePosition = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    // Calculate position based on 8 AM (8:00) being the start (0%)
    const position = (((hours - 8) * 60 + minutes) / (12 * 60)) * 100
    return `${position}%`
  }

  // Get the duration height for a flight (for day view)
  const getDurationHeight = (startTime: string, endTime: string) => {
    const [startHours, startMinutes] = startTime.split(":").map(Number)
    const [endHours, endMinutes] = endTime.split(":").map(Number)

    const startMinutesTotal = startHours * 60 + startMinutes
    const endMinutesTotal = endHours * 60 + endMinutes
    const durationMinutes = endMinutesTotal - startMinutesTotal

    // Calculate height based on duration relative to the 12-hour day view
    return `${(durationMinutes / (12 * 60)) * 100}%`
  }

  // Get color class based on flight type
  const getFlightColorClass = (type: string) => {
    switch (type) {
      case "Training":
        return "bg-blue-100 border-blue-300 text-blue-800"
      case "Cross-Country":
        return "bg-green-100 border-green-300 text-green-800"
      case "Check Ride":
        return "bg-purple-100 border-purple-300 text-purple-800"
      case "Solo":
        return "bg-amber-100 border-amber-300 text-amber-800"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  // Render day view
  const renderDayView = () => {
    const flights = getFlightsForDate(currentDate)

    return (
      <div className="flex flex-col h-[600px] border rounded-md">
        <div className="flex border-b p-2 font-medium">
          <div className="w-16 text-center">Time</div>
          <div className="flex-1 text-center">{format(currentDate, "EEEE, MMMM d")}</div>
        </div>
        <div className="flex flex-1 overflow-y-auto">
          {/* Time labels */}
          <div className="w-16 flex flex-col border-r">
            {timeSlots.map((time) => (
              <div key={time} className="h-12 border-b flex items-center justify-center text-sm">
                {time}
              </div>
            ))}
          </div>

          {/* Schedule content */}
          <div className="flex-1 relative">
            {/* Time grid lines */}
            {timeSlots.map((time) => (
              <div key={time} className="h-12 border-b w-full" />
            ))}

            {/* Scheduled flights */}
            {flights.map((flight) => (
              <HoverCard key={flight.id}>
                <HoverCardTrigger asChild>
                  <div
                    className={cn(
                      "absolute left-1 right-1 p-2 rounded-md border text-sm cursor-pointer",
                      getFlightColorClass(flight.type),
                    )}
                    style={{
                      top: getTimePosition(flight.startTime),
                      height: getDurationHeight(flight.startTime, flight.endTime),
                    }}
                  >
                    <div className="font-medium truncate">{flight.aircraft}</div>
                    <div className="truncate">{flight.student}</div>
                  </div>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <div className="flex justify-between">
                    <div className="font-semibold">{flight.type} Flight</div>
                    <Badge variant={flight.status === "Confirmed" ? "default" : "secondary"}>{flight.status}</Badge>
                  </div>
                  <div className="mt-2 grid gap-1">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      <span>{flight.aircraft}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        {flight.student} with {flight.instructor}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {flight.startTime} - {flight.endTime}
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                      Cancel
                    </Button>
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render week view
  const renderWeekView = () => {
    return (
      <div className="flex flex-col h-[600px] border rounded-md">
        <div className="flex border-b">
          <div className="w-16 border-r p-2 text-center font-medium">Time</div>
          {weekDays.map((day, index) => (
            <div
              key={day.toString()}
              className={cn(
                "flex-1 p-2 text-center font-medium border-r last:border-r-0",
                formatDateString(day) === formatDateString(new Date()) && "bg-muted",
              )}
            >
              <div>{format(day, "EEE")}</div>
              <div className="text-sm">{format(day, "MMM d")}</div>
            </div>
          ))}
        </div>
        <div className="flex flex-1 overflow-y-auto">
          {/* Time labels */}
          <div className="w-16 flex flex-col border-r">
            {timeSlots.map((time) => (
              <div key={time} className="h-12 border-b flex items-center justify-center text-sm">
                {time}
              </div>
            ))}
          </div>

          {/* Days columns */}
          {weekDays.map((day) => {
            const flights = getFlightsForDate(day)

            return (
              <div key={day.toString()} className="flex-1 relative border-r last:border-r-0">
                {/* Time grid lines */}
                {timeSlots.map((time) => (
                  <div key={time} className="h-12 border-b w-full" />
                ))}

                {/* Scheduled flights */}
                {flights.map((flight) => (
                  <HoverCard key={flight.id}>
                    <HoverCardTrigger asChild>
                      <div
                        className={cn(
                          "absolute left-1 right-1 p-1 rounded-md border text-xs cursor-pointer",
                          getFlightColorClass(flight.type),
                        )}
                        style={{
                          top: getTimePosition(flight.startTime),
                          height: getDurationHeight(flight.startTime, flight.endTime),
                        }}
                      >
                        <div className="font-medium truncate">{flight.aircraft}</div>
                        <div className="truncate">{flight.student}</div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="flex justify-between">
                        <div className="font-semibold">{flight.type} Flight</div>
                        <Badge variant={flight.status === "Confirmed" ? "default" : "secondary"}>{flight.status}</Badge>
                      </div>
                      <div className="mt-2 grid gap-1">
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4" />
                          <span>{flight.aircraft}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>
                            {flight.student} with {flight.instructor}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {flight.startTime} - {flight.endTime}
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600">
                          Cancel
                        </Button>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render month view
  const renderMonthView = () => {
    console.log("Rendering MonthView with onViewChange:", !!onViewChange);
    return (
      <MonthView
        schedules={schedules}
        students={students}
        instructors={instructors}
        onSelectDate={onDateChange}
        onScheduleUpdate={onScheduleUpdate}
        onViewChange={onViewChange}
      />
    )
  }

  return (
    <div className="flex-1 space-y-4">
      {view === "month" && renderMonthView()}
      {view === "week" && (
        <WeekView
          currentDate={currentDate}
          weekDays={weekDays}
          schedules={schedules}
          students={students}
          instructors={instructors}
          onSelectDate={onDateChange}
          onScheduleUpdate={onScheduleUpdate}
        />
      )}
      {view === "day" && (
        <DayView
          currentDate={currentDate}
          schedules={schedules}
          students={students}
          instructors={instructors}
          onSelectDate={onDateChange}
          onScheduleUpdate={onScheduleUpdate}
        />
      )}
    </div>
  )
}
