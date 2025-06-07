import * as React from "react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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

interface ScheduleCardProps {
  schedule: Schedule
  student: Student | null
  instructor: Instructor | null
  onScheduleUpdate?: () => void
  onClick?: (e: React.MouseEvent, schedule: Schedule) => void
  index: number
  total: number
  businessHoursStart?: number // Default 6 AM
  businessHoursEnd?: number // Default 10 PM
  slotHeight?: number // Height of each hour slot
}

export function ScheduleCard({
  schedule,
  student,
  instructor,
  onScheduleUpdate,
  onClick,
  index,
  total,
  businessHoursStart = 6,
  businessHoursEnd = 22,
  slotHeight = 60
}: ScheduleCardProps) {
  // Convert UTC time to local time for display and positioning
  const startDateTime = new Date(schedule.scheduled_start_time)
  const startHour = startDateTime.getHours()
  const startMinute = startDateTime.getMinutes()
  const durationMinutes = schedule.scheduled_duration * 60 // Convert hours to minutes
  
  // Calculate position based on business hours
  const businessHourMinutes = (businessHoursEnd - businessHoursStart) * 60
  const startMinutesFromBusinessStart = (startHour - businessHoursStart) * 60 + startMinute
  const endMinutesFromBusinessStart = startMinutesFromBusinessStart + durationMinutes
  
  // Convert to percentage of business day
  const topPercent = (startMinutesFromBusinessStart / businessHourMinutes) * 100
  const heightPercent = (durationMinutes / businessHourMinutes) * 100

  // Calculate width and left position for overlapping schedules
  const calculateOverlapPosition = () => {
    if (total === 1) {
      return {
        width: '95%',
        left: '2.5%'
      }
    }
    
    // For overlapping schedules, use a more sophisticated layout
    const baseWidth = 90 // Leave 10% total margin
    const overlapOffset = 2 // Offset between overlapping cards for visual separation
    
    if (total === 2) {
      // Two overlapping: side by side
      const cardWidth = (baseWidth - overlapOffset) / 2
      return {
        width: `${cardWidth}%`,
        left: `${5 + index * (cardWidth + overlapOffset)}%`
      }
    } else if (total === 3) {
      // Three overlapping: slightly narrower
      const cardWidth = (baseWidth - 2 * overlapOffset) / 3
      return {
        width: `${cardWidth}%`,
        left: `${5 + index * (cardWidth + overlapOffset)}%`
      }
    } else {
      // Four or more: stack with cascade effect
      const cardWidth = Math.max(baseWidth / total, 20) // Minimum 20% width
      const maxOffset = Math.min(index * 3, 15) // Cascade but don't go too far right
      return {
        width: `${cardWidth}%`,
        left: `${5 + maxOffset}%`
      }
    }
  }
  
  const { width, left } = calculateOverlapPosition()

  const formatStartTime = () => {
    const period = startHour >= 12 ? "PM" : "AM"
    const displayHours = startHour % 12 || 12
    return `${displayHours}:${startMinute.toString().padStart(2, "0")} ${period}`
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onClick) {
      onClick(e, schedule)
    }
  }

  // Get flight type color - optimized for both light and dark mode
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

  // Get status color - optimized for both light and dark mode
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'scheduled':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700/50'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700/50'
    }
  }

  // Calculate actual height in pixels based on duration
  const actualHeightPx = (heightPercent / 100) * (businessHourMinutes * (slotHeight / 60))
  const minHeightPx = Math.max(actualHeightPx, 30) // Minimum 30px for visibility
  const shouldShowDetails = minHeightPx >= 50
  const shouldShowStartTime = schedule.scheduled_duration > 0.5 // Hide start time for short durations
  const isLongDuration = schedule.scheduled_duration >= 1.0 // Cards 1+ hours get more spacing and hide registration

  return (
    <div
      className={cn(
        "absolute rounded-lg cursor-pointer border-l-4",
        total > 1 ? "shadow-md border border-white/20 dark:border-black/20" : "shadow-sm",
        getFlightTypeColor(schedule.flight_type)
      )}
      style={{
        top: `${topPercent}%`,
        height: `${heightPercent}%`, // Use actual duration percentage
        width,
        left,
        minHeight: `${minHeightPx}px`, // Only minimum for very short durations
        zIndex: total > 1 ? 10 + (total - index) : 10 // Higher z-index for later items in overlapping groups
      }}
      onClick={handleClick}
    >
      <div className={cn(
        "h-full flex flex-col justify-between overflow-hidden",
        isLongDuration ? "p-3" : "p-2"
      )}>
        <div className={cn(
          isLongDuration ? "flex-1 flex flex-col justify-center space-y-1.5" : "flex-1 min-h-0 space-y-0.5"
        )}>
          {student ? (
            <>
              <div className="font-semibold text-sm leading-tight truncate">
                {student.user_id.first_name} {student.user_id.last_name}
              </div>
              {shouldShowDetails && (
                <>
                  {/* Only show registration on short cards */}
                  {!isLongDuration && (
                    <div className="text-xs opacity-90 leading-tight truncate font-mono">
                      {schedule.plane_id.registration}
                    </div>
                  )}
                  {instructor ? (
                    <div className={cn(
                      "text-xs opacity-85",
                      isLongDuration ? "leading-relaxed" : "leading-tight truncate"
                    )}>
                      w/ {instructor.user_id.first_name} {instructor.user_id.last_name}
                    </div>
                  ) : schedule.flight_type.toLowerCase() === 'solo' ? (
                    <div className={cn(
                      "text-xs opacity-85",
                      isLongDuration ? "leading-relaxed" : "leading-tight truncate"
                    )}>
                      Solo Flight
                    </div>
                  ) : (
                    <div className={cn(
                      "text-xs opacity-85",
                      isLongDuration ? "leading-relaxed" : "leading-tight truncate"
                    )}>
                      Instructor: {instructor ? 'Found' : 'Missing'}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-sm font-medium opacity-70">...</div>
          )}
        </div>
        
        {(shouldShowStartTime || shouldShowDetails || instructor) && (
          <div className={cn(
            "flex items-center justify-between flex-shrink-0",
            isLongDuration ? "mt-2" : "mt-1"
          )}>
            <div className="flex flex-col items-start space-y-0.5">
              {shouldShowStartTime && (
                <span className="text-xs font-medium opacity-90 leading-none">
                  {formatStartTime()}
                </span>
              )}
            </div>
            <div className="flex flex-col items-end justify-center">
              {shouldShowDetails && (
                <span className="text-xs opacity-75 font-medium leading-none capitalize">
                  {schedule.flight_type}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 