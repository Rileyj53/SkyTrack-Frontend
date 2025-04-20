import * as React from "react"
import { format, parseISO } from "date-fns"
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

interface ScheduleCardProps {
  schedule: Schedule
  student: Student | null
  instructor: Instructor | null
  onScheduleUpdate?: () => void
  onClick?: (e: React.MouseEvent, schedule: Schedule) => void
  index: number
  total: number
}

export function ScheduleCard({
  schedule,
  student,
  instructor,
  onScheduleUpdate,
  onClick,
  index,
  total
}: ScheduleCardProps) {
  const [startHour, startMinute] = schedule.start_time.split(":").map(Number)
  const [endHour, endMinute] = schedule.end_time.split(":").map(Number)
  
  // Calculate position and height based on time (24 hour format)
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  const durationMinutes = endMinutes - startMinutes
  
  // Convert to percentage of day (24 hours = 1440 minutes)
  const topPercent = (startMinutes / 1440) * 100
  const heightPercent = (durationMinutes / 1440) * 100

  // Calculate width and left position for overlapping schedules
  const width = total > 1 ? `${100 / total}%` : '100%'
  const left = total > 1 ? `${(index * 100) / total}%` : '0'

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick(e, schedule)
    }
  }

  // Calculate if we have enough space for instructor name
  const hasSpaceForInstructor = heightPercent >= 6

  return (
    <div
      className="absolute bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-900/40 transition-colors rounded-md shadow-sm cursor-pointer overflow-hidden border border-blue-200 dark:border-blue-800/30 hover:shadow-md"
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
        width,
        left,
        minHeight: '20px',
        zIndex: 10
      }}
      onClick={handleClick}
    >
      <div className="p-1 h-full flex flex-col gap-0.5">
        {student ? (
          <>
            <div className="font-medium text-xs text-blue-900 dark:text-blue-100 leading-tight break-words">
              {student.user_id.first_name} {student.user_id.last_name}
            </div>
            {hasSpaceForInstructor && instructor && (
              <div className="text-xs text-blue-800/90 dark:text-blue-200/80 leading-tight break-words">
                {instructor.user_id.first_name} {instructor.user_id.last_name}
              </div>
            )}
            <div className="text-xs text-blue-700/80 dark:text-blue-200/70 leading-tight break-words">
              {formatTime(schedule.start_time)}
            </div>
          </>
        ) : (
          <div className="font-medium text-xs text-blue-900 dark:text-blue-100 leading-tight">
            Loading...
          </div>
        )}
      </div>
    </div>
  )
} 