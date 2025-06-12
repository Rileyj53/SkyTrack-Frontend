"use client"

import React, { useEffect, useState } from "react"
import { Plane, MapPin, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface FlightData {
  _id: string
  tail_number: string
  aircraft_info?: {
    type: string
    model: string
  }
  tracking: Array<{
    latitude: number
    longitude: number
    altitude: number | string
    heading: number
    ground_speed: number
    timestamp: string
    flight?: string
  }>
}

interface ActiveFlightsListProps {
  onFlightClick?: (flight: FlightData) => void
  showHeader?: boolean
}

export function ActiveFlightsList({ onFlightClick, showHeader = true }: ActiveFlightsListProps) {
  const [trackingData, setTrackingData] = useState<FlightData[]>([])
  const [loading, setLoading] = useState(true)

  // Load tracking data from localStorage on mount
  useEffect(() => {
    const loadTrackingData = () => {
      const savedTrackingData = localStorage.getItem('trackingData')
      if (savedTrackingData) {
        try {
          const data = JSON.parse(savedTrackingData)
          setTrackingData(data || [])
        } catch (err) {
          console.error('Error parsing saved tracking data:', err)
          setTrackingData([])
        }
      } else {
        setTrackingData([])
      }
      setLoading(false)
    }
    
    loadTrackingData()
    
    // Listen for storage changes to update in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'trackingData') {
        loadTrackingData()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // Also check for updates periodically
    const interval = setInterval(loadTrackingData, 5000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const activeFlights = trackingData?.filter((flight: FlightData) => 
    flight.tracking && flight.tracking.length > 0
  ) || []

  if (loading) {
    return (
      <div className="h-full border rounded-md bg-white dark:bg-gray-800">
        {showHeader && (
          <div className="p-3 border-b">
            <h3 className="text-lg font-semibold">Active Flights</h3>
            <p className="text-sm text-muted-foreground">Live aircraft status</p>
          </div>
        )}
        <div className="flex-1 overflow-auto p-2">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-700 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="space-y-1">
                      <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                      <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-12"></div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-8"></div>
                    <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-10"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full border rounded-md bg-white dark:bg-gray-800 flex flex-col">
      {showHeader && (
        <div className="p-3 border-b bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Active Flights</h3>
              <p className="text-sm text-muted-foreground">Live aircraft status</p>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              {activeFlights.length} Active
            </Badge>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        {activeFlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center mb-4">
              <Plane className="h-8 w-8 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">No Active Flights</h4>
            <p className="text-sm text-muted-foreground">All aircraft are currently on the ground.</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {activeFlights.map((flight) => {
              const latestPosition = flight.tracking[flight.tracking.length - 1]
              const timeAgo = new Date(latestPosition.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
              
              return (
                <div
                  key={flight._id}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => onFlightClick?.(flight)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                        <Plane className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{flight.tail_number}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {flight.aircraft_info ? `${flight.aircraft_info.type} ${flight.aircraft_info.model}` : 'Aircraft'}
                        </div>
                        {latestPosition.flight?.trim() && (
                          <div className="text-xs font-mono bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded mt-1 inline-block">
                            {latestPosition.flight.trim()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right space-y-1 flex-shrink-0">
                      <div className="text-xs font-medium">
                        {latestPosition.altitude === "ground" ? "Ground" : `${Number(latestPosition.altitude).toLocaleString()}ft`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {latestPosition.ground_speed} kts
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeAgo}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 