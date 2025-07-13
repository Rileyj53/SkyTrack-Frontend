"use client"

import * as React from "react"
import { useMemo, useState, useEffect } from "react"
import { format, isSameDay, parseISO, startOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScheduleDialog } from "./schedule-dialog"
import { ScheduleCard } from "./schedule-card"

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
  const [isLoading, setIsLoading] = useState(false)

  const getDaySchedules = (date: Date) => {
    // Format the date to compare with schedule dates (in local timezone)
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

    // Improved overlap detection for better visual layout
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
    
    // Assign positions within each group with better layout
    const result: Array<typeof daySchedules[0] & { overlappingIndex: number; totalOverlapping: number }> = []
    
    for (const group of overlapGroups) {
      // Sort group by start time, then by duration (shorter first for better stacking)
      const sortedGroup = group.sort((a, b) => {
        const timeDiff = a.startTime.getTime() - b.startTime.getTime()
        if (timeDiff !== 0) return timeDiff
        return a.scheduled_duration - b.scheduled_duration // Shorter durations first
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

  const isToday = (date: Date) => {
    const today = new Date()
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  }

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
    <div className="flex flex-col h-full bg-background">
      <div className="grid grid-cols-8 gap-0 border-b">
        <div className="p-2 border-r bg-muted/50">
          <Skeleton className="h-4 w-12" />
        </div>
        {weekDays.map((_, index) => (
          <div key={index} className="p-2 text-center border-r">
            <Skeleton className="h-4 w-16 mx-auto mb-1" />
            <Skeleton className="h-6 w-8 mx-auto" />
          </div>
        ))}
      </div>
      
      <div className="flex-1 grid grid-cols-8 overflow-hidden">
        <div className="border-r bg-muted/50 overflow-y-auto">
          {TIME_SLOTS.map((slot, index) => (
            <div key={index} className="h-[60px] border-b flex items-start p-2">
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
        
        {weekDays.map((_, dayIndex) => (
          <div key={dayIndex} className="border-r relative overflow-y-auto">
            {TIME_SLOTS.map((_, slotIndex) => (
              <div key={slotIndex} className="h-[60px] border-b relative">
                {Math.random() > 0.8 && (
                  <div className="absolute inset-0 p-1">
                    <Skeleton className="h-full w-full rounded-md" />
                  </div>
                )}
              </div>
            ))}
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
    <>
      <div className="flex flex-col bg-background" style={{ height: '100%' }}>
        <div className="border border-border rounded-lg bg-card shadow-sm" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Fixed header */}
          <div className="grid grid-cols-8 border-b border-border bg-muted/50 flex-shrink-0">
            <div className="h-16 border-r border-border flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Time
              </span>
            </div>
            {weekDays.map((day, dayIndex) => {
              const isSelected = format(currentDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
              const isDayToday = isToday(day)
              
              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "h-16 border-r border-border last:border-r-0 flex flex-col items-center justify-center cursor-pointer",
                    isSelected && "bg-[#3366ff]/15 dark:bg-[#3366ff]/30",
                    isDayToday && "bg-[#ff9900]/15 dark:bg-[#ff9900]/30"
                  )}
                  onClick={() => onSelectDate?.(day)}
                >
                  <div className={cn(
                    "text-sm font-semibold",
                    isDayToday && "text-[#ff9900] dark:text-[#ff9900]"
                  )}>
                    {format(day, "EEE")}
                  </div>
                  <div className={cn(
                    "text-xs mt-1",
                    isDayToday ? "text-[#ff9900] dark:text-[#ff9900] font-medium" : "text-muted-foreground"
                  )}>
                    {format(day, "MMM d")}
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-8">
              {/* Time column */}
              <div className="bg-muted/30 border-r border-border">
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.hour}
                    className="h-[60px] border-b border-border/50 flex items-center justify-end pr-3"
                  >
                    <span className="text-xs font-medium text-muted-foreground">
                      {slot.label}
                    </span>
                  </div>
                ))}
              </div>
               
               {/* Day columns */}
               {weekDays.map((day, dayIndex) => {
                 const daySchedules = getDaySchedules(day)
                 const isSelected = format(currentDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                 const isDayToday = isToday(day)
                 
                 return (
                   <div
                     key={dayIndex}
                     className={cn(
                       "relative border-r border-border last:border-r-0",
                       isSelected && "bg-[#3366ff]/10 dark:bg-[#3366ff]/20",
                       isDayToday && "bg-[#ff9900]/10 dark:bg-[#ff9900]/20"
                     )}
                   >
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
                       {isDayToday && currentTimePosition && (
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
                       {daySchedules.map((schedule) => (
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
                         />
                       ))}
                     </div>
                   </div>
                 )
               })}
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
    </>
  )
} 