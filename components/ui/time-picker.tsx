"use client"

import * as React from "react"
import { Clock, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimePickerProps {
  time: string | null
  setTime: (time: string | null) => void
  className?: string
  onApply?: () => void
  minuteInterval?: number // Default to 5, can be set to 1 for more precision
}

export function TimePicker({ time, setTime, className, onApply, minuteInterval = 5 }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(time || "")
  
  // Parse current hour, minute, and period (AM/PM)
  const [hour12, minute, period] = React.useMemo(() => {
    if (!inputValue) return ["12", "00", "AM"]
    const [h, m] = inputValue.split(":")
    const hourNum = parseInt(h, 10)
    const isPM = hourNum >= 12
    const hour12Value = isPM ? (hourNum === 12 ? 12 : hourNum - 12) : (hourNum === 0 ? 12 : hourNum)
    return [hour12Value.toString().padStart(2, '0'), m, isPM ? "PM" : "AM"]
  }, [inputValue])

  // Generate hour options (01-12)
  const hourOptions = React.useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => 
      (i + 1).toString().padStart(2, '0')
    )
  }, [])

  // Generate minute options based on minuteInterval prop
  const minuteOptions = React.useMemo(() => {
    const totalOptions = 60 / minuteInterval;
    return Array.from({ length: totalOptions }, (_, i) => 
      (i * minuteInterval).toString().padStart(2, '0')
    )
  }, [minuteInterval])

  // Period options (AM/PM)
  const periodOptions = ["AM", "PM"]

  const handleHourChange = (value: string) => {
    const newTime = convertTo24Hour(value, minute, period)
    setInputValue(newTime)
    setTime(newTime)
  }

  const handleMinuteChange = (value: string) => {
    const newTime = convertTo24Hour(hour12, value, period)
    setInputValue(newTime)
    setTime(newTime)
  }

  const handlePeriodChange = (value: string) => {
    const newTime = convertTo24Hour(hour12, minute, value)
    setInputValue(newTime)
    setTime(newTime)
  }

  // Convert 12-hour time to 24-hour format
  const convertTo24Hour = (hour: string, minute: string, period: string): string => {
    let hourNum = parseInt(hour, 10)
    if (period === "PM" && hourNum !== 12) {
      hourNum += 12
    } else if (period === "AM" && hourNum === 12) {
      hourNum = 0
    }
    return `${hourNum.toString().padStart(2, '0')}:${minute}`
  }

  // Format time for display (12-hour format)
  const formatDisplayTime = (time: string | null): string => {
    if (!time) return ""
    const [h, m] = time.split(":")
    const hourNum = parseInt(h, 10)
    const isPM = hourNum >= 12
    const hour12Value = isPM ? (hourNum === 12 ? 12 : hourNum - 12) : (hourNum === 0 ? 12 : hourNum)
    return `${hour12Value}:${m} ${isPM ? "PM" : "AM"}`
  }

  const handleApplyTime = () => {
    if (onApply) {
      onApply()
    }
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-[140px] justify-start text-left font-normal dark:border-muted-foreground/20",
            !time && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {time ? formatDisplayTime(time) : <span>Pick a time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4 dark:bg-muted dark:border-muted-foreground/20" align="start">
        <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-center gap-2 bg-muted/30 dark:bg-muted/50 p-3 rounded-md">
            <Select value={hour12} onValueChange={handleHourChange}>
              <SelectTrigger className="w-[60px] h-9 dark:bg-muted/50">
                <SelectValue placeholder="Hour" />
              </SelectTrigger>
              <SelectContent>
                {hourOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-lg font-medium dark:text-muted-foreground">:</span>
            <Select value={minute} onValueChange={handleMinuteChange}>
              <SelectTrigger className="w-[60px] h-9 dark:bg-muted/50">
                <SelectValue placeholder="Min" />
              </SelectTrigger>
              <SelectContent>
                {minuteOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[70px] h-9 dark:bg-muted/50">
                <SelectValue placeholder="AM/PM" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleApplyTime}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 