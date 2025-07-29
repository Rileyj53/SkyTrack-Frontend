"use client"

import * as React from "react"
import { format, startOfDay, addHours, isSameDay } from "date-fns"
import { cn } from "@/lib/utils"
import { ScheduleDialog } from "@/components/schedule/schedule-dialog"

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

interface Aircraft {
  id: string
  registration: string
  type?: string
  aircraftModel?: string
  status: string
  location?: string
  notes?: string
}

interface AircraftViewProps {
  currentDate: Date
  schedules: Schedule[]
  students: Record<string, Student>
  instructors: Record<string, Instructor>
  onSelectDate?: (date: Date) => void
  onScheduleUpdate?: () => void
}

export function AircraftView({
  currentDate,
  schedules,
  students,
  instructors,
  onSelectDate,
  onScheduleUpdate
}: AircraftViewProps) {
  const [selectedFlight, setSelectedFlight] = React.useState<Schedule | null>(null)
  const [isFlightDialogOpen, setIsFlightDialogOpen] = React.useState(false)
  const [allAircraft, setAllAircraft] = React.useState<Aircraft[]>([])
  const [loading, setLoading] = React.useState(true)

  // Fetch all aircraft
  const fetchAircraft = React.useCallback(async () => {
    try {
      const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!organizationId || !token || !apiKey) {
        setLoading(false)
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/planes`,
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "Authorization": `Bearer ${token}`,
            "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
          },
          credentials: "include"
        }
      )

      if (!response.ok) {
        console.error("Failed to fetch aircraft:", response.status, response.statusText)
        setLoading(false)
        return
      }

      const data = await response.json()
      
      if (data.success && data.data && Array.isArray(data.data.planes)) {
        setAllAircraft(data.data.planes)
      } else {
        console.error("Invalid aircraft response format:", data)
      }
    } catch (err) {
      console.error("Error fetching aircraft:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchAircraft()
  }, [])

  // Get schedules for the current date
  const daySchedules = schedules.filter(schedule => {
    if (!schedule.scheduled_start_time) return false
    const scheduleDate = new Date(schedule.scheduled_start_time)
    return isSameDay(scheduleDate, currentDate)
  })

  // Group schedules by aircraft and include all aircraft
  const aircraftGroups = React.useMemo(() => {
    const groups: Record<string, { aircraft: Aircraft; schedules: Schedule[] }> = {}
    
    // First, add all aircraft (even those without flights)
    allAircraft.forEach(aircraft => {
      groups[aircraft.id] = {
        aircraft,
        schedules: []
      }
    })
    
    // Then, add schedules to their respective aircraft
    daySchedules.forEach(schedule => {
      const aircraftId = schedule.plane_id._id
      if (groups[aircraftId]) {
        groups[aircraftId].schedules.push(schedule)
      } else {
        // If aircraft not in allAircraft list, create entry from schedule data
        groups[aircraftId] = {
          aircraft: {
            id: schedule.plane_id._id,
            registration: schedule.plane_id.registration,
            type: schedule.plane_id.type,
            aircraftModel: schedule.plane_id.aircraftModel,
            status: 'Available'
          },
          schedules: [schedule]
        }
      }
    })

    // Sort schedules within each aircraft group by start time
    Object.keys(groups).forEach(aircraftId => {
      groups[aircraftId].schedules.sort((a, b) => 
        new Date(a.scheduled_start_time).getTime() - new Date(b.scheduled_start_time).getTime()
      )
    })

    return groups
  }, [daySchedules, allAircraft])

  // Generate time slots (24 hours: midnight to midnight)
  const timeSlots = React.useMemo(() => {
    const slots = []
    
    for (let hour = 0; hour < 24; hour++) {
      slots.push(hour)
    }
    return slots
  }, [])

  const handleFlightClick = (schedule: Schedule) => {
    setSelectedFlight(schedule)
    setIsFlightDialogOpen(true)
  }


  const getTimePosition = (timeString: string) => {
    const date = new Date(timeString)
    const hour = date.getHours()
    const minutes = date.getMinutes()
    
    // Calculate position as percentage from midnight (00:00)
    const totalMinutesFromMidnight = hour * 60 + minutes
    const totalMinutesInDay = 24 * 60 // Full 24 hours
    
    return Math.max(0, Math.min(100, (totalMinutesFromMidnight / totalMinutesInDay) * 100))
  }

  const getFlightWidth = (schedule: Schedule) => {
    const startTime = new Date(schedule.scheduled_start_time)
    const endTime = new Date(schedule.scheduled_end_time)
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    const totalMinutesInDay = 24 * 60 // Full 24 hours
    
    return Math.min(100, (durationMinutes / totalMinutesInDay) * 100)
  }

  // Function to detect overlapping schedules and assign stack positions
  const processSchedulesForStacking = (schedules: Schedule[]) => {
    if (schedules.length === 0) return []

    // Sort schedules by start time
    const sortedSchedules = [...schedules].sort((a, b) => 
      new Date(a.scheduled_start_time).getTime() - new Date(b.scheduled_start_time).getTime()
    )

    // Assign stack levels for overlapping schedules
    const processedSchedules: (Schedule & { stackLevel: number; maxStack: number })[] = []
    
    for (const schedule of sortedSchedules) {
      const startTime = new Date(schedule.scheduled_start_time).getTime()
      const endTime = new Date(schedule.scheduled_end_time).getTime()
      
      // Find overlapping schedules that are already processed
      const overlapping = processedSchedules.filter(existing => {
        const existingStart = new Date(existing.scheduled_start_time).getTime()
        const existingEnd = new Date(existing.scheduled_end_time).getTime()
        return startTime < existingEnd && endTime > existingStart
      })
      
      // Find the lowest available stack level
      let stackLevel = 0
      const usedLevels = overlapping.map(s => s.stackLevel)
      while (usedLevels.includes(stackLevel)) {
        stackLevel++
      }
      
      processedSchedules.push({
        ...schedule,
        stackLevel,
        maxStack: 0 // Will be calculated after all schedules are processed
      })
    }
    
    // Calculate maxStack for each schedule
    processedSchedules.forEach(schedule => {
      const startTime = new Date(schedule.scheduled_start_time).getTime()
      const endTime = new Date(schedule.scheduled_end_time).getTime()
      
      const overlapping = processedSchedules.filter(other => {
        const otherStart = new Date(other.scheduled_start_time).getTime()
        const otherEnd = new Date(other.scheduled_end_time).getTime()
        return startTime < otherEnd && endTime > otherStart
      })
      
      schedule.maxStack = Math.max(1, ...overlapping.map(s => s.stackLevel + 1))
    })
    
    return processedSchedules
  }

  // Get flight type styling
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
      case 'commercial training':
        return {
          bg: 'bg-[#73738c] dark:bg-[#73738c]/80',
          border: 'border-[#73738c] dark:border-[#73738c]/60',
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

  // Format time for display
  const formatTime = (timeString: string) => {
    return format(new Date(timeString), "h:mm a")
  }


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          Aircraft Schedule - {format(currentDate, "EEEE, MMMM d, yyyy")}
        </h2>
      </div>

      {/* Time header */}
      <div className="flex border-b bg-gray-50">
        <div className="w-48 p-2 border-r bg-white">
          <span className="text-sm font-medium">Aircraft</span>
        </div>
        <div className="flex-1 relative">
          <div className="flex">
            {timeSlots.map((hour) => (
              <div key={hour} className="flex-1 min-w-0 p-2 text-center border-r border-gray-200 text-xs">
                {format(addHours(startOfDay(currentDate), hour), "h a")}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aircraft rows */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Loading aircraft...
          </div>
        ) : Object.keys(aircraftGroups).length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No aircraft available
          </div>
        ) : (
          Object.entries(aircraftGroups).map(([aircraftId, { aircraft, schedules }]) => {
            return (
              <div key={aircraftId} className="flex border-b min-h-[60px]">
                {/* Aircraft info */}
                <div className="w-48 p-3 border-r bg-white flex flex-col justify-center">
                  <div className="font-medium text-sm">{aircraft.registration}</div>
                  {aircraft.type && (
                    <div className="text-xs text-muted-foreground">
                      {aircraft.type} {aircraft.aircraftModel}
                    </div>
                  )}
                  {schedules.length === 0 && (
                    <div className="text-xs text-green-600 mt-1">Available</div>
                  )}
                </div>

                {/* Timeline */}
                <div className="flex-1 relative bg-gray-25 min-h-[60px]">
                  {/* Time grid lines */}
                  <div className="absolute inset-0 flex">
                    {timeSlots.map((hour) => (
                      <div key={hour} className="flex-1 border-r border-gray-200" />
                    ))}
                  </div>

                  {/* Scheduled flights */}
                  {(() => {
                    const processedSchedules = processSchedulesForStacking(schedules)
                    
                    return processedSchedules.map((schedule) => {
                      const typeStyle = getFlightTypeStyle(schedule.flight_type)
                      const student = students[schedule.student_id._id]
                      const instructor = schedule.instructor_id ? instructors[schedule.instructor_id._id] : null
                      
                      // Calculate stacking position
                      const availableHeight = 52 // Aircraft row height minus padding
                      const stackHeight = availableHeight / schedule.maxStack
                      const top = 4 + (schedule.stackLevel * stackHeight)
                      const height = stackHeight - 2 // Small gap between stacked items
                      
                      return (
                        <div
                          key={schedule._id}
                          className={cn(
                            "absolute rounded cursor-pointer border-l-4 transition-all duration-200 hover:shadow-lg overflow-hidden",
                            typeStyle.bg,
                            typeStyle.border,
                            typeStyle.text
                          )}
                          style={{
                            left: `${getTimePosition(schedule.scheduled_start_time)}%`,
                            width: `${getFlightWidth(schedule)}%`,
                            top: `${top}px`,
                            height: `${height}px`,
                            minWidth: '80px',
                            zIndex: 10 + schedule.stackLevel
                          }}
                          onClick={() => handleFlightClick(schedule)}
                        >
                          <div className="h-full flex items-center justify-center px-2">
                            <div className="font-medium text-sm truncate text-center">
                              {student ? `${student.user_id.first_name} ${student.user_id.last_name}` : 'Unassigned'}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Flight details dialog */}
      {selectedFlight && (
        <ScheduleDialog
          open={isFlightDialogOpen}
          onOpenChange={setIsFlightDialogOpen}
          schedule={selectedFlight}
          student={students[selectedFlight.student_id._id] || null}
          instructor={instructors[selectedFlight.instructor_id._id] || null}
          onScheduleUpdate={onScheduleUpdate || (() => {})}
        />
      )}
    </div>
  )
}