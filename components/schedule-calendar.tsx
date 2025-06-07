"use client"

import * as React from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { WeekView } from "@/components/schedule/week-view"
import { DayView } from "@/components/schedule/day-view"
import { MonthView } from "@/components/schedule/month-view"

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

interface ScheduleCalendarProps {
  currentDate: Date
  view: "day" | "week" | "month"
  weekDays: Date[]
  schedules: Schedule[]
  students: Record<string, Student>
  instructors: Record<string, Instructor>
  onScheduleUpdate?: () => void
  onDateChange: (date: Date) => void
  onViewChange: (view: "day" | "week" | "month") => void
}

export function ScheduleCalendar({
  currentDate,
  view,
  weekDays,
  schedules,
  students,
  instructors,
  onScheduleUpdate,
  onDateChange,
  onViewChange
}: ScheduleCalendarProps) {


  const formatDateString = (date: Date) => {
    return format(date, "yyyy-MM-dd")
  }

  const getFlightsForDate = (date: Date) => {
    const dateString = formatDateString(date)
    return schedules.filter((schedule) => {
      if (!schedule.scheduled_start_time) return false
      const scheduleDate = new Date(schedule.scheduled_start_time)
      const scheduleDateString = format(scheduleDate, 'yyyy-MM-dd')
      return scheduleDateString === dateString
    })
  }

  // Render day view using the proper DayView component
  const renderDayView = () => {
    return (
      <DayView
        currentDate={currentDate}
        schedules={schedules}
        students={students}
        instructors={instructors}
        onSelectDate={onDateChange}
        onScheduleUpdate={onScheduleUpdate}
      />
    )
  }

  // Render week view using the updated WeekView component
  const renderWeekView = () => {
    return (
      <WeekView
        currentDate={currentDate}
        weekDays={weekDays}
        schedules={schedules}
        students={students}
        instructors={instructors}
        onSelectDate={onDateChange}
        onScheduleUpdate={onScheduleUpdate}
      />
    )
  }

  // Render month view using the proper MonthView component
  const renderMonthView = () => {
    return (
      <MonthView
        schedules={schedules}
        students={students}
        instructors={instructors}
        onSelectDate={onDateChange}
        onScheduleUpdate={onScheduleUpdate}
        onViewChange={onViewChange}
        currentDate={currentDate}
      />
    )
  }

  switch (view) {
    case "day":
      return renderDayView()
    case "week":
      return renderWeekView()
    case "month":
      return renderMonthView()
    default:
      return renderWeekView()
  }
}
