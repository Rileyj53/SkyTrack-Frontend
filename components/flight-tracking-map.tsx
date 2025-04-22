"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import { Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Import Leaflet CSS
import "leaflet/dist/leaflet.css"

// Fix for Leaflet marker icons in Next.js
const fixLeafletIcon = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  })
}

// Update the createAircraftIcon function to make the aircraft icons more visible and bold
const createAircraftIcon = (heading: number) => {
  const isDarkMode = document.documentElement.classList.contains("dark")
  const strokeColor = isDarkMode ? "#ffffff" : "#000000"
  const fillColor = isDarkMode ? "#1e293b" : "#e2e8f0"

  return L.divIcon({
    html: `
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="36" 
        height="36" 
        viewBox="0 0 24 24" 
        fill="${fillColor}" 
        stroke="${strokeColor}" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style="transform: rotate(${heading}deg);"
      >
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
      </svg>
    `,
    className: "aircraft-icon",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

// Update the AircraftIconStyles component to enhance the styling
const AircraftIconStyles = () => {
  return (
    <style jsx global>{`
      .aircraft-icon {
        background: transparent;
        border: none;
      }
      .aircraft-icon svg {
        filter: drop-shadow(0px 3px 5px rgba(0, 0, 0, 0.7));
        transition: all 0.3s ease;
      }
      .dark .aircraft-icon svg {
        filter: drop-shadow(0px 3px 5px rgba(255, 255, 255, 0.4));
      }
      .aircraft-icon:hover svg {
        transform: scale(1.4) rotate(var(--heading));
        filter: drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.9));
      }
      .dark .aircraft-icon:hover svg {
        filter: drop-shadow(0px 4px 6px rgba(255, 255, 255, 0.5));
      }
    `}</style>
  )
}

// Map layer options
const mapLayers = {
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    // Using a different satellite provider that doesn't require subdomains
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
  },
}

// Component to recenter map
function MapCenterControl({ center }: { center: [number, number] }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

  return null
}

// Component to change the map layer
function MapLayerControl({ activeLayer, onChange }: { activeLayer: string; onChange: (layer: string) => void }) {
  const map = useMap()

  useEffect(() => {
    // This effect runs when the activeLayer changes
    const layer = mapLayers[activeLayer as keyof typeof mapLayers]
    if (layer) {
      // We would update the layer here if we had a reference to it
      // For now, the parent component handles recreating the TileLayer
    }
  }, [activeLayer, map])

  return null
}

interface FlightTrackingMapProps {
  className?: string
}

export function FlightTrackingMap({ className }: FlightTrackingMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => {
    // Try to get school location from localStorage first
    const savedSchoolLocation = localStorage.getItem('schoolLocation')
    if (savedSchoolLocation) {
      try {
        const { latitude, longitude } = JSON.parse(savedSchoolLocation)
        return [latitude, longitude]
      } catch (e) {
        console.error('Error parsing saved school location:', e)
      }
    }
    // Fallback to Seattle only if no school location is available
    return [47.6062, -122.3321]
  })
  const [mapZoom, setMapZoom] = useState(12)
  const [activeMapLayer, setActiveMapLayer] = useState<string>("street")
  const [activeFlights, setActiveFlights] = useState<any[]>([])
  const [todaysFlights, setTodaysFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<any | null>(null)
  const [planeData, setPlaneData] = useState<any | null>(null)
  const [showTimeDialog, setShowTimeDialog] = useState(false)
  const [tachTime, setTachTime] = useState("")
  const [hobbsTime, setHobbsTime] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("In Flight")
  const [trackingData, setTrackingData] = useState<any | null>(null)
  const [activeTrackingIds, setActiveTrackingIds] = useState<string[]>([])
  const [isStartingFlight, setIsStartingFlight] = useState(false)
  const [schoolData, setSchoolData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [openPopupId, setOpenPopupId] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const geocodedCoordinatesRef = useRef<{ latitude: number; longitude: number } | null>(null)
  const lastFocusUpdateRef = useRef<number>(0)
  const [planeInfoCache, setPlaneInfoCache] = useState<{ [key: string]: any }>({})
  const router = useRouter()

  // Fix Leaflet icon issue on client side
  useEffect(() => {
    fixLeafletIcon()
  }, [])

  // Debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // Geocode address to get coordinates
  const geocodeAddress = async (address: any) => {
    try {
      // Check if we already have coordinates for this address
      if (geocodedCoordinatesRef.current) {
        console.log('Using cached coordinates:', geocodedCoordinatesRef.current)
        return geocodedCoordinatesRef.current
      }

      // Format address with more specific details
      const addressString = `${address.street}, ${address.city}, ${address.state} ${address.zip}, ${address.country}`
      console.log('Geocoding address:', addressString)
      
      // Add a delay to respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Flight School Dashboard/1.0'
          }
        }
      )
      
      if (!response.ok) {
        console.error('Geocoding request failed:', response.status)
        return null
      }
      
      const data = await response.json()
      console.log('Geocoding response:', data)
      
      if (data && data[0]) {
        const coordinates = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }
        console.log('Found coordinates:', coordinates)
        geocodedCoordinatesRef.current = coordinates
        return coordinates
      }
      
      // If no results found, try with just the city and state
      console.log('No results found with full address, trying city and state only')
      const cityStateString = `${address.city}, ${address.state}`
      const cityStateResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityStateString)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Flight School Dashboard/1.0'
          }
        }
      )
      
      if (!cityStateResponse.ok) {
        console.error('City/State geocoding request failed:', cityStateResponse.status)
        return null
      }
      
      const cityStateData = await cityStateResponse.json()
      console.log('City/State geocoding response:', cityStateData)
      
      if (cityStateData && cityStateData[0]) {
        const coordinates = {
          latitude: parseFloat(cityStateData[0].lat),
          longitude: parseFloat(cityStateData[0].lon)
        }
        console.log('Found coordinates from city/state:', coordinates)
        geocodedCoordinatesRef.current = coordinates
        return coordinates
      }
      
      console.log('No coordinates found')
      return null
    } catch (err) {
      console.error("Error geocoding address:", err)
      return null
    }
  }

  // Fetch school data
  const fetchSchoolData = async () => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) {
        console.log('Missing required auth data')
        return
      }

      console.log('Fetching school data for ID:', schoolId)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch school data: ${response.status}`)
      }

      const data = await response.json()
      console.log('Received school data:', data.school)
      const school = data.school
      
      // Geocode the address
      if (school.address) {
        console.log('School address found:', school.address)
        const coordinates = await geocodeAddress(school.address)
        if (coordinates) {
          school.address = {
            ...school.address,
            ...coordinates
          }
          console.log('Updated school address with coordinates:', school.address)
        } else {
          console.log('Failed to geocode address')
        }
      } else {
        console.log('No address found in school data')
      }
      
      setSchoolData(school)
      setIsLoading(false)
    } catch (err) {
      console.error("Error fetching school data:", err)
      setIsLoading(false)
    }
  }

  // Load school data on mount
  useEffect(() => {
    fetchSchoolData()
  }, [])

  // Update map focus based on active flights or school location
  const updateMapFocus = useCallback(() => {
    if (!mapRef.current || isLoading) return

    const activeFlights = trackingData?.filter((flight: any) => 
      flight.tracking && flight.tracking.length > 0
    ) || []

    console.log('Active flights:', activeFlights.length)
    console.log('School data:', schoolData)

    if (activeFlights.length > 0) {
      if (activeFlights.length === 1) {
        // Single active flight - center on it with animation
        const flight = activeFlights[0]
        const latestPosition = flight.tracking[flight.tracking.length - 1]
        console.log('Centering on single flight:', latestPosition)
        mapRef.current.flyTo([latestPosition.latitude, latestPosition.longitude], 12, {
          duration: 1.5
        })
      } else {
        // Multiple active flights - fit all in view with animation
        const bounds = L.latLngBounds(activeFlights.map((flight: any) => {
          const latestPosition = flight.tracking[flight.tracking.length - 1]
          return [latestPosition.latitude, latestPosition.longitude]
        }))
        console.log('Fitting bounds for multiple flights:', bounds)
        mapRef.current.flyToBounds(bounds, {
          padding: [50, 50],
          duration: 1.5
        })
      }
    } else if (schoolData?.address?.latitude && schoolData?.address?.longitude) {
      // No active flights - center on school with animation
      console.log('Centering on school:', schoolData.address)
      // Save school location for future use
      localStorage.setItem('schoolLocation', JSON.stringify({
        latitude: schoolData.address.latitude,
        longitude: schoolData.address.longitude
      }))
      mapRef.current.flyTo([schoolData.address.latitude, schoolData.address.longitude], 12, {
        duration: 1.5
      })
    }
  }, [trackingData, schoolData, isLoading])

  // Update map focus when tracking data or school data changes
  useEffect(() => {
    if (!isLoading) {
      updateMapFocus()
    }
  }, [trackingData, schoolData, isLoading, updateMapFocus])

  // Load tracking data from localStorage on mount
  useEffect(() => {
    const savedTrackingData = localStorage.getItem('trackingData')
    if (savedTrackingData) {
      try {
        setTrackingData(JSON.parse(savedTrackingData))
      } catch (err) {
        console.error('Error parsing saved tracking data:', err)
      }
    }
  }, [])

  // Save tracking data to localStorage when it changes
  useEffect(() => {
    if (trackingData) {
      localStorage.setItem('trackingData', JSON.stringify(trackingData))
    }
  }, [trackingData])

  const fetchTodaysFlights = async () => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) {
        console.error("Missing required authentication:", { schoolId: !!schoolId, token: !!token, apiKey: !!apiKey })
        throw new Error("Missing required authentication")
      }

      const now = new Date()
      const today = now.toISOString().split('T')[0]
      console.log('Fetching flights for date:', today)
      
      // Try both endpoints to ensure we get the data
      const url = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight-logs/today`
      console.log('Fetching flights from URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      console.log('Flight logs response status:', response.status)
      if (!response.ok) {
        throw new Error(`Failed to fetch flights: ${response.status}`)
      }

      const data = await response.json()
      console.log('Flight logs response data:', data)
      
      if (data.flightLogs && Array.isArray(data.flightLogs)) {
        console.log('Setting today\'s flights:', data.flightLogs.length, 'flights found')
        setTodaysFlights(data.flightLogs)
      } else if (Array.isArray(data)) {
        // Handle case where the API returns an array directly
        console.log('Setting today\'s flights (direct array):', data.length, 'flights found')
        setTodaysFlights(data)
      } else {
        console.warn('Unexpected flight logs data structure:', data)
        // Try the alternative endpoint as a fallback
        const altUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight-logs?date=${today}`
        console.log('Trying alternative endpoint:', altUrl)
        
        const altResponse = await fetch(altUrl, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          credentials: 'include'
        })
        
        if (altResponse.ok) {
          const altData = await altResponse.json()
          console.log('Alternative endpoint response:', altData)
          
          if (altData.flightLogs && Array.isArray(altData.flightLogs)) {
            console.log('Setting today\'s flights from alternative endpoint:', altData.flightLogs.length, 'flights found')
            setTodaysFlights(altData.flightLogs)
          } else if (Array.isArray(altData)) {
            console.log('Setting today\'s flights from alternative endpoint (direct array):', altData.length, 'flights found')
            setTodaysFlights(altData)
          } else {
            console.error('Both endpoints returned unexpected data structure')
            setTodaysFlights([])
          }
        } else {
          console.error('Alternative endpoint also failed:', altResponse.status)
          setTodaysFlights([])
        }
      }
    } catch (err) {
      console.error("Error fetching flights:", err)
      setTodaysFlights([])
    }
  }

  // Add useEffect for fetching today's flights
  useEffect(() => {
    console.log('Initial fetch of today\'s flights')
    fetchTodaysFlights()
    
    // Set up polling every 30 seconds
    const interval = setInterval(() => {
      console.log('Polling for flight updates')
      fetchTodaysFlights()
    }, 30000)
    
    return () => clearInterval(interval)
  }, []) // Empty dependency array to run only on mount
  
  // Add a separate useEffect to refetch flights when school data changes
  useEffect(() => {
    if (schoolData) {
      console.log('School data updated, refetching flights')
      fetchTodaysFlights()
    }
  }, [schoolData])

  // Add function to check if flight can be started
  const canStartFlight = (date: string, startTime: string) => {
    // Parse the time string (HH:mm)
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Create a date object for the flight time
    const flightDate = new Date(date);
    
    // Set the hours and minutes
    flightDate.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    
    // Calculate 30 minutes before flight time
    const thirtyMinutesBefore = new Date(flightDate.getTime() - 30 * 60000);
    
    // Calculate 30 minutes after flight time
    const thirtyMinutesAfter = new Date(flightDate.getTime() + 30 * 60000);
    
    // Log the time calculations for debugging
    console.log('canStartFlight calculation:', {
      flightDate: flightDate.toISOString(),
      now: now.toISOString(),
      thirtyMinutesBefore: thirtyMinutesBefore.toISOString(),
      thirtyMinutesAfter: thirtyMinutesAfter.toISOString(),
      isWithinWindow: now >= thirtyMinutesBefore && now <= thirtyMinutesAfter
    });
    
    // Flight can be started if current time is between 30 minutes before and 30 minutes after the scheduled time
    return now >= thirtyMinutesBefore && now <= thirtyMinutesAfter;
  }

  const handleStartFlight = async (event: React.MouseEvent, flight: any) => {
    event.stopPropagation()
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required authentication")
      }

      // First get the plane data
      const planeResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${flight.plane_id}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!planeResponse.ok) {
        throw new Error(`Failed to fetch plane data: ${planeResponse.status}`)
      }

      const planeData = await planeResponse.json()
      console.log('Plane data received:', planeData)
      
      // Access the values from the nested plane object
      const plane = planeData.plane
      setPlaneData(plane)
      setSelectedFlight(flight)
      setTachTime(plane?.tach_time?.toString() ?? '0.0')
      setHobbsTime(plane?.hopps_time?.toString() ?? '0.0')
      setSelectedStatus(flight.status)
      setShowTimeDialog(true)
    } catch (err) {
      console.error("Error starting flight:", err)
    }
  }

  const handleConfirmStart = async () => {
    try {
      if (!selectedFlight || !planeData) return

      setIsStartingFlight(true)

      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required authentication")
      }

      // Update plane times
      const updateResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${selectedFlight.plane_id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          tach_time: parseFloat(tachTime),
          hopps_time: parseFloat(hobbsTime)
        }),
        credentials: 'include'
      })

      if (!updateResponse.ok) {
        throw new Error(`Failed to update plane times: ${updateResponse.status}`)
      }

      // Update flight log status to "In Flight"
      const statusResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight-logs/${selectedFlight._id}`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          status: "In Flight"
        }),
        credentials: 'include'
      })

      if (!statusResponse.ok) {
        throw new Error(`Failed to update flight status: ${statusResponse.status}`)
      }

      // Start tracking the flight
      const trackingResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/track`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          tail_number: planeData.registration,
          instructor_id: selectedFlight.instructor_id,
          student_id: selectedFlight.student_id,
          plane_id: selectedFlight.plane_id,
          school_id: schoolId
        }),
        credentials: 'include'
      })

      if (!trackingResponse.ok) {
        throw new Error(`Failed to start flight tracking: ${trackingResponse.status}`)
      }

      const trackingResult = await trackingResponse.json()
      
      // Store tracking ID in localStorage for future use
      if (trackingResult.track && trackingResult.track._id) {
        const trackingId = trackingResult.track._id
        localStorage.setItem(`tracking_${selectedFlight._id}`, trackingId)
        
        // Add to active tracking IDs
        setActiveTrackingIds(prev => [...prev, trackingId])
      }

      // Close dialog and refresh flights
      setShowTimeDialog(false)
      setSelectedFlight(null)
      setPlaneData(null)
      fetchTodaysFlights()

      // Fetch latest tracking data immediately
      await fetchTrackingUpdates()
    } catch (err) {
      console.error("Error confirming flight start:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsStartingFlight(false)
    }
  }

  // Function to fetch tracking updates for all flights
  const fetchTrackingUpdates = async () => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/track?school_id=${schoolId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tracking updates: ${response.status}`)
      }

      const data = await response.json()
      if (data.tracks && Array.isArray(data.tracks)) {
        setTrackingData(data.tracks)
      }
    } catch (err) {
      console.error("Error fetching tracking updates:", err)
    }
  }

  // Set up interval to fetch tracking updates every minute
  useEffect(() => {
    // Initial fetch
    fetchTrackingUpdates()

    // Set up interval for regular updates (1 minute)
    const interval = setInterval(fetchTrackingUpdates, 60000)

    return () => clearInterval(interval)
  }, [])

  // Load active tracking IDs from localStorage on component mount
  useEffect(() => {
    const loadActiveTrackingIds = () => {
      const trackingIds: string[] = []
      
      // Check all localStorage items for tracking IDs
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('tracking_')) {
          const trackingId = localStorage.getItem(key)
          if (trackingId) {
            trackingIds.push(trackingId)
          }
        }
      }
      
      setActiveTrackingIds(trackingIds)
    }
    
    loadActiveTrackingIds()
  }, [])

  // Get current layer configuration
  const currentLayer = mapLayers[activeMapLayer as keyof typeof mapLayers]

  // Add function to format UTC time to local time
  const formatLocalTime = (utcTime: string) => {
    const date = new Date(utcTime)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Add function to fetch plane info
  const fetchPlaneInfo = async (planeId: string) => {
    try {
      // Check cache first
      if (planeInfoCache[planeId]) {
        return planeInfoCache[planeId]
      }

      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required authentication")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${planeId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch plane info: ${response.status}`)
      }

      const data = await response.json()
      // Cache the result
      setPlaneInfoCache(prev => ({ ...prev, [planeId]: data.plane }))
      return data.plane
    } catch (err) {
      console.error("Error fetching plane info:", err)
      return null
    }
  }

  // Add effect to fetch plane info for active flights
  useEffect(() => {
    if (trackingData && Array.isArray(trackingData)) {
      trackingData.forEach(flightData => {
        if (flightData.plane_id) {
          fetchPlaneInfo(flightData.plane_id)
        }
      })
    }
  }, [trackingData])

  // Update the map markers to include tracking data if available
  const renderMapMarkers = () => {
    const markers = []
    
    // Add active flights from tracking data
    if (trackingData && Array.isArray(trackingData)) {
      trackingData.forEach((flightData) => {
        if (flightData.tracking && flightData.tracking.length > 0) {
          // Find matching flight log for additional info
          const flightLog = todaysFlights.find(f => f.plane_reg === flightData.tail_number && f.status === "In Flight")
          const latestPosition = flightData.tracking[flightData.tracking.length - 1]
          const planeInfo = planeInfoCache[flightData.plane_id]
          
          // Format departure time if available
          const departureTime = flightData.actual_off ? formatLocalTime(flightData.actual_off) : 'Not departed'
          
          markers.push(
            <Marker
              key={`tracking-${flightData._id}`}
              position={[latestPosition.latitude, latestPosition.longitude]}
              icon={createAircraftIcon(latestPosition.heading)}
              eventHandlers={{
                click: () => {
                  setMapCenter([latestPosition.latitude, latestPosition.longitude])
                  setOpenPopupId(flightData._id)
                },
              }}
            >
              <Popup
                open={openPopupId === flightData._id}
                onClose={() => setOpenPopupId(null)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                    <span className="font-bold">{flightData.tail_number}</span>
                    <span className="ml-auto bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">In Flight</span>
                  </div>
                  <div className="space-y-2">
                    <div><span className="font-medium">Aircraft:</span> {planeInfo ? `${planeInfo.type} (${planeInfo.registration})` : flightData.tail_number}</div>
                    <div><span className="font-medium">Student:</span> {flightLog?.student_name}</div>
                    <div><span className="font-medium">Instructor:</span> {flightLog?.instructor}</div>
                    <div><span className="font-medium">Altitude:</span> {Number(latestPosition.altitude * 100).toLocaleString()} ft</div>
                    <div><span className="font-medium">Speed:</span> {latestPosition.ground_speed} kts</div>
                    <div><span className="font-medium">Heading:</span> {latestPosition.heading}°</div>
                    <div><span className="font-medium">Departure:</span> {departureTime}</div>
                    {flightLog?.estimated_on && (
                      <div><span className="font-medium">Est. Arrival:</span> {formatLocalTime(flightLog.estimated_on)}</div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        }
      })
    }
    
    return markers
  }

  // Add function to handle flight card click
  const handleFlightCardClick = (flight: any) => {
    console.log('Flight card clicked:', flight)
    console.log('Tracking data:', trackingData)
    
    if (flight.status === "In Flight" && trackingData) {
      // Find the flight in tracking data by matching the tail number
      const trackedFlight = trackingData.find((f: any) => f.tail_number === flight.plane_reg)
      console.log('Found tracked flight:', trackedFlight)
      
      if (trackedFlight && trackedFlight.tracking && trackedFlight.tracking.length > 0) {
        const latestPosition = trackedFlight.tracking[trackedFlight.tracking.length - 1]
        console.log('Latest position:', latestPosition)
        
        if (mapRef.current) {
          // Create popup content
          const popupContent = `
            <div class="p-4">
              <div class="flex items-center gap-2 mb-4">
                <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                <span class="font-bold">${flight.plane_reg}</span>
                <span class="ml-auto bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">In Flight</span>
              </div>
              <div class="space-y-2">
                <div><span class="font-medium">Aircraft:</span> undefined (${flight.plane_reg})</div>
                <div><span class="font-medium">Student:</span> ${flight.student_name}</div>
                <div><span class="font-medium">Instructor:</span> undefined</div>
                <div><span class="font-medium">Altitude:</span> ${latestPosition.altitude} ft</div>
                <div><span class="font-medium">Speed:</span> ${latestPosition.ground_speed} kts</div>
                <div><span class="font-medium">Heading:</span> ${latestPosition.heading}°</div>
                <div><span class="font-medium">Departure:</span> Not departed</div>
                ${flight.estimated_on ? `<div><span class="font-medium">Est. Arrival:</span> ${flight.estimated_on}</div>` : ''}
              </div>
            </div>
          `

          // Create and open popup
          const popup = L.popup()
            .setLatLng([latestPosition.latitude, latestPosition.longitude])
            .setContent(popupContent)
            .openOn(mapRef.current)

          // Fly to the position
          mapRef.current.flyTo([latestPosition.latitude, latestPosition.longitude], 12, {
            duration: 1.5
          })
        }
      }
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
            "X-CSRF-Token": localStorage.getItem("csrfToken") || "",
            "Authorization": `Bearer ${token}`
          },
          credentials: "include"
        })

        if (!response.ok) {
          throw new Error("Not authenticated")
        }

        const data = await response.json()
        console.log('User data received:', JSON.stringify(data, null, 2))
        
        // Store the school ID in localStorage for other components to use
        if (data.user && data.user.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
          console.log('Stored school ID in localStorage:', data.user.school_id)
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Active Flight Tracking</CardTitle>
          <CardDescription>Loading map data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full rounded-md overflow-hidden border relative flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Initializing map...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Active Flight Tracking</CardTitle>
          <CardDescription>Real-time location of aircraft currently in flight</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              console.log('Manual refresh triggered')
              fetchTodaysFlights()
            }}
          >
            Refresh Flights
          </Button>
          <Select value={activeMapLayer} onValueChange={setActiveMapLayer}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select map type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="terrain">Terrain Map</SelectItem>
              <SelectItem value="street">Street Map</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full rounded-md overflow-hidden border relative">
          {typeof window !== "undefined" && (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "100%", width: "100%", zIndex: 0 }}
              scrollWheelZoom={false}
              minZoom={currentLayer.minZoom || 5}
              maxZoom={currentLayer.maxZoom}
              ref={mapRef}
            >
              <TileLayer attribution={currentLayer.attribution} url={currentLayer.url} maxZoom={currentLayer.maxZoom} />
              <MapCenterControl center={mapCenter} />
              <MapLayerControl activeLayer={activeMapLayer} onChange={setActiveMapLayer} />
              <AircraftIconStyles />
              {renderMapMarkers()}
            </MapContainer>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            // Get current local time
            const now = new Date();
            const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
            console.log('Current local time:', localDate.toISOString());
            console.log('All today\'s flights:', todaysFlights);
            
            const filteredFlights = todaysFlights.filter(flight => {
              console.log('Checking flight:', flight);
              
              // Always include In Flight and Preparing
              if (flight.status === "In Flight" || flight.status === "Preparing") {
                console.log('Flight included (In Flight or Preparing):', flight);
                return true;
              }
              
              // For Scheduled flights, check if within 30 minutes window
              if (flight.status === "Scheduled") {
                // Parse the time string (HH:mm)
                const [hours, minutes] = flight.start_time.split(':').map(Number);
                
                // Create a date object for the flight time in local time
                const flightDate = new Date(flight.date);
                
                // Create a new date object for the flight time
                const localFlightTime = new Date(flightDate);
                
                // Set the hours and minutes in local time
                localFlightTime.setUTCHours(hours, minutes, 0, 0);
                
                // Calculate 30 minutes before flight time
                const thirtyMinutesBefore = new Date(localFlightTime.getTime() - 30 * 60000);
                
                // Calculate 30 minutes after flight time
                const thirtyMinutesAfter = new Date(localFlightTime.getTime() + 30 * 60000);
                
                console.log('Flight time check:', {
                  flight,
                  flightDate: flightDate.toISOString(),
                  localFlightTime: localFlightTime.toISOString(),
                  thirtyMinutesBefore: thirtyMinutesBefore.toISOString(),
                  thirtyMinutesAfter: thirtyMinutesAfter.toISOString(),
                  now: localDate.toISOString(),
                  isWithinWindow: localDate >= thirtyMinutesBefore && localDate <= thirtyMinutesAfter
                });
                
                // Check if current time is within the window
                return localDate >= thirtyMinutesBefore && localDate <= thirtyMinutesAfter;
              }
              
              // Include flights that can be started
              if (canStartFlight(flight.date, flight.start_time)) {
                console.log('Flight included (can be started):', flight);
                return true;
              }
              
              console.log('Flight excluded:', flight);
              return false;
            });

            console.log('Filtered flights:', filteredFlights);

            if (filteredFlights.length === 0) {
              return (
                <div className="col-span-full flex flex-col items-center justify-center py-4 px-8 text-center border rounded-md bg-muted/50">
                  <Plane className="h-8 w-8 text-muted-foreground mb-2" strokeWidth={1.5} />
                  <h3 className="text-lg font-semibold mb-1">No Active Flights</h3>
                  <p className="text-sm text-muted-foreground">
                    There are no upcoming, preparing, or in-progress flights at this time.
                  </p>
                </div>
              );
            }

            // Sort flights by status priority
            const sortedFlights = [...filteredFlights].sort((a, b) => {
              const statusPriority: { [key: string]: number } = {
                "In Flight": 1,
                "Preparing": 2,
                "Scheduled": 3
              };
              
              const priorityA = statusPriority[a.status] || 999;
              const priorityB = statusPriority[b.status] || 999;
              
              if (priorityA !== priorityB) {
                return priorityA - priorityB;
              }
              
              // If status is the same, sort by start time
              return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
            });

            return sortedFlights.map((flight) => (
              <div
                key={flight._id}
                className={`flex items-center justify-between p-3 border rounded-md ${
                  flight.status === "Completed" 
                    ? "hover:bg-muted/50 cursor-pointer" 
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleFlightCardClick(flight)}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <Plane className="h-10 w-10 text-primary" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-medium">{flight.student_name}</div>
                    <div className="text-sm text-muted-foreground">{flight.plane_reg}</div>
                    <div className="text-sm text-muted-foreground">{flight.start_time}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge
                    variant={flight.status === "Completed" ? "default" : "secondary"}
                    className={`${
                      flight.status === "Completed" 
                        ? "bg-green-500/80 hover:bg-green-500/90" 
                        : flight.status === "In Flight"
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : flight.status === "Preparing"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : flight.status === "Scheduled"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                          : flight.status === "Canceled"
                            ? "bg-red-100 text-red-800 hover:bg-red-200"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {flight.status}
                  </Badge>
                  {(() => {
                    const canStart = canStartFlight(flight.date, flight.start_time);
                    console.log('Flight card rendering:', {
                      flightId: flight._id,
                      status: flight.status,
                      date: flight.date,
                      startTime: flight.start_time,
                      canStart,
                      shouldShowButton: flight.status === "Scheduled" && canStart
                    });
                    return flight.status === "Scheduled" && canStart ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleStartFlight(e, flight)}
                        className="w-[100px]"
                      >
                        Start Flight
                      </Button>
                    ) : null;
                  })()}
                </div>
              </div>
            ));
          })()}
        </div>

        <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
          <DialogContent className="z-[1000]">
            <DialogHeader>
              <DialogTitle>Confirm Aircraft Times</DialogTitle>
              <DialogDescription>
                Please verify or update the current tach and hobbs time for {planeData?.registration}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tach" className="text-right">
                  Tach Time
                </Label>
                <Input
                  id="tach"
                  value={tachTime}
                  onChange={(e) => setTachTime(e.target.value)}
                  className="col-span-3"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hobbs" className="text-right">
                  Hobbs Time
                </Label>
                <Input
                  id="hobbs"
                  value={hobbsTime}
                  onChange={(e) => setHobbsTime(e.target.value)}
                  className="col-span-3"
                  type="number"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTimeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmStart} disabled={isStartingFlight}>
                {isStartingFlight ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting Flight...
                  </>
                ) : (
                  'Start Flight'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <style jsx global>{`
          .leaflet-container {
            z-index: 0 !important;
          }
          .leaflet-control {
            z-index: 1 !important;
          }
          .leaflet-pane {
            z-index: 1 !important;
          }
          .leaflet-popup {
            z-index: 2 !important;
          }
        `}</style>
      </CardContent>
    </Card>
  )
}