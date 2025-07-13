"use client"

import * as React from "react"
import { useMemo, useState, useEffect } from "react"
import { format, parseISO, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  const [isLoading, setIsLoading] = useState(false)

  const getDaySchedules = (date: Date) => {
    // Format the calendar date as YYYY-MM-DD
    const dateString = format(date, 'yyyy-MM-dd')
    const targetDate = new Date(date)
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0)
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999)
    
    // Filter schedules that intersect with this day and split overnight events
    const daySchedules = schedules
      .filter(schedule => {
        if (!schedule.scheduled_start_time || !schedule.scheduled_end_time) return false
        
        const startDateTime = new Date(schedule.scheduled_start_time)
        const endDateTime = new Date(schedule.scheduled_end_time)
        
        // Include schedules that intersect with this day (start before day ends AND end after day starts)
        return startDateTime < dayEnd && endDateTime > dayStart
      })
      .map(schedule => {
        const startDateTime = new Date(schedule.scheduled_start_time)
        const endDateTime = new Date(schedule.scheduled_end_time)
        
        // Check if this is an overnight event that needs splitting
        const startsOnThisDay = format(startDateTime, 'yyyy-MM-dd') === dateString
        const endsOnThisDay = format(endDateTime, 'yyyy-MM-dd') === dateString
        
        let adjustedStartTime = startDateTime
        let adjustedEndTime = endDateTime
        let isPartialEvent = false
        
        if (startsOnThisDay && !endsOnThisDay) {
          // Event starts today but ends tomorrow - show from start to end of day
          adjustedEndTime = new Date(dayEnd)
          isPartialEvent = true
        } else if (!startsOnThisDay && endsOnThisDay) {
          // Event started yesterday but ends today - show from start of day to end
          adjustedStartTime = new Date(dayStart)
          isPartialEvent = true
        } else if (!startsOnThisDay && !endsOnThisDay) {
          // Event spans multiple days and this day is in the middle - show full day
          adjustedStartTime = new Date(dayStart)
          adjustedEndTime = new Date(dayEnd)
          isPartialEvent = true
        }
        
        return {
          ...schedule,
          startTime: adjustedStartTime,
          endTime: adjustedEndTime,
          isPartialEvent,
          originalStartTime: startDateTime,
          originalEndTime: endDateTime
        }
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    // Build overlap groups using a more robust algorithm
    const overlapGroups: Array<Array<typeof daySchedules[0]>> = []
    
    for (const schedule of daySchedules) {
      // Find existing groups that this schedule overlaps with
      const overlappingGroups = overlapGroups.filter(group =>
        group.some(existing => 
          schedule.startTime < existing.endTime && schedule.endTime > existing.startTime
        )
      )
      
      if (overlappingGroups.length === 0) {
        // No overlaps, create new group
        overlapGroups.push([schedule])
      } else if (overlappingGroups.length === 1) {
        // Overlaps with one group, add to it
        overlappingGroups[0].push(schedule)
      } else {
        // Overlaps with multiple groups, merge them all
        const mergedGroup = [schedule, ...overlappingGroups.flat()]
        
        // Remove old groups
        overlappingGroups.forEach(group => {
          const index = overlapGroups.indexOf(group)
          overlapGroups.splice(index, 1)
        })
        
        // Add merged group
        overlapGroups.push(mergedGroup)
      }
    }
    
    // Assign positions within each group
    const result: Array<typeof daySchedules[0] & { overlappingIndex: number; totalOverlapping: number }> = []
    
    for (const group of overlapGroups) {
      // Sort group by start time, then by duration (longer first) for better visual arrangement
      const sortedGroup = group.sort((a, b) => {
        const timeDiff = a.startTime.getTime() - b.startTime.getTime()
        if (timeDiff !== 0) return timeDiff
        return b.scheduled_duration - a.scheduled_duration // Longer durations first
      })
      
      sortedGroup.forEach((schedule, index) => {
        result.push({
          ...schedule,
          overlappingIndex: index,
          totalOverlapping: sortedGroup.length
        })
      })
    }
    
    // Sort final result by start time for consistent rendering order
    return result.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  const handleScheduleClick = (e: React.MouseEvent, schedule: Schedule) => {
    e.stopPropagation()
    setSelectedSchedule(schedule)
    setDialogOpen(true)
  }

  // Full day: 12 AM to 11 PM (24 hours)
  const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
    const hour = i // Start from 12 AM (0)
    return {
      hour,
      label: format(new Date().setHours(hour, 0, 0, 0), "h a"),
      label24: `${hour.toString().padStart(2, '0')}:00`
    }
  })

  const SLOT_HEIGHT = 60 // Height of each hour slot in pixels

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  const [currentTimePosition, setCurrentTimePosition] = useState(() => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()
    const position = (currentHour * 60 + currentMinutes) / (24 * 60) * 100
    return `${position}%`
  })

  const getCurrentTimePosition = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()
    
    // Show for full 24-hour day
    const position = (currentHour * 60 + currentMinutes) / (24 * 60) * 100
    return `${position}%`
  }

  // Update current time position every minute
  useEffect(() => {
    const updateTimePosition = () => {
      setCurrentTimePosition(getCurrentTimePosition())
    }

    // Update immediately
    updateTimePosition()

    // Set up interval to update every minute
    const interval = setInterval(updateTimePosition, 60000) // Update every minute

    // Cleanup interval on unmount
    return () => clearInterval(interval)
  }, []) // Empty dependency array means this runs once on mount

  const LoadingSkeleton = () => (
    <div className="space-y-2 p-4">
      <div className="text-center mb-4">
        <Skeleton className="h-6 w-32 mx-auto" />
      </div>
      <div className="grid gap-1">
        {TIME_SLOTS.map((_, index) => (
          <div key={index} className="border-b border-gray-100 py-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-12" />
              {Math.random() > 0.7 && (
                <div className="flex-1 ml-4">
                  <Skeleton className="h-16 w-full rounded-md" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  // If no data is loaded yet, show loading state
  if (!schedules && Object.keys(students).length === 0 && Object.keys(instructors).length === 0) {
    return <LoadingSkeleton />
  }

  return (
    <div className="flex flex-col bg-background" style={{ height: '100%' }}>
      <div className={cn(
        "border border-border rounded-lg bg-card shadow-sm",
        isToday && "bg-[#ff9900]/10 dark:bg-[#ff9900]/20"
      )} style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Fixed header */}
        <div className="grid grid-cols-[80px,1fr] border-b border-border bg-muted/50 flex-shrink-0">
          <div className="h-16 border-r border-border flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">Time</span>
          </div>
          <div className={cn(
            "h-16 flex flex-col items-center justify-center",
            isToday && "bg-[#ff9900]/15 dark:bg-[#ff9900]/30"
          )}>
            <div className={cn(
              "text-sm font-semibold",
              isToday && "text-orange-700 dark:text-orange-300"
            )}>
              {format(currentDate, "EEE")}
            </div>
            <div className={cn(
              "text-xs",
              isToday ? "text-orange-600 dark:text-orange-400 font-medium" : "text-muted-foreground"
            )}>
              {format(currentDate, "MMM d")}
            </div>
          </div>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[80px,1fr]">
            {/* Time column */}
            <div className="bg-muted/30 border-r border-border">
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.hour}
                  className="h-15 border-b border-border/50 flex items-start justify-end pr-3 pt-1"
                  style={{ height: `${SLOT_HEIGHT}px` }}
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {slot.label}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Day column */}
            <div className={cn(
              "relative",
              isToday && "bg-orange-50/30 dark:bg-orange-950/20"
            )}>
              {/* Schedule content area */}
              <div 
                className="relative" 
                style={{ height: `${TIME_SLOTS.length * SLOT_HEIGHT}px` }}
              >
                {/* Time grid lines */}
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.hour}
                    className="absolute w-full border-b border-border/30"
                    style={{ 
                      top: `${slot.hour * SLOT_HEIGHT}px`,
                      height: `${SLOT_HEIGHT}px`
                    }}
                  />
                ))}
                
                {/* Current time indicator (only for today) */}
                {isToday && currentTimePosition && (
                  <div
                    className="absolute w-full z-20 pointer-events-none"
                    style={{ top: currentTimePosition }}
                  >
                    <div className="w-full h-0.5 bg-[#f90606] relative">
                      <div className="absolute -left-1 -top-1 w-2 h-2 bg-[#f90606] rounded-full" />
                    </div>
                  </div>
                )}
                
                {/* Schedule cards */}
                {getDaySchedules(currentDate).map((schedule) => (
                  <ScheduleCard
                    key={schedule._id}
                    schedule={schedule}
                                          student={schedule.student_id ? students[schedule.student_id._id] : null}
                                        instructor={schedule.instructor_id ? instructors[schedule.instructor_id._id] : null}
                    onScheduleUpdate={onScheduleUpdate}
                    onClick={handleScheduleClick}
                    index={schedule.overlappingIndex}
                    total={schedule.totalOverlapping}
                    businessHoursStart={0}
                    businessHoursEnd={24}
                    slotHeight={SLOT_HEIGHT}
                    isDayView={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ScheduleDialog
        schedule={selectedSchedule}
        student={selectedSchedule?.student_id ? students[selectedSchedule.student_id._id] : null}
        instructor={selectedSchedule?.instructor_id ? instructors[selectedSchedule.instructor_id._id] : null}
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