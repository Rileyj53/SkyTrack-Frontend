"use client"

import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Plane, User, ArrowLeft, AlertTriangle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"



import { TimePicker } from "@/components/ui/time-picker"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

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

interface FlightLogOverviewProps {
  className?: string
}

export default function FlightLogOverview({ className }: FlightLogOverviewProps) {
  const router = useRouter()
  const [flights, setFlights] = useState<FlightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<FlightLog | null>(null)
  const [showStartFlightDialog, setShowStartFlightDialog] = useState(false)
  const [actualStartTime, setActualStartTime] = useState<string | null>(null)
  const [isStartingFlight, setIsStartingFlight] = useState(false)
  const [showEndFlightDialog, setShowEndFlightDialog] = useState(false)
  const [actualEndTime, setActualEndTime] = useState<string | null>(null)
  const [isEndingFlight, setIsEndingFlight] = useState(false)

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch (err) {
      return time // Return original time if parsing fails
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch (err) {
      return dateString // Return original date if parsing fails
    }
  }

  // Helper function to capitalize status for display
  const capitalizeStatus = (status: string): string => {
    if (status.toLowerCase() === 'in-progress') {
      return 'In-Progress'
    }
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  }

  const fetchFlightLogs = async () => {
    try {
      setLoading(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token) {
        setError("School ID or authentication token not found")
        setLoading(false)
        return
      }

      if (!apiKey) {
        setError("API key is not configured")
        setLoading(false)
        return
      }

      // Get today's date range in UTC to ensure we capture all flights for today in local timezone
      const today = new Date()
      const startOfDay = new Date(today)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(today)
      endOfDay.setHours(23, 59, 59, 999)
      
      const startDateUTC = startOfDay.toISOString().split('T')[0]
      const endDateUTC = endOfDay.toISOString().split('T')[0]
      
      // Add page and limit parameters to the API call
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule?page=1&limit=50&start_date=${startDateUTC}&end_date=${endDateUTC}`
      
      const response = await fetch(apiUrl, {
        method: 'GET',
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
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        })
        throw new Error(`Failed to fetch flight logs: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Flight logs data:', data)
      
      if (data.schedules && Array.isArray(data.schedules)) {
        // Transform the schedule data to match our FlightLog interface
        const transformedFlights: FlightLog[] = data.schedules.map((schedule: any) => {
          // Parse UTC time and convert to local time for display
          const utcDateTime = schedule.scheduled_start_time ? new Date(schedule.scheduled_start_time) : null
          
          return {
            _id: schedule._id,
            date: utcDateTime ? utcDateTime.toLocaleDateString('en-CA') : '', // YYYY-MM-DD format in local time
            start_time: utcDateTime ? 
              utcDateTime.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit',
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
              }) : '',
            plane_reg: schedule.plane_id?.registration || 'N/A',
            plane_id: schedule.plane_id?._id || '',
            student_name: schedule.student_id ? 
              `${schedule.student_id.user_id?.first_name || ''} ${schedule.student_id.user_id?.last_name || ''}`.trim() : 'N/A',
            student_id: schedule.student_id?._id || '',
            instructor: schedule.instructor_id ? 
              `${schedule.instructor_id.user_id?.first_name || ''} ${schedule.instructor_id.user_id?.last_name || ''}`.trim() : 'N/A',
            instructor_id: schedule.instructor_id?._id || '',
            duration: schedule.scheduled_duration || 0,
            type: schedule.flight_type || 'Training',
            status: capitalizeStatus(schedule.status || 'scheduled'),
            school_id: schedule.school_id?._id || schoolId,
            created_at: schedule.created_at || '',
            updated_at: schedule.updated_at || ''
          }
        })
        
        // Filter flights to only show today's flights in local timezone
        const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD format
        const todaysFlights = transformedFlights.filter(flight => flight.date === todayStr)
        
        setFlights(todaysFlights)
      } else {
        setError("Invalid data format received from API")
      }
    } catch (err) {
      console.error("Error fetching flight logs:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlightLogs()
  }, [])

  // Effect to trigger DOM modal
  useEffect(() => {
    if (showStartFlightDialog && selectedFlight) {
      createDOMModal();
    }
  }, [showStartFlightDialog, selectedFlight])

  // Effect to trigger End Flight DOM modal
  useEffect(() => {
    if (showEndFlightDialog && selectedFlight) {
      createEndFlightDOMModal();
    }
  }, [showEndFlightDialog, selectedFlight])

  const handleViewAllFlights = () => {
    // Navigate to the flight log page
    router.push('/flight-log')
  }

  const handleViewDetails = (flight: FlightLog) => {
    setSelectedFlight(flight)
    // Reset dialog state when viewing a different flight
    setShowStartFlightDialog(false)
    setActualStartTime(null)
    setShowEndFlightDialog(false)
    setActualEndTime(null)
  }

  const handleBackToList = () => {
    setSelectedFlight(null)
    // Reset dialog state when going back to list
    setShowStartFlightDialog(false)
    setActualStartTime(null)
    setShowEndFlightDialog(false)
    setActualEndTime(null)
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedFlight) return;
    
    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      if (!schoolId || !token) {
        toast.error("School ID or authentication token not found");
        return;
      }

      if (!apiKey) {
        toast.error("API key is not configured");
        return;
      }

      const updatedFlight = { ...selectedFlight, status: newStatus };
      
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule/${selectedFlight._id}`;
      
      console.log('Updating flight status:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          status: newStatus.toLowerCase()
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        });
        throw new Error(`Failed to update flight status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Updated flight status:', data);
      
      // Update the flight in the list
      setFlights(flights.map(flight => 
        flight._id === selectedFlight._id ? updatedFlight : flight
      ));
      
      // Update the selected flight
      setSelectedFlight(updatedFlight);
      
      toast.success("Flight status updated successfully");
    } catch (err) {
      console.error("Error updating flight status:", err);
      toast.error(err instanceof Error ? err.message : "An unknown error occurred");
    }
  };

  // Get current time in HH:MM format with accurate minutes
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

    // Create modal using direct DOM manipulation with React TimePicker
  const createDOMModal = () => {
    // Remove any existing modal
    const existingModal = document.getElementById('start-flight-modal');
    if (existingModal) existingModal.remove();

    // Set default time to current time
    const currentTime = getCurrentTime();
    setActualStartTime(currentTime);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'start-flight-modal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Create modal content
    const modal = document.createElement('div');
    const isDarkMode = document.documentElement.classList.contains('dark');
    console.log('Start Flight Modal - Dark mode detected:', isDarkMode);
    
    modal.style.cssText = `
      background: ${isDarkMode ? '#2a2d30' : 'white'} !important;
      color: ${isDarkMode ? '#f9fafb' : '#111'} !important;
      border-radius: 12px;
      padding: 24px;
      max-width: 420px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    `;

    modal.innerHTML = `
      <!-- CSS to ensure TimePicker popover appears above modal -->
      <style>
        [data-radix-popper-content-wrapper] {
          z-index: 9999999 !important;
        }
        [data-radix-popper-content] {
          z-index: 9999999 !important;
        }
        @media (prefers-color-scheme: dark) {
          [data-radix-popper-content] {
            background-color: #2a2d30 !important;
            border-color: rgba(156, 163, 175, 0.2) !important;
            color: #f9fafb !important;
          }
        }
        @media (prefers-color-scheme: light) {
          [data-radix-popper-content] {
            background-color: white !important;
            border-color: rgba(0, 0, 0, 0.1) !important;
            color: #111 !important;
          }
        }
      </style>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: ${isDarkMode ? '#f9fafb' : '#111'};">
          Start Flight
        </h2>
        <p style="font-size: 14px; color: ${isDarkMode ? '#d1d5db' : '#6b7280'}; margin: 0;">
          Set the actual departure time
        </p>
      </div>
      
      <!-- Flight Info Card -->
      <div style="margin-bottom: 24px; padding: 16px; background: ${isDarkMode ? 'linear-gradient(135deg, #2a2d30 0%, #34383c 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'}; border-radius: 8px; border: 1px solid ${isDarkMode ? '#6b7280' : '#e5e7eb'};">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="width: 8px; height: 8px; background: #3366ff; border-radius: 50%;"></div>
          <div style="font-weight: 600; font-size: 16px; color: ${isDarkMode ? '#f9fafb' : '#111'}; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;">
            ${selectedFlight?.plane_reg || 'N/A'}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; background: #33cc33; border-radius: 50%;"></div>
          <div style="font-size: 14px; color: ${isDarkMode ? '#d1d5db' : '#4b5563'};">
            <strong>Student:</strong> ${(selectedFlight as any)?.student_name || 'N/A'}
          </div>
        </div>
      </div>
      
      <!-- Time Picker Section -->
      <div style="margin-bottom: 24px;">
        <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 12px; color: ${isDarkMode ? '#e5e7eb' : '#374151'};">
          Actual Start Time
        </label>
        <div id="time-picker-container" style="position: relative;"></div>
      </div>
      
      <!-- Action Buttons -->
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button 
          id="modal-cancel-btn"
          style="
            padding: 10px 20px;
            border: 2px solid ${isDarkMode ? '#6b7280' : '#e5e7eb'};
            background: ${isDarkMode ? '#2a2d30' : 'white'};
            color: ${isDarkMode ? '#e5e7eb' : '#374151'};
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
          "
          onmouseover="this.style.borderColor='${isDarkMode ? '#9ca3af' : '#d1d5db'}'; this.style.backgroundColor='${isDarkMode ? '#374151' : '#f9fafb'}';"
          onmouseout="this.style.borderColor='${isDarkMode ? '#6b7280' : '#e5e7eb'}'; this.style.backgroundColor='${isDarkMode ? '#2a2d30' : 'white'}';"
        >
          Cancel
        </button>
        <button 
          id="modal-start-btn"
          style="
            padding: 10px 20px;
            background: linear-gradient(135deg, #3366ff 0%, #2563eb 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(51, 102, 255, 0.4);
          "
          onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 8px 20px rgba(51, 102, 255, 0.5)';"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(51, 102, 255, 0.4)';"
        >
          Start Flight
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Render the TimePicker component into the container
    const timePickerContainer = document.getElementById('time-picker-container');
    if (timePickerContainer) {
      const root = createRoot(timePickerContainer);
      root.render(
        <TimePicker
          time={currentTime}
          setTime={(time) => {
            console.log('TimePicker setTime called with:', time);
            setActualStartTime(time);
          }}
          className="w-full"
          minuteInterval={1}
        />
      );
    }

    // Add event listeners
    const cancelBtn = document.getElementById('modal-cancel-btn');
    const startBtn = document.getElementById('modal-start-btn');

    const closeModal = () => {
      setShowStartFlightDialog(false);
      setActualStartTime(null);
      overlay.remove();
    };

    cancelBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    startBtn?.addEventListener('click', async () => {
      console.log('Start Flight clicked. actualStartTime:', actualStartTime);
      console.log('currentTime from modal creation:', currentTime);
      
      // Use currentTime as fallback if actualStartTime is not set
      const timeToUse = actualStartTime || currentTime;
      
      if (!timeToUse) {
        alert('Please select an actual start time');
        return;
      }
      
      closeModal();
      
      // Call the API
      await handleStartFlightAPI(timeToUse);
    });
  };

  // Create End Flight modal using direct DOM manipulation with React TimePicker
  const createEndFlightDOMModal = () => {
    // Remove any existing modal
    const existingModal = document.getElementById('end-flight-modal');
    if (existingModal) existingModal.remove();

    // Set default time to current time
    const currentTime = getCurrentTime();
    setActualEndTime(currentTime);

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'end-flight-modal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // Create modal content
    const modal = document.createElement('div');
    const isDarkMode = document.documentElement.classList.contains('dark');
    console.log('End Flight Modal - Dark mode detected:', isDarkMode);
    
    modal.style.cssText = `
      background: ${isDarkMode ? '#2a2d30' : 'white'} !important;
      color: ${isDarkMode ? '#f9fafb' : '#111'} !important;
      border-radius: 12px;
      padding: 24px;
      max-width: 420px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    `;

    modal.innerHTML = `
      <!-- CSS to ensure TimePicker popover appears above modal -->
      <style>
        [data-radix-popper-content-wrapper] {
          z-index: 9999999 !important;
        }
        [data-radix-popper-content] {
          z-index: 9999999 !important;
        }
        @media (prefers-color-scheme: dark) {
          [data-radix-popper-content] {
            background-color: #2a2d30 !important;
            border-color: rgba(156, 163, 175, 0.2) !important;
            color: #f9fafb !important;
          }
        }
        @media (prefers-color-scheme: light) {
          [data-radix-popper-content] {
            background-color: white !important;
            border-color: rgba(0, 0, 0, 0.1) !important;
            color: #111 !important;
          }
        }
      </style>
      
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="font-size: 20px; font-weight: 600; margin: 0 0 8px 0; color: ${isDarkMode ? '#f9fafb' : '#111'};">
          End Flight
        </h2>
        <p style="font-size: 14px; color: ${isDarkMode ? '#d1d5db' : '#6b7280'}; margin: 0;">
          Set the actual landing time
        </p>
      </div>
      
      <!-- Flight Info Card -->
      <div style="margin-bottom: 24px; padding: 16px; background: ${isDarkMode ? 'linear-gradient(135deg, #2a2d30 0%, #34383c 100%)' : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)'}; border-radius: 8px; border: 1px solid ${isDarkMode ? '#6b7280' : '#e5e7eb'};">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="width: 8px; height: 8px; background: #3366ff; border-radius: 50%;"></div>
          <div style="font-weight: 600; font-size: 16px; color: ${isDarkMode ? '#f9fafb' : '#111'}; font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;">
            ${selectedFlight?.plane_reg || 'N/A'}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 8px; height: 8px; background: #33cc33; border-radius: 50%;"></div>
          <div style="font-size: 14px; color: ${isDarkMode ? '#d1d5db' : '#4b5563'};">
            <strong>Student:</strong> ${(selectedFlight as any)?.student_name || 'N/A'}
          </div>
        </div>
      </div>
      
      <!-- Time Picker Section -->
      <div style="margin-bottom: 24px;">
        <label style="display: block; font-size: 14px; font-weight: 500; margin-bottom: 12px; color: ${isDarkMode ? '#e5e7eb' : '#374151'};">
          Actual End Time
        </label>
        <div id="end-time-picker-container" style="position: relative;"></div>
      </div>
      
      <!-- Action Buttons -->
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button 
          id="end-modal-cancel-btn"
          style="
            padding: 10px 20px;
            border: 2px solid ${isDarkMode ? '#6b7280' : '#e5e7eb'};
            background: ${isDarkMode ? '#2a2d30' : 'white'};
            color: ${isDarkMode ? '#e5e7eb' : '#374151'};
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
          "
          onmouseover="this.style.borderColor='${isDarkMode ? '#9ca3af' : '#d1d5db'}'; this.style.backgroundColor='${isDarkMode ? '#374151' : '#f9fafb'}';"
          onmouseout="this.style.borderColor='${isDarkMode ? '#6b7280' : '#e5e7eb'}'; this.style.backgroundColor='${isDarkMode ? '#2a2d30' : 'white'}';"
        >
          Cancel
        </button>
        <button 
          id="end-modal-complete-btn"
          style="
            padding: 10px 20px;
            background: linear-gradient(135deg, #33cc33 0%, #2d9c2d 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(51, 204, 51, 0.4);
          "
          onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 8px 20px rgba(51, 204, 51, 0.5)';"
          onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(51, 204, 51, 0.4)';"
        >
          Complete Flight
        </button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Render the TimePicker component into the container
    const timePickerContainer = document.getElementById('end-time-picker-container');
    if (timePickerContainer) {
      const root = createRoot(timePickerContainer);
      root.render(
        <TimePicker
          time={currentTime}
          setTime={(time) => {
            console.log('End TimePicker setTime called with:', time);
            setActualEndTime(time);
          }}
          className="w-full"
          minuteInterval={1}
        />
      );
    }

    // Add event listeners
    const cancelBtn = document.getElementById('end-modal-cancel-btn');
    const completeBtn = document.getElementById('end-modal-complete-btn');

    const closeModal = () => {
      setShowEndFlightDialog(false);
      setActualEndTime(null);
      overlay.remove();
    };

    cancelBtn?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    completeBtn?.addEventListener('click', async () => {
      console.log('Complete Flight clicked. actualEndTime:', actualEndTime);
      console.log('currentTime from modal creation:', currentTime);
      
      // Use currentTime as fallback if actualEndTime is not set
      const timeToUse = actualEndTime || currentTime;
      
      if (!timeToUse) {
        alert('Please select an actual end time');
        return;
      }
      
      closeModal();
      
      // Call the API
      await handleEndFlightAPI(timeToUse);
    });
  };

  const handleStartFlightAPI = async (timeValue: string) => {
    if (!selectedFlight) return;

    setIsStartingFlight(true);

    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      if (!schoolId || !token) {
        toast.error("School ID or authentication token not found");
        return;
      }

      if (!apiKey) {
        toast.error("API key is not configured");
        return;
      }

      // Convert the actual start time to the proper format
      const today = new Date().toISOString().split('T')[0];
      const actualStartDateTime = `${today}T${timeValue}:00.000Z`;

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule/${selectedFlight._id}`;
      
      console.log('Starting flight with actual start time:', apiUrl, actualStartDateTime);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          actual_start_time: actualStartDateTime,
          status: 'in-progress'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        });
        throw new Error(`Failed to start flight: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Flight started successfully:', data);
      
      // Update the flight in the list
      const updatedFlight = { ...selectedFlight, status: 'In-Progress' };
      setFlights(flights.map(flight => 
        flight._id === selectedFlight._id ? updatedFlight : flight
      ));
      
      // Update the selected flight
      setSelectedFlight(updatedFlight);
      
      toast.success("Flight started successfully!");
    } catch (err) {
      console.error("Error starting flight:", err);
      toast.error(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsStartingFlight(false);
    }
  };

  const handleEndFlightAPI = async (timeValue: string) => {
    if (!selectedFlight) return;

    setIsEndingFlight(true);

    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      if (!schoolId || !token) {
        toast.error("School ID or authentication token not found");
        return;
      }

      if (!apiKey) {
        toast.error("API key is not configured");
        return;
      }

      // Convert the actual end time to the proper format
      const today = new Date().toISOString().split('T')[0];
      const actualEndDateTime = `${today}T${timeValue}:00.000Z`;

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/flight_schedule/${selectedFlight._id}`;
      
      console.log('Ending flight with actual end time:', apiUrl, actualEndDateTime);
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          actual_end_time: actualEndDateTime,
          status: 'completed'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        });
        throw new Error(`Failed to end flight: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Flight ended successfully:', data);
      
      // Update the flight in the list
      const updatedFlight = { ...selectedFlight, status: 'Completed' };
      setFlights(flights.map(flight => 
        flight._id === selectedFlight._id ? updatedFlight : flight
      ));
      
      // Update the selected flight
      setSelectedFlight(updatedFlight);
      
      toast.success("Flight completed successfully!");
    } catch (err) {
      console.error("Error ending flight:", err);
      toast.error(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsEndingFlight(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Today's Flights</CardTitle>
          <CardDescription>Loading flight data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">Loading flight logs...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Today's Flights</CardTitle>
          <CardDescription>Error loading flight data</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  if (selectedFlight) {
    return (
      <Card className={className}>
        <CardHeader className="border-b">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBackToList}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <CardTitle className="text-2xl">Flight Details</CardTitle>
              <CardDescription className="text-base">
                {selectedFlight.plane_reg} • {formatDate(selectedFlight.date)} • {formatTime(selectedFlight.start_time)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {/* Flight Information Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-[#b3c6ff]/20 to-[#809fff]/20 dark:from-[#3366ff]/20 dark:to-[#3366ff]/10 rounded border border-[#809fff]/30 dark:border-[#3366ff]/30">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[#3366ff]/10 dark:bg-[#3366ff]/20">
                  <Plane className="h-3 w-3 text-[#3366ff] dark:text-[#3366ff]" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-medium text-[#3366ff] dark:text-[#b3c6ff]">Flight Information</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 p-2 rounded bg-card border">
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                    <h4 className="text-xs text-muted-foreground uppercase tracking-wide">Time</h4>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{formatTime(selectedFlight.start_time)}</p>
                </div>
                <div className="space-y-1 p-2 rounded bg-card border">
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-green-500"></div>
                    <h4 className="text-xs text-muted-foreground uppercase tracking-wide">Duration</h4>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{selectedFlight.duration} hrs</p>
                </div>
                <div className="space-y-1 p-2 rounded bg-card border">
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-purple-500"></div>
                    <h4 className="text-xs text-muted-foreground uppercase tracking-wide">Type</h4>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{selectedFlight.type}</p>
                </div>
              </div>
            </div>
            
            {/* Aircraft Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded border border-emerald-100 dark:border-emerald-800/30">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 dark:bg-emerald-400/10">
                  <Plane className="h-3 w-3 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-medium text-emerald-900 dark:text-emerald-100">Aircraft</h3>
                </div>
              </div>
              
              <div className="space-y-1 p-2 rounded bg-card border">
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-emerald-500"></div>
                  <h4 className="text-xs text-muted-foreground uppercase tracking-wide">Registration</h4>
                </div>
                <p className="text-xs font-semibold text-foreground font-mono">{selectedFlight.plane_reg}</p>
              </div>
            </div>
            
            {/* People Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded border border-amber-100 dark:border-amber-800/30">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/10 dark:bg-amber-400/10">
                  <User className="h-3 w-3 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs font-medium text-amber-900 dark:text-amber-100">Flight Crew</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1 p-2 rounded bg-card border">
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-amber-500"></div>
                    <h4 className="text-xs text-muted-foreground uppercase tracking-wide">Student</h4>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{selectedFlight.student_name}</p>
                </div>
                
                <div className="space-y-1 p-2 rounded bg-card border">
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-1 rounded-full bg-orange-500"></div>
                    <h4 className="text-xs text-muted-foreground uppercase tracking-wide">Instructor</h4>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{selectedFlight.instructor}</p>
                </div>
              </div>
            </div>
            
            {/* Start Flight Button */}
            {selectedFlight && (selectedFlight.status === "Scheduled" || selectedFlight.status === "Preparing") && (
              <div className="flex items-center justify-center p-2 rounded bg-card border">
                <Button 
                  onClick={() => {
                    console.log('Start Flight button clicked');
                    setShowStartFlightDialog(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Start Flight
                </Button>
              </div>
            )}

            {/* End Flight Button */}
            {selectedFlight && selectedFlight.status === "In-Progress" && (
              <div className="flex items-center justify-center p-2 rounded bg-card border">
                <Button 
                  onClick={() => {
                    console.log('End Flight button clicked');
                    setShowEndFlightDialog(true);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={isEndingFlight}
                >
                  {isEndingFlight ? "Ending Flight..." : "End Flight"}
                </Button>
              </div>
            )}


          </div>
        </CardContent>
      </Card>
    )
  }

  // Show only the next 4 flights
  const displayedFlights = flights
    .sort((a, b) => {
      // Define status priority - scheduled flights come first, then completed
      const getStatusPriority = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower === "preparing") return 0;
        if (statusLower === "scheduled") return 1;
        if (statusLower === "completed") return 2;
        if (statusLower === "cancelled" || statusLower === "canceled") return 3;
        return 4; // Any other status
      };
      
      // Sort by status priority
      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // For flights with same priority, sort by start time (soonest first)
      // Convert HH:MM format to comparable values
      const timeA = a.start_time.split(':').map(Number);
      const timeB = b.start_time.split(':').map(Number);
      const minutesA = timeA[0] * 60 + (timeA[1] || 0);
      const minutesB = timeB[0] * 60 + (timeB[1] || 0);
      
      return minutesA - minutesB;
    })
    .slice(0, 4);



  return (
    <>

      <Card className={className}>
        <CardHeader>
          <CardTitle>Today's Flights</CardTitle>
          <CardDescription>Overview of upcoming flights</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedFlights.length > 0 ? (
                displayedFlights.map((flight) => (
                  <TableRow 
                    key={flight._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetails(flight)}
                  >
                    <TableCell>{formatTime(flight.start_time)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Plane className="h-5 w-5 text-foreground" strokeWidth={2.5} />
                        {flight.plane_reg}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {flight.student_name}
                      </div>
                    </TableCell>
                    <TableCell>{flight.duration} hrs</TableCell>
                    <TableCell>
                      <Badge
                        variant={flight.status === "Completed" ? "default" : "secondary"}
                        className={`whitespace-nowrap ${
                                                      flight.status === "Completed" 
                              ? "!bg-[#b3c6ff] !text-black hover:!bg-[#809fff] !border-[#809fff]" 
                                                          : flight.status === "In-Progress"
                                ? "!bg-[#c2f0c2] !text-black hover:!bg-[#99e699] !border-[#99e699]"
                            
                                                            : flight.status === "Preparing"
                                ? "!bg-[#fbfbb6] !text-black hover:!bg-[#f9f986] !border-[#f9f986]"
                              : flight.status === "Scheduled"
                                ? "!bg-[#f0b3ff] !text-black hover:!bg-[#e580ff] !border-[#e580ff]"
                                : flight.status === "Cancelled" || flight.status === "Canceled"
                                  ? "!bg-[#fc9c9c] !text-black hover:!bg-[#fb6a6a] !border-[#fb6a6a]"
                                : "!bg-[#d5d5dd] !text-[#73738c] hover:!bg-[#b9b9c6] !border-[#b9b9c6]"
                        }`}
                      >
                        {flight.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{flight.type}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Plane className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                      <p className="text-lg font-medium text-muted-foreground">No flights scheduled today</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {displayedFlights.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={handleViewAllFlights}>
                View All Flights
              </Button>
            </div>
          )}
        </CardContent>
      </Card>


    </>
  )
} 