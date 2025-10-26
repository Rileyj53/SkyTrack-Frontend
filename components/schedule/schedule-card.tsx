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
    aircraftModel?: string
  }
  instructor_id: {
    _id: string
    user_id: {
      first_name: string
      last_name: string
    }
  } | null
  student_id: {
    _id: string
    user_id: {
      first_name: string
      last_name: string
    }
  } | null
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
  businessHoursStart?: number
  businessHoursEnd?: number
  slotHeight?: number
  isDayView?: boolean // New prop to distinguish between day view and week view
}

export function ScheduleCard({
  schedule,
  student,
  instructor,
  onScheduleUpdate,
  onClick,
  index,
  total,
  businessHoursStart = 0,
  businessHoursEnd = 24,
  slotHeight = 60,
  isDayView = false // Default to week view behavior
}: ScheduleCardProps) {
  // Use adjusted times if available (for overnight events), otherwise use original times
  const startDateTime = (schedule as any).startTime || new Date(schedule.scheduled_start_time)
  const endDateTime = (schedule as any).endTime || new Date(schedule.scheduled_end_time)
  const startHour = startDateTime.getHours()
  const startMinute = startDateTime.getMinutes()
  const endHour = endDateTime.getHours()
  const endMinute = endDateTime.getMinutes()
  
  // Calculate duration based on adjusted times for proper height
  const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)

  // Calculate position based on full 24-hour day
  const totalMinutes = (businessHoursEnd - businessHoursStart) * 60
  const startMinutesFromStart = (startHour - businessHoursStart) * 60 + startMinute
  const topPercent = (startMinutesFromStart / totalMinutes) * 100
  const heightPercent = (durationMinutes / totalMinutes) * 100

  // Smart overlap positioning for handling many events
  const calculateOverlapPosition = () => {
    if (total === 1) {
      return {
        width: '94%',
        left: '3%', // Consistent with overlapping events
        zIndex: 10
      }
    }
    
    // Handle large numbers of overlapping events (20+)
    if (total > 20) {
      // For very high numbers, use a thin bar approach with minimal spacing
      const barWidth = 2 // Very thin bars
      const spacing = 1
      const maxBars = Math.floor(94 / (barWidth + spacing)) // Max bars that fit
      
      if (index < maxBars) {
        return {
          width: `${barWidth}%`,
          left: `${3 + index * (barWidth + spacing)}%`, // Consistent 3% base
          zIndex: 10 + index
        }
      } else {
        // Stack remaining bars on the right edge
        const stackIndex = index - maxBars
        return {
          width: `${barWidth}%`,
          left: `${94 - barWidth}%`,
          zIndex: 10 + index,
          transform: `translateX(${-stackIndex * 2}px)` // Small offset for visibility
        }
      }
    }
    
    // Handle medium numbers of overlapping events (6-20)
    if (total > 6) {
      // Use thinner columns for medium numbers
      const columnWidth = 94 / Math.min(total, 12) // Cap at 12 visible columns
      const leftOffset = 3 + (index * columnWidth)
      
      return {
        width: `${Math.max(columnWidth - 0.5, 2)}%`, // Minimum 2% width
        left: `${Math.min(leftOffset, 90)}%`, // Don't exceed 90%
        zIndex: 10 + index
      }
    }
    
    // Normal column-based approach for fewer events (2-6)
    const columnWidth = 94 / total
    const leftOffset = 3 + (index * columnWidth)
    
    return {
      width: `${columnWidth - 1}%`,
      left: `${leftOffset}%`,
      zIndex: 10 + index
    }
  }
  
  const { width, left, zIndex, transform } = calculateOverlapPosition()

  // Brand color scheme based on flight type
  const getFlightTypeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'training':
        return {
          bg: 'bg-[#3366ff] dark:bg-[#3366ff]/80',
          border: 'border-[#3366ff] dark:border-[#3366ff]/60',
          text: 'text-white'
        }
      case 'solo':
        return {
          bg: 'bg-[#33cc33] dark:bg-[#33cc33]/80',
          border: 'border-[#33cc33] dark:border-[#33cc33]/60',
          text: 'text-white'
        }
      case 'checkride':
        return {
          bg: 'bg-[#cc00ff] dark:bg-[#cc00ff]/80',
          border: 'border-[#cc00ff] dark:border-[#cc00ff]/60',
          text: 'text-white'
        }
      case 'maintenance':
        return {
          bg: 'bg-[#ff9900] dark:bg-[#ff9900]/80',
          border: 'border-[#ff9900] dark:border-[#ff9900]/60',
          text: 'text-white'
        }
      default:
        return {
          bg: 'bg-[#73738c] dark:bg-[#73738c]/80',
          border: 'border-[#73738c] dark:border-[#73738c]/60',
          text: 'text-white'
        }
    }
  }

  const formatTime = () => {
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

  const typeStyle = getFlightTypeStyle(schedule.flight_type)
  const minHeight = Math.max(heightPercent, 3) // Minimum height for visibility
  
  // Calculate actual pixel dimensions
  const widthPercent = parseFloat(width.replace('%', ''))
  const heightPixels = (durationMinutes / 60) * slotHeight // Use calculated duration for proper height
  
  // Different text display thresholds based on view type
  const hasRoomForText = isDayView 
    ? widthPercent >= 6 && heightPixels >= 25 // Generous for day view
    : widthPercent >= 18 && heightPixels >= 40 // Aggressive for week view
  
  const hasRoomForBothLines = isDayView
    ? widthPercent >= 10 && heightPixels >= 40 // Generous for day view  
    : widthPercent >= 25 && heightPixels >= 60 // Aggressive for week view
  
  const hasRoomForWrapping = isDayView
    ? widthPercent >= 8 && heightPixels >= 50 // Allow wrapping in day view
    : widthPercent >= 30 && heightPixels >= 80 // Very restrictive for week view
  
  const isBarOnly = !hasRoomForText || (total > 10 && widthPercent < 4) // Hide text when extremely cramped

  // Create tooltip text for when we don't show text
  const getTooltipText = () => {
    const studentName = student?.user_id ? `${student.user_id.first_name} ${student.user_id.last_name}` : 'Unassigned'
    const planeInfo = schedule.plane_id.registration
    const aircraftModel = schedule.plane_id.aircraftModel || schedule.plane_id.model || ''
    const isPartial = (schedule as any).isPartialEvent
    const partialIndicator = isPartial ? ' (partial)' : ''
    return `${studentName} - ${planeInfo} ${aircraftModel} - ${schedule.flight_type} at ${formatTime()}${partialIndicator}`
  }

    const isPartialEvent = (schedule as any).isPartialEvent
  
  return (
    <div
      className={cn(
        "absolute rounded-lg cursor-pointer border-l-4 transition-all duration-200 hover:shadow-lg",
        typeStyle.bg,
        typeStyle.border,
        typeStyle.text,
        total > 1 ? "shadow-md border border-white/20 dark:border-black/20" : "shadow-sm",
        isPartialEvent && "border-dashed" // Visual indicator for partial events
      )}
      style={{
        top: `${topPercent}%`,
        height: `${minHeight}%`,
        width,
        left,
        zIndex,
        transform,
        minHeight: '16px'
      }}
      onClick={handleClick}
      title={getTooltipText()}
    >
      {/* Bar-only mode when there's not enough space */}
      {isBarOnly ? (
        <div className="h-full w-full rounded-sm" />
      ) : (
        <div className="h-full flex flex-col overflow-hidden" style={{ paddingLeft: '10px', paddingRight: '6px', paddingTop: '8px', paddingBottom: '8px' }}>
          {/* Only show student name and time when there's enough space */}
          <div className="flex-1 min-h-0 flex flex-col justify-center">
            {student ? (
              <div className="space-y-1">
                {/* Student name - highest priority */}
                <div className={cn(
                  "font-semibold text-sm leading-tight",
                  hasRoomForWrapping ? "break-words" : "whitespace-nowrap overflow-hidden"
                )}>
                  {student.user_id.first_name} {student.user_id.last_name}
                </div>
                
                {/* Time - show when there's room for both lines OR when it's a longer event */}
                {(hasRoomForBothLines || heightPixels >= 60) && (
                  <div className="text-xs opacity-90 font-mono whitespace-nowrap overflow-hidden">
                    {formatTime()}
                  </div>
                )}
              </div>
            ) : (
              /* When no student, show plane registration and time */
              <div className="space-y-1">
                <div className={cn(
                  "font-semibold text-sm leading-tight",
                  hasRoomForWrapping ? "break-words" : "whitespace-nowrap overflow-hidden"
                )}>
                  {schedule.plane_id.registration}
                </div>
                
                {/* Time - show when there's room for both lines OR when it's a longer event */}
                {(hasRoomForBothLines || heightPixels >= 60) && (
                  <div className="text-xs opacity-90 font-mono whitespace-nowrap overflow-hidden">
                    {formatTime()}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 