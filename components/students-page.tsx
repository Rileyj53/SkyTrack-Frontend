"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, Download, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Input } from "@/components/ui/input"
import { MainNav } from "@/components/main-nav"
import { Progress } from "@/components/ui/progress"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { UserNav } from "@/components/user-nav"
import { Loading } from "@/components/ui/loading"
import { toast } from "sonner"

interface Student {
  _id: string
  school_id: string
  user_id: {
    _id: string
    email: string
    first_name: string
    last_name: string
    role: string
  }
  contact_email: string
  phone: string
  certifications: string[]
  license_number: string
  emergency_contact: {
    name: string
    relationship: string
    phone: string
  }
  enrollmentDate: string
  program: string
  status: string
  stage: string
  nextMilestone: string
  notes: string
  progress: {
    requirements: Array<{
      name: string
      total_hours: number
      completed_hours: number
      type: string
      _id: string
    }>
    milestones: Array<{
      name: string
      description: string
      order: number
      completed: boolean
      _id: string
    }>
    stages: Array<{
      name: string
      description: string
      order: number
      completed: boolean
      _id: string
    }>
    lastUpdated: string
  }
  studentNotes: any[]
  created_at: string
  updated_at: string
}

interface Program {
  _id: string
  program_name: string
  school_id: string
  requirements: Array<{
    name: string
    hours: number
    type: string
    _id: string
  }>
  milestones: Array<{
    name: string
    description: string
    order: number
    _id: string
  }>
  stages: Array<{
    name: string
    description: string
    order: number
    _id: string
  }>
  description: string
  duration: string
  cost: number
  created_at: string
  updated_at: string
}

export function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([
    { 
      _id: 'default-1', 
      program_name: 'Private Pilot License',
      school_id: '',
      requirements: [],
      milestones: [],
      stages: [],
      description: 'Complete training program for obtaining a Private Pilot License',
      duration: '6 months',
      cost: 12000,
      created_at: '',
      updated_at: ''
    },
    { 
      _id: 'default-2', 
      program_name: 'Instrument Rating',
      school_id: '',
      requirements: [],
      milestones: [],
      stages: [],
      description: 'Comprehensive training program for obtaining an Instrument Rating',
      duration: '4 months',
      cost: 15000,
      created_at: '',
      updated_at: ''
    },
    { 
      _id: 'default-3', 
      program_name: 'Commercial Pilot License',
      school_id: '',
      requirements: [],
      milestones: [],
      stages: [],
      description: 'Advanced training program for obtaining a Commercial Pilot License',
      duration: '12 months',
      cost: 25000,
      created_at: '',
      updated_at: ''
    }
  ])
  const [loading, setLoading] = useState(true)
  const [programsLoading, setProgramsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [programFilter, setProgramFilter] = useState<string>("all")
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [newStudent, setNewStudent] = useState({
    contact_email: "",
    program: ""
  })

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
        
        // Store the school ID in localStorage for other components to use
        if (data.user && data.user.school_id) {
          localStorage.setItem("schoolId", data.user.school_id)
        }

        // Get user role from JWT token
        if (token) {
          try {
            const base64Url = token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            }).join(''))
            const payload = JSON.parse(jsonPayload)
            setUserRole(payload.role)
          } catch (err) {
            console.error('Error decoding token:', err)
          }
        }

        await fetchStudents()
        await fetchPrograms()
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  // Add effect to refresh data when returning to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Only refresh if page becomes visible and we have existing data
      if (!document.hidden && !loading && students.length > 0) {
        fetchStudents()
      }
    }

    // Listen for page visibility changes (better than focus for tab switching)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [loading, students.length])

  // Also add a way to manually refresh data (useful for debugging)
  const refreshStudents = () => {
    fetchStudents()
  }

  // Helper function to get the current stage from progress data
  const getCurrentStage = (student: Student): string => {
    if (!student.progress?.stages?.length) {
      return student.stage || 'Not Set'
    }

    // Find the highest completed stage or the first incomplete stage
    const sortedStages = [...student.progress.stages].sort((a, b) => a.order - b.order)
    
    // Find the last completed stage
    let currentStage = sortedStages.find(stage => !stage.completed)
    
    // If all stages are completed, return the last stage
    if (!currentStage) {
      currentStage = sortedStages[sortedStages.length - 1]
    }
    
    return currentStage?.name || student.stage || 'Not Set'
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students`,
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

      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()
      setStudents(data.students || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students')
      toast.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const fetchPrograms = async () => {
    try {
      setProgramsLoading(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        console.log('Missing schoolId or token for fetching programs')
        return // Keep default programs
      }

      console.log('Fetching programs for school:', schoolId)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/programs`,
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

      console.log('Programs API response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Programs API response data:', data)
        
        // Handle different possible response structures
        const programsArray = Array.isArray(data) ? data : (data.programs || [])
        console.log('Extracted programs array:', programsArray)
        
        // Only update programs if we got valid data from API
        if (programsArray.length > 0) {
          setPrograms(programsArray)
          console.log('Successfully loaded programs from API')
        } else {
          console.log('API returned empty programs, keeping defaults')
        }
      } else {
        console.error('Failed to fetch programs:', response.status, response.statusText)
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('Error response:', errorText)
        console.log('Keeping default programs due to API error')
      }
    } catch (err) {
      console.error('Error fetching programs:', err)
      console.log('Keeping default programs due to fetch error')
    } finally {
      setProgramsLoading(false)
    }
  }

  const calculateProgress = (student: Student): number => {
    if (!student.progress?.requirements?.length) return 0
    
    // Find the "Total Flight Time" requirement for overall progress
    const totalFlightTime = student.progress.requirements.find(req => req.name === "Total Flight Time")
    if (!totalFlightTime || totalFlightTime.total_hours === 0) return 0
    
    return Math.min(Math.round((totalFlightTime.completed_hours / totalFlightTime.total_hours) * 100), 100)
  }

  const calculateFlightHours = (student: Student): number => {
    if (!student.progress?.requirements?.length) return 0
    
    const totalHoursReq = student.progress.requirements.find(req => req.name === "Total Flight Time")
    return totalHoursReq?.completed_hours || 0
  }

  const handleAddStudent = async () => {
    try {
      // Validate required fields
      if (!newStudent.contact_email || !newStudent.program) {
        toast.error("Please fill in all required fields")
        return
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newStudent.contact_email)) {
        toast.error("Please enter a valid email address")
        return
      }

      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students/invite`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify({
            email: newStudent.contact_email,
            program: newStudent.program
          }),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to send student invitation')
      }

      await fetchStudents()
      setIsAddingStudent(false)
      setNewStudent({ contact_email: "", program: "" })
      toast.success("Student invitation sent successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send student invitation')
    }
  }

  // Filter students based on search query and filters
  const filteredStudents = students.filter((student) => {
    const matchesSearch = 
      (student.user_id ? `${student.user_id.first_name} ${student.user_id.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (student.program || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.nextMilestone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.license_number || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || student.status === statusFilter
    const matchesProgram = programFilter === "all" || student.program === programFilter
    const currentStage = getCurrentStage(student)
    const matchesStage = stageFilter === "all" || currentStage === stageFilter

    return matchesSearch && matchesStatus && matchesProgram && matchesStage
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Active":
        return "default"
      case "On Hold":
        return "secondary"
      case "Graduated":
        return "outline"
      case "Withdrawn":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Active":
        return { backgroundColor: '#c2f0c2', color: 'black', border: '1px solid #99e699' }
      case "Graduated":
        return { backgroundColor: '#b3c6ff', color: 'black', border: '1px solid #809fff' }
      case "On Hold":
        return { backgroundColor: '#f0b3ff', color: 'black', border: '1px solid #e580ff' }
      case "Withdrawn":
      case "Discontinued":
        return { backgroundColor: '#fc9c9c', color: 'black', border: '1px solid #fb6a6a' }
      default:
        return { backgroundColor: '#fbfbb6', color: 'black', border: '1px solid #f9f986' }
    }
  }

  const uniqueStatuses = [...new Set(students.map(s => s.status))]
  const uniquePrograms = [...new Set(students.map(s => s.program))]
  const uniqueStages = [...new Set(students.map(s => getCurrentStage(s)))]

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader>
          <MainNav />
          <UserNav />
        </DashboardHeader>
        <DashboardShell>
          <Loading />
        </DashboardShell>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader>
          <MainNav />
          <UserNav />
        </DashboardHeader>
        <DashboardShell>
          <div className="flex flex-col space-y-4">
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <Card>
              <CardContent className="pt-6">
                <p style={{ color: '#f90606' }}>Error: {error}</p>
              </CardContent>
            </Card>
          </div>
        </DashboardShell>
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
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Students</h1>
              <p className="text-muted-foreground">
                Manage student records, track progress, and monitor training requirements.
              </p>
            </div>
            {(userRole === 'school_admin' || userRole === 'sys_admin') && (
              <Dialog open={isAddingStudent} onOpenChange={(open) => {
                setIsAddingStudent(open)
                if (open) {
                  // Try to fetch programs when dialog opens (but we have defaults as fallback)
                  fetchPrograms()
                }
              }}>
                <DialogTrigger asChild>
                  <Button style={{ backgroundColor: '#3366ff', color: 'white' }} className="hover:opacity-90 transition-opacity">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>
                      Enter the student's email and program to create their account.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@example.com"
                        value={newStudent.contact_email}
                        onChange={(e) => setNewStudent({ ...newStudent, contact_email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="program">Program</Label>
                      <Select 
                        value={newStudent.program} 
                        onValueChange={(value) => setNewStudent({ ...newStudent, program: value })}
                        disabled={programsLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={programsLoading ? "Loading programs..." : "Select a program"} />
                        </SelectTrigger>
                        <SelectContent>
                          {programsLoading ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading programs...</div>
                          ) : (
                            programs.map((program) => (
                              <SelectItem key={program._id} value={program.program_name}>
                                {program.program_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddingStudent(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddStudent} style={{ backgroundColor: '#3366ff', color: 'white' }} className="hover:opacity-90 transition-opacity">
                      Add Student
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card style={{ borderLeftColor: '#3366ff' }} className="border-l-4 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle style={{ color: '#3366ff' }} className="text-sm font-medium dark:opacity-80">Total Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ color: '#3366ff' }} className="text-2xl font-bold dark:opacity-70">{students.length}</div>
              </CardContent>
            </Card>
            <Card style={{ borderLeftColor: '#33cc33' }} className="border-l-4 bg-gradient-to-r from-green-50 to-white dark:from-green-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle style={{ color: '#33cc33' }} className="text-sm font-medium dark:opacity-80">Active Students</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ color: '#33cc33' }} className="text-2xl font-bold dark:opacity-70">
                  {students.filter(s => s.status === 'Active').length}
                </div>
              </CardContent>
            </Card>
            <Card style={{ borderLeftColor: '#ff9900' }} className="border-l-4 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle style={{ color: '#ff9900' }} className="text-sm font-medium dark:opacity-80">Pre-Solo</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ color: '#ff9900' }} className="text-2xl font-bold dark:opacity-70">
                  {students.filter(s => getCurrentStage(s) === 'Pre-Solo').length}
                </div>
              </CardContent>
            </Card>
            <Card style={{ borderLeftColor: '#cc00ff' }} className="border-l-4 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle style={{ color: '#cc00ff' }} className="text-sm font-medium dark:opacity-80">Graduates This Year</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ color: '#cc00ff' }} className="text-2xl font-bold dark:opacity-70">
                  {students.filter(s => s.status === 'Graduated').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card style={{ borderTopColor: '#d5d5dd' }} className="border-t-4 dark:border-t-slate-600">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-background">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div className="flex flex-1 items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ '--tw-ring-color': '#3366ff' } as any}
                      className="pl-8 max-w-sm border-slate-200 focus:border-[#3366ff] dark:border-slate-700 dark:focus:border-[#3366ff]"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] border-slate-200 focus:border-[#3366ff] dark:border-slate-700 dark:focus:border-[#3366ff]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {uniqueStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={programFilter} onValueChange={setProgramFilter}>
                    <SelectTrigger className="w-[160px] border-slate-200 focus:border-[#3366ff] dark:border-slate-700 dark:focus:border-[#3366ff]">
                      <SelectValue placeholder="Program" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programs.map(program => (
                        <SelectItem key={program._id} value={program.program_name}>{program.program_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={stageFilter} onValueChange={setStageFilter}>
                    <SelectTrigger className="w-[140px] border-slate-200 focus:border-[#3366ff] dark:border-slate-700 dark:focus:border-[#3366ff]">
                      <SelectValue placeholder="Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      {uniqueStages.map(stage => (
                        <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-200 dark:border-slate-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Student</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">License #</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Program</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Stage</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Progress</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Flight Hours</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Next Milestone</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                          No students found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow 
                          key={student._id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => router.push(`/students/${student._id}`)}
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="font-medium">
                                {student.user_id 
                                  ? `${student.user_id.first_name} ${student.user_id.last_name}`
                                  : 'Unknown'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {student.user_id?.email || student.contact_email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {student.license_number || 'N/A'}
                          </TableCell>
                          <TableCell>{student.program}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{getCurrentStage(student)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={calculateProgress(student)} className="w-[60px]" />
                              <span className="text-xs text-muted-foreground">
                                {calculateProgress(student)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">
                            {calculateFlightHours(student).toFixed(1)}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {student.nextMilestone}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(student.status)} style={getStatusBadgeStyle(student.status)}>
                              {student.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </div>
  )
}
