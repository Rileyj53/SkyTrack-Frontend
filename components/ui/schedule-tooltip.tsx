"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Clock, User, UserCheck, Plane, Calendar, FileText, Tag } from "lucide-react"

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

interface ScheduleTooltipProps {
  schedule: Schedule
  student: Student | null
  instructor: Instructor | null
  children: React.ReactNode
  delayMs?: number
}

export function ScheduleTooltip({ 
  schedule, 
  student, 
  instructor, 
  children, 
  delayMs = 1000 
}: ScheduleTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    })

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delayMs)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "h:mm a")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, "MMM d, yyyy")
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getFlightTypeBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'training':
        return 'bg-[#3366ff]/10 text-[#3366ff] border-[#3366ff]/20'
      case 'solo':
        return 'bg-[#33cc33]/10 text-[#33cc33] border-[#33cc33]/20'
      case 'checkride':
        return 'bg-[#cc00ff]/10 text-[#cc00ff] border-[#cc00ff]/20'
      case 'maintenance':
        return 'bg-[#ff9900]/10 text-[#ff9900] border-[#ff9900]/20'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  // Clone the child element and add event handlers without wrapping
  const child = React.Children.only(children) as React.ReactElement<any>
  const childWithHandlers = React.cloneElement(child, {
    onMouseEnter: (e: React.MouseEvent) => {
      // Call original handler if it exists
      if (child.props.onMouseEnter) {
        child.props.onMouseEnter(e)
      }
      handleMouseEnter(e)
    },
    onMouseLeave: (e: React.MouseEvent) => {
      // Call original handler if it exists  
      if (child.props.onMouseLeave) {
        child.props.onMouseLeave(e)
      }
      handleMouseLeave()
    }
  })

  return (
    <>
      {childWithHandlers}

      {isVisible && (
        <div className="fixed z-50 pointer-events-none">
          <div
            className="absolute transform -translate-x-1/2 -translate-y-full mb-2"
            style={{
              left: position.x,
              top: position.y,
            }}
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Flight Schedule
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium border",
                    getFlightTypeBadgeColor(schedule.flight_type)
                  )}>
                    {schedule.flight_type}
                  </span>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getStatusBadgeColor(schedule.status)
                  )}>
                    {schedule.status}
                  </span>
                </div>
              </div>

              {/* Time Information */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatDate(schedule.scheduled_start_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-6">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formatTime(schedule.scheduled_start_time)} - {formatTime(schedule.scheduled_end_time)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({schedule.scheduled_duration} min)
                  </span>
                </div>
              </div>

              {/* Student Information */}
              {student && (
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Student: {student.user_id.first_name} {student.user_id.last_name}
                  </span>
                </div>
              )}

              {/* Instructor Information */}
              {instructor && (
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Instructor: {instructor.user_id.first_name} {instructor.user_id.last_name}
                  </span>
                </div>
              )}

              {/* Aircraft Information */}
              <div className="flex items-center gap-2 mb-2">
                <Plane className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Aircraft: {schedule.plane_id.registration}
                  {(schedule.plane_id.aircraftModel || schedule.plane_id.model) && (
                    <span className="text-gray-500 ml-1">
                      ({schedule.plane_id.aircraftModel || schedule.plane_id.model})
                    </span>
                  )}
                </span>
              </div>

              {/* Notes */}
              {schedule.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes:</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                        {schedule.notes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Arrow pointer */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-200 dark:border-t-gray-700"></div>
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-white dark:border-t-gray-800 absolute top-[-7px] left-[-5px]"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 