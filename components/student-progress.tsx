"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Plus, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface Student {
  _id: string
  user_id?: {
    _id: string
    email: string
    first_name: string
    last_name: string
    role: string
  }
  contact_email: string
  program: string
  status: string
  stage: string
  nextMilestone: string
  progress: {
    requirements: {
      name: string
      total_hours: number
      completed_hours: number
      _id: string
    }[]
    lastUpdated: string
  }
}

interface Program {
  _id: string
  program_name: string
  requirements: {
    name: string
    hours: number
    _id: string
  }[]
  description: string
  duration: string
  cost: number
}

interface StudentProgressProps {
  className?: string
  fullView?: boolean
}

export function StudentProgress({ className, fullView = false }: StudentProgressProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [newStudent, setNewStudent] = useState({
    contact_email: "",
    program: ""
  })

  useEffect(() => {
    // Get user role from JWT token
    const token = localStorage.getItem("token")
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
  }, [])

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        
        if (!schoolId || !token) {
          throw new Error("School ID or authentication token not found")
        }

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
        
        if (!response.ok) {
          throw new Error('Failed to fetch programs')
        }

        const data = await response.json()
        setPrograms(data.programs || [])
      } catch (err) {
        console.error('Error fetching programs:', err)
      }
    }

    fetchPrograms()
  }, [])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        setError(null)
        
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
        setStudents(data.students || []) // Extract the students array from the response
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  // Calculate progress based on Total Flight Time only
  const calculateProgress = (student: Student) => {
    const totalFlightTime = student.progress.requirements.find(req => req.name === "Total Flight Time")
    if (!totalFlightTime) return 0
    
    return Math.min(Math.round((totalFlightTime.completed_hours / totalFlightTime.total_hours) * 100), 100)
  }

  // Calculate total flight hours for a student
  const calculateFlightHours = (student: Student) => {
    const totalFlightTime = student.progress.requirements.find(req => req.name === "Total Flight Time")
    return totalFlightTime?.completed_hours || 0
  }

  // Filter students based on search query
  const filteredStudents = students.filter(
    (student) =>
      (student.user_id ? `${student.user_id.first_name} ${student.user_id.last_name}`.toLowerCase() : '').includes(searchQuery.toLowerCase()) ||
      (student.program || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.nextMilestone || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Display only the first 3 students if not in full view
  const displayedStudents = fullView ? filteredStudents : filteredStudents.slice(0, 3)

  const handleAddStudent = async () => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(newStudent),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to add student')
      }

      // Refresh the student list
      const fetchStudents = async () => {
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
      }

      await fetchStudents()
      setIsAddingStudent(false)
      setNewStudent({ contact_email: "", program: "" })
      toast.success("Student added successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add student')
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>Loading student data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>Unable to load student data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20">
              <svg className="h-8 w-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load students</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                There was an error loading student data. Please try refreshing the page.
              </p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Student Progress</CardTitle>
          <CardDescription>
            {fullView ? "Complete student progress tracking" : "Overview of student training progress"}
          </CardDescription>
        </div>
        {userRole === 'school_admin' && pathname !== '/dashboard' && (
          <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
            <DialogTrigger asChild>
              <Button>
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
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="student@example.com"
                    value={newStudent.contact_email}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, contact_email: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="program">Program</Label>
                  <Select
                    value={newStudent.program}
                    onValueChange={(value) => setNewStudent(prev => ({ ...prev, program: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program._id} value={program.program_name}>
                          {program.program_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddingStudent(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddStudent}>
                    Add Student
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <div className="flex flex-col w-full">
            {/* Header */}
            <div className="flex font-semibold border-b px-4 py-2">
              <div className="flex-[2]">Student</div>
              <div className="flex-[1]">Progress</div>
              {fullView && <div className="flex-[1]">Flight Hours</div>}
              {fullView && <div className="flex-[1]">Next Milestone</div>}
              <div className="flex-[1]">Status</div>
            </div>
            {/* Rows */}
            {displayedStudents.length > 0 ? (
              displayedStudents.map((student) => (
                <div
                  key={student._id}
                  className="flex items-center border-b px-4 py-2 cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/students/${student._id}`)}
                >
                  <div className="flex-[2]">
                    <div>{student.user_id ? `${student.user_id.first_name} ${student.user_id.last_name}` : student.contact_email}</div>
                    <div className="text-xs text-muted-foreground">{student.program}</div>
                  </div>
                  <div className="flex-[1] flex items-center gap-2">
                    <Progress value={calculateProgress(student)} className="w-[60px]" />
                    <span className="text-xs">{calculateProgress(student)}%</span>
                  </div>
                  {fullView && <div className="flex-[1]">{calculateFlightHours(student)} hrs</div>}
                  {fullView && <div className="flex-[1]">{student.nextMilestone}</div>}
                  <div className="flex-[1]">
                    <div
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors border"
                      style={{
                        backgroundColor: student.status === "Active" ? "#c2f0c2"
                          : student.status === "Graduated" ? "#b3c6ff"
                          : student.status === "On Hold" ? "#f0b3ff"
                          : student.status === "Discontinued" ? "#fc9c9c"
                          : "#fbfbb6",
                        borderColor: student.status === "Active" ? "#99e699"
                          : student.status === "Graduated" ? "#809fff"
                          : student.status === "On Hold" ? "#e580ff"
                          : student.status === "Discontinued" ? "#fb6a6a"
                          : "#f9f986",
                        color: "black"
                      }}
                    >
                      {student.status}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-950/20">
                  <Users className="h-8 w-8 text-green-500 dark:text-green-400" strokeWidth={1.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {searchQuery ? 'No students found' : 'No students enrolled'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {searchQuery
                      ? `No students match "${searchQuery}". Try adjusting your search terms.`
                      : 'Get started by enrolling your first student in a training program.'}
                  </p>
                </div>
                {!searchQuery && userRole === 'school_admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingStudent(true)}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        {!fullView && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link href="/students">View All Students</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
