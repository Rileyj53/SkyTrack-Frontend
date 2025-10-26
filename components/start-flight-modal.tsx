"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TimePicker } from "@/components/ui/time-picker"
import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

interface FlightLog {
  _id: string
  date: string
  start_time: string
  plane_reg: string
  plane_id: string
  student_name: string
  student_id: string
  instructor: string
  instructor_id: string
  duration: number
  type: string
  status: string
  school_id: string
  created_at: string
  updated_at: string
}

interface StartFlightModalProps {
  isOpen: boolean
  onClose: () => void
  onStartFlight: (actualStartTime: string) => Promise<void>
  selectedFlight: FlightLog | null
  isUpdating: boolean
}

export function StartFlightModal({ 
  isOpen, 
  onClose, 
  onStartFlight, 
  selectedFlight, 
  isUpdating 
}: StartFlightModalProps) {
  // Initialize with current time
  const [actualStartTime, setActualStartTime] = useState<string | null>(() => {
    const now = new Date()
    return now.toTimeString().slice(0, 5) // HH:MM format
  })

  const handleOpenChange = (open: boolean) => {
    if (open) {
      // Pre-fill with current time when opening (if not already set)
      if (!actualStartTime) {
        const now = new Date()
        const currentTime = now.toTimeString().slice(0, 5) // HH:MM format
        setActualStartTime(currentTime)
      }
    } else {
      // Reset time when closing
      setActualStartTime(null)
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (!actualStartTime) return
    await onStartFlight(actualStartTime)
    setActualStartTime(null)
  }

  if (!selectedFlight) return null

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 w-full h-full bg-black opacity-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-lg mx-auto px-4 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <div className="bg-white dark:bg-gray-900 rounded-md shadow-lg px-4 py-6">
            <div className="flex items-center justify-end">
              <Dialog.Close className="p-2 text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
            <div className="max-w-sm mx-auto space-y-4 text-center">
              <Dialog.Title className="text-lg font-medium text-gray-800 dark:text-gray-200">
                Start Flight
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400">
                <div className="space-y-3">
                  <p>Set the actual start time for this flight:</p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-left">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Student:</span>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">{selectedFlight.student_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Instructor:</span>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">{selectedFlight.instructor}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Aircraft:</span>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">{selectedFlight.plane_reg}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Date:</span>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">{new Date(selectedFlight.date).toLocaleDateString()}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-gray-500 dark:text-gray-400">Scheduled Start:</span>
                        <p className="text-gray-800 dark:text-gray-200 font-medium">{selectedFlight.start_time}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Description>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Actual Start Time
                </Label>
                <div className="flex justify-center">
                  <TimePicker
                    time={actualStartTime}
                    setTime={setActualStartTime}
                    className="w-full"
                    minuteInterval={1}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Dialog.Close asChild>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button 
                  onClick={handleSubmit}
                  disabled={!actualStartTime || isUpdating}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {isUpdating ? "Starting..." : "Start Flight"}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 