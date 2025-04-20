"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Edit2, MoreHorizontal, Plus, Trash2 } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { toast } from "react-hot-toast"

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
  studentNotes: Array<{
    student_id: string
    author_id: string
    author_name: string
    type: string
    title: string
    content: string
    tags: string[]
    is_private: boolean
    attachments: any[]
    _id: string
  }>
  created_at: string
  updated_at: string
}

export function SettingsStudents() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [deleteStudentId, setDeleteStudentId] = useState<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    contact_email: "",
    phone: "",
    certifications: [],
    license_number: "",
    emergency_contact: {
      name: "",
      relationship: "",
      phone: ""
    },
    enrollmentDate: new Date().toISOString().split("T")[0],
    program: "Private Pilot License",
    status: "Active",
    stage: "Pre-Solo",
    nextMilestone: "First Solo",
    notes: "",
    progress: {
      requirements: [],
      milestones: [],
      stages: [],
      lastUpdated: new Date().toISOString()
    }
  })

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
      return
    }
    setLoading(false)
    fetchStudents()
  }, [router])

  const fetchStudents = async () => {
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

      console.log("Fetching students for school:", schoolId)
      
      const response = await fetch(
        `${process.env.API_URL}/schools/${schoolId}/students`,
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
        throw new Error(`Failed to fetch students: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Raw API response:", data)
      
      // Extract the students array from the response
      const studentsData = data.students || []
      console.log("Extracted students data:", studentsData)
      
      // Validate each student object
      const validStudents = studentsData.filter(student => {
        const isValid = student && typeof student === 'object' && student._id;
        if (!isValid) {
          console.warn("Invalid student object:", student);
        }
        return isValid;
      });
      
      console.log("Valid students:", validStudents);
      setStudents(validStudents)
    } catch (error) {
      console.error("Error fetching students:", error)
      toast.error("Failed to fetch students")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  // Filter students based on search query
  const filteredStudents = students.filter((student) => {
    if (!student) return false;
    
    const searchLower = searchQuery.toLowerCase()
    return (
      (student.user_id?.first_name && student.user_id.first_name.toLowerCase().includes(searchLower)) ||
      (student.user_id?.last_name && student.user_id.last_name.toLowerCase().includes(searchLower)) ||
      (student.user_id?.email && student.user_id.email.toLowerCase().includes(searchLower)) ||
      (student.program && student.program.toLowerCase().includes(searchLower))
    )
  })

  // Handle adding a new student
  const handleAddStudent = async () => {
    if (!isSchoolAdmin) {
      toast.error("You do not have permission to add students")
      return
    }

    if (newStudent.contact_email && newStudent.program) {
      try {
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        const apiKey = process.env.API_KEY
        
        if (!schoolId || !token || !apiKey) {
          throw new Error("Missing required credentials")
        }

        console.log("Sending new student data:", newStudent)

        const response = await fetch(
          `${process.env.API_URL}/schools/${schoolId}/students`,
          {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "Authorization": `Bearer ${token}`,
              "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
            },
            body: JSON.stringify(newStudent),
            credentials: "include"
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error response:", errorText)
          throw new Error(`Failed to add student: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Add response:", data)

        // Handle both possible response formats
        const addedStudent = data.student || data
        console.log("Processed added student:", addedStudent)

        if (!addedStudent || !addedStudent._id) {
          throw new Error("Invalid response format from add endpoint")
        }

        // Add the new student to the list
        setStudents([...students, addedStudent])
        
        // Reset the form
        setNewStudent({
          contact_email: "",
          phone: "",
          certifications: [],
          license_number: "",
          emergency_contact: {
            name: "",
            relationship: "",
            phone: ""
          },
          enrollmentDate: new Date().toISOString().split("T")[0],
          program: "Private Pilot License",
          status: "Active",
          stage: "Pre-Solo",
          nextMilestone: "First Solo",
          notes: "",
          progress: {
            requirements: [],
            milestones: [],
            stages: [],
            lastUpdated: new Date().toISOString()
          }
        })
        
        setIsAddDialogOpen(false)
        toast.success("Student added successfully")
        
        // Refresh the students list to ensure we have the latest data
        fetchStudents()
      } catch (error) {
        console.error("Error adding student:", error)
        toast.error(error instanceof Error ? error.message : "Failed to add student")
      }
    } else {
      toast.error("Please fill in all required fields (Email and Program)")
    }
  }

  // Handle editing a student
  const handleEditStudent = async () => {
    if (!isSchoolAdmin) {
      toast.error("You do not have permission to update students")
      return
    }

    if (editingStudent && editingStudent._id) {
      try {
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        const apiKey = process.env.API_KEY
        
        if (!schoolId || !token || !apiKey) {
          throw new Error("Missing required credentials")
        }

        console.log("Sending update for student:", editingStudent)

        const response = await fetch(
          `${process.env.API_URL}/schools/${schoolId}/students/${editingStudent._id}`,
          {
            method: "PUT",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "Authorization": `Bearer ${token}`,
              "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
            },
            body: JSON.stringify(editingStudent),
            credentials: "include"
          }
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error("Error response:", errorText)
          throw new Error(`Failed to update student: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Update response:", data)

        // Handle both possible response formats
        const updatedStudent = data.student || data
        console.log("Processed updated student:", updatedStudent)

        if (!updatedStudent || !updatedStudent._id) {
          throw new Error("Invalid response format from update endpoint")
        }

        // Update the students list
        setStudents(students.map((student) => 
          student._id === updatedStudent._id ? updatedStudent : student
        ))
        
        setIsEditDialogOpen(false)
        setEditingStudent(null)
        toast.success("Student updated successfully")
        
        // Refresh the students list to ensure we have the latest data
        fetchStudents()
      } catch (error) {
        console.error("Error updating student:", error)
        toast.error(error instanceof Error ? error.message : "Failed to update student")
      }
    }
  }

  // Handle deleting a student
  const handleDeleteStudent = async () => {
    if (!isSchoolAdmin) {
      toast.error("You do not have permission to delete students")
      return
    }

    if (deleteStudentId) {
      try {
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        const apiKey = process.env.API_KEY
        
        if (!schoolId || !token || !apiKey) {
          throw new Error("Missing required credentials")
        }

        const response = await fetch(
          `${process.env.API_URL}/schools/${schoolId}/students/${deleteStudentId}`,
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
          throw new Error("Failed to delete student")
        }

        setStudents(students.filter((student) => student._id !== deleteStudentId))
        setIsDeleteDialogOpen(false)
        setDeleteStudentId(null)
        toast.success("Student deleted successfully")
      } catch (error) {
        console.error("Error deleting student:", error)
        toast.error("Failed to delete student")
      }
    }
  }

  // Start editing a student
  const startEditStudent = (student: Student) => {
    setEditingStudent({ ...student })
    setIsEditDialogOpen(true)
  }

  // Start deleting a student
  const startDeleteStudent = (id: string) => {
    setDeleteStudentId(id)
    setIsDeleteDialogOpen(true)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>
            {isSchoolAdmin 
              ? "Add, edit, or remove students from your flight school."
              : "View students in your flight school."}
          </CardDescription>
        </div>
        {isSchoolAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Enter the details for the new student.</DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-6 -mr-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact_email">Email</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={newStudent.contact_email}
                          onChange={(e) => setNewStudent({ ...newStudent, contact_email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={newStudent.phone}
                          onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="license_number">License Number</Label>
                        <Input
                          id="license_number"
                          value={newStudent.license_number}
                          onChange={(e) => setNewStudent({ ...newStudent, license_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="program">Program</Label>
                        <Select
                          value={newStudent.program}
                          onValueChange={(value) => setNewStudent({ ...newStudent, program: value })}
                        >
                          <SelectTrigger id="program">
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Program</SelectLabel>
                              <SelectItem value="Private Pilot License">Private Pilot License</SelectItem>
                              <SelectItem value="Commercial Pilot License">Commercial Pilot License</SelectItem>
                              <SelectItem value="Instrument Rating">Instrument Rating</SelectItem>
                              <SelectItem value="Multi-Engine Rating">Multi-Engine Rating</SelectItem>
                              <SelectItem value="Flight Instructor">Flight Instructor</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Status & Stage */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Status & Stage</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={newStudent.status}
                          onValueChange={(value) => setNewStudent({ ...newStudent, status: value })}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Status</SelectLabel>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="On Hold">On Hold</SelectItem>
                              <SelectItem value="Graduated">Graduated</SelectItem>
                              <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stage">Stage</Label>
                        <Select
                          value={newStudent.stage}
                          onValueChange={(value) => setNewStudent({ ...newStudent, stage: value })}
                        >
                          <SelectTrigger id="stage">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Stage</SelectLabel>
                              <SelectItem value="Pre-Solo">Pre-Solo</SelectItem>
                              <SelectItem value="Post-Solo">Post-Solo</SelectItem>
                              <SelectItem value="Checkride Prep">Checkride Prep</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="next_milestone">Next Milestone</Label>
                        <Input
                          id="next_milestone"
                          value={newStudent.nextMilestone}
                          onChange={(e) => setNewStudent({ ...newStudent, nextMilestone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="enrollment_date">Enrollment Date</Label>
                        <Input
                          id="enrollment_date"
                          type="date"
                          value={newStudent.enrollmentDate}
                          onChange={(e) => setNewStudent({ ...newStudent, enrollmentDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_name">Name</Label>
                        <Input
                          id="emergency_name"
                          value={newStudent.emergency_contact?.name}
                          onChange={(e) => setNewStudent({
                            ...newStudent,
                            emergency_contact: {
                              ...newStudent.emergency_contact,
                              name: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_relationship">Relationship</Label>
                        <Input
                          id="emergency_relationship"
                          value={newStudent.emergency_contact?.relationship}
                          onChange={(e) => setNewStudent({
                            ...newStudent,
                            emergency_contact: {
                              ...newStudent.emergency_contact,
                              relationship: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_phone">Phone</Label>
                        <Input
                          id="emergency_phone"
                          value={newStudent.emergency_contact?.phone}
                          onChange={(e) => setNewStudent({
                            ...newStudent,
                            emergency_contact: {
                              ...newStudent.emergency_contact,
                              phone: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Notes</h3>
                    <textarea
                      id="notes"
                      value={newStudent.notes}
                      onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStudent}>Add Student</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Search students by name, email, or program..."
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
              <TableHead>Program</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Next Milestone</TableHead>
              <TableHead>Flight Hours</TableHead>
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
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student._id}>
                  <TableCell className="font-medium">
                    {student.user_id?.first_name} {student.user_id?.last_name}
                  </TableCell>
                  <TableCell>{student.user_id?.email || student.contact_email}</TableCell>
                  <TableCell>{student.phone || 'N/A'}</TableCell>
                  <TableCell>{student.program}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        student.status === "Active"
                          ? "success"
                          : student.status === "On Hold"
                            ? "warning"
                            : student.status === "Graduated"
                              ? "default"
                              : "secondary"
                      }
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{student.stage}</TableCell>
                  <TableCell>{student.nextMilestone}</TableCell>
                  <TableCell>
                    {student.progress?.requirements?.find(req => req.name === "Total Flight Time")?.completed_hours || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isSchoolAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditStudent(student)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => startDeleteStudent(student._id)}
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
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Edit Student Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>Update the student's information.</DialogDescription>
            </DialogHeader>
            {editingStudent && (
              <div className="flex-1 overflow-y-auto pr-6 -mr-6">
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-contact_email">Email</Label>
                        <Input
                          id="edit-contact_email"
                          type="email"
                          value={editingStudent.contact_email}
                          onChange={(e) => setEditingStudent({ ...editingStudent, contact_email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          value={editingStudent.phone}
                          onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-license_number">License Number</Label>
                        <Input
                          id="edit-license_number"
                          value={editingStudent.license_number}
                          onChange={(e) => setEditingStudent({ ...editingStudent, license_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-program">Program</Label>
                        <Select
                          value={editingStudent.program}
                          onValueChange={(value) => setEditingStudent({ ...editingStudent, program: value })}
                        >
                          <SelectTrigger id="edit-program">
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Program</SelectLabel>
                              <SelectItem value="Private Pilot License">Private Pilot License</SelectItem>
                              <SelectItem value="Commercial Pilot License">Commercial Pilot License</SelectItem>
                              <SelectItem value="Instrument Rating">Instrument Rating</SelectItem>
                              <SelectItem value="Multi-Engine Rating">Multi-Engine Rating</SelectItem>
                              <SelectItem value="Flight Instructor">Flight Instructor</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Status & Stage */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Status & Stage</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-status">Status</Label>
                        <Select
                          value={editingStudent.status}
                          onValueChange={(value) => setEditingStudent({ ...editingStudent, status: value })}
                        >
                          <SelectTrigger id="edit-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Status</SelectLabel>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="On Hold">On Hold</SelectItem>
                              <SelectItem value="Graduated">Graduated</SelectItem>
                              <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-stage">Stage</Label>
                        <Select
                          value={editingStudent.stage}
                          onValueChange={(value) => setEditingStudent({ ...editingStudent, stage: value })}
                        >
                          <SelectTrigger id="edit-stage">
                            <SelectValue placeholder="Select stage" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Stage</SelectLabel>
                              <SelectItem value="Pre-Solo">Pre-Solo</SelectItem>
                              <SelectItem value="Post-Solo">Post-Solo</SelectItem>
                              <SelectItem value="Checkride Prep">Checkride Prep</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-next_milestone">Next Milestone</Label>
                        <Input
                          id="edit-next_milestone"
                          value={editingStudent.nextMilestone}
                          onChange={(e) => setEditingStudent({ ...editingStudent, nextMilestone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-enrollment_date">Enrollment Date</Label>
                        <Input
                          id="edit-enrollment_date"
                          type="date"
                          value={editingStudent.enrollmentDate}
                          onChange={(e) => setEditingStudent({ ...editingStudent, enrollmentDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Emergency Contact</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-emergency_name">Name</Label>
                        <Input
                          id="edit-emergency_name"
                          value={editingStudent.emergency_contact?.name}
                          onChange={(e) => setEditingStudent({
                            ...editingStudent,
                            emergency_contact: {
                              ...editingStudent.emergency_contact,
                              name: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-emergency_relationship">Relationship</Label>
                        <Input
                          id="edit-emergency_relationship"
                          value={editingStudent.emergency_contact?.relationship}
                          onChange={(e) => setEditingStudent({
                            ...editingStudent,
                            emergency_contact: {
                              ...editingStudent.emergency_contact,
                              relationship: e.target.value
                            }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-emergency_phone">Phone</Label>
                        <Input
                          id="edit-emergency_phone"
                          value={editingStudent.emergency_contact?.phone}
                          onChange={(e) => setEditingStudent({
                            ...editingStudent,
                            emergency_contact: {
                              ...editingStudent.emergency_contact,
                              phone: e.target.value
                            }
                          })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Notes</h3>
                    <textarea
                      id="edit-notes"
                      value={editingStudent.notes}
                      onChange={(e) => setEditingStudent({ ...editingStudent, notes: e.target.value })}
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
              <Button onClick={handleEditStudent}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the student from the system. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteStudent} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
