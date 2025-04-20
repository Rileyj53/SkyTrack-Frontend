"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Plus } from "lucide-react"

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
          <CardDescription className="text-red-500">Error: {error}</CardDescription>
        </CardHeader>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Progress</TableHead>
              {fullView && <TableHead>Flight Hours</TableHead>}
              {fullView && <TableHead>Next Milestone</TableHead>}
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedStudents.map((student) => (
              <TableRow 
                key={student._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/students/${student._id}`)}
              >
                <TableCell className="font-medium">
                  {student.user_id 
                    ? `${student.user_id.first_name} ${student.user_id.last_name}`
                    : student.contact_email}
                </TableCell>
                <TableCell>{student.program}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={calculateProgress(student)} className="w-[60px]" />
                    <span className="text-xs">{calculateProgress(student)}%</span>
                  </div>
                </TableCell>
                {fullView && <TableCell>{calculateFlightHours(student)} hrs</TableCell>}
                {fullView && <TableCell>{student.nextMilestone}</TableCell>}
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`${
                      student.status === "Active" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {student.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
