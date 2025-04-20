"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { format, isSameDay, parseISO, startOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScheduleDialog } from "./schedule-dialog"
import { ScheduleCard } from "./schedule-card"

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

interface WeekViewProps {
  currentDate: Date
  weekDays: Date[]
  schedules: Schedule[]
  students: Record<string, Student>
  instructors: Record<string, Instructor>
  onSelectDate?: (date: Date) => void
  onScheduleUpdate?: () => void
}

export function WeekView({
  currentDate,
  weekDays,
  schedules,
  students,
  instructors,
  onSelectDate,
  onScheduleUpdate
}: WeekViewProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  console.log('Instructors:', instructors)

  const getDaySchedules = (date: Date) => {
    // Compare dates without timezone conversion
    const dateString = format(date, 'yyyy-MM-dd')
    
    // Group schedules by start time
    const schedulesByTime = schedules
      .filter(schedule => {
        const scheduleDate = schedule.date.split('T')[0]
        return scheduleDate === dateString
      })
      .reduce((groups, schedule) => {
        const startTime = schedule.start_time
        if (!groups[startTime]) {
          groups[startTime] = []
        }
        groups[startTime].push(schedule)
        return groups
      }, {} as Record<string, Schedule[]>)

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

    console.log('Day schedules:', result.map(s => ({
      id: s._id,
      instructor_id: s.instructor_id,
      instructor: instructors[s.instructor_id]
    })))

    return result
  }

  const handleScheduleClick = (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation()
    setSelectedSchedule(schedule)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-8 gap-4">
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
          {weekDays.map((day, dayIndex) => {
            const daySchedules = getDaySchedules(day)
            const isSelected = format(currentDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            
            return (
              <div
                key={dayIndex}
                className={cn(
                  "relative",
                  isSelected && "bg-muted/50"
                )}
              >
                <div
                  className="sticky top-0 z-10 h-12 bg-background border-b border-border flex items-center justify-center cursor-pointer"
                  onClick={() => onSelectDate?.(day)}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {format(day, "EEE")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(day, "MMM d")}
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
                  {daySchedules.map((schedule) => (
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
            )
          })}
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
    </>
  )
} 