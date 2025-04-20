"use client"

import { useState, useEffect } from "react"
import { Edit2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Aircraft {
  id: string
  registration: string
  type: string
  model: string
  year: number
  engineHours: number
  tach_time: number
  hopps_time: number
  lastMaintenance: string
  nextMaintenance: string
  status: string
  hourlyRates: {
    wet: number
    dry: number
    block: number
    instruction: number
    weekend: number
    solo: number
    checkride: number
  }
  specialRates: Array<{
    name: string
    discount: number
    description: string
    _id: string
  }>
  utilization: number
  location: string
  notes: string
}

export function SettingsAircraft() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteAircraftId, setDeleteAircraftId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingAircraft, setEditingAircraft] = useState<Aircraft | null>(null)
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false)
  const [newAircraft, setNewAircraft] = useState<Partial<Aircraft>>({
    registration: "",
    type: "",
    model: "",
    year: new Date().getFullYear(),
    engineHours: 0,
    tach_time: 0,
    hopps_time: 0,
    lastMaintenance: "",
    nextMaintenance: "",
    status: "Available",
    hourlyRates: {
      wet: 0,
      dry: 0,
      block: 0,
      instruction: 0,
      weekend: 0,
      solo: 0,
      checkride: 0
    },
    specialRates: [],
    utilization: 0,
    location: "",
    notes: ""
  })

  useEffect(() => {
    // Check user role from both localStorage and JWT token
    const token = localStorage.getItem("token")
    let userRole = localStorage.getItem("userRole") || localStorage.getItem("role")
    
    // If we have a token, try to decode it to get the role
    if (token) {
      try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        const payload = JSON.parse(jsonPayload)
        console.log("Role from JWT token:", payload.role)
        userRole = payload.role
      } catch (error) {
        console.error("Error decoding JWT token:", error)
      }
    }

    console.log("Final user role being used:", userRole)
    setIsSchoolAdmin(userRole === "school_admin" || userRole === "admin")
    
    fetchAircraft()
  }, [])

  const fetchAircraft = async () => {
    try {
      setLoading(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token) {
        toast.error("School ID or authentication token not found")
        return
      }

      if (!apiKey) {
        toast.error("API key is not configured")
        return
      }

      console.log("Fetching aircraft for school:", schoolId)
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes`,
        {
          method: "GET",
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
        throw new Error(`Failed to fetch aircraft: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Raw API response:", data)
      
      // Extract the planes array from the response
      const planesData = data.planes || []
      console.log("Extracted planes data:", planesData)
      
      // Validate each plane object
      const validPlanes = planesData.filter(plane => {
        const isValid = plane && typeof plane === 'object' && plane.id;
        if (!isValid) {
          console.warn("Invalid plane object:", plane);
        }
        return isValid;
      });
      
      console.log("Valid planes:", validPlanes);
      setAircraft(validPlanes)
    } catch (error) {
      console.error("Error fetching aircraft:", error)
      toast.error("Failed to fetch aircraft")
      setAircraft([])
    } finally {
      setLoading(false)
    }
  }

  // Filter aircraft based on search query
  const filteredAircraft = Array.isArray(aircraft) ? aircraft.filter((plane) => {
    if (!plane) return false;
    
    const searchLower = searchQuery.toLowerCase()
    return (
      (plane.registration && plane.registration.toLowerCase().includes(searchLower)) ||
      (plane.type && plane.type.toLowerCase().includes(searchLower)) ||
      (plane.model && plane.model.toLowerCase().includes(searchLower))
    )
  }) : []

  // Handle adding a new aircraft
  const handleAddAircraft = async () => {
    if (!isSchoolAdmin) {
      toast.error("You do not have permission to add aircraft")
      return
    }

    if (newAircraft.registration && newAircraft.type && newAircraft.model) {
      try {
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        const apiKey = process.env.NEXT_PUBLIC_API_KEY
        
        if (!schoolId || !token || !apiKey) {
          throw new Error("Missing required credentials")
        }

        console.log("Sending new aircraft data:", newAircraft)

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes`,
          {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "Authorization": `Bearer ${token}`,
              "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
            },
            body: JSON.stringify(newAircraft),
            credentials: "include"
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error response:", errorText)
          throw new Error(`Failed to add aircraft: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Add response:", data)

        // Handle both possible response formats
        const addedAircraft = data.plane || data
        console.log("Processed added aircraft:", addedAircraft)

        if (!addedAircraft || !addedAircraft.id) {
          throw new Error("Invalid response format from add endpoint")
        }

        // Add the new aircraft to the list
        setAircraft([...aircraft, addedAircraft])
        
        // Reset the form
        setNewAircraft({
          registration: "",
          type: "",
          model: "",
          year: new Date().getFullYear(),
          engineHours: 0,
          tach_time: 0,
          hopps_time: 0,
          lastMaintenance: "",
          nextMaintenance: "",
          status: "Available",
          hourlyRates: {
            wet: 0,
            dry: 0,
            block: 0,
            instruction: 0,
            weekend: 0,
            solo: 0,
            checkride: 0
          },
          specialRates: [],
          utilization: 0,
          location: "",
          notes: ""
        })
        
        setIsAddDialogOpen(false)
        toast.success("Aircraft added successfully")
        
        // Refresh the aircraft list to ensure we have the latest data
        fetchAircraft()
      } catch (error) {
        console.error("Error adding aircraft:", error)
        toast.error(error instanceof Error ? error.message : "Failed to add aircraft")
      }
    } else {
      toast.error("Please fill in all required fields (Registration, Type, and Model)")
    }
  }

  // Handle editing an aircraft
  const handleEditAircraft = async () => {
    if (!isSchoolAdmin) {
      toast.error("You do not have permission to update aircraft")
      return
    }

    if (editingAircraft && editingAircraft.registration && editingAircraft.type && editingAircraft.model) {
      try {
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        const apiKey = process.env.NEXT_PUBLIC_API_KEY
        
        if (!schoolId || !token || !apiKey) {
          throw new Error("Missing required credentials")
        }

        console.log("Sending update for aircraft:", editingAircraft)

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${editingAircraft.id}`,
          {
            method: "PUT",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "Authorization": `Bearer ${token}`,
              "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
            },
            body: JSON.stringify(editingAircraft),
            credentials: "include"
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error response:", errorText)
          throw new Error(`Failed to update aircraft: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Update response:", data)

        // Handle both possible response formats
        const updatedAircraft = data.plane || data
        console.log("Processed updated aircraft:", updatedAircraft)

        if (!updatedAircraft || !updatedAircraft.id) {
          throw new Error("Invalid response format from update endpoint")
        }

        // Update the aircraft list
        setAircraft(aircraft.map((plane) => 
          plane.id === updatedAircraft.id ? updatedAircraft : plane
        ))
        
        setIsEditDialogOpen(false)
        setEditingAircraft(null)
        toast.success("Aircraft updated successfully")
        
        // Refresh the aircraft list to ensure we have the latest data
        fetchAircraft()
      } catch (error) {
        console.error("Error updating aircraft:", error)
        toast.error(error instanceof Error ? error.message : "Failed to update aircraft")
      }
    }
  }

  // Handle deleting an aircraft
  const handleDeleteAircraft = async () => {
    if (!isSchoolAdmin) {
      toast.error("You do not have permission to delete aircraft")
      return
    }

    if (deleteAircraftId) {
      try {
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        const apiKey = process.env.NEXT_PUBLIC_API_KEY
        
        if (!schoolId || !token || !apiKey) {
          throw new Error("Missing required credentials")
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/planes/${deleteAircraftId}`,
          {
            method: "DELETE",
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
          throw new Error("Failed to delete aircraft")
        }

        setAircraft(aircraft.filter((plane) => plane.id !== deleteAircraftId))
        setIsDeleteDialogOpen(false)
        setDeleteAircraftId(null)
        toast.success("Aircraft deleted successfully")
      } catch (error) {
        console.error("Error deleting aircraft:", error)
        toast.error("Failed to delete aircraft")
      }
    }
  }

  // Start editing an aircraft
  const startEditAircraft = (plane: Aircraft) => {
    setEditingAircraft({ ...plane })
    setIsEditDialogOpen(true)
  }

  // Start deleting an aircraft
  const startDeleteAircraft = (id: string) => {
    setDeleteAircraftId(id)
    setIsDeleteDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Aircraft Management</CardTitle>
          <CardDescription>
            {isSchoolAdmin 
              ? "Add, edit, or remove aircraft from your fleet."
              : "View aircraft in your fleet."}
          </CardDescription>
        </div>
        {isSchoolAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Aircraft
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Aircraft</DialogTitle>
                <DialogDescription>Enter the details for the new aircraft.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-6 -mr-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="registration">Registration</Label>
                        <Input
                          id="registration"
                          value={newAircraft.registration}
                          onChange={(e) => setNewAircraft({ ...newAircraft, registration: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Input
                          id="type"
                          value={newAircraft.type}
                          onChange={(e) => setNewAircraft({ ...newAircraft, type: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="model">Model</Label>
                        <Input
                          id="model"
                          value={newAircraft.model}
                          onChange={(e) => setNewAircraft({ ...newAircraft, model: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Input
                          id="year"
                          type="number"
                          value={newAircraft.year}
                          onChange={(e) => setNewAircraft({ ...newAircraft, year: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={newAircraft.location}
                          onChange={(e) => setNewAircraft({ ...newAircraft, location: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status and Hours */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Status & Hours</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                          id="status"
                          value={newAircraft.status}
                          onChange={(e) => setNewAircraft({ ...newAircraft, status: e.target.value })}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="Available">Available</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Unavailable">Unavailable</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="engine-hours">Engine Hours</Label>
                        <Input
                          id="engine-hours"
                          type="number"
                          value={newAircraft.engineHours}
                          onChange={(e) => setNewAircraft({ ...newAircraft, engineHours: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tach-time">Tach Time</Label>
                        <Input
                          id="tach-time"
                          type="number"
                          value={newAircraft.tach_time}
                          onChange={(e) => setNewAircraft({ ...newAircraft, tach_time: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hopps-time">Hopps Time</Label>
                        <Input
                          id="hopps-time"
                          type="number"
                          value={newAircraft.hopps_time}
                          onChange={(e) => setNewAircraft({ ...newAircraft, hopps_time: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-maintenance">Last Maintenance</Label>
                        <Input
                          id="last-maintenance"
                          type="date"
                          value={newAircraft.lastMaintenance ? newAircraft.lastMaintenance.split('T')[0] : ''}
                          onChange={(e) => setNewAircraft({ ...newAircraft, lastMaintenance: e.target.value ? `${e.target.value}T00:00:00.000Z` : null })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="next-maintenance">Next Maintenance</Label>
                        <Input
                          id="next-maintenance"
                          type="date"
                          value={newAircraft.nextMaintenance ? newAircraft.nextMaintenance.split('T')[0] : ''}
                          onChange={(e) => setNewAircraft({ ...newAircraft, nextMaintenance: e.target.value ? `${e.target.value}T00:00:00.000Z` : null })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hourly Rates */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Hourly Rates</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="wet-rate">Wet Rate ($)</Label>
                        <Input
                          id="wet-rate"
                          type="number"
                          value={newAircraft.hourlyRates?.wet || 0}
                          onChange={(e) => setNewAircraft({ 
                            ...newAircraft, 
                            hourlyRates: { 
                              ...newAircraft.hourlyRates, 
                              wet: parseInt(e.target.value) || 0 
                            } 
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dry-rate">Dry Rate ($)</Label>
                        <Input
                          id="dry-rate"
                          type="number"
                          value={newAircraft.hourlyRates?.dry || 0}
                          onChange={(e) => setNewAircraft({ 
                            ...newAircraft, 
                            hourlyRates: { 
                              ...newAircraft.hourlyRates, 
                              dry: parseInt(e.target.value) || 0 
                            } 
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="block-rate">Block Rate ($)</Label>
                        <Input
                          id="block-rate"
                          type="number"
                          value={newAircraft.hourlyRates?.block || 0}
                          onChange={(e) => setNewAircraft({ 
                            ...newAircraft, 
                            hourlyRates: { 
                              ...newAircraft.hourlyRates, 
                              block: parseInt(e.target.value) || 0 
                            } 
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instruction-rate">Instruction Rate ($)</Label>
                        <Input
                          id="instruction-rate"
                          type="number"
                          value={newAircraft.hourlyRates?.instruction || 0}
                          onChange={(e) => setNewAircraft({ 
                            ...newAircraft, 
                            hourlyRates: { 
                              ...newAircraft.hourlyRates, 
                              instruction: parseInt(e.target.value) || 0 
                            } 
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weekend-rate">Weekend Rate ($)</Label>
                        <Input
                          id="weekend-rate"
                          type="number"
                          value={newAircraft.hourlyRates?.weekend || 0}
                          onChange={(e) => setNewAircraft({ 
                            ...newAircraft, 
                            hourlyRates: { 
                              ...newAircraft.hourlyRates, 
                              weekend: parseInt(e.target.value) || 0 
                            } 
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="solo-rate">Solo Rate ($)</Label>
                        <Input
                          id="solo-rate"
                          type="number"
                          value={newAircraft.hourlyRates?.solo || 0}
                          onChange={(e) => setNewAircraft({ 
                            ...newAircraft, 
                            hourlyRates: { 
                              ...newAircraft.hourlyRates, 
                              solo: parseInt(e.target.value) || 0 
                            } 
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkride-rate">Checkride Rate ($)</Label>
                        <Input
                          id="checkride-rate"
                          type="number"
                          value={newAircraft.hourlyRates?.checkride || 0}
                          onChange={(e) => setNewAircraft({ 
                            ...newAircraft, 
                            hourlyRates: { 
                              ...newAircraft.hourlyRates, 
                              checkride: parseInt(e.target.value) || 0 
                            } 
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Utilization */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Utilization</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="utilization">Utilization (%)</Label>
                        <Input
                          id="utilization"
                          type="number"
                          min="0"
                          max="100"
                          value={newAircraft.utilization}
                          onChange={(e) => setNewAircraft({ ...newAircraft, utilization: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Notes</h3>
                    <textarea
                      id="notes"
                      value={newAircraft.notes}
                      onChange={(e) => setNewAircraft({ ...newAircraft, notes: e.target.value })}
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAircraft}>Add Aircraft</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search aircraft by registration, type, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Registration</TableHead>
              <TableHead>Type/Model</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Engine Hours</TableHead>
              <TableHead>Next Maintenance</TableHead>
              <TableHead>Utilization</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredAircraft.length > 0 ? (
              filteredAircraft.map((plane) => (
                <TableRow key={plane.id}>
                  <TableCell className="font-medium">{plane.registration || 'N/A'}</TableCell>
                  <TableCell>{plane.type || 'N/A'} {plane.model || ''}</TableCell>
                  <TableCell>{plane.year || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={plane.status === "Available" ? "default" : "secondary"}>
                      {plane.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>{plane.engineHours || 0}</TableCell>
                  <TableCell>
                    {plane.nextMaintenance 
                      ? new Date(plane.nextMaintenance).toLocaleDateString() 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={plane.utilization || 0} className="w-[60px]" />
                      <span className="text-xs">{plane.utilization || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell>{plane.location || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isSchoolAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditAircraft(plane)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => startDeleteAircraft(plane.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No aircraft found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Edit Aircraft Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Aircraft</DialogTitle>
              <DialogDescription>Update the aircraft's information.</DialogDescription>
            </DialogHeader>
            {editingAircraft && (
              <div className="flex-1 overflow-y-auto pr-6 -mr-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-registration">Registration</Label>
                        <Input
                          id="edit-registration"
                          value={editingAircraft.registration}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, registration: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-type">Type</Label>
                        <Input
                          id="edit-type"
                          value={editingAircraft.type}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, type: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-model">Model</Label>
                        <Input
                          id="edit-model"
                          value={editingAircraft.model}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, model: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-year">Year</Label>
                        <Input
                          id="edit-year"
                          type="number"
                          value={editingAircraft.year}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, year: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status and Hours */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Status & Hours</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <select
                          id="edit-status"
                          value={editingAircraft.status}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, status: e.target.value })}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="Available">Available</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Unavailable">Unavailable</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-engine-hours">Engine Hours</Label>
                        <Input
                          id="edit-engine-hours"
                          type="number"
                          value={editingAircraft.engineHours}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, engineHours: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-tach-time">Tach Time</Label>
                        <Input
                          id="edit-tach-time"
                          type="number"
                          value={editingAircraft.tach_time}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, tach_time: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-hopps-time">Hopps Time</Label>
                        <Input
                          id="edit-hopps-time"
                          type="number"
                          value={editingAircraft.hopps_time}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, hopps_time: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-last-maintenance">Last Maintenance</Label>
                        <Input
                          id="edit-last-maintenance"
                          value={editingAircraft.lastMaintenance}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, lastMaintenance: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-next-maintenance">Next Maintenance</Label>
                        <Input
                          id="edit-next-maintenance"
                          value={editingAircraft.nextMaintenance}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, nextMaintenance: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Utilization */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Utilization</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-utilization">Utilization (%)</Label>
                        <Input
                          id="edit-utilization"
                          type="number"
                          min="0"
                          max="100"
                          value={editingAircraft.utilization}
                          onChange={(e) => setEditingAircraft({ ...editingAircraft, utilization: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Notes</h3>
                    <textarea
                      id="edit-notes"
                      value={editingAircraft.notes}
                      onChange={(e) => setEditingAircraft({ ...editingAircraft, notes: e.target.value })}
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditAircraft}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the aircraft from the system. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAircraft} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
