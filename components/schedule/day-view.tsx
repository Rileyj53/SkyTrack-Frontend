"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScheduleDialog } from "./schedule-dialog"
import { ScheduleCard } from "./schedule-card"

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
  date: string
  start_time: string
  end_time: string
  flight_type: string
  status: string
  student_id: string
  instructor_id: string
}

interface DayViewProps {
  currentDate: Date
  schedules: Schedule[]
  students: Record<string, Student>
  instructors: Record<string, Instructor>
  onSelectDate?: (date: Date) => void
  onScheduleUpdate?: () => void
}

export function DayView({
  currentDate,
  schedules,
  students,
  instructors,
  onSelectDate,
  onScheduleUpdate
}: DayViewProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  console.log('DayView Props:', {
    currentDate,
    dateString: format(currentDate, 'yyyy-MM-dd'),
    schedules: schedules.map(s => ({
      id: s._id,
      date: s.date,
      datePart: s.date.split('T')[0],
      start: s.start_time
    }))
  })

  const getDaySchedules = (date: Date) => {
    // Compare dates without timezone conversion
    const dateString = format(date, 'yyyy-MM-dd')
    console.log('Getting schedules for date:', dateString)
    
    // Group schedules by start time
    const filtered = schedules.filter(schedule => {
      const scheduleDate = schedule.date.split('T')[0]
      const matches = scheduleDate === dateString
      console.log('Schedule:', {
        id: schedule._id,
        scheduleDate,
        dateString,
        matches
      })
      return matches
    })

    console.log('Filtered schedules:', filtered)
    
    // Group by start time
    const schedulesByTime = filtered.reduce((groups, schedule) => {
      const startTime = schedule.start_time
      if (!groups[startTime]) {
        groups[startTime] = []
      }
      groups[startTime].push(schedule)
      return groups
    }, {} as Record<string, Schedule[]>)

    console.log('Grouped by time:', schedulesByTime)

    // Flatten and sort by start time
    const result = Object.entries(schedulesByTime)
      .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
      .flatMap(([_, timeSchedules]) => 
        timeSchedules.map((schedule, index) => ({
          ...schedule,
          overlappingIndex: index,
          totalOverlapping: timeSchedules.length
        }))
      )

    console.log('Final schedules:', result)
    return result
  }

  const handleScheduleClick = (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation()
    setSelectedSchedule(schedule)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-[5rem,1fr] gap-4">
        <div className="sticky left-0 z-10 bg-background">
          <div className="h-12" />
          {Array.from({ length: 24 }).map((_, hour) => (
            <div
              key={hour}
              className="h-16 border-b border-border flex items-center justify-end pr-2 text-sm text-muted-foreground"
            >
              {format(new Date().setHours(hour), "h a")}
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="sticky top-0 z-10 h-12 bg-background border-b border-border flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-medium">
                {format(currentDate, "EEE")}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(currentDate, "MMM d")}
              </div>
            </div>
          </div>
          <div className="relative" style={{ height: 'calc(24 * 4rem)' }}>
            {Array.from({ length: 24 }).map((_, hour) => (
              <div
                key={hour}
                className="h-16 border-b border-border"
              />
            ))}
            {getDaySchedules(currentDate).map((schedule) => (
              <ScheduleCard
                key={schedule._id}
                schedule={schedule}
                student={students[schedule.student_id]}
                instructor={instructors[schedule.instructor_id]}
                onScheduleUpdate={onScheduleUpdate}
                onClick={handleScheduleClick}
                index={schedule.overlappingIndex}
                total={schedule.totalOverlapping}
              />
            ))}
          </div>
        </div>
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