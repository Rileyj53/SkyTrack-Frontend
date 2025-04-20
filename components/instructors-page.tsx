"use client"

import { useState, useEffect } from "react"
import { Clock, Edit2, Save, User, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"

export function InstructorsPage() {
  const [instructors, setInstructors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editedRates, setEditedRates] = useState<Record<string, number>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch(`${process.env.API_URL}/auth/me`, {
          headers: {
            "x-api-key": process.env.API_KEY || "",
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

  useEffect(() => {
    fetchInstructors()
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

  // Start editing rates for an instructor
  const handleStartEdit = (id: number, rates: Record<string, number>) => {
    setEditingId(id)
    setEditedRates({ ...rates })
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null)
  }

  // Save edited rates
  const handleSaveRates = (id: number) => {
    setInstructors(instructors.map((i) => (i.id === id ? { ...i, hourlyRates: editedRates } : i)))
    setEditingId(null)
  }

  // Update rate during edit
  const handleRateChange = (rateType: string, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setEditedRates({
      ...editedRates,
      [rateType]: numValue,
    })
  }

  // Calculate active instructors
  const activeInstructors = instructors.filter((i) => i.status === "Active")

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

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader>
        <MainNav />
        <UserNav />
      </DashboardHeader>
      <DashboardShell>
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Flight Instructors</h1>
          <p className="text-muted-foreground">Manage instructor information, certifications, and hourly rates.</p>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Instructors</CardTitle>
                    <User className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{instructors.length}</div>
                    <p className="text-xs text-muted-foreground">{activeInstructors.length} active</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(activeInstructors.reduce((sum, i) => sum + i.utilization, 0) / activeInstructors.length)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
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
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{instructors.reduce((sum, i) => sum + i.students, 0)}</div>
                    <p className="text-xs text-muted-foreground">Currently enrolled</p>
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
                      $
                      {Math.round(
                        activeInstructors.reduce((sum, i) => sum + i.hourlyRates.primary, 0) / activeInstructors.length,
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Primary instruction</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Instructor Roster</CardTitle>
                  <CardDescription>View and manage all flight instructors at the school.</CardDescription>
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
                        <TableHead>Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Certifications</TableHead>
                        <TableHead>Flight Hours</TableHead>
                        <TableHead>Hourly Rates</TableHead>
                        <TableHead>Utilization</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredInstructors.length > 0 ? (
                        filteredInstructors.map((instructor) => (
                          <TableRow key={instructor.id}>
                            <TableCell>
                              <Badge variant={instructor.status === "Active" ? "success" : "secondary"}
                                className={`${
                                  instructor.status === "Active" 
                                    ? "bg-green-100 text-green-800" 
                                    : ""
                                }`}
                              >
                                {instructor.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>{instructor.name}</div>
                              <div className="text-xs text-muted-foreground">{instructor.email}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {instructor.certifications.map((cert) => (
                                  <Badge key={cert} variant="outline" className="text-xs">
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>{instructor.flightHours} hrs total</div>
                              <div className="text-xs text-muted-foreground">{instructor.teachingHours} hrs teaching</div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-xs">Primary: ${instructor.hourlyRates.primary.toFixed(2)}/hr</div>
                                <div className="text-xs">
                                  Instrument: ${instructor.hourlyRates.instrument.toFixed(2)}/hr
                                </div>
                                <div className="text-xs">Advanced: ${instructor.hourlyRates.advanced.toFixed(2)}/hr</div>
                                <div className="text-xs">
                                  Multi-Engine: ${instructor.hourlyRates.multiEngine.toFixed(2)}/hr
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={instructor.utilization} className="w-[60px]" />
                                <span className="text-xs">{instructor.utilization}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No instructors found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardShell>
    </div>
  )
}
