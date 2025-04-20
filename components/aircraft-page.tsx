"use client"

import { useEffect, useState } from "react"
import { Clock, Edit2, MoreHorizontal, Plane, Save, X, Calendar, Wrench, Plus, ChevronUp, ChevronDown } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface HourlyRates {
  wet: number
  dry: number
  block: number
  instruction: number
  weekend: number
  solo: number
  checkride: number
}

interface SpecialRate {
  _id: string
  name: string
  discount: number
  description: string
}

interface Aircraft {
  id: string
  registration: string
  type: string
  model: string
  year: number
  engineHours: number
  lastMaintenance: string
  nextMaintenance: string
  status: string
  hourlyRates: HourlyRates
  specialRates: SpecialRate[]
  utilization: number
  location: string
  notes: string
}

// Add interfaces for maintenance data
interface MaintenanceLog {
  _id: string;
  aircraftId: string;
  date: string;
  type: string;
  description: string;
  workPerformed: string;
  partsReplaced: {
    partNumber: string;
    description: string;
    quantity: number;
    cost: number;
    _id: string;
  }[];
  technician: {
    name: string;
    certificate: string;
    signature: string;
  };
  aircraftHours: {
    total: number;
    sinceLastOverhaul: number;
  };
  nextDue: {
    hours: number;
    date: string;
  };
  status: string;
  referenceDocuments: string[];
  notes: string;
  created_at: string;
  updated_at: string;
}

interface MaintenanceSchedule {
  componentHours: {
    engine: {
      total: number;
      sinceOverhaul: number;
      nextOverhaul: number;
    };
    propeller: {
      total: number;
      sinceOverhaul: number;
      nextOverhaul: number;
    };
    landingGear: {
      total: number;
      sinceOverhaul: number;
      nextOverhaul: number;
    };
  };
  _id: string;
  aircraftId: string;
  last100Hour: string;
  lastAnnual: string;
  lastInspection: string;
  lastOilChange: string;
  next100Hour: string;
  nextAnnual: string;
  nextInspection: string;
  nextOilChange: string;
  created_at: string;
  updated_at: string;
}

interface AirworthinessDirective {
  _id: string;
  aircraftId: string;
  adNumber: string;
  title: string;
  description: string;
  issuedDate: string;
  effectiveDate: string;
  complianceDate: string;
  category: string;
  applicability: string;
  status: string;
  priority: string;
  estimatedLabor: string;
  estimatedParts: string;
  recurringInspection: boolean;
  notes: string;
  attachments: {
    _id: string;
    name: string;
    url: string;
  }[];
  complianceMethod: string;
  references: string[];
  created_at: string;
  updated_at: string;
}

interface ServiceBulletin {
  _id: string;
  aircraftId: string;
  sbNumber: string;
  title: string;
  description: string;
  status: string;
  completionDate: string;
  notes: string;
  created_at: string;
  updated_at: string;
  __v: number;
}

export function AircraftPage() {
  console.log("AircraftPage component initializing")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking authentication...")
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          console.log("No token found, redirecting to login")
          router.push("/login")
          return
        }

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/me`
        console.log('Auth check API URL:', apiUrl)
        
        const response = await fetch(apiUrl, {
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
        
        if (data.user && data.user.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
          console.log('Stored school ID in localStorage:', data.user.school_id)
          setIsAuthenticated(true)
        } else {
          throw new Error("Invalid user data")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  // Fetch aircraft data only after authentication is confirmed
  useEffect(() => {
    if (isAuthenticated) {
      console.log("Authentication confirmed, fetching aircraft data")
      fetchAircraft()
    }
  }, [isAuthenticated])

  const fetchAircraft = async () => {
    console.log("Starting to fetch aircraft data")
    try {
      setLoading(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      console.log("Credentials check:", { 
        hasSchoolId: !!schoolId, 
        hasToken: !!token,
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
        apiKey: !!process.env.NEXT_PUBLIC_API_KEY
      })
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes`
      console.log("Fetching from URL:", apiUrl)

      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      console.log("API Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        })
        throw new Error(`Failed to fetch aircraft: ${response.status}`)
      }

      const data = await response.json()
      console.log("Received aircraft data:", data)
      
      if (data.planes && Array.isArray(data.planes)) {
        console.log("Setting aircraft data:", data.planes.length, "aircraft found")
        setAircraft(data.planes)
      } else {
        throw new Error("Invalid data format received from API")
      }
    } catch (err) {
      console.error("Error fetching aircraft:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
      toast.error("Failed to load aircraft data")
    } finally {
      console.log("Fetch complete, setting loading to false")
      setLoading(false)
    }
  }

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedRates, setEditedRates] = useState<Record<string, number>>({})
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "fleet")
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null)
  const [newSpecialRate, setNewSpecialRate] = useState<Omit<SpecialRate, '_id'>>({
    name: '',
    discount: 0,
    description: ''
  })
  const [addingSpecialRateFor, setAddingSpecialRateFor] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedAircraft, setEditedAircraft] = useState<Aircraft | null>(null)
  const [editingSection, setEditingSection] = useState<'hourly' | 'special' | null>(null)
  const [editingField, setEditingField] = useState<'location' | 'notes' | null>(null)
  const [editedValue, setEditedValue] = useState<string>('')
  const [updatingStatus, setUpdatingStatus] = useState<Aircraft | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')

  // Add state variables for maintenance data
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule | null>(null)
  const [airworthinessDirectives, setAirworthinessDirectives] = useState<AirworthinessDirective[]>([])
  const [serviceBulletins, setServiceBulletins] = useState<ServiceBulletin[]>([])

  // Add a state for the selected aircraft in the maintenance tab
  const [maintenanceAircraft, setMaintenanceAircraft] = useState<Aircraft | null>(null);

  // Add a loading state for maintenance data
  const [loadingMaintenanceData, setLoadingMaintenanceData] = useState(false);

  // Add state for expanded items
  const [expandedMaintenanceLog, setExpandedMaintenanceLog] = useState<string | null>(null);
  const [expandedAD, setExpandedAD] = useState<string | null>(null);
  const [expandedSB, setExpandedSB] = useState<string | null>(null);

  // Add state for Service Bulletin dialog
  const [isServiceBulletinDialogOpen, setIsServiceBulletinDialogOpen] = useState(false);
  const [editingServiceBulletin, setEditingServiceBulletin] = useState<ServiceBulletin | null>(null);
  const [newServiceBulletin, setNewServiceBulletin] = useState<Partial<ServiceBulletin>>({
    title: '',
    description: '',
    status: 'Pending',
    completionDate: '',
    notes: ''
  });

  // Add state for Airworthiness Directive dialog
  const [isADDialogOpen, setIsADDialogOpen] = useState(false);
  const [editingAD, setEditingAD] = useState<AirworthinessDirective | null>(null);
  const [newAD, setNewAD] = useState<Partial<AirworthinessDirective>>({
    adNumber: '',
    title: '',
    description: '',
    issuedDate: '',
    effectiveDate: '',
    complianceDate: '',
    category: '',
    applicability: '',
    status: 'Pending',
    priority: 'Medium',
    estimatedLabor: '',
    estimatedParts: '',
    recurringInspection: false,
    notes: '',
    attachments: [],
    complianceMethod: '',
    references: []
  });

  // Add new state variables after the existing AD state variables
  const [isMaintenanceLogDialogOpen, setIsMaintenanceLogDialogOpen] = useState(false);
  const [editingMaintenanceLog, setEditingMaintenanceLog] = useState<MaintenanceLog | null>(null);
  const [newMaintenanceLog, setNewMaintenanceLog] = useState<Partial<MaintenanceLog>>({
    date: new Date().toISOString(),
    type: 'Annual',
    description: '',
    workPerformed: '',
    partsReplaced: [],
    technician: {
      name: '',
      certificate: '',
      signature: ''
    },
    aircraftHours: {
      total: 0,
      sinceLastOverhaul: 0
    },
    nextDue: {
      hours: 0,
      date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    },
    status: 'Pending',
    referenceDocuments: [],
    notes: ''
  });

  // Add new state variables after the existing ones
  const [isMaintenanceScheduleDialogOpen, setIsMaintenanceScheduleDialogOpen] = useState(false);
  const [editedMaintenanceSchedule, setEditedMaintenanceSchedule] = useState<Partial<MaintenanceSchedule>>({
    nextAnnual: '',
    next100Hour: '',
    nextOilChange: '',
    nextInspection: '',
    lastAnnual: '',
    last100Hour: '',
    lastOilChange: '',
    lastInspection: '',
    componentHours: {
      engine: {
        total: 0,
        sinceOverhaul: 0,
        nextOverhaul: 0
      },
      propeller: {
        total: 0,
        sinceOverhaul: 0,
        nextOverhaul: 0
      },
      landingGear: {
        total: 0,
        sinceOverhaul: 0,
        nextOverhaul: 0
      }
    }
  });

  // Start editing rates for an aircraft
  const handleStartEdit = (id: string, rates: HourlyRates) => {
    setEditingId(id)
    // Convert HourlyRates to Record<string, number> safely
    const ratesRecord: Record<string, number> = {
      wet: rates.wet,
      dry: rates.dry,
      block: rates.block,
      instruction: rates.instruction,
      weekend: rates.weekend,
      solo: rates.solo,
      checkride: rates.checkride,
    }
    setEditedRates(ratesRecord)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditedRates({})
  }

  // Save edited rates
  const handleSaveRates = async (id: string) => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const aircraftToUpdate = aircraft.find(a => a.id === id)
      if (!aircraftToUpdate) {
        throw new Error("Aircraft not found")
      }

      const updatedAircraft = {
        ...aircraftToUpdate,
        hourlyRates: {
          ...aircraftToUpdate.hourlyRates,
          ...editedRates
        }
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${id}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(updatedAircraft),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to update rates: ${response.status}`)
      }

      const data = await response.json()
      
      // Update both the aircraft list and selected aircraft if it's the same one
      setAircraft(prev => prev.map(a => a.id === id ? {
        ...a,
    hourlyRates: {
          ...a.hourlyRates,
          ...editedRates
        }
      } : a))

      if (selectedAircraft?.id === id) {
        setSelectedAircraft(prev => prev ? {
          ...prev,
          hourlyRates: {
            ...prev.hourlyRates,
            ...editedRates
          }
        } : null)
      }

      setEditingId(null)
      setEditedRates({})
      toast.success("Rates updated successfully")
    } catch (err) {
      console.error("Error updating rates:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update rates")
    }
  }

  // Handle rate input changes
  const handleRateChange = (rateType: keyof HourlyRates, value: string) => {
    setEditedRates({
      ...editedRates,
      [rateType]: parseFloat(value) || 0,
    })
  }

  // Update the handleAddSpecialRate function
  const handleAddSpecialRate = async (aircraftId: string) => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const aircraftToUpdate = aircraft.find(a => a.id === aircraftId)
      if (!aircraftToUpdate) {
        throw new Error("Aircraft not found")
      }

      // Create a new special rate
      const newRate = {
        name: newSpecialRate.name,
        discount: newSpecialRate.discount,
        description: newSpecialRate.description,
        _id: `temp-${Date.now()}`
      }

      // Create updated aircraft with the new special rate
      const updatedAircraft = {
        ...aircraftToUpdate,
        specialRates: [...(aircraftToUpdate.specialRates || []), newRate]
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${aircraftId}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(updatedAircraft),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to add special rate: ${response.status}`)
      }

      const data = await response.json()
      
      // Update the aircraft list
      setAircraft(prev => prev.map(a => a.id === aircraftId ? {
        ...a,
        specialRates: [...(a.specialRates || []), newRate]
      } : a))

      // Reset the form
      setNewSpecialRate({
        name: '',
        discount: 0,
        description: ''
      })
      setAddingSpecialRateFor(null)
      toast.success("Special rate added successfully")
    } catch (err) {
      console.error("Error adding special rate:", err)
      toast.error(err instanceof Error ? err.message : "Failed to add special rate")
    }
  }

  // Update the handleRemoveSpecialRate function
  const handleRemoveSpecialRate = async (aircraftId: string, rateId: string) => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const aircraftToUpdate = aircraft.find(a => a.id === aircraftId)
      if (!aircraftToUpdate) {
        throw new Error("Aircraft not found")
      }

      // Remove the special rate
      const updatedRates = aircraftToUpdate.specialRates.filter(rate => rate._id !== rateId)

      // Create updated aircraft without the removed special rate
      const updatedAircraft = {
        ...aircraftToUpdate,
        specialRates: updatedRates
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${aircraftId}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(updatedAircraft),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to remove special rate: ${response.status}`)
      }

      const data = await response.json()
      
      // Update the aircraft list
      setAircraft(prev => prev.map(a => a.id === aircraftId ? {
        ...a,
        specialRates: updatedRates
      } : a))

      toast.success("Special rate removed successfully")
    } catch (err) {
      console.error("Error removing special rate:", err)
      toast.error(err instanceof Error ? err.message : "Failed to remove special rate")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Add the update handler:
  const handleUpdateAircraft = async () => {
    if (!editedAircraft) return

    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${editedAircraft.id}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(editedAircraft),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to update aircraft: ${response.status}`)
      }

      const updatedAircraft = await response.json()
      
      // Update both the selected aircraft and the aircraft list
      setSelectedAircraft(updatedAircraft)
      setAircraft(aircraft.map(a => a.id === updatedAircraft.id ? updatedAircraft : a))
      
      setIsEditing(false)
      setEditedAircraft(null)
      toast.success("Aircraft updated successfully")
    } catch (err) {
      console.error("Error updating aircraft:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update aircraft")
    }
  }

  // Add handler for starting edit mode:
  const handleStartEditAircraft = () => {
    if (selectedAircraft) {
      setEditedAircraft({ ...selectedAircraft })
      setIsEditing(true)
    }
  }

  // Add handler for canceling edit:
  const handleCancelEditAircraft = () => {
    setIsEditing(false)
    setEditedAircraft(null)
  }

  // Add handler for updating hourly rates:
  const handleHourlyRateChange = (type: keyof HourlyRates, value: string) => {
    if (!editedAircraft) return
    setEditedAircraft({
      ...editedAircraft,
      hourlyRates: {
        ...editedAircraft.hourlyRates,
        [type]: parseFloat(value) || 0
      }
    })
  }

  // Add handler for updating special rates:
  const handleSpecialRateChange = (index: number, field: keyof SpecialRate, value: string | number) => {
    if (!editedAircraft) return
    const updatedRates = [...editedAircraft.specialRates]
    updatedRates[index] = {
      ...updatedRates[index],
      [field]: field === 'discount' ? Number(value) : value
    }
    setEditedAircraft({
      ...editedAircraft,
      specialRates: updatedRates
    })
  }

  // Add handler for saving individual field
  const handleSaveField = async () => {
    if (!selectedAircraft || !editingField) return

    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const updatedAircraft = {
        ...selectedAircraft,
        [editingField]: editedValue
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${selectedAircraft.id}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(updatedAircraft),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to update aircraft: ${response.status}`)
      }

      const data = await response.json()
      
      // Update both the selected aircraft and the aircraft list
      setSelectedAircraft(prev => ({
        ...prev!,
        [editingField]: editedValue
      }))
      
      setAircraft(prev => prev.map(a => 
        a.id === selectedAircraft.id 
          ? { ...a, [editingField]: editedValue }
          : a
      ))
      
      setEditingField(null)
      setEditedValue('')
      toast.success("Aircraft updated successfully")
    } catch (err) {
      console.error("Error updating aircraft:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update aircraft")
    }
  }

  // Add handler for status update
  const handleStatusUpdate = async () => {
    if (!updatingStatus || !newStatus) return

    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const updatedAircraft = {
        ...updatingStatus,
        status: newStatus
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${updatingStatus.id}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(updatedAircraft),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to update aircraft status: ${response.status}`)
      }

      // Update both the selected aircraft and the aircraft list
      setAircraft(prev => prev.map(a => 
        a.id === updatingStatus.id 
          ? { ...a, status: newStatus }
          : a
      ))

      if (selectedAircraft?.id === updatingStatus.id) {
        setSelectedAircraft(prev => prev ? { ...prev, status: newStatus } : null)
      }

      setUpdatingStatus(null)
      setNewStatus('')
      toast.success("Aircraft status updated successfully")
    } catch (err) {
      console.error("Error updating aircraft status:", err)
      toast.error(err instanceof Error ? err.message : "Failed to update aircraft status")
    }
  }

  // Add the export rate sheet function
  const handleExportRateSheet = () => {
    // Create CSV header
    const headers = [
      'Registration',
      'Type/Model',
      'Wet Rate',
      'Dry Rate',
      'Block Rate',
      'Instruction Rate',
      'Weekend Rate',
      'Solo Rate',
      'Checkride Rate',
      'Special Rates'
    ].join(',')

    // Create CSV rows
    const rows = aircraft.map(plane => {
      const specialRates = plane.specialRates
        ?.map(rate => `${rate.name} (${rate.discount}% off)`)
        .join('; ') || 'None'

      return [
        plane.registration,
        `${plane.type} ${plane.model}`,
        plane.hourlyRates?.wet || 0,
        plane.hourlyRates?.dry || 0,
        plane.hourlyRates?.block || 0,
        plane.hourlyRates?.instruction || 0,
        plane.hourlyRates?.weekend || 0,
        plane.hourlyRates?.solo || 0,
        plane.hourlyRates?.checkride || 0,
        `"${specialRates}"`
      ].join(',')
    }).join('\n')

    // Combine header and rows
    const csv = `${headers}\n${rows}`

    // Create and download the file
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'aircraft-rates.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast.success("Rate sheet exported successfully")
  }

  // Add fetchMaintenanceData function
  const fetchMaintenanceData = async () => {
    if (!maintenanceAircraft) return;

    try {
      setLoadingMaintenanceData(true);
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      // Fetch all data in parallel
      const [logsResponse, scheduleResponse, adResponse, sbResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/maintenance`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
            },
            credentials: 'include'
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/maintenance-schedule`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
            },
            credentials: 'include'
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/airworthiness-directives`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
            },
            credentials: 'include'
          }
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/service-bulletins`,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
            },
            credentials: 'include'
          }
        )
      ]);

      // Process all responses
      const [logsData, scheduleData, adData, sbData] = await Promise.all([
        logsResponse.json(),
        scheduleResponse.json(),
        adResponse.json(),
        sbResponse.json()
      ]);

      // Update state with all data
      setMaintenanceLogs(logsData.logs);
      setMaintenanceSchedule(scheduleData.maintenanceSchedule);
      setAirworthinessDirectives(adData.airworthinessDirectives);
      setServiceBulletins(sbData.serviceBulletins);
    } catch (err) {
      console.error("Error fetching maintenance data:", err)
      toast.error("Failed to load maintenance data")
    } finally {
      setLoadingMaintenanceData(false);
    }
  };

  // Update the useEffect to handle loading state
  useEffect(() => {
    const fetchMaintenanceData = async () => {
      if (!maintenanceAircraft) return;

      try {
        setLoadingMaintenanceData(true);
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        
        if (!schoolId || !token) {
          throw new Error("School ID or authentication token not found")
        }

        // Fetch all data in parallel
        const [logsResponse, scheduleResponse, adResponse, sbResponse] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/maintenance`,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
                'Authorization': `Bearer ${token}`,
                'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
              },
              credentials: 'include'
            }
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/maintenance-schedule`,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
                'Authorization': `Bearer ${token}`,
                'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
              },
              credentials: 'include'
            }
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/airworthiness-directives`,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
                'Authorization': `Bearer ${token}`,
                'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
              },
              credentials: 'include'
            }
          ),
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/service-bulletins`,
            {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
                'Authorization': `Bearer ${token}`,
                'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
              },
              credentials: 'include'
            }
          )
        ]);

        // Process all responses
        const [logsData, scheduleData, adData, sbData] = await Promise.all([
          logsResponse.json(),
          scheduleResponse.json(),
          adResponse.json(),
          sbResponse.json()
        ]);

        // Update state with all data
        setMaintenanceLogs(logsData.logs);
        setMaintenanceSchedule(scheduleData.maintenanceSchedule);
        setAirworthinessDirectives(adData.airworthinessDirectives);
        setServiceBulletins(sbData.serviceBulletins);
      } catch (err) {
        console.error("Error fetching maintenance data:", err)
        toast.error("Failed to load maintenance data")
      } finally {
        setLoadingMaintenanceData(false);
      }
    }

    fetchMaintenanceData()
  }, [maintenanceAircraft])

  // Add function to generate SB number
  const generateSBNumber = () => {
    const year = new Date().getFullYear();
    const existingSBs = serviceBulletins.filter(sb => sb.sbNumber.startsWith(`SB-${year}`));
    const nextNumber = (existingSBs.length + 1).toString().padStart(2, '0');
    return `SB-${year}-${nextNumber}`;
  };

  // Add function to handle Service Bulletin creation/update
  const handleServiceBulletinSubmit = async () => {
    if (!maintenanceAircraft) return;

    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found");
      }

      const endpoint = editingServiceBulletin
        ? `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/service-bulletins/${editingServiceBulletin._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/service-bulletins`;

      const method = editingServiceBulletin ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          ...newServiceBulletin,
          sbNumber: editingServiceBulletin ? editingServiceBulletin.sbNumber : generateSBNumber()
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingServiceBulletin ? 'update' : 'create'} service bulletin: ${response.status}`);
      }

      // Refresh maintenance data
      await fetchMaintenanceData();
      
      // Reset form and close dialog
      setNewServiceBulletin({
        title: '',
        description: '',
        status: 'Pending',
        completionDate: '',
        notes: ''
      });
      setEditingServiceBulletin(null);
      setIsServiceBulletinDialogOpen(false);
      toast.success(`Service bulletin ${editingServiceBulletin ? 'updated' : 'created'} successfully`);
    } catch (err) {
      console.error("Error saving service bulletin:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save service bulletin");
    }
  };

  // Update handleDeleteServiceBulletin function
  const handleDeleteServiceBulletin = async (sbId: string) => {
    if (!maintenanceAircraft) return;

    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/service-bulletins/${sbId}`,
        {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete service bulletin: ${response.status}`);
      }

      // Refresh maintenance data
      await fetchMaintenanceData();
      toast.success("Service bulletin deleted successfully");
    } catch (err) {
      console.error("Error deleting service bulletin:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete service bulletin");
    }
  };

  // Add handleUpdateServiceBulletin function
  const handleUpdateServiceBulletin = async (sbId: string, updates: Partial<ServiceBulletin>) => {
    if (!maintenanceAircraft) return;

    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/service-bulletins/${sbId}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(updates),
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update service bulletin: ${response.status}`);
      }

      // Refresh maintenance data
      await fetchMaintenanceData();
      toast.success("Service bulletin updated successfully");
    } catch (err) {
      console.error("Error updating service bulletin:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update service bulletin");
    }
  };

  // Add function to handle Airworthiness Directive creation/update
  const handleADSubmit = async () => {
    if (!maintenanceAircraft) return;

    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found");
      }

      const endpoint = editingAD
        ? `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/airworthiness-directives/${editingAD._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/airworthiness-directives`;

      const method = editingAD ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify(newAD),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingAD ? 'update' : 'create'} airworthiness directive: ${response.status}`);
      }

      // Refresh maintenance data
      await fetchMaintenanceData();
      
      // Reset form and close dialog
      setNewAD({
        adNumber: '',
        title: '',
        description: '',
        issuedDate: '',
        effectiveDate: '',
        complianceDate: '',
        category: '',
        applicability: '',
        status: 'Pending',
        priority: 'Medium',
        estimatedLabor: '',
        estimatedParts: '',
        recurringInspection: false,
        notes: '',
        attachments: [],
        complianceMethod: '',
        references: []
      });
      setEditingAD(null);
      setIsADDialogOpen(false);
      toast.success(`Airworthiness directive ${editingAD ? 'updated' : 'created'} successfully`);
    } catch (err) {
      console.error("Error saving airworthiness directive:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save airworthiness directive");
    }
  };

  // Add function to handle Airworthiness Directive deletion
  const handleDeleteAD = async (adId: string) => {
    if (!maintenanceAircraft) return;

    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/airworthiness-directives/${adId}`,
        {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete airworthiness directive: ${response.status}`);
      }

      // Refresh maintenance data
      await fetchMaintenanceData();
      toast.success("Airworthiness directive deleted successfully");
    } catch (err) {
      console.error("Error deleting airworthiness directive:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete airworthiness directive");
    }
  };

  // Add new handlers after the existing AD handlers
  const handleMaintenanceLogSubmit = async () => {
    if (!maintenanceAircraft) return;

    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found");
      }

      const endpoint = editingMaintenanceLog
        ? `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/maintenance/${editingMaintenanceLog._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/maintenance`;

      const method = editingMaintenanceLog ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify(newMaintenanceLog),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingMaintenanceLog ? 'update' : 'create'} maintenance log: ${response.status}`);
      }

      // Refresh maintenance data
      await fetchMaintenanceData();
      
      // Reset form and close dialog
      setNewMaintenanceLog({
        date: new Date().toISOString(),
        type: 'Annual',
        description: '',
        workPerformed: '',
        partsReplaced: [],
        technician: {
          name: '',
          certificate: '',
          signature: ''
        },
        aircraftHours: {
          total: 0,
          sinceLastOverhaul: 0
        },
        nextDue: {
          hours: 0,
          date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        status: 'Pending',
        referenceDocuments: [],
        notes: ''
      });
      setEditingMaintenanceLog(null);
      setIsMaintenanceLogDialogOpen(false);
      toast.success(`Maintenance log ${editingMaintenanceLog ? 'updated' : 'created'} successfully`);
    } catch (err) {
      console.error("Error saving maintenance log:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save maintenance log");
    }
  };

  const handleDeleteMaintenanceLog = async (logId: string) => {
    if (!maintenanceAircraft) return;

    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/maintenance/${logId}`,
        {
          method: 'DELETE',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete maintenance log: ${response.status}`);
      }

      // Refresh maintenance data
      await fetchMaintenanceData();
      toast.success("Maintenance log deleted successfully");
    } catch (err) {
      console.error("Error deleting maintenance log:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete maintenance log");
    }
  };

  // Add handler for updating maintenance schedule
  const handleMaintenanceScheduleSubmit = async () => {
    if (!maintenanceAircraft) return;

    try {
      const schoolId = localStorage.getItem("schoolId");
      const token = localStorage.getItem("token");
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${maintenanceAircraft.id}/maintenance-schedule`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(editedMaintenanceSchedule),
          credentials: 'include'
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update maintenance schedule: ${response.status}`);
      }

      // Refresh maintenance data
      await fetchMaintenanceData();
      setIsMaintenanceScheduleDialogOpen(false);
      toast.success("Maintenance schedule updated successfully");
    } catch (err) {
      console.error("Error updating maintenance schedule:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update maintenance schedule");
    }
  };

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader>
        <MainNav />
        <UserNav />
      </DashboardHeader>
      <DashboardShell>
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Aircraft Fleet</h1>
          <p className="text-muted-foreground">Manage aircraft information, maintenance schedules, and hourly rates.</p>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Aircraft</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{aircraft.length}</div>
                <p className="text-xs text-muted-foreground">
                  {aircraft.filter((a) => a.status === "Available").length} available
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(aircraft.reduce((sum, a) => sum + a.utilization, 0) / aircraft.length)}%
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance Due</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Within next 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Hourly Rate</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${Math.round(aircraft.reduce((sum, a) => sum + (a.hourlyRates?.wet || 0), 0) / aircraft.length)}
                </div>
                <p className="text-xs text-muted-foreground">Wet rate average</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="fleet">Fleet Overview</TabsTrigger>
              <TabsTrigger value="rates">Rate Management</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            <TabsContent value="fleet">
              <Card>
                <CardHeader>
                  <CardTitle>Aircraft Fleet</CardTitle>
                  <CardDescription>View and manage all aircraft in the flight school fleet.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Registration</TableHead>
                        <TableHead>Type/Model</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Engine Hours</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Utilization</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aircraft.map((aircraft) => (
                        <TableRow key={aircraft.id}>
                          <TableCell className="font-medium">{aircraft.registration}</TableCell>
                          <TableCell>
                            <div>{aircraft.type}</div>
                            <div className="text-xs text-muted-foreground">{aircraft.model}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={aircraft.status === "Available" ? "default" : "secondary"}
                              className={`${
                                aircraft.status === "Available"
                                  ? "bg-green-500/80 hover:bg-green-500/90"
                                  : aircraft.status === "Maintenance"
                                    ? "bg-yellow-500/80 hover:bg-yellow-500/90"
                                    : "bg-red-500/80 hover:bg-red-500/90"
                              }`}
                            >
                              {aircraft.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{aircraft.engineHours}</TableCell>
                          <TableCell>{aircraft.location}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={aircraft.utilization} className="w-[60px]" />
                              <span className="text-xs">{aircraft.utilization}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setSelectedAircraft(aircraft)}>
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => {
                                  setUpdatingStatus(aircraft)
                                  setNewStatus(aircraft.status)
                                }}>
                                  Update status
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Maintenance log</DropdownMenuItem>
                                <DropdownMenuItem>Schedule maintenance</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rates">
              <Card>
                <CardHeader>
                  <CardTitle>Aircraft Rate Management</CardTitle>
                  <CardDescription>Manage hourly rates and special pricing for all aircraft.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aircraft</TableHead>
                        <TableHead>Standard Rates</TableHead>
                        <TableHead>Special Rates & Discounts</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {aircraft.map((aircraft) => (
                        <TableRow key={aircraft.id}>
                          <TableCell>
                            <div className="font-medium">{aircraft.registration}</div>
                            <div className="text-xs text-muted-foreground">{aircraft.model}</div>
                          </TableCell>
                          <TableCell>
                            {editingId === aircraft.id ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 items-center">
                                  <Label htmlFor={`wet-${aircraft.id}`} className="text-xs">
                                    Wet:
                                  </Label>
                                  <Input
                                    id={`wet-${aircraft.id}`}
                                    type="number"
                                    value={editedRates.wet}
                                    onChange={(e) => handleRateChange("wet", e.target.value)}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                  <Label htmlFor={`dry-${aircraft.id}`} className="text-xs">
                                    Dry:
                                  </Label>
                                  <Input
                                    id={`dry-${aircraft.id}`}
                                    type="number"
                                    value={editedRates.dry}
                                    onChange={(e) => handleRateChange("dry", e.target.value)}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                  <Label htmlFor={`block-${aircraft.id}`} className="text-xs">
                                    Block:
                                  </Label>
                                  <Input
                                    id={`block-${aircraft.id}`}
                                    type="number"
                                    value={editedRates.block}
                                    onChange={(e) => handleRateChange("block", e.target.value)}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                  <Label htmlFor={`instruction-${aircraft.id}`} className="text-xs">
                                    Instruction:
                                  </Label>
                                  <Input
                                    id={`instruction-${aircraft.id}`}
                                    type="number"
                                    value={editedRates.instruction}
                                    onChange={(e) => handleRateChange("instruction", e.target.value)}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                  <Label htmlFor={`weekend-${aircraft.id}`} className="text-xs">
                                    Weekend:
                                  </Label>
                                  <Input
                                    id={`weekend-${aircraft.id}`}
                                    type="number"
                                    value={editedRates.weekend}
                                    onChange={(e) => handleRateChange("weekend", e.target.value)}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                  <Label htmlFor={`solo-${aircraft.id}`} className="text-xs">
                                    Solo:
                                  </Label>
                                  <Input
                                    id={`solo-${aircraft.id}`}
                                    type="number"
                                    value={editedRates.solo}
                                    onChange={(e) => handleRateChange("solo", e.target.value)}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2 items-center">
                                  <Label htmlFor={`checkride-${aircraft.id}`} className="text-xs">
                                    Checkride:
                                  </Label>
                                  <Input
                                    id={`checkride-${aircraft.id}`}
                                    type="number"
                                    value={editedRates.checkride}
                                    onChange={(e) => handleRateChange("checkride", e.target.value)}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div className="flex justify-end space-x-2 mt-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="h-7 text-xs"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveRates(aircraft.id)}
                                    className="h-7 text-xs"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="text-xs">Wet: ${(aircraft.hourlyRates?.wet || 0).toFixed(2)}/hr</div>
                                <div className="text-xs">Dry: ${(aircraft.hourlyRates?.dry || 0).toFixed(2)}/hr</div>
                                <div className="text-xs">Block: ${(aircraft.hourlyRates?.block || 0).toFixed(2)}/hr</div>
                                <div className="text-xs">
                                  Instruction: ${(aircraft.hourlyRates?.instruction || 0).toFixed(2)}/hr
                                </div>
                                <div className="text-xs">Weekend: ${(aircraft.hourlyRates?.weekend || 0).toFixed(2)}/hr</div>
                                <div className="text-xs">Solo: ${(aircraft.hourlyRates?.solo || 0).toFixed(2)}/hr</div>
                                <div className="text-xs">
                                  Checkride: ${(aircraft.hourlyRates?.checkride || 0).toFixed(2)}/hr
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStartEdit(aircraft.id, aircraft.hourlyRates || {
                                    wet: 0,
                                    dry: 0,
                                    block: 0,
                                    instruction: 0,
                                    weekend: 0,
                                    solo: 0,
                                    checkride: 0
                                  })}
                                  className="h-6 text-xs mt-1"
                                >
                                  <Edit2 className="h-3 w-3 mr-1" />
                                  Edit Rates
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {aircraft.specialRates?.length > 0 ? (
                                aircraft.specialRates.map((rate) => (
                                  <div key={rate._id} className="flex justify-between items-center">
                                    <div>
                                      <div className="text-xs font-medium">{rate.name}</div>
                                      <div className="text-xs text-muted-foreground">{rate.description}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">{rate.discount}% off</Badge>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0"
                                        onClick={() => handleRemoveSpecialRate(aircraft.id, rate._id)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-muted-foreground">No special rates configured</div>
                              )}

                              {addingSpecialRateFor === aircraft.id ? (
                                <div className="space-y-2 border rounded-md p-2 mt-2">
                                  <div className="grid grid-cols-2 gap-2 items-center">
                                    <Label htmlFor="rate-name" className="text-xs">
                                      Name:
                                    </Label>
                                    <Input
                                      id="rate-name"
                                      value={newSpecialRate.name}
                                      onChange={(e) => setNewSpecialRate({ ...newSpecialRate, name: e.target.value })}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 items-center">
                                    <Label htmlFor="rate-discount" className="text-xs">
                                      Discount %:
                                    </Label>
                                    <Input
                                      id="rate-discount"
                                      type="number"
                                      value={newSpecialRate.discount}
                                      onChange={(e) =>
                                        setNewSpecialRate({
                                          ...newSpecialRate,
                                          discount: Number(e.target.value),
                                        })
                                      }
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 items-center">
                                    <Label htmlFor="rate-description" className="text-xs">
                                      Description:
                                    </Label>
                                    <Input
                                      id="rate-description"
                                      value={newSpecialRate.description}
                                      onChange={(e) =>
                                        setNewSpecialRate({ ...newSpecialRate, description: e.target.value })
                                      }
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div className="flex justify-end space-x-2 mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setAddingSpecialRateFor(null)
                                        setNewSpecialRate({ name: '', discount: 0, description: '' })
                                      }}
                                      className="h-7 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddSpecialRate(aircraft.id)}
                                      className="h-7 text-xs"
                                    >
                                      Add Rate
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setAddingSpecialRateFor(aircraft.id)}
                                  className="h-7 text-xs w-full mt-2"
                                >
                                  Add Special Rate
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setSelectedAircraft(aircraft)}>
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleExportRateSheet}>
                                  Export rate sheet
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance">
              <Card>
                <CardHeader>
                  <CardTitle>Maintenance Schedule</CardTitle>
                  <CardDescription>Track and manage aircraft maintenance requirements.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Aircraft</TableHead>
                        <TableHead>Engine Hours</TableHead>
                        <TableHead>Last Maintenance</TableHead>
                          <TableHead>Next Due</TableHead>
                        <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {aircraft.map((plane) => (
                          <TableRow 
                            key={plane.id}
                            className={maintenanceAircraft?.id === plane.id ? "bg-muted" : ""}
                            onClick={() => setMaintenanceAircraft(plane)}
                          >
                          <TableCell>
                              <div className="font-medium">{plane.registration}</div>
                              <div className="text-xs text-muted-foreground">{plane.type} {plane.model}</div>
                          </TableCell>
                            <TableCell>{plane.engineHours}</TableCell>
                            <TableCell>{formatDate(plane.lastMaintenance)}</TableCell>
                            <TableCell>{formatDate(plane.nextMaintenance)}</TableCell>
                          <TableCell>
                            <Badge
                                variant={plane.status === "Available" ? "default" : "secondary"}
                                className={`${
                                  plane.status === "Available"
                                    ? "bg-green-500/80 hover:bg-green-500/90"
                                    : plane.status === "Maintenance"
                                      ? "bg-yellow-500/80 hover:bg-yellow-500/90"
                                      : "bg-red-500/80 hover:bg-red-500/90"
                                }`}
                              >
                                {plane.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMaintenanceAircraft(maintenanceAircraft?.id === plane.id ? null : plane);
                                }}
                              >
                                {maintenanceAircraft?.id === plane.id ? "Hide Details" : "View Details"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                    {maintenanceAircraft && (
                      <div className="space-y-6 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Maintenance Details - {maintenanceAircraft.registration}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMaintenanceAircraft(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {loadingMaintenanceData ? (
                          <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                            <p className="text-sm text-muted-foreground">Loading maintenance data...</p>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {/* Component Hours */}
                            <div>
                              <h4 className="text-md font-semibold mb-4">Component Hours</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {maintenanceSchedule?.componentHours && (
                                  <>
                                    <Card>
                                      <CardHeader className="p-4">
                                        <CardTitle className="text-sm">Engine</CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 pt-0">
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Total Hours:</span>
                                            <span className="text-sm font-medium">{maintenanceSchedule.componentHours.engine.total}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Since Overhaul:</span>
                                            <span className="text-sm font-medium">{maintenanceSchedule.componentHours.engine.sinceOverhaul}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Next Overhaul:</span>
                                            <span className="text-sm font-medium">{maintenanceSchedule.componentHours.engine.nextOverhaul}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardHeader className="p-4">
                                        <CardTitle className="text-sm">Propeller</CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 pt-0">
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Total Hours:</span>
                                            <span className="text-sm font-medium">{maintenanceSchedule.componentHours.propeller.total}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Since Overhaul:</span>
                                            <span className="text-sm font-medium">{maintenanceSchedule.componentHours.propeller.sinceOverhaul}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Next Overhaul:</span>
                                            <span className="text-sm font-medium">{maintenanceSchedule.componentHours.propeller.nextOverhaul}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                    <Card>
                                      <CardHeader className="p-4">
                                        <CardTitle className="text-sm">Landing Gear</CardTitle>
                                      </CardHeader>
                                      <CardContent className="p-4 pt-0">
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Total Hours:</span>
                                            <span className="text-sm font-medium">{maintenanceSchedule.componentHours.landingGear.total}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Since Overhaul:</span>
                                            <span className="text-sm font-medium">{maintenanceSchedule.componentHours.landingGear.sinceOverhaul}</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-sm text-muted-foreground">Next Overhaul:</span>
                                            <span className="text-sm font-medium">{maintenanceSchedule.componentHours.landingGear.nextOverhaul}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Maintenance Schedule */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-semibold">Maintenance Schedule</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (maintenanceSchedule) {
                                      setEditedMaintenanceSchedule({
                                        nextAnnual: maintenanceSchedule.nextAnnual,
                                        next100Hour: maintenanceSchedule.next100Hour,
                                        nextOilChange: maintenanceSchedule.nextOilChange,
                                        nextInspection: maintenanceSchedule.nextInspection,
                                        lastAnnual: maintenanceSchedule.lastAnnual,
                                        last100Hour: maintenanceSchedule.last100Hour,
                                        lastOilChange: maintenanceSchedule.lastOilChange,
                                        lastInspection: maintenanceSchedule.lastInspection,
                                        componentHours: maintenanceSchedule.componentHours
                                      });
                                      setIsMaintenanceScheduleDialogOpen(true);
                                    }
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit Schedule
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                  <CardHeader className="p-4">
                                    <CardTitle className="text-sm">Last Maintenance</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-0">
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Annual:</span>
                                        <span className="text-sm font-medium">{formatDate(maintenanceSchedule?.lastAnnual || '')}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">100-Hour:</span>
                                        <span className="text-sm font-medium">{formatDate(maintenanceSchedule?.last100Hour || '')}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Oil Change:</span>
                                        <span className="text-sm font-medium">{formatDate(maintenanceSchedule?.lastOilChange || '')}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Inspection:</span>
                                        <span className="text-sm font-medium">{formatDate(maintenanceSchedule?.lastInspection || '')}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardHeader className="p-4">
                                    <CardTitle className="text-sm">Next Due</CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-4 pt-0">
                                    <div className="space-y-2">
                                      <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Annual:</span>
                                        <span className="text-sm font-medium">{formatDate(maintenanceSchedule?.nextAnnual || '')}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">100-Hour:</span>
                                        <span className="text-sm font-medium">{formatDate(maintenanceSchedule?.next100Hour || '')}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Oil Change:</span>
                                        <span className="text-sm font-medium">{formatDate(maintenanceSchedule?.nextOilChange || '')}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Inspection:</span>
                                        <span className="text-sm font-medium">{formatDate(maintenanceSchedule?.nextInspection || '')}</span>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>

                            {/* Maintenance Logs */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-semibold">Maintenance Logs</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setNewMaintenanceLog({
                                      date: new Date().toISOString(),
                                      type: 'Annual',
                                      description: '',
                                      workPerformed: '',
                                      partsReplaced: [],
                                      technician: {
                                        name: '',
                                        certificate: '',
                                        signature: ''
                                      },
                                      aircraftHours: {
                                        total: 0,
                                        sinceLastOverhaul: 0
                                      },
                                      nextDue: {
                                        hours: 0,
                                        date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                                      },
                                      status: 'Pending',
                                      referenceDocuments: [],
                                      notes: ''
                                    });
                                    setEditingMaintenanceLog(null);
                                    setIsMaintenanceLogDialogOpen(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Maintenance Log
                                </Button>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Technician</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Next Due</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {maintenanceLogs.map((log) => (
                                    <>
                                      <TableRow 
                                        key={log._id}
                                        className={expandedMaintenanceLog === log._id ? "bg-muted" : ""}
                                        onClick={() => setExpandedMaintenanceLog(expandedMaintenanceLog === log._id ? null : log._id)}
                                      >
                                        <TableCell>{formatDate(log.date)}</TableCell>
                                        <TableCell>{log.type}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{log.description}</TableCell>
                                        <TableCell>{log.technician.name}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={log.status === "Completed" ? "default" : "secondary"}
                                            className={log.status === "Completed" ? "bg-green-500/80" : "bg-yellow-500/80"}
                                          >
                                            {log.status}
                            </Badge>
                          </TableCell>
                                        <TableCell>{formatDate(log.nextDue.date)}</TableCell>
                                        <TableCell className="text-right">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingMaintenanceLog(log);
                                              setNewMaintenanceLog({
                                                date: log.date,
                                                type: log.type,
                                                description: log.description,
                                                workPerformed: log.workPerformed,
                                                partsReplaced: log.partsReplaced,
                                                technician: log.technician,
                                                aircraftHours: log.aircraftHours,
                                                nextDue: log.nextDue,
                                                status: log.status,
                                                referenceDocuments: log.referenceDocuments,
                                                notes: log.notes
                                              });
                                              setIsMaintenanceLogDialogOpen(true);
                                            }}
                                          >
                                            <Edit2 className="h-4 w-4" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                      {expandedMaintenanceLog === log._id && (
                                        <TableRow>
                                          <TableCell colSpan={7} className="bg-muted/50">
                                            <div className="p-4 space-y-4">
                                              <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                  <h5 className="font-medium mb-2">Work Performed</h5>
                                                  <p className="text-sm text-muted-foreground">{log.workPerformed}</p>
                                                </div>
                                                <div>
                                                  <h5 className="font-medium mb-2">Parts Replaced</h5>
                                                  <div className="space-y-2">
                                                    {log.partsReplaced.map((part) => (
                                                      <div key={part._id} className="text-sm">
                                                        <span className="font-medium">{part.partNumber}</span> - {part.description} (Qty: {part.quantity})
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                  <h5 className="font-medium mb-2">Aircraft Hours</h5>
                                                  <div className="space-y-1 text-sm">
                                                    <div>Total: {log.aircraftHours.total}</div>
                                                    <div>Since Last Overhaul: {log.aircraftHours.sinceLastOverhaul}</div>
                                                  </div>
                                                </div>
                                                <div>
                                                  <h5 className="font-medium mb-2">Next Due</h5>
                                                  <div className="space-y-1 text-sm">
                                                    <div>Hours: {log.nextDue.hours}</div>
                                                    <div>Date: {formatDate(log.nextDue.date)}</div>
                                                  </div>
                                                </div>
                                              </div>
                                              {log.notes && (
                                                <div>
                                                  <h5 className="font-medium mb-2">Notes</h5>
                                                  <p className="text-sm text-muted-foreground">{log.notes}</p>
                                                </div>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Airworthiness Directives */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-semibold">Airworthiness Directives</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setNewAD({
                                      adNumber: '',
                                      title: '',
                                      description: '',
                                      issuedDate: '',
                                      effectiveDate: '',
                                      complianceDate: '',
                                      category: '',
                                      applicability: '',
                                      status: 'Pending',
                                      priority: 'Medium',
                                      estimatedLabor: '',
                                      estimatedParts: '',
                                      recurringInspection: false,
                                      notes: '',
                                      attachments: [],
                                      complianceMethod: '',
                                      references: []
                                    });
                                    setEditingAD(null);
                                    setIsADDialogOpen(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Airworthiness Directive
                                </Button>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>AD Number</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Compliance Date</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {airworthinessDirectives.map((ad) => (
                                    <>
                                      <TableRow 
                                        key={ad._id}
                                        className={expandedAD === ad._id ? "bg-muted" : ""}
                                        onClick={() => setExpandedAD(expandedAD === ad._id ? null : ad._id)}
                                      >
                                        <TableCell>{ad.adNumber}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{ad.title}</TableCell>
                          <TableCell>
                                          <Badge
                                            variant={ad.status === "Compliant" ? "default" : "secondary"}
                                            className={ad.status === "Compliant" ? "bg-green-500/80" : "bg-yellow-500/80"}
                                          >
                                            {ad.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(ad.complianceDate)}</TableCell>
                                        <TableCell>
                                          <div className="flex items-center justify-end">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingAD(ad);
                                                setNewAD({
                                                  adNumber: ad.adNumber,
                                                  title: ad.title,
                                                  description: ad.description,
                                                  issuedDate: ad.issuedDate,
                                                  effectiveDate: ad.effectiveDate,
                                                  complianceDate: ad.complianceDate,
                                                  category: ad.category,
                                                  applicability: ad.applicability,
                                                  status: ad.status,
                                                  priority: ad.priority,
                                                  estimatedLabor: ad.estimatedLabor,
                                                  estimatedParts: ad.estimatedParts,
                                                  recurringInspection: ad.recurringInspection,
                                                  notes: ad.notes,
                                                  attachments: ad.attachments,
                                                  complianceMethod: ad.complianceMethod,
                                                  references: ad.references
                                                });
                                                setIsADDialogOpen(true);
                                              }}
                                            >
                                              <Edit2 className="h-4 w-4" />
                            </Button>
                                          </div>
                          </TableCell>
                        </TableRow>
                                      {expandedAD === ad._id && (
                                        <TableRow>
                                          <TableCell colSpan={5} className="bg-muted/50">
                                            <div className="p-4 space-y-4">
                                              <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                  <h5 className="font-medium mb-2">Description</h5>
                                                  <p className="text-sm text-muted-foreground">{ad.description}</p>
                                                </div>
                                                <div>
                                                  <h5 className="font-medium mb-2">Compliance Method</h5>
                                                  <p className="text-sm text-muted-foreground">{ad.complianceMethod}</p>
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                  <h5 className="font-medium mb-2">Dates</h5>
                                                  <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                      <span className="text-muted-foreground">Issued:</span>
                                                      <span>{formatDate(ad.issuedDate)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-muted-foreground">Effective:</span>
                                                      <span>{formatDate(ad.effectiveDate)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-muted-foreground">Compliance Due:</span>
                                                      <span>{formatDate(ad.complianceDate)}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div>
                                                  <h5 className="font-medium mb-2">Category & Applicability</h5>
                                                  <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                      <span className="text-muted-foreground">Category:</span>
                                                      <span>{ad.category}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-muted-foreground">Applicability:</span>
                                                      <span>{ad.applicability}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-muted-foreground">Recurring:</span>
                                                      <span>{ad.recurringInspection ? 'Yes' : 'No'}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div>
                                                  <h5 className="font-medium mb-2">Estimates</h5>
                                                  <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                      <span className="text-muted-foreground">Labor Hours:</span>
                                                      <span>{ad.estimatedLabor}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                      <span className="text-muted-foreground">Parts Cost:</span>
                                                      <span>${ad.estimatedParts}</span>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>

                                              {ad.references && ad.references.length > 0 && (
                                                <div>
                                                  <h5 className="font-medium mb-2">References</h5>
                                                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                    {ad.references.map((ref, index) => (
                                                      <li key={index}>{ref}</li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}

                                              {ad.attachments && ad.attachments.length > 0 && (
                                                <div>
                                                  <h5 className="font-medium mb-2">Attachments</h5>
                                                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                    {ad.attachments.map((attachment) => (
                                                      <li key={attachment._id}>
                                                        <a 
                                                          href={attachment.url} 
                                                          target="_blank" 
                                                          rel="noopener noreferrer"
                                                          className="text-primary hover:underline"
                                                        >
                                                          {attachment.name}
                                                        </a>
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}

                                              {ad.notes && (
                                                <div>
                                                  <h5 className="font-medium mb-2">Notes</h5>
                                                  <p className="text-sm text-muted-foreground">{ad.notes}</p>
                                                </div>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </>
                      ))}
                    </TableBody>
                  </Table>
                            </div>

                            {/* Service Bulletins */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-semibold">Service Bulletins</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setNewServiceBulletin({
                                      title: '',
                                      description: '',
                                      status: 'Pending',
                                      completionDate: '',
                                      notes: ''
                                    });
                                    setEditingServiceBulletin(null);
                                    setIsServiceBulletinDialogOpen(true);
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Service Bulletin
                                </Button>
                              </div>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>SB Number</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Completion Date</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {serviceBulletins.map((sb) => (
                                    <>
                                      <TableRow 
                                        key={sb._id}
                                        className={expandedSB === sb._id ? "bg-muted" : ""}
                                        onClick={() => setExpandedSB(expandedSB === sb._id ? null : sb._id)}
                                      >
                                        <TableCell>{sb.sbNumber}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{sb.title}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={sb.status === "Completed" ? "default" : "secondary"}
                                            className={sb.status === "Completed" ? "bg-green-500/80" : "bg-yellow-500/80"}
                                          >
                                            {sb.status}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{formatDate(sb.completionDate)}</TableCell>
                                        <TableCell>
                                          <div className="flex items-center justify-end">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-8 w-8 p-0"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingServiceBulletin(sb);
                                                setNewServiceBulletin({
                                                  title: sb.title,
                                                  description: sb.description,
                                                  status: sb.status,
                                                  completionDate: sb.completionDate,
                                                  notes: sb.notes
                                                });
                                                setIsServiceBulletinDialogOpen(true);
                                              }}
                                            >
                                              <Edit2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                      {expandedSB === sb._id && (
                                        <TableRow>
                                          <TableCell colSpan={5} className="bg-muted/50">
                                            <div className="p-4 space-y-4">
                                              <div>
                                                <h5 className="font-medium mb-2">Description</h5>
                                                <p className="text-sm text-muted-foreground">{sb.description}</p>
                                              </div>
                                              {sb.notes && (
                                                <div>
                                                  <h5 className="font-medium mb-2">Notes</h5>
                                                  <p className="text-sm text-muted-foreground">{sb.notes}</p>
                                                </div>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Update the Component Hours section */}
                            <div>
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-md font-semibold">Component Hours</h4>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (maintenanceSchedule) {
                                      setEditedMaintenanceSchedule({
                                        nextAnnual: maintenanceSchedule.nextAnnual,
                                        next100Hour: maintenanceSchedule.next100Hour,
                                        nextOilChange: maintenanceSchedule.nextOilChange,
                                        nextInspection: maintenanceSchedule.nextInspection,
                                        lastAnnual: maintenanceSchedule.lastAnnual,
                                        last100Hour: maintenanceSchedule.last100Hour,
                                        lastOilChange: maintenanceSchedule.lastOilChange,
                                        lastInspection: maintenanceSchedule.lastInspection,
                                        componentHours: maintenanceSchedule.componentHours
                                      });
                                      setIsMaintenanceScheduleDialogOpen(true);
                                    }
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit Schedule
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardShell>

      <Dialog open={selectedAircraft !== null} onOpenChange={(open) => {
        if (!open) {
          setSelectedAircraft(null)
          setEditingField(null)
          setEditedValue('')
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Aircraft Details</DialogTitle>
            <DialogDescription>
              Detailed information about {selectedAircraft?.registration}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAircraft && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Aircraft Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Registration:</div>
                    <div>{selectedAircraft.registration}</div>
                    <div className="text-muted-foreground">Type:</div>
                    <div>{selectedAircraft.type}</div>
                    <div className="text-muted-foreground">Model:</div>
                    <div>{selectedAircraft.model}</div>
                    <div className="text-muted-foreground">Year:</div>
                    <div>{selectedAircraft.year}</div>
                    <div className="text-muted-foreground">Location:</div>
                    <div className="flex items-center gap-2">
                      {editingField === 'location' ? (
                        <>
                          <Input
                            value={editedValue}
                            onChange={(e) => setEditedValue(e.target.value)}
                            className="h-8"
                          />
                          <Button
                            onClick={handleSaveField}
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => {
                              setEditingField(null)
                              setEditedValue('')
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div>{selectedAircraft.location}</div>
                          <Button
                            onClick={() => {
                              setEditingField('location')
                              setEditedValue(selectedAircraft.location)
                            }}
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Status & Utilization</h4>
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge
                        variant={selectedAircraft.status === "Available" ? "default" : "secondary"}
                        className={`${
                          selectedAircraft.status === "Available"
                            ? "bg-green-500/80 hover:bg-green-500/90"
                            : selectedAircraft.status === "Maintenance"
                              ? "bg-yellow-500/80 hover:bg-yellow-500/90"
                              : "bg-red-500/80 hover:bg-red-500/90"
                        }`}
                      >
                        {selectedAircraft.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Utilization:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedAircraft.utilization} className="w-[60px]" />
                        <span className="text-sm">{selectedAircraft.utilization}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Notes</h4>
                  {editingField === 'notes' ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveField}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingField(null)
                          setEditedValue('')
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setEditingField('notes')
                        setEditedValue(selectedAircraft.notes || '')
                      }}
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {editingField === 'notes' ? (
                  <Textarea
                    value={editedValue}
                    onChange={(e) => setEditedValue(e.target.value)}
                    placeholder="Add notes about the aircraft..."
                    className="min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">{selectedAircraft.notes || 'No notes available'}</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Maintenance Information</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="p-3">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">Engine Hours</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-2xl font-bold">{selectedAircraft.engineHours}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">Last Maintenance</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-sm">{formatDate(selectedAircraft.lastMaintenance)}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm">Next Due</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="text-sm">{formatDate(selectedAircraft.nextMaintenance)}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={updatingStatus !== null} onOpenChange={(open) => {
        if (!open) {
          setUpdatingStatus(null)
          setNewStatus('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Aircraft Status</DialogTitle>
            <DialogDescription>
              Change the status of {updatingStatus?.registration}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                <option value="Available">Available</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUpdatingStatus(null)
                setNewStatus('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isServiceBulletinDialogOpen} onOpenChange={setIsServiceBulletinDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingServiceBulletin ? 'Edit Service Bulletin' : 'Add Service Bulletin'}</DialogTitle>
            <DialogDescription>
              {editingServiceBulletin 
                ? `Edit service bulletin ${editingServiceBulletin.sbNumber}`
                : 'Create a new service bulletin for this aircraft'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newServiceBulletin.title}
                onChange={(e) => setNewServiceBulletin({ ...newServiceBulletin, title: e.target.value })}
                placeholder="Enter service bulletin title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newServiceBulletin.description}
                onChange={(e) => setNewServiceBulletin({ ...newServiceBulletin, description: e.target.value })}
                placeholder="Enter service bulletin description"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
                value={newServiceBulletin.status}
                onChange={(e) => setNewServiceBulletin({ ...newServiceBulletin, status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="completionDate">Completion Date</Label>
              <Input
                id="completionDate"
                type="date"
                value={newServiceBulletin.completionDate?.split('T')[0]}
                onChange={(e) => setNewServiceBulletin({ 
                  ...newServiceBulletin, 
                  completionDate: new Date(e.target.value).toISOString() 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newServiceBulletin.notes}
                onChange={(e) => setNewServiceBulletin({ ...newServiceBulletin, notes: e.target.value })}
                placeholder="Enter any additional notes"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editingServiceBulletin && (
              <Button
                variant="destructive"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this service bulletin?")) {
                    handleDeleteServiceBulletin(editingServiceBulletin._id);
                    setIsServiceBulletinDialogOpen(false);
                  }
                }}
              >
                Delete Service Bulletin
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setIsServiceBulletinDialogOpen(false);
                setEditingServiceBulletin(null);
                setNewServiceBulletin({
                  title: '',
                  description: '',
                  status: 'Pending',
                  completionDate: '',
                  notes: ''
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleServiceBulletinSubmit}>
                {editingServiceBulletin ? 'Update' : 'Create'} Service Bulletin
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isADDialogOpen} onOpenChange={setIsADDialogOpen}>
        <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingAD ? 'Edit Airworthiness Directive' : 'Add Airworthiness Directive'}</DialogTitle>
            <DialogDescription>
              {editingAD 
                ? `Edit airworthiness directive ${editingAD.adNumber}`
                : 'Create a new airworthiness directive for this aircraft'}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <div className="grid gap-6 p-6">
              {/* First row - Basic Information */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="ad-number">AD Number</Label>
                  <Input
                    id="ad-number"
                    value={newAD.adNumber}
                    onChange={(e) => setNewAD({ ...newAD, adNumber: e.target.value })}
                    placeholder="e.g., 2024-02-15"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="ad-title">Title</Label>
                  <Input
                    id="ad-title"
                    value={newAD.title}
                    onChange={(e) => setNewAD({ ...newAD, title: e.target.value })}
                    placeholder="Enter airworthiness directive title"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="ad-category">Category</Label>
                  <Input
                    id="ad-category"
                    value={newAD.category}
                    onChange={(e) => setNewAD({ ...newAD, category: e.target.value })}
                    placeholder="e.g., Fuel System"
                  />
                </div>
              </div>

              {/* Second row - Dates */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="ad-issuedDate">Issued Date</Label>
                  <Input
                    id="ad-issuedDate"
                    type="date"
                    value={newAD.issuedDate?.split('T')[0]}
                    onChange={(e) => setNewAD({ 
                      ...newAD, 
                      issuedDate: new Date(e.target.value).toISOString() 
                    })}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="ad-effectiveDate">Effective Date</Label>
                  <Input
                    id="ad-effectiveDate"
                    type="date"
                    value={newAD.effectiveDate?.split('T')[0]}
                    onChange={(e) => setNewAD({ 
                      ...newAD, 
                      effectiveDate: new Date(e.target.value).toISOString() 
                    })}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="ad-complianceDate">Compliance Date</Label>
                  <Input
                    id="ad-complianceDate"
                    type="date"
                    value={newAD.complianceDate?.split('T')[0]}
                    onChange={(e) => setNewAD({ 
                      ...newAD, 
                      complianceDate: new Date(e.target.value).toISOString() 
                    })}
                  />
                </div>
              </div>

              {/* Third row - Status and Priority */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="ad-status">Status</Label>
                  <select
                    id="ad-status"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newAD.status}
                    onChange={(e) => setNewAD({ ...newAD, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Compliant">Compliant</option>
                  </select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="ad-priority">Priority</Label>
                  <select
                    id="ad-priority"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newAD.priority}
                    onChange={(e) => setNewAD({ ...newAD, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="ad-applicability">Applicability</Label>
                  <Input
                    id="ad-applicability"
                    value={newAD.applicability}
                    onChange={(e) => setNewAD({ ...newAD, applicability: e.target.value })}
                    placeholder="e.g., Models PA-28-181 manufactured between 2018-2020"
                  />
                </div>
              </div>

              {/* Fourth row - Estimates */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="ad-estimatedLabor">Estimated Labor (hours)</Label>
                  <Input
                    id="ad-estimatedLabor"
                    type="number"
                    step="0.5"
                    value={newAD.estimatedLabor}
                    onChange={(e) => setNewAD({ ...newAD, estimatedLabor: e.target.value })}
                    placeholder="e.g., 4.0"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="ad-estimatedParts">Estimated Parts Cost ($)</Label>
                  <Input
                    id="ad-estimatedParts"
                    type="number"
                    step="0.01"
                    value={newAD.estimatedParts}
                    onChange={(e) => setNewAD({ ...newAD, estimatedParts: e.target.value })}
                    placeholder="e.g., 850.00"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="ad-recurringInspection" className="block">Recurring Inspection</Label>
                  <div className="flex items-center space-x-2 h-10">
                    <Checkbox
                      id="ad-recurringInspection"
                      checked={newAD.recurringInspection}
                      onCheckedChange={(checked) => 
                        setNewAD({ ...newAD, recurringInspection: checked as boolean })
                      }
                    />
                    <Label htmlFor="ad-recurringInspection" className="text-sm text-muted-foreground">Required</Label>
                  </div>
                </div>
              </div>

              {/* Fifth row - Description and Compliance Method */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="ad-description">Description</Label>
                  <Textarea
                    id="ad-description"
                    value={newAD.description}
                    onChange={(e) => setNewAD({ ...newAD, description: e.target.value })}
                    placeholder="Enter airworthiness directive description"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="ad-complianceMethod">Compliance Method</Label>
                  <Textarea
                    id="ad-complianceMethod"
                    value={newAD.complianceMethod}
                    onChange={(e) => setNewAD({ ...newAD, complianceMethod: e.target.value })}
                    placeholder="Enter compliance method details"
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              {/* Sixth row - References and Notes */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="ad-references">References</Label>
                  <Textarea
                    id="ad-references"
                    value={newAD.references?.join('\n')}
                    onChange={(e) => setNewAD({ 
                      ...newAD, 
                      references: e.target.value.split('\n').filter(ref => ref.trim()) 
                    })}
                    placeholder="Enter references (one per line)"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="ad-notes">Notes</Label>
                  <Textarea
                    id="ad-notes"
                    value={newAD.notes}
                    onChange={(e) => setNewAD({ ...newAD, notes: e.target.value })}
                    placeholder="Enter any additional notes"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between">
              {editingAD && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this airworthiness directive?")) {
                      handleDeleteAD(editingAD._id);
                      setIsADDialogOpen(false);
                    }
                  }}
                >
                  Delete Airworthiness Directive
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setIsADDialogOpen(false);
                  setEditingAD(null);
                  setNewAD({
                    adNumber: '',
                    title: '',
                    description: '',
                    issuedDate: '',
                    effectiveDate: '',
                    complianceDate: '',
                    category: '',
                    applicability: '',
                    status: 'Pending',
                    priority: 'Medium',
                    estimatedLabor: '',
                    estimatedParts: '',
                    recurringInspection: false,
                    notes: '',
                    attachments: [],
                    complianceMethod: '',
                    references: []
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleADSubmit}>
                  {editingAD ? 'Update' : 'Create'} Airworthiness Directive
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add the Maintenance Log Dialog before the closing div */}
      <Dialog open={isMaintenanceLogDialogOpen} onOpenChange={setIsMaintenanceLogDialogOpen}>
        <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingMaintenanceLog ? 'Edit Maintenance Log' : 'Add Maintenance Log'}</DialogTitle>
            <DialogDescription>
              {editingMaintenanceLog 
                ? `Edit maintenance log from ${formatDate(editingMaintenanceLog.date)}`
                : 'Create a new maintenance log entry'}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <div className="grid gap-6 p-6">
              {/* First row - Basic Information */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="log-date">Date</Label>
                  <Input
                    id="log-date"
                    type="date"
                    value={newMaintenanceLog.date?.split('T')[0]}
                    onChange={(e) => setNewMaintenanceLog({ 
                      ...newMaintenanceLog, 
                      date: new Date(e.target.value).toISOString() 
                    })}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="log-type">Type</Label>
                  <select
                    id="log-type"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newMaintenanceLog.type}
                    onChange={(e) => setNewMaintenanceLog({ ...newMaintenanceLog, type: e.target.value })}
                  >
                    <option value="Annual">Annual</option>
                    <option value="100-Hour">100-Hour</option>
                    <option value="Progressive">Progressive</option>
                    <option value="Repair">Repair</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="log-status">Status</Label>
                  <select
                    id="log-status"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    value={newMaintenanceLog.status}
                    onChange={(e) => setNewMaintenanceLog({ ...newMaintenanceLog, status: e.target.value })}
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Second row - Description and Work Performed */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="log-description">Description</Label>
                  <Textarea
                    id="log-description"
                    value={newMaintenanceLog.description}
                    onChange={(e) => setNewMaintenanceLog({ ...newMaintenanceLog, description: e.target.value })}
                    placeholder="Brief description of maintenance work"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="log-workPerformed">Work Performed</Label>
                  <Textarea
                    id="log-workPerformed"
                    value={newMaintenanceLog.workPerformed}
                    onChange={(e) => setNewMaintenanceLog({ ...newMaintenanceLog, workPerformed: e.target.value })}
                    placeholder="Detailed description of work performed"
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              {/* Third row - Parts Replaced */}
              <div className="space-y-2.5">
                <Label>Parts Replaced</Label>
                <div className="space-y-4">
                  {newMaintenanceLog.partsReplaced?.map((part, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label htmlFor={`part-number-${index}`}>Part Number</Label>
                        <Input
                          id={`part-number-${index}`}
                          value={part.partNumber}
                          onChange={(e) => {
                            const updatedParts = [...(newMaintenanceLog.partsReplaced || [])];
                            updatedParts[index] = { ...part, partNumber: e.target.value };
                            setNewMaintenanceLog({ ...newMaintenanceLog, partsReplaced: updatedParts });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`part-description-${index}`}>Description</Label>
                        <Input
                          id={`part-description-${index}`}
                          value={part.description}
                          onChange={(e) => {
                            const updatedParts = [...(newMaintenanceLog.partsReplaced || [])];
                            updatedParts[index] = { ...part, description: e.target.value };
                            setNewMaintenanceLog({ ...newMaintenanceLog, partsReplaced: updatedParts });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`part-quantity-${index}`}>Quantity</Label>
                        <Input
                          id={`part-quantity-${index}`}
                          type="number"
                          value={part.quantity}
                          onChange={(e) => {
                            const updatedParts = [...(newMaintenanceLog.partsReplaced || [])];
                            updatedParts[index] = { ...part, quantity: Number(e.target.value) };
                            setNewMaintenanceLog({ ...newMaintenanceLog, partsReplaced: updatedParts });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`part-cost-${index}`}>Cost ($)</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`part-cost-${index}`}
                            type="number"
                            step="0.01"
                            value={part.cost}
                            onChange={(e) => {
                              const updatedParts = [...(newMaintenanceLog.partsReplaced || [])];
                              updatedParts[index] = { ...part, cost: Number(e.target.value) };
                              setNewMaintenanceLog({ ...newMaintenanceLog, partsReplaced: updatedParts });
                            }}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              const updatedParts = newMaintenanceLog.partsReplaced?.filter((_, i) => i !== index);
                              setNewMaintenanceLog({ ...newMaintenanceLog, partsReplaced: updatedParts });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPart = {
                        _id: `temp-${Date.now()}`,
                        partNumber: '',
                        description: '',
                        quantity: 1,
                        cost: 0
                      };
                      setNewMaintenanceLog({
                        ...newMaintenanceLog,
                        partsReplaced: [...(newMaintenanceLog.partsReplaced || []), newPart]
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Part
                  </Button>
                </div>
              </div>

              {/* Fourth row - Technician Information */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="technician-name">Technician Name</Label>
                  <Input
                    id="technician-name"
                    value={newMaintenanceLog.technician?.name}
                    onChange={(e) => setNewMaintenanceLog({
                      ...newMaintenanceLog,
                      technician: { ...newMaintenanceLog.technician!, name: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="technician-certificate">Certificate Number</Label>
                  <Input
                    id="technician-certificate"
                    value={newMaintenanceLog.technician?.certificate}
                    onChange={(e) => setNewMaintenanceLog({
                      ...newMaintenanceLog,
                      technician: { ...newMaintenanceLog.technician!, certificate: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="technician-signature">Signature</Label>
                  <Input
                    id="technician-signature"
                    value={newMaintenanceLog.technician?.signature}
                    onChange={(e) => setNewMaintenanceLog({
                      ...newMaintenanceLog,
                      technician: { ...newMaintenanceLog.technician!, signature: e.target.value }
                    })}
                  />
                </div>
              </div>

              {/* Fifth row - Aircraft Hours and Next Due */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label>Aircraft Hours</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hours-total">Total Hours</Label>
                      <Input
                        id="hours-total"
                        type="number"
                        value={newMaintenanceLog.aircraftHours?.total}
                        onChange={(e) => setNewMaintenanceLog({
                          ...newMaintenanceLog,
                          aircraftHours: {
                            ...newMaintenanceLog.aircraftHours!,
                            total: Number(e.target.value)
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hours-since-overhaul">Since Last Overhaul</Label>
                      <Input
                        id="hours-since-overhaul"
                        type="number"
                        value={newMaintenanceLog.aircraftHours?.sinceLastOverhaul}
                        onChange={(e) => setNewMaintenanceLog({
                          ...newMaintenanceLog,
                          aircraftHours: {
                            ...newMaintenanceLog.aircraftHours!,
                            sinceLastOverhaul: Number(e.target.value)
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label>Next Due</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="next-due-hours">Hours</Label>
                      <Input
                        id="next-due-hours"
                        type="number"
                        value={newMaintenanceLog.nextDue?.hours}
                        onChange={(e) => setNewMaintenanceLog({
                          ...newMaintenanceLog,
                          nextDue: {
                            ...newMaintenanceLog.nextDue!,
                            hours: Number(e.target.value)
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="next-due-date">Date</Label>
                      <Input
                        id="next-due-date"
                        type="date"
                        value={newMaintenanceLog.nextDue?.date.split('T')[0]}
                        onChange={(e) => setNewMaintenanceLog({
                          ...newMaintenanceLog,
                          nextDue: {
                            ...newMaintenanceLog.nextDue!,
                            date: new Date(e.target.value).toISOString()
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sixth row - Reference Documents and Notes */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="reference-documents">Reference Documents</Label>
                  <Textarea
                    id="reference-documents"
                    value={newMaintenanceLog.referenceDocuments?.join('\n')}
                    onChange={(e) => setNewMaintenanceLog({
                      ...newMaintenanceLog,
                      referenceDocuments: e.target.value.split('\n').filter(doc => doc.trim())
                    })}
                    placeholder="Enter reference documents (one per line)"
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="log-notes">Notes</Label>
                  <Textarea
                    id="log-notes"
                    value={newMaintenanceLog.notes}
                    onChange={(e) => setNewMaintenanceLog({ ...newMaintenanceLog, notes: e.target.value })}
                    placeholder="Additional notes or observations"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex justify-between px-6 pb-6">
              {editingMaintenanceLog && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this maintenance log?")) {
                      handleDeleteMaintenanceLog(editingMaintenanceLog._id);
                      setIsMaintenanceLogDialogOpen(false);
                    }
                  }}
                >
                  Delete Maintenance Log
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setIsMaintenanceLogDialogOpen(false);
                  setEditingMaintenanceLog(null);
                  setNewMaintenanceLog({
                    date: new Date().toISOString(),
                    type: 'Annual',
                    description: '',
                    workPerformed: '',
                    partsReplaced: [],
                    technician: {
                      name: '',
                      certificate: '',
                      signature: ''
                    },
                    aircraftHours: {
                      total: 0,
                      sinceLastOverhaul: 0
                    },
                    nextDue: {
                      hours: 0,
                      date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                    },
                    status: 'Pending',
                    referenceDocuments: [],
                    notes: ''
                  });
                }}>
                  Cancel
                </Button>
                <Button onClick={handleMaintenanceLogSubmit}>
                  {editingMaintenanceLog ? 'Update' : 'Create'} Maintenance Log
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add the Maintenance Schedule Dialog */}
      <Dialog open={isMaintenanceScheduleDialogOpen} onOpenChange={setIsMaintenanceScheduleDialogOpen}>
        <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Maintenance Schedule</DialogTitle>
            <DialogDescription>
              Update component hours and maintenance schedule
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <div className="grid gap-6 p-6">
              {/* Component Hours */}
              <div>
                <h4 className="text-md font-semibold mb-4">Component Hours</h4>
                <div className="grid grid-cols-3 gap-6">
                  {/* Engine Hours */}
                  <div className="space-y-4">
                    <h5 className="font-medium">Engine</h5>
                    <div className="space-y-2.5">
                      <Label htmlFor="engine-total">Total Hours</Label>
                      <Input
                        id="engine-total"
                        type="number"
                        value={editedMaintenanceSchedule.componentHours?.engine.total}
                        onChange={(e) => setEditedMaintenanceSchedule({
                          ...editedMaintenanceSchedule,
                          componentHours: {
                            ...editedMaintenanceSchedule.componentHours!,
                            engine: {
                              ...editedMaintenanceSchedule.componentHours!.engine,
                              total: Number(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="engine-since">Since Overhaul</Label>
                      <Input
                        id="engine-since"
                        type="number"
                        value={editedMaintenanceSchedule.componentHours?.engine.sinceOverhaul}
                        onChange={(e) => setEditedMaintenanceSchedule({
                          ...editedMaintenanceSchedule,
                          componentHours: {
                            ...editedMaintenanceSchedule.componentHours!,
                            engine: {
                              ...editedMaintenanceSchedule.componentHours!.engine,
                              sinceOverhaul: Number(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="engine-next">Next Overhaul</Label>
                      <Input
                        id="engine-next"
                        type="number"
                        value={editedMaintenanceSchedule.componentHours?.engine.nextOverhaul}
                        onChange={(e) => setEditedMaintenanceSchedule({
                          ...editedMaintenanceSchedule,
                          componentHours: {
                            ...editedMaintenanceSchedule.componentHours!,
                            engine: {
                              ...editedMaintenanceSchedule.componentHours!.engine,
                              nextOverhaul: Number(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                  </div>

                  {/* Propeller Hours */}
                  <div className="space-y-4">
                    <h5 className="font-medium">Propeller</h5>
                    <div className="space-y-2.5">
                      <Label htmlFor="prop-total">Total Hours</Label>
                      <Input
                        id="prop-total"
                        type="number"
                        value={editedMaintenanceSchedule.componentHours?.propeller.total}
                        onChange={(e) => setEditedMaintenanceSchedule({
                          ...editedMaintenanceSchedule,
                          componentHours: {
                            ...editedMaintenanceSchedule.componentHours!,
                            propeller: {
                              ...editedMaintenanceSchedule.componentHours!.propeller,
                              total: Number(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="prop-since">Since Overhaul</Label>
                      <Input
                        id="prop-since"
                        type="number"
                        value={editedMaintenanceSchedule.componentHours?.propeller.sinceOverhaul}
                        onChange={(e) => setEditedMaintenanceSchedule({
                          ...editedMaintenanceSchedule,
                          componentHours: {
                            ...editedMaintenanceSchedule.componentHours!,
                            propeller: {
                              ...editedMaintenanceSchedule.componentHours!.propeller,
                              sinceOverhaul: Number(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="prop-next">Next Overhaul</Label>
                      <Input
                        id="prop-next"
                        type="number"
                        value={editedMaintenanceSchedule.componentHours?.propeller.nextOverhaul}
                        onChange={(e) => setEditedMaintenanceSchedule({
                          ...editedMaintenanceSchedule,
                          componentHours: {
                            ...editedMaintenanceSchedule.componentHours!,
                            propeller: {
                              ...editedMaintenanceSchedule.componentHours!.propeller,
                              nextOverhaul: Number(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                  </div>

                  {/* Landing Gear Hours */}
                  <div className="space-y-4">
                    <h5 className="font-medium">Landing Gear</h5>
                    <div className="space-y-2.5">
                      <Label htmlFor="gear-total">Total Hours</Label>
                      <Input
                        id="gear-total"
                        type="number"
                        value={editedMaintenanceSchedule.componentHours?.landingGear.total}
                        onChange={(e) => setEditedMaintenanceSchedule({
                          ...editedMaintenanceSchedule,
                          componentHours: {
                            ...editedMaintenanceSchedule.componentHours!,
                            landingGear: {
                              ...editedMaintenanceSchedule.componentHours!.landingGear,
                              total: Number(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="gear-since">Since Overhaul</Label>
                      <Input
                        id="gear-since"
                        type="number"
                        value={editedMaintenanceSchedule.componentHours?.landingGear.sinceOverhaul}
                        onChange={(e) => setEditedMaintenanceSchedule({
                          ...editedMaintenanceSchedule,
                          componentHours: {
                            ...editedMaintenanceSchedule.componentHours!,
                            landingGear: {
                              ...editedMaintenanceSchedule.componentHours!.landingGear,
                              sinceOverhaul: Number(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="gear-next">Next Overhaul</Label>
                      <Input
                        id="gear-next"
                        type="number"
                        value={editedMaintenanceSchedule.componentHours?.landingGear.nextOverhaul}
                        onChange={(e) => setEditedMaintenanceSchedule({
                          ...editedMaintenanceSchedule,
                          componentHours: {
                            ...editedMaintenanceSchedule.componentHours!,
                            landingGear: {
                              ...editedMaintenanceSchedule.componentHours!.landingGear,
                              nextOverhaul: Number(e.target.value)
                            }
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance Schedule */}
              <div>
                <h4 className="text-md font-semibold mb-4">Maintenance Schedule</h4>
                <div className="grid grid-cols-2 gap-6">
                  {/* Last Maintenance */}
                  <div>
                    <h5 className="font-medium mb-4">Last Maintenance</h5>
                    <div className="space-y-4">
                      <div className="space-y-2.5">
                        <Label htmlFor="last-annual">Annual</Label>
                        <Input
                          id="last-annual"
                          type="date"
                          value={editedMaintenanceSchedule.lastAnnual?.split('T')[0]}
                          onChange={(e) => setEditedMaintenanceSchedule({
                            ...editedMaintenanceSchedule,
                            lastAnnual: new Date(e.target.value).toISOString()
                          })}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="last-100">100-Hour</Label>
                        <Input
                          id="last-100"
                          type="date"
                          value={editedMaintenanceSchedule.last100Hour?.split('T')[0]}
                          onChange={(e) => setEditedMaintenanceSchedule({
                            ...editedMaintenanceSchedule,
                            last100Hour: new Date(e.target.value).toISOString()
                          })}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="last-oil">Oil Change</Label>
                        <Input
                          id="last-oil"
                          type="date"
                          value={editedMaintenanceSchedule.lastOilChange?.split('T')[0]}
                          onChange={(e) => setEditedMaintenanceSchedule({
                            ...editedMaintenanceSchedule,
                            lastOilChange: new Date(e.target.value).toISOString()
                          })}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="last-inspection">Inspection</Label>
                        <Input
                          id="last-inspection"
                          type="date"
                          value={editedMaintenanceSchedule.lastInspection?.split('T')[0]}
                          onChange={(e) => setEditedMaintenanceSchedule({
                            ...editedMaintenanceSchedule,
                            lastInspection: new Date(e.target.value).toISOString()
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Next Due */}
                  <div>
                    <h5 className="font-medium mb-4">Next Due</h5>
                    <div className="space-y-4">
                      <div className="space-y-2.5">
                        <Label htmlFor="next-annual">Annual</Label>
                        <Input
                          id="next-annual"
                          type="date"
                          value={editedMaintenanceSchedule.nextAnnual?.split('T')[0]}
                          onChange={(e) => setEditedMaintenanceSchedule({
                            ...editedMaintenanceSchedule,
                            nextAnnual: new Date(e.target.value).toISOString()
                          })}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="next-100">100-Hour</Label>
                        <Input
                          id="next-100"
                          type="date"
                          value={editedMaintenanceSchedule.next100Hour?.split('T')[0]}
                          onChange={(e) => setEditedMaintenanceSchedule({
                            ...editedMaintenanceSchedule,
                            next100Hour: new Date(e.target.value).toISOString()
                          })}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="next-oil">Oil Change</Label>
                        <Input
                          id="next-oil"
                          type="date"
                          value={editedMaintenanceSchedule.nextOilChange?.split('T')[0]}
                          onChange={(e) => setEditedMaintenanceSchedule({
                            ...editedMaintenanceSchedule,
                            nextOilChange: new Date(e.target.value).toISOString()
                          })}
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="next-inspection">Inspection</Label>
                        <Input
                          id="next-inspection"
                          type="date"
                          value={editedMaintenanceSchedule.nextInspection?.split('T')[0]}
                          onChange={(e) => setEditedMaintenanceSchedule({
                            ...editedMaintenanceSchedule,
                            nextInspection: new Date(e.target.value).toISOString()
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="px-6 pb-6">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsMaintenanceScheduleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleMaintenanceScheduleSubmit}>
                  Update Schedule
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
