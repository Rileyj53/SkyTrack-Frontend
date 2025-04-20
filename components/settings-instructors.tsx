"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

export function SettingsInstructors() {
  const router = useRouter()
  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteInstructorId, setDeleteInstructorId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState<any>(null)
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false)
  const [newInstructor, setNewInstructor] = useState({
    name: "",
    email: "",
    phone: "",
    certifications: [] as string[],
    contact_email: "",
    license_number: "",
    emergency_contact: {
      name: "",
      relationship: "",
      phone: ""
    },
    specialties: [] as string[],
    status: "Active",
    hourlyRates: {
      primary: 0,
      instrument: 0,
      advanced: 0,
      multiEngine: 0
    },
    flightHours: 0,
    teachingHours: 0,
    availability: "Full-time",
    students: 0,
    utilization: 0,
    ratings: [] as string[],
    availability_time: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    },
    notes: "",
    documents: []
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    setLoading(false)
    fetchInstructors()
  }, [router])

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
    console.log("All localStorage items:", Object.keys(localStorage).map(key => `${key}: ${localStorage.getItem(key)}`))
    setIsSchoolAdmin(userRole === "school_admin" || userRole === "admin")
    console.log("isSchoolAdmin set to:", userRole === "school_admin" || userRole === "admin")
  }, [])

  const fetchInstructors = async () => {
    try {
      setLoading(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.API_KEY
      
      if (!schoolId || !token) {
        toast.error("School ID or authentication token not found")
        return
      }

      if (!apiKey) {
        toast.error("API key is not configured")
        return
      }

      const apiUrl = `${process.env.API_URL}/schools/${schoolId}/instructors`
      
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
        throw new Error(`Failed to fetch instructors: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (Array.isArray(data)) {
        // Transform the API data to match our component's expected format
        const transformedInstructors = data.map((instructor) => ({
          id: instructor._id,
          name: `${instructor.user_id.first_name} ${instructor.user_id.last_name}`,
          email: instructor.user_id.email,
          phone: instructor.phone,
          certifications: instructor.certifications,
          ratings: instructor.ratings,
          status: instructor.status,
          hourlyRates: instructor.hourlyRates,
          flightHours: instructor.flightHours,
          teachingHours: instructor.teachingHours,
          availability: instructor.availability,
          students: instructor.students,
          utilization: instructor.utilization,
          specialties: instructor.specialties,
          license_number: instructor.license_number,
          emergency_contact: instructor.emergency_contact,
          availability_time: instructor.availability_time,
          notes: instructor.notes,
          documents: instructor.documents
        }))
        setInstructors(transformedInstructors)
      } else {
        toast.error("Invalid data format received from API")
      }
    } catch (err) {
      console.error("Error fetching instructors:", err)
      toast.error(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Filter instructors based on search query
  const filteredInstructors = instructors.filter((instructor) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      instructor.name.toLowerCase().includes(searchLower) ||
      instructor.email.toLowerCase().includes(searchLower) ||
      instructor.phone.toLowerCase().includes(searchLower) ||
      instructor.certifications.some((cert: string) => cert.toLowerCase().includes(searchLower)) ||
      instructor.ratings.some((rating: string) => rating.toLowerCase().includes(searchLower)) ||
      instructor.specialties.some((specialty: string) => specialty.toLowerCase().includes(searchLower))
    )
  })

  // Handle adding a new instructor
  const handleAddInstructor = async () => {
    if (!isSchoolAdmin) {
      toast.error("You do not have permission to add instructors")
      return
    }

    if (newInstructor.name && newInstructor.email) {
      try {
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        const apiKey = process.env.API_KEY
        
        if (!schoolId || !token || !apiKey) {
          throw new Error("Missing required credentials")
        }

        const response = await fetch(
          `${process.env.API_URL}/schools/${schoolId}/instructors`,
          {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "Authorization": `Bearer ${token}`,
              "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
            },
            body: JSON.stringify(newInstructor),
            credentials: "include"
          }
        )

        if (!response.ok) {
          throw new Error("Failed to add instructor")
        }

        const addedInstructor = await response.json()
        setInstructors([...instructors, addedInstructor])
        setNewInstructor({
          name: "",
          email: "",
          phone: "",
          certifications: [],
          contact_email: "",
          license_number: "",
          emergency_contact: {
            name: "",
            relationship: "",
            phone: ""
          },
          specialties: [],
          status: "Active",
          hourlyRates: {
            primary: 0,
            instrument: 0,
            advanced: 0,
            multiEngine: 0
          },
          flightHours: 0,
          teachingHours: 0,
          availability: "Full-time",
          students: 0,
          utilization: 0,
          ratings: [],
          availability_time: {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: []
          },
          notes: "",
          documents: []
        })
        setIsAddDialogOpen(false)
        toast.success("Instructor added successfully")
      } catch (error) {
        console.error("Error adding instructor:", error)
        toast.error("Failed to add instructor")
      }
    }
  }

  // Handle editing an instructor
  const handleEditInstructor = async () => {
    if (!isSchoolAdmin) {
      toast.error("You do not have permission to update instructor information")
      return
    }

    if (editingInstructor && editingInstructor.name && editingInstructor.email) {
      try {
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        const apiKey = process.env.API_KEY
        
        if (!schoolId || !token || !apiKey) {
          throw new Error("Missing required credentials")
        }

        // Prepare the instructor data for the API
        const instructorData = {
          contact_email: editingInstructor.contact_email,
          phone: editingInstructor.phone,
          certifications: editingInstructor.certifications,
          license_number: editingInstructor.license_number,
          emergency_contact: editingInstructor.emergency_contact,
          specialties: editingInstructor.specialties,
          status: editingInstructor.status,
          hourlyRates: editingInstructor.hourlyRates,
          flightHours: editingInstructor.flightHours,
          teachingHours: editingInstructor.teachingHours,
          availability: editingInstructor.availability,
          students: editingInstructor.students,
          utilization: editingInstructor.utilization,
          ratings: editingInstructor.ratings,
          availability_time: editingInstructor.availability_time,
          notes: editingInstructor.notes,
          documents: editingInstructor.documents
        }

        const response = await fetch(
          `${process.env.API_URL}/schools/${schoolId}/instructors/${editingInstructor.id}`,
          {
            method: "PUT",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "Authorization": `Bearer ${token}`,
              "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
            },
            body: JSON.stringify(instructorData),
            credentials: "include"
          }
        )

        if (!response.ok) {
          throw new Error("Failed to update instructor")
        }

        const updatedInstructor = await response.json()
        setInstructors(instructors.map((instructor) => 
          instructor.id === editingInstructor.id ? updatedInstructor : instructor
        ))
        setIsEditDialogOpen(false)
        setEditingInstructor(null)
        toast.success("Instructor updated successfully")
      } catch (error) {
        console.error("Error updating instructor:", error)
        toast.error("Failed to update instructor")
      }
    }
  }

  // Handle deleting an instructor
  const handleDeleteInstructor = async () => {
    if (!isSchoolAdmin) {
      toast.error("You do not have permission to delete instructors")
      return
    }

    if (deleteInstructorId) {
      try {
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        const apiKey = process.env.API_KEY
        
        if (!schoolId || !token || !apiKey) {
          throw new Error("Missing required credentials")
        }

        const response = await fetch(
          `${process.env.API_URL}/schools/${schoolId}/instructors/${deleteInstructorId}`,
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
          throw new Error("Failed to delete instructor")
        }

        setInstructors(instructors.filter((instructor) => instructor.id !== deleteInstructorId))
        setIsDeleteDialogOpen(false)
        setDeleteInstructorId(null)
        toast.success("Instructor deleted successfully")
      } catch (error) {
        console.error("Error deleting instructor:", error)
        toast.error("Failed to delete instructor")
      }
    }
  }

  // Start editing an instructor
  const startEditInstructor = (instructor: any) => {
    // Create a deep copy of the instructor to avoid modifying the original
    const instructorCopy = JSON.parse(JSON.stringify(instructor))
    setEditingInstructor(instructorCopy)
    setIsEditDialogOpen(true)
  }

  // Start deleting an instructor
  const startDeleteInstructor = (id: number) => {
    setDeleteInstructorId(id)
    setIsDeleteDialogOpen(true)
  }

  // Handle certification selection
  const handleCertificationChange = (cert: string, isAdding: boolean, isNewInstructor = false) => {
    if (isNewInstructor) {
      if (isAdding) {
        setNewInstructor({
          ...newInstructor,
          certifications: [...newInstructor.certifications, cert],
        })
      } else {
        setNewInstructor({
          ...newInstructor,
          certifications: newInstructor.certifications.filter((c) => c !== cert),
        })
      }
    } else if (editingInstructor) {
      if (isAdding) {
        setEditingInstructor({
          ...editingInstructor,
          certifications: [...editingInstructor.certifications, cert],
        })
      } else {
        setEditingInstructor({
          ...editingInstructor,
          certifications: editingInstructor.certifications.filter((c: string) => c !== cert),
        })
      }
    }
  }

  // Handle rating selection
  const handleRatingChange = (rating: string, isAdding: boolean, isNewInstructor = false) => {
    if (isNewInstructor) {
      if (isAdding) {
        setNewInstructor({
          ...newInstructor,
          ratings: [...newInstructor.ratings, rating],
        })
      } else {
        setNewInstructor({
          ...newInstructor,
          ratings: newInstructor.ratings.filter((r) => r !== rating),
        })
      }
    } else if (editingInstructor) {
      if (isAdding) {
        setEditingInstructor({
          ...editingInstructor,
          ratings: [...editingInstructor.ratings, rating],
        })
      } else {
        setEditingInstructor({
          ...editingInstructor,
          ratings: editingInstructor.ratings.filter((r: string) => r !== rating),
        })
      }
    }
  }

  // Handle specialty selection
  const handleSpecialtyChange = (specialty: string, isAdding: boolean, isNewInstructor = false) => {
    if (isNewInstructor) {
      if (isAdding) {
        setNewInstructor({
          ...newInstructor,
          specialties: [...newInstructor.specialties, specialty],
        })
      } else {
        setNewInstructor({
          ...newInstructor,
          specialties: newInstructor.specialties.filter((s) => s !== specialty),
        })
      }
    } else if (editingInstructor) {
      if (isAdding) {
        setEditingInstructor({
          ...editingInstructor,
          specialties: [...editingInstructor.specialties, specialty],
        })
      } else {
        setEditingInstructor({
          ...editingInstructor,
          specialties: editingInstructor.specialties.filter((s: string) => s !== specialty),
        })
      }
    }
  }

  // Handle hourly rate change
  const handleHourlyRateChange = (rateType: string, value: string, isNewInstructor = false) => {
    const numValue = Number.parseFloat(value) || 0
    if (isNewInstructor) {
      setNewInstructor({
        ...newInstructor,
        hourlyRates: {
          ...newInstructor.hourlyRates,
          [rateType]: numValue
        }
      })
    } else if (editingInstructor) {
      setEditingInstructor({
        ...editingInstructor,
        hourlyRates: {
          ...editingInstructor.hourlyRates,
          [rateType]: numValue
        }
      })
    }
  }

  // Handle emergency contact change
  const handleEmergencyContactChange = (field: string, value: string, isNewInstructor = false) => {
    if (isNewInstructor) {
      setNewInstructor({
        ...newInstructor,
        emergency_contact: {
          ...newInstructor.emergency_contact,
          [field]: value
        }
      })
    } else if (editingInstructor) {
      setEditingInstructor({
        ...editingInstructor,
        emergency_contact: {
          ...editingInstructor.emergency_contact,
          [field]: value
        }
      })
    }
  }

  // Handle availability time change
  const handleAvailabilityTimeChange = (day: string, value: string, isNewInstructor = false) => {
    // Parse the time range (e.g., "09:00-17:00")
    const timeRanges = value.split(',').map(range => range.trim())
    
    if (isNewInstructor) {
      setNewInstructor({
        ...newInstructor,
        availability_time: {
          ...newInstructor.availability_time,
          [day]: timeRanges
        }
      })
    } else if (editingInstructor) {
      setEditingInstructor({
        ...editingInstructor,
        availability_time: {
          ...editingInstructor.availability_time,
          [day]: timeRanges
        }
      })
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Instructor Management</CardTitle>
          <CardDescription>
            {isSchoolAdmin 
              ? "Add, edit, or remove flight instructors from your school."
              : "View flight instructors in your school."}
          </CardDescription>
        </div>
        {isSchoolAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Instructor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Instructor</DialogTitle>
                <DialogDescription>Enter the details for the new instructor.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-6 -mr-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={newInstructor.name}
                          onChange={(e) => setNewInstructor({ ...newInstructor, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newInstructor.email}
                          onChange={(e) => setNewInstructor({ ...newInstructor, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Contact Email</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={newInstructor.contact_email}
                          onChange={(e) => setNewInstructor({ ...newInstructor, contact_email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={newInstructor.phone}
                          onChange={(e) => setNewInstructor({ ...newInstructor, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="license-number">License Number</Label>
                        <Input
                          id="license-number"
                          value={newInstructor.license_number}
                          onChange={(e) => setNewInstructor({ ...newInstructor, license_number: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Certifications and Ratings */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Certifications & Ratings</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Certifications</Label>
                        <div className="flex flex-wrap gap-2">
                          {["private", "instrument", "commercial", "cfi"].map((cert) => (
                            <Badge
                              key={cert}
                              variant={newInstructor.certifications.includes(cert) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() =>
                                handleCertificationChange(cert, !newInstructor.certifications.includes(cert), true)
                              }
                            >
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Ratings</Label>
                        <div className="flex flex-wrap gap-2">
                          {["CFI", "CFII", "MEI", "ATP"].map((rating) => (
                            <Badge
                              key={rating}
                              variant={newInstructor.ratings.includes(rating) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() =>
                                handleRatingChange(rating, !newInstructor.ratings.includes(rating), true)
                              }
                            >
                              {rating}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {["instrument", "multi-engine", "tailwheel", "acrobatic", "seaplane"].map((specialty) => (
                        <Badge
                          key={specialty}
                          variant={newInstructor.specialties.includes(specialty) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() =>
                            handleSpecialtyChange(specialty, !newInstructor.specialties.includes(specialty), true)
                          }
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Status and Availability */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Status & Availability</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <select
                          id="status"
                          value={newInstructor.status}
                          onChange={(e) => setNewInstructor({ ...newInstructor, status: e.target.value })}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="On Leave">On Leave</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="availability">Availability</Label>
                        <select
                          id="availability"
                          value={newInstructor.availability}
                          onChange={(e) => setNewInstructor({ ...newInstructor, availability: e.target.value })}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Weekends Only">Weekends Only</option>
                          <option value="Evenings Only">Evenings Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Hours and Students */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Hours & Students</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="flight-hours">Flight Hours</Label>
                        <Input
                          id="flight-hours"
                          type="number"
                          value={newInstructor.flightHours}
                          onChange={(e) => setNewInstructor({ ...newInstructor, flightHours: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="teaching-hours">Teaching Hours</Label>
                        <Input
                          id="teaching-hours"
                          type="number"
                          value={newInstructor.teachingHours}
                          onChange={(e) => setNewInstructor({ ...newInstructor, teachingHours: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="students">Students</Label>
                        <Input
                          id="students"
                          type="number"
                          value={newInstructor.students}
                          onChange={(e) => setNewInstructor({ ...newInstructor, students: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="utilization">Utilization (%)</Label>
                        <Input
                          id="utilization"
                          type="number"
                          min="0"
                          max="100"
                          value={newInstructor.utilization}
                          onChange={(e) => setNewInstructor({ ...newInstructor, utilization: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hourly Rates */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Hourly Rates</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-rate">Primary</Label>
                        <Input
                          id="primary-rate"
                          type="number"
                          value={newInstructor.hourlyRates.primary}
                          onChange={(e) => handleHourlyRateChange("primary", e.target.value, true)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="instrument-rate">Instrument</Label>
                        <Input
                          id="instrument-rate"
                          type="number"
                          value={newInstructor.hourlyRates.instrument}
                          onChange={(e) => handleHourlyRateChange("instrument", e.target.value, true)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="advanced-rate">Advanced</Label>
                        <Input
                          id="advanced-rate"
                          type="number"
                          value={newInstructor.hourlyRates.advanced}
                          onChange={(e) => handleHourlyRateChange("advanced", e.target.value, true)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="multi-engine-rate">Multi-Engine</Label>
                        <Input
                          id="multi-engine-rate"
                          type="number"
                          value={newInstructor.hourlyRates.multiEngine}
                          onChange={(e) => handleHourlyRateChange("multiEngine", e.target.value, true)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency-name">Name</Label>
                        <Input
                          id="emergency-name"
                          value={newInstructor.emergency_contact.name}
                          onChange={(e) => handleEmergencyContactChange("name", e.target.value, true)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency-relationship">Relationship</Label>
                        <Input
                          id="emergency-relationship"
                          value={newInstructor.emergency_contact.relationship}
                          onChange={(e) => handleEmergencyContactChange("relationship", e.target.value, true)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency-phone">Phone</Label>
                        <Input
                          id="emergency-phone"
                          value={newInstructor.emergency_contact.phone}
                          onChange={(e) => handleEmergencyContactChange("phone", e.target.value, true)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Notes</h3>
                    <textarea
                      id="notes"
                      value={newInstructor.notes}
                      onChange={(e) => setNewInstructor({ ...newInstructor, notes: e.target.value })}
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddInstructor}>Add Instructor</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search instructors by name, email, phone, certifications, ratings, or specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Certifications</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Flight Hours</TableHead>
              <TableHead>Teaching Hours</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Utilization</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredInstructors.length > 0 ? (
              filteredInstructors.map((instructor) => (
                <TableRow key={instructor.id}>
                  <TableCell className="font-medium">{instructor.name}</TableCell>
                  <TableCell>{instructor.email}</TableCell>
                  <TableCell>{instructor.phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {instructor.certifications.map((cert) => (
                        <Badge key={cert} variant="outline">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={instructor.status === "Active" ? "default" : "secondary"}>
                      {instructor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{instructor.flightHours}</TableCell>
                  <TableCell>{instructor.teachingHours}</TableCell>
                  <TableCell>{instructor.students}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={instructor.utilization} className="w-[60px]" />
                      <span className="text-xs">{instructor.utilization}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isSchoolAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditInstructor(instructor)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => startDeleteInstructor(instructor.id)}
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
                <TableCell colSpan={10} className="h-24 text-center">
                  No instructors found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Edit Instructor Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Instructor</DialogTitle>
              <DialogDescription>Update the instructor's information.</DialogDescription>
            </DialogHeader>
            {editingInstructor && (
              <div className="flex-1 overflow-y-auto pr-6 -mr-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                          id="edit-name"
                          value={editingInstructor.name}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={editingInstructor.email}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-contact-email">Contact Email</Label>
                        <Input
                          id="edit-contact-email"
                          type="email"
                          value={editingInstructor.contact_email}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, contact_email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          value={editingInstructor.phone}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-license-number">License Number</Label>
                        <Input
                          id="edit-license-number"
                          value={editingInstructor.license_number}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, license_number: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Certifications and Ratings */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Certifications & Ratings</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Certifications</Label>
                        <div className="flex flex-wrap gap-2">
                          {["private", "instrument", "commercial", "cfi"].map((cert) => (
                            <Badge
                              key={cert}
                              variant={editingInstructor.certifications.includes(cert) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() =>
                                handleCertificationChange(cert, !editingInstructor.certifications.includes(cert))
                              }
                            >
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Ratings</Label>
                        <div className="flex flex-wrap gap-2">
                          {["CFI", "CFII", "MEI", "ATP"].map((rating) => (
                            <Badge
                              key={rating}
                              variant={editingInstructor.ratings.includes(rating) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() =>
                                handleRatingChange(rating, !editingInstructor.ratings.includes(rating))
                              }
                            >
                              {rating}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {["instrument", "multi-engine", "tailwheel", "acrobatic", "seaplane"].map((specialty) => (
                        <Badge
                          key={specialty}
                          variant={editingInstructor.specialties.includes(specialty) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() =>
                            handleSpecialtyChange(specialty, !editingInstructor.specialties.includes(specialty))
                          }
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Status and Availability */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Status & Availability</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <select
                          id="edit-status"
                          value={editingInstructor.status}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, status: e.target.value })}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="On Leave">On Leave</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-availability">Availability</Label>
                        <select
                          id="edit-availability"
                          value={editingInstructor.availability}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, availability: e.target.value })}
                          className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Weekends Only">Weekends Only</option>
                          <option value="Evenings Only">Evenings Only</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Hours and Students */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Hours & Students</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-flight-hours">Flight Hours</Label>
                        <Input
                          id="edit-flight-hours"
                          type="number"
                          value={editingInstructor.flightHours}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, flightHours: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-teaching-hours">Teaching Hours</Label>
                        <Input
                          id="edit-teaching-hours"
                          type="number"
                          value={editingInstructor.teachingHours}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, teachingHours: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-students">Students</Label>
                        <Input
                          id="edit-students"
                          type="number"
                          value={editingInstructor.students}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, students: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-utilization">Utilization (%)</Label>
                        <Input
                          id="edit-utilization"
                          type="number"
                          min="0"
                          max="100"
                          value={editingInstructor.utilization}
                          onChange={(e) => setEditingInstructor({ ...editingInstructor, utilization: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hourly Rates */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Hourly Rates</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-primary-rate">Primary</Label>
                        <Input
                          id="edit-primary-rate"
                          type="number"
                          value={editingInstructor.hourlyRates.primary}
                          onChange={(e) => handleHourlyRateChange("primary", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-instrument-rate">Instrument</Label>
                        <Input
                          id="edit-instrument-rate"
                          type="number"
                          value={editingInstructor.hourlyRates.instrument}
                          onChange={(e) => handleHourlyRateChange("instrument", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-advanced-rate">Advanced</Label>
                        <Input
                          id="edit-advanced-rate"
                          type="number"
                          value={editingInstructor.hourlyRates.advanced}
                          onChange={(e) => handleHourlyRateChange("advanced", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-multi-engine-rate">Multi-Engine</Label>
                        <Input
                          id="edit-multi-engine-rate"
                          type="number"
                          value={editingInstructor.hourlyRates.multiEngine}
                          onChange={(e) => handleHourlyRateChange("multiEngine", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-emergency-name">Name</Label>
                        <Input
                          id="edit-emergency-name"
                          value={editingInstructor.emergency_contact.name}
                          onChange={(e) => handleEmergencyContactChange("name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-emergency-relationship">Relationship</Label>
                        <Input
                          id="edit-emergency-relationship"
                          value={editingInstructor.emergency_contact.relationship}
                          onChange={(e) => handleEmergencyContactChange("relationship", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-emergency-phone">Phone</Label>
                        <Input
                          id="edit-emergency-phone"
                          value={editingInstructor.emergency_contact.phone}
                          onChange={(e) => handleEmergencyContactChange("phone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Notes</h3>
                    <textarea
                      id="edit-notes"
                      value={editingInstructor.notes}
                      onChange={(e) => setEditingInstructor({ ...editingInstructor, notes: e.target.value })}
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
              <Button onClick={handleEditInstructor}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the instructor from the system. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteInstructor} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
