"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { addDays, startOfMonth, endOfMonth, format, isSameMonth, isToday, startOfWeek, endOfWeek, isSameDay, parseISO, subMonths, addMonths } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScheduleDialog } from "./schedule-dialog"
import type { Schedule, Student, Instructor } from "@/types"

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
      // Extract just the date part from the ISO string
      const scheduleDateStr = schedule.date.split('T')[0]
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
    console.log("Date clicked:", date);
    // Call the onSelectDate callback to notify parent component
    onSelectDate?.(date)
    
    // Switch to week view
    if (onViewChange) {
      console.log("Switching to week view");
      onViewChange("week")
    }
  }

  const handleScheduleClick = (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation()
    setSelectedSchedule(schedule)
    setDialogOpen(true)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-muted rounded-md"
        >
          ←
        </button>
        <h2 className="text-lg font-semibold">
          {format(selectedMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-muted rounded-md"
        >
          →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-muted p-2 text-center text-sm font-medium"
          >
            {day}
          </div>
        ))}
        {calendar.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((date, dateIndex) => {
              const daySchedules = getDaySchedules(date)
              const isCurrentMonth = isSameMonth(date, selectedMonth)
              const isToday = isSameDay(date, new Date())
              
              return (
                <div
                  key={dateIndex}
                  className={cn(
                    "min-h-[100px] p-2 bg-background",
                    !isCurrentMonth && "text-muted-foreground",
                    isToday && "bg-muted/50"
                  )}
                  onClick={() => {
                    console.log("Date cell clicked:", format(date, "yyyy-MM-dd"));
                    handleDateClick(date);
                  }}
                >
                  <div className="font-medium mb-1">{format(date, "d")}</div>
                  <div className="space-y-1">
                    {daySchedules.map((schedule) => {
                      const student = students[schedule.student_id]
                      const studentName = student 
                        ? `${student.user_id.first_name} ${student.user_id.last_name}`
                        : 'Loading...'
                      
                      return (
                        <div
                          key={schedule._id}
                          onClick={(e) => handleScheduleClick(e, schedule)}
                          className="text-xs p-1 rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 cursor-pointer border border-blue-200 dark:border-blue-800/30"
                        >
                          <div className="font-medium text-blue-900 dark:text-blue-100">
                            {formatTime(schedule.start_time)} - {studentName}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      <ScheduleDialog
        schedule={selectedSchedule}
        student={selectedSchedule ? students[selectedSchedule.student_id] : null}
        instructor={selectedSchedule ? instructors[selectedSchedule.instructor_id] : null}
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