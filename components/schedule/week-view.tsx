"use client"

import * as React from "react"
import { useMemo, useState } from "react"
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

// Business hours: 6 AM to 10 PM (16 hours)
const TIME_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour = i + 6 // Start from 6 AM
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
    
    // Filter schedules for this day and sort by start time
    const daySchedules = schedules
      .filter(schedule => {
        if (!schedule.scheduled_start_time) return false
        
        // Convert UTC time to local time for comparison
        const scheduleDate = new Date(schedule.scheduled_start_time)
        const scheduleDateString = format(scheduleDate, 'yyyy-MM-dd')
        return scheduleDateString === dateString
      })
      .map(schedule => {
        const startDateTime = new Date(schedule.scheduled_start_time)
        const endDateTime = new Date(schedule.scheduled_end_time)
        return {
          ...schedule,
          startTime: startDateTime,
          endTime: endDateTime
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

  const isToday = (date: Date) => {
    const today = new Date()
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  }

  const getCurrentTimePosition = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()
    
    // Only show if within business hours (6 AM - 10 PM)
    if (currentHour < 6 || currentHour >= 22) return null
    
    const position = ((currentHour - 6) * 60 + currentMinutes) / (16 * 60) * 100
    return `${position}%`
  }

  const currentTimePosition = getCurrentTimePosition()

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
      <div className="flex flex-col h-full bg-background">
        <div className="grid grid-cols-8 border border-border rounded-lg overflow-hidden bg-card shadow-sm">
          {/* Time column */}
          <div className="bg-muted/30 border-r border-border">
            <div className="h-16 border-b border-border bg-muted/50" />
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
                {/* Day header */}
                <div
                  className={cn(
                    "h-16 border-b border-border flex flex-col items-center justify-center cursor-pointer",
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
                    "text-xs",
                    isDayToday ? "text-[#ff9900] dark:text-[#ff9900] font-medium" : "text-muted-foreground"
                  )}>
                    {format(day, "MMM d")}
                  </div>
                </div>
                
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
                        top: `${(slot.hour - 6) * SLOT_HEIGHT}px`,
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
                      student={students[schedule.student_id?._id || '']}
                      instructor={instructors[schedule.instructor_id?._id || '']}
                      onScheduleUpdate={onScheduleUpdate}
                      onClick={handleScheduleClick}
                      index={schedule.overlappingIndex}
                      total={schedule.totalOverlapping}
                      businessHoursStart={6}
                      businessHoursEnd={22}
                      slotHeight={SLOT_HEIGHT}
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
    </>
  )
} 