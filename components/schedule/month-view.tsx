"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { addDays, startOfMonth, endOfMonth, format, isSameMonth, isToday, startOfWeek, endOfWeek, isSameDay, subMonths, addMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScheduleDialog } from "./schedule-dialog"

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

interface MonthViewProps {
  schedules: Schedule[]
  students: Record<string, Student>
  instructors: Record<string, Instructor>
  onSelectDate?: (date: Date) => void
  onScheduleUpdate?: () => void
  onViewChange?: (view: "day" | "week" | "month") => void
  currentDate?: Date
}

export function MonthView({
  schedules,
  students,
  instructors,
  onSelectDate,
  onScheduleUpdate,
  onViewChange,
  currentDate
}: MonthViewProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentDate || new Date())
  const [isLoading, setIsLoading] = useState(false)

  // Update selectedMonth when currentDate changes
  React.useEffect(() => {
    if (currentDate) {
      setSelectedMonth(currentDate)
    }
  }, [currentDate])

  const calendar = useMemo(() => {
    const start = startOfMonth(selectedMonth)
    const end = endOfMonth(selectedMonth)
    const days = []
    let day = startOfWeek(start)

    while (day <= endOfWeek(end)) {
      const week = []
      for (let i = 0; i < 7; i++) {
        week.push(day)
        day = addDays(day, 1)
      }
      days.push(week)
    }

    return days
  }, [selectedMonth])

  const getDaySchedules = (date: Date) => {
    // Format the calendar date as YYYY-MM-DD
    const calendarDateStr = format(date, 'yyyy-MM-dd')
    
    // Filter schedules where the date part matches
    return schedules.filter(schedule => {
      if (!schedule.scheduled_start_time) return false
      
      // Convert UTC time to local time for comparison
      const scheduleDate = new Date(schedule.scheduled_start_time)
      const scheduleDateStr = format(scheduleDate, 'yyyy-MM-dd')
      return scheduleDateStr === calendarDateStr
    })
  }

  const handlePrevMonth = () => {
    setSelectedMonth(prev => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth(prev => addMonths(prev, 1))
  }

  const handleDateClick = (date: Date) => {
    // Call the onSelectDate callback to notify parent component
    onSelectDate?.(date)
    
    // Switch to week view
    if (onViewChange) {
      onViewChange("week")
    }
  }

  const handleScheduleClick = (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation()
    setSelectedSchedule(schedule)
    setDialogOpen(true)
  }

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime)
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  // Get flight type color - exactly matching day/week views
  const getFlightTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'training':
        return 'bg-blue-600 dark:bg-blue-800/80 text-white border-blue-700 dark:border-blue-700/60'
      case 'solo':
        return 'bg-green-600 dark:bg-green-800/80 text-white border-green-700 dark:border-green-700/60'
      case 'checkride':
        return 'bg-purple-600 dark:bg-purple-800/80 text-white border-purple-700 dark:border-purple-700/60'
      case 'maintenance':
        return 'bg-orange-600 dark:bg-orange-800/80 text-white border-orange-700 dark:border-orange-700/60'
      default:
        return 'bg-gray-600 dark:bg-gray-800/80 text-white border-gray-700 dark:border-gray-700/60'
    }
  }

  const LoadingSkeleton = () => (
    <div className="flex flex-col h-full bg-background">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-8" />
      </div>

      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Week headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-2 text-center">
              <Skeleton className="h-4 w-8 mx-auto" />
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-0 h-full">
          {Array.from({ length: 35 }).map((_, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 p-2 min-h-[120px] flex flex-col">
              <Skeleton className="h-4 w-6 mb-2" />
              <div className="space-y-1">
                {Math.random() > 0.7 && <Skeleton className="h-6 w-full rounded" />}
                {Math.random() > 0.8 && <Skeleton className="h-6 w-3/4 rounded" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // If no data is loaded yet, show loading state
  if (!schedules && Object.keys(students).length === 0 && Object.keys(instructors).length === 0) {
    return <LoadingSkeleton />
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold text-foreground">
          {format(selectedMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm flex-1">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold text-muted-foreground border-r border-border last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendar.map((week, weekIndex) => (
            <React.Fragment key={weekIndex}>
              {week.map((date, dateIndex) => {
                const daySchedules = getDaySchedules(date)
                const isCurrentMonth = isSameMonth(date, selectedMonth)
                const isDayToday = isToday(date)
                
                return (
                  <div
                    key={dateIndex}
                    className={cn(
                      "min-h-[120px] p-3 border-r border-b border-border last-in-row:border-r-0 cursor-pointer transition-colors",
                      "hover:bg-muted/30",
                      !isCurrentMonth && "text-muted-foreground bg-muted/20",
                      isDayToday && "bg-orange-50 dark:bg-orange-950/30"
                    )}
                    onClick={() => handleDateClick(date)}
                  >
                    {/* Date Number */}
                    <div className={cn(
                      "font-semibold text-sm mb-2",
                      isDayToday && "text-orange-700 dark:text-orange-300"
                    )}>
                      {format(date, "d")}
                    </div>

                    {/* Schedule Items */}
                    <div className="space-y-1">
                      {daySchedules.slice(0, 3).map((schedule) => {
                        const student = students[schedule.student_id?._id || '']
                        const studentName = student 
                          ? `${student.user_id.first_name} ${student.user_id.last_name}`
                          : '...'
                        
                        return (
                          <div
                            key={schedule._id}
                            onClick={(e) => handleScheduleClick(e, schedule)}
                            className={cn(
                              "text-xs p-1.5 rounded-md cursor-pointer border transition-colors",
                              "hover:scale-[1.02] hover:shadow-sm",
                              getFlightTypeColor(schedule.flight_type)
                            )}
                          >
                            <div className="font-medium leading-tight truncate">
                              {formatTime(schedule.scheduled_start_time)} • {studentName}
                            </div>
                            <div className="text-xs opacity-75 truncate">
                              {schedule.flight_type} • {schedule.plane_id.registration}
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Show overflow indicator */}
                      {daySchedules.length > 3 && (
                        <div className="text-xs text-muted-foreground font-medium px-1.5">
                          +{daySchedules.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <ScheduleDialog
        schedule={selectedSchedule}
        student={selectedSchedule ? students[selectedSchedule.student_id?._id || ''] : null}
        instructor={selectedSchedule ? instructors[selectedSchedule.instructor_id?._id || ''] : null}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onScheduleUpdate={() => {
          onScheduleUpdate?.()
          setDialogOpen(false)
          setSelectedSchedule(null)
        }}
      />
    </div>
  )
} 