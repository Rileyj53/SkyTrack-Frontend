"use client"

import { useState, useEffect } from "react"
import { Check, CreditCard, Edit2, Save, X, FileText, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"

interface Requirement {
  name: string
  total_hours: number
  completed_hours: number
  _id: string
  is_custom?: boolean
  type?: string
  order?: number
}

interface Milestone {
  name: string
  description: string
  order: number
  completed: boolean
  _id: string
}

interface Stage {
  name: string
  description: string
  order: number
  completed: boolean
  _id: string
}

interface StudentNote {
  _id: string
  student_id: string
  author_id: string
  author_name: string
  type: string
  title: string
  content: string
  tags: string[]
  is_private: boolean
  attachments: {
    name: string
    url: string
    type: string
    _id: string
  }[]
  created_at: string
}

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
    requirements: Requirement[]
    milestones: Milestone[]
    stages: Stage[]
    lastUpdated: string
  }
  studentNotes: StudentNote[]
  created_at: string
  updated_at: string
}

// Define certification types and their hour requirements
const initialCertificationRequirements = {
  privatePilot: {
    name: "Private Pilot",
    totalHours: 40,
    requirements: [
      { name: "Total Flight Time", hours: 40 },
      { name: "Dual Instruction", hours: 20 },
      { name: "Solo Flight Time", hours: 10 },
      { name: "Cross-Country (Dual)", hours: 3 },
      { name: "Cross-Country (Solo)", hours: 5 },
      { name: "Night Flight", hours: 3 },
      { name: "Instrument Training", hours: 3 },
      { name: "Pre-Solo Training", hours: 3 },
      { name: "Test Preparation", hours: 3 },
    ],
  },
  instrumentRating: {
    name: "Instrument Rating",
    totalHours: 40,
    requirements: [
      { name: "Total Instrument Time", hours: 40 },
      { name: "Instrument Flight Training", hours: 15 },
      { name: "Cross-Country Instrument", hours: 3 },
      { name: "Practical Test Preparation", hours: 3 },
    ],
  },
  commercialPilot: {
    name: "Commercial Pilot",
    totalHours: 250,
    requirements: [
      { name: "Total Flight Time", hours: 250 },
      { name: "Pilot in Command", hours: 100 },
      { name: "Cross-Country (PIC)", hours: 50 },
      { name: "Night Flight (PIC)", hours: 10 },
      { name: "Instrument Flight", hours: 10 },
      { name: "Complex Aircraft", hours: 10 },
      { name: "Dual Commercial Training", hours: 20 },
      { name: "Test Preparation", hours: 3 },
    ],
  },
}

// Mock student data
const studentData = {
  id: 1,
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  phone: "(555) 123-4567",
  enrollmentDate: "2023-01-15",
  program: "privatePilot",
  instructor: "Michael Smith",
  status: "Active",
  notes: "Showing excellent progress. Ready for first solo soon.",
  stage: "Pre-Solo",
  nextMilestone: "First Solo Flight",
  progress: {
    privatePilot: {
      "Total Flight Time": 18.5,
      "Dual Instruction": 16.2,
      "Solo Flight Time": 2.3,
      "Cross-Country (Dual)": 2.0,
      "Cross-Country (Solo)": 0,
      "Night Flight": 1.5,
      "Instrument Training": 2.0,
      "Pre-Solo Training": 3.0,
      "Test Preparation": 0,
    },
  },
  // Store custom requirements for this student (if different from standard)
  customRequirements: null,
  // Payment information
  paymentInfo: {
    balance: 1250.75,
    lastPayment: {
      amount: 500.0,
      date: "2023-04-01",
      method: "Credit Card",
    },
    paymentMethod: {
      type: "Credit Card",
      last4: "4242",
      expiry: "05/25",
    },
  },
  // Payment history
  paymentHistory: [
    {
      id: "PMT-001",
      date: "2023-04-01",
      amount: 500.0,
      description: "Flight training payment",
      status: "Completed",
    },
    {
      id: "PMT-002",
      date: "2023-03-15",
      amount: 750.0,
      description: "Monthly training package",
      status: "Completed",
    },
    {
      id: "PMT-003",
      date: "2023-02-28",
      amount: 125.5,
      description: "Ground school materials",
      status: "Completed",
    },
  ],
  // Invoices
  invoices: [
    {
      id: "INV-001",
      date: "2023-04-05",
      amount: 350.0,
      description: "Flight training - 2 hours C172",
      dueDate: "2023-04-20",
      status: "Unpaid",
    },
    {
      id: "INV-002",
      date: "2023-04-01",
      amount: 500.0,
      description: "Flight training - 3 hours PA-28",
      dueDate: "2023-04-15",
      status: "Paid",
    },
    {
      id: "INV-003",
      date: "2023-03-15",
      amount: 750.0,
      description: "Monthly training package",
      dueDate: "2023-03-30",
      status: "Paid",
    },
  ],
}

// Training stages for students
const trainingStages = ["Pre-Solo", "Solo", "Cross-Country", "Maneuvers", "Checkride Prep", "Checkride", "Complete"]

interface StudentDetailProgressProps {
  studentId: string
  className?: string
}

export function StudentDetailProgress({ studentId, className }: StudentDetailProgressProps) {
  const [student, setStudent] = useState<Student | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedHours, setEditedHours] = useState<Record<string, number>>({})
  const [editedStage, setEditedStage] = useState("")
  const [editedNotes, setEditedNotes] = useState("")
  const [activeTab, setActiveTab] = useState("notes")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingRequirement, setIsAddingRequirement] = useState(false)
  const [newRequirement, setNewRequirement] = useState({ name: "", total_hours: 0 })
  const [requirementsToDelete, setRequirementsToDelete] = useState<string[]>([])
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false)
  const [editedMilestones, setEditedMilestones] = useState<Record<string, boolean>>({})
  const [editedStages, setEditedStages] = useState<Record<string, boolean>>({})
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [newNote, setNewNote] = useState<Partial<StudentNote> & { tagInput?: string }>({
    student_id: studentId,
    author_id: "",
    author_name: "",
    type: "flight",
    title: "",
    content: "",
    tags: [],
    is_private: false,
    attachments: [],
    tagInput: ""
  })

  // Get the current certification requirements from the student's progress
  const requirements = student?.progress?.requirements || []

  // Update Total Flight Time when requirements change
  useEffect(() => {
    if (!student?.progress?.requirements) return;

    const totalFlightTime = requirements.find(req => req.name === "Total Flight Time");
    if (!totalFlightTime) return;

    // Calculate the sum of all flight time requirements EXCEPT Total Flight Time
    const totalRequired = requirements
      .filter(req => req.name !== "Total Flight Time")
      .reduce((sum, req) => sum + req.total_hours, 0);
    
    const totalCompleted = requirements
      .filter(req => req.name !== "Total Flight Time")
      .reduce((sum, req) => sum + req.completed_hours, 0);
    
    // Update the Total Flight Time requirement if it doesn't match
    if (totalFlightTime.total_hours !== totalRequired || totalFlightTime.completed_hours !== totalCompleted) {
      const updatedStudent = { ...student };
      updatedStudent.progress.requirements = updatedStudent.progress.requirements.map(req => {
        if (req.name === "Total Flight Time") {
          return {
            ...req,
            total_hours: totalRequired,
            completed_hours: totalCompleted
          };
        }
        return req;
      });
      setStudent(updatedStudent);
    }
  }, [student, requirements]);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const schoolId = localStorage.getItem("schoolId")
        const token = localStorage.getItem("token")
        
        if (!schoolId || !token) {
          throw new Error("School ID or authentication token not found")
        }

        // Check if user is a school admin - check multiple possible values
        const userRole = localStorage.getItem("userRole") || localStorage.getItem("role")
        console.log("User role from localStorage:", userRole)
        
        // Set isSchoolAdmin to true for debugging
        setIsSchoolAdmin(true)
        
        // Uncomment this line when ready to use proper role checking
        // setIsSchoolAdmin(userRole === "school_admin" || userRole === "admin")

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students/${studentId}`,
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
          throw new Error('Failed to fetch student')
        }

        const data = await response.json()
        setStudent(data)
        setEditedStage(data.stage || "")
        setEditedNotes(data.notes || "")
        
        // Initialize milestone and stage completion states
        const milestoneStates: Record<string, boolean> = {}
        const stageStates: Record<string, boolean> = {}
        
        data?.progress.milestones.forEach((milestone: Milestone) => {
          milestoneStates[milestone._id] = milestone.completed
        })
        
        data?.progress.stages.forEach((stage: Stage) => {
          stageStates[stage._id] = stage.completed
        })
        
        setEditedMilestones(milestoneStates)
        setEditedStages(stageStates)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStudent()
  }, [studentId])

  // Calculate total progress percentage
  const calculateTotalProgress = () => {
    if (!student?.progress?.requirements) return 0;
    
    const totalFlightTime = requirements.find(req => req.name === "Total Flight Time");
    if (!totalFlightTime) return 0;
    
    // Calculate the sum of all flight time requirements EXCEPT Total Flight Time
    const totalRequired = requirements
      .filter(req => req.name !== "Total Flight Time")
      .reduce((sum, req) => sum + req.total_hours, 0);
    
    const totalCompleted = requirements
      .filter(req => req.name !== "Total Flight Time")
      .reduce((sum, req) => sum + req.completed_hours, 0);
    
    return Math.min(Math.round((totalCompleted / totalRequired) * 100), 100);
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Loading student data...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !student) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription className="text-red-500">
            {error || 'Failed to load student data'}
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Calculate individual requirement progress
  const calculateRequirementProgress = (requirement: Requirement) => {
    return Math.min(Math.round((requirement.completed_hours / requirement.total_hours) * 100), 100)
  }

  // Add these helper functions after the calculateRequirementProgress function
  const getCurrentStage = (stages: Stage[] = []) => {
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    const incompleteStage = sortedStages.find(stage => !stage.completed);
    return incompleteStage || sortedStages[sortedStages.length - 1];
  };

  const getNextMilestone = (milestones: Milestone[] = []) => {
    const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);
    const incompleteMilestone = sortedMilestones.find(milestone => !milestone.completed);
    return incompleteMilestone || null;
  };

  // Add this helper function after getNextMilestone
  const getKeyRequirements = (requirements: Requirement[]) => {
    return requirements
      .filter(req => req.type === "Key")
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  // Start editing mode
  const handleStartEdit = () => {
    const hours: Record<string, number> = {}
    requirements.forEach((req: Requirement) => {
      hours[req.name] = req.completed_hours
    })
    setEditedHours(hours)
    setEditedStage(student.stage)
    setEditedNotes(student.notes)

    // Initialize milestone and stage completion states
    const milestoneStates: Record<string, boolean> = {}
    const stageStates: Record<string, boolean> = {}
    
    student?.progress.milestones.forEach((milestone: Milestone) => {
      milestoneStates[milestone._id] = milestone.completed
    })
    
    student?.progress.stages.forEach((stage: Stage) => {
      stageStates[stage._id] = stage.completed
    })
    
    setEditedMilestones(milestoneStates)
    setEditedStages(stageStates)
    setIsEditing(true)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false)
    setRequirementsToDelete([])
  }

  // Add a new custom requirement
  const handleAddRequirement = () => {
    if (!newRequirement.name || newRequirement.total_hours <= 0) {
      toast.error("Please enter a valid requirement name and hours")
      return
    }

    // Check if requirement with this name already exists
    if (requirements.some(req => req.name === newRequirement.name)) {
      toast.error("A requirement with this name already exists")
      return
    }

    // Create a temporary ID for the new requirement
    const tempId = `temp-${Date.now()}`
    
    // Add the new requirement to the edited hours
    setEditedHours({
      ...editedHours,
      [newRequirement.name]: 0
    })

    // Add the new requirement to the student's requirements
    if (student) {
      const updatedStudent = { ...student }
      updatedStudent.progress.requirements = [
        ...updatedStudent.progress.requirements,
        {
          name: newRequirement.name,
          total_hours: newRequirement.total_hours,
          completed_hours: 0,
          _id: tempId,
          is_custom: true
        }
      ]
      setStudent(updatedStudent)
    }

    // Reset the new requirement form
    setNewRequirement({ name: "", total_hours: 0 })
    setIsAddingRequirement(false)
  }

  // Mark a requirement for deletion
  const handleDeleteRequirement = (requirementId: string, requirementName: string) => {
    // Add to the list of requirements to delete
    setRequirementsToDelete([...requirementsToDelete, requirementId])
    
    // Remove from edited hours
    const updatedHours = { ...editedHours }
    delete updatedHours[requirementName]
    setEditedHours(updatedHours)
    
    // Remove from the student's requirements
    if (student) {
      const updatedStudent = { ...student }
      updatedStudent.progress.requirements = updatedStudent.progress.requirements.filter(
        req => req._id !== requirementId
      )
      setStudent(updatedStudent)
    }
  }

  // Toggle milestone completion
  const handleToggleMilestone = (milestoneId: string, currentState: boolean) => {
    setEditedMilestones({
      ...editedMilestones,
      [milestoneId]: !currentState
    })
  }

  // Toggle stage completion
  const handleToggleStage = (stageId: string, currentState: boolean) => {
    setEditedStages({
      ...editedStages,
      [stageId]: !currentState
    })
  }

  // Save changes
  const handleSaveChanges = async () => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      // Calculate total flight time
      const totalRequired = requirements.reduce((sum, req) => sum + req.total_hours, 0);
      const totalCompleted = requirements.reduce((sum, req) => sum + (editedHours[req.name] || 0), 0);

      // Filter out requirements marked for deletion and update Total Flight Time
      const updatedRequirements = requirements
        .filter(req => !requirementsToDelete.includes(req._id))
        .map(req => {
          if (req.name === "Total Flight Time") {
            return {
              ...req,
              total_hours: totalRequired,
              completed_hours: totalCompleted
            };
          }
          return {
            ...req,
            completed_hours: editedHours[req.name] || 0
          };
        });
      
      // Update milestones
      const updatedMilestones = student?.progress.milestones.map(milestone => ({
        ...milestone,
        completed: editedMilestones[milestone._id] || false
      })) || []
      
      // Update stages
      const updatedStages = student?.progress.stages.map(stage => ({
        ...stage,
        completed: editedStages[stage._id] || false
      })) || []

      // Prepare the update payload
      const updatePayload = {
      stage: editedStage,
      notes: editedNotes,
        progress: {
          requirements: updatedRequirements,
          milestones: updatedMilestones,
          stages: updatedStages,
          lastUpdated: new Date().toISOString()
        },
        status: "Active" // Ensure status remains "Active"
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students/${studentId}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(updatePayload),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update student')
      }

      const updatedStudent = await response.json()
      
      // Ensure we preserve all student data
      setStudent({
        ...student,
        ...updatedStudent,
        progress: {
          ...updatedStudent.progress,
          requirements: updatedRequirements,
          milestones: updatedMilestones,
          stages: updatedStages,
        },
        notes: editedNotes,
        stage: editedStage,
        status: "Active"
      })
      
    setIsEditing(false)
      setRequirementsToDelete([])
      toast.success("Student progress updated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update student')
    }
  }

  // Update hours during edit
  const handleHourChange = (requirement: string, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    setEditedHours({
      ...editedHours,
      [requirement]: numValue,
    })
  }

  // Update handleAddNote to use the main student update endpoint
  const handleAddNote = async () => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("Missing schoolId or token")
      }

      // Try to get user ID from token first
      let userId = null
      let userName = ""

      try {
        // Decode the JWT token to get user information
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        const payload = JSON.parse(jsonPayload)
        
        console.log("Token payload:", payload)
        
        // Try different possible locations of the user ID
        userId = payload.user_id || payload.id || payload.sub || payload.userId
        userName = payload.first_name && payload.last_name 
          ? `${payload.first_name} ${payload.last_name}`
          : payload.name || payload.userName || "Unknown User"

        console.log("Extracted user info:", { userId, userName })
      } catch (tokenError) {
        console.warn("Failed to decode token:", tokenError)
      }

      // If user ID not found in token, try localStorage
      if (!userId) {
        userId = localStorage.getItem("userId")
        userName = localStorage.getItem("userName") || "Unknown User"
      }

      if (!userId) {
        throw new Error("User ID not found in token or localStorage")
      }

      console.log("Final user info:", { userId, userName })

      if (!student) {
        throw new Error("Student data not found")
      }

      if (!newNote.title?.trim() || !newNote.content?.trim()) {
        toast.error("Please fill in both title and content")
        return
      }

      // Create updated student notes array with new note at the beginning
      const updatedNotes = [...(student.studentNotes || [])]

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students/${studentId}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify({
            studentNotes: [...updatedNotes, {
              student_id: studentId,
              author_id: userId,
              author_name: userName,
              type: newNote.type || "flight",
              title: newNote.title.trim(),
              content: newNote.content.trim(),
              tags: newNote.tags || [],
              is_private: newNote.is_private || false,
              attachments: [],
              created_at: new Date().toISOString()
            }],
            // Preserve other student data
            stage: student.stage,
            notes: student.notes,
            progress: student.progress,
            status: student.status,
            // Preserve all other student fields
            user_id: student.user_id,
            contact_email: student.contact_email,
            phone: student.phone,
            certifications: student.certifications,
            license_number: student.license_number,
            emergency_contact: student.emergency_contact,
            enrollmentDate: student.enrollmentDate,
            program: student.program
          }),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error('Failed to add note: ' + (errorData.message || 'Unknown error'))
      }

      // Create the new note object
      const newNoteObject: StudentNote = {
        _id: `temp-${Date.now()}`, // Temporary ID that will be replaced by the server
        student_id: studentId,
        author_id: userId,
        author_name: userName,
        type: newNote.type || "flight",
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        tags: newNote.tags || [],
        is_private: newNote.is_private || false,
        attachments: [],
        created_at: new Date().toISOString()
      }

      // Update the local state while preserving all other data
        setStudent({
          ...student,
        studentNotes: [...(student.studentNotes || []), newNoteObject]
      })

      // Reset form and close dialog
      setNewNote({
        student_id: studentId,
        author_id: "",
        author_name: "",
        type: "flight",
        title: "",
        content: "",
        tags: [],
        is_private: false,
        attachments: [],
        tagInput: ""
      })
      setIsAddingNote(false)
      toast.success("Training note added successfully")
    } catch (err) {
      console.error("Error adding note:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to add note')
    }
  }

  // Update the handleAddNoteClick function
  const handleAddNoteClick = () => {
    setActiveTab("notes"); // Ensure we're on the notes tab
    setIsAddingNote(true);
  };

  // Add handleDeleteNote function
  const handleDeleteNote = async (noteId: string) => {
    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("Missing schoolId or token")
      }

      if (!student) {
        throw new Error("Student data not found")
      }

      // Filter out the note to be deleted
      const updatedNotes = student.studentNotes.filter(note => note._id !== noteId)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students/${studentId}`,
        {
          method: 'PUT',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
            'Authorization': `Bearer ${token}`,
            'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify({
            studentNotes: updatedNotes,
            // Preserve other student data
            stage: student.stage,
            notes: student.notes,
            progress: student.progress,
            status: student.status,
            // Preserve all other student fields
            user_id: student.user_id,
            contact_email: student.contact_email,
            phone: student.phone,
            certifications: student.certifications,
            license_number: student.license_number,
            emergency_contact: student.emergency_contact,
            enrollmentDate: student.enrollmentDate,
            program: student.program
          }),
          credentials: 'include'
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error('Failed to delete note: ' + (errorData.message || 'Unknown error'))
      }

      // Update the local state while preserving all other data
      setStudent({
        ...student,
        studentNotes: updatedNotes
      })
      
      toast.success("Note deleted successfully")
    } catch (err) {
      console.error("Error deleting note:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete note')
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl">
            {student.user_id 
              ? `${student.user_id.first_name} ${student.user_id.last_name}`
              : student.contact_email}
          </CardTitle>
          <CardDescription className="text-base mt-1">
            {student.program} • Student
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={student.status === "Active" ? "default" : "secondary"} 
                className={student.status === "Active" ? "bg-green-500/80 hover:bg-green-500/90" : ""}>
            {student.status}
          </Badge>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleStartEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Progress
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSaveChanges}>
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Hour Requirements</TabsTrigger>
            <TabsTrigger value="milestones">Milestones & Stages</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Overall Progress Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Overall Progress</CardTitle>
                    <CardDescription>Total flight time progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Flight Time</span>
                    <span className="text-sm text-muted-foreground">
                          {requirements.find(req => req.name === "Total Flight Time")?.completed_hours || 0} / {requirements.find(req => req.name === "Total Flight Time")?.total_hours || 0} hours
                    </span>
                  </div>
                      <Progress 
                        value={calculateTotalProgress()} 
                        className="h-2 bg-green-900/50 dark:bg-green-800/30" 
                      />
                </div>
                  </CardContent>
                </Card>

                {/* Key Requirements Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Key Requirements</CardTitle>
                    <CardDescription>Essential training milestones</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getKeyRequirements(requirements).map((req: Requirement) => (
                      <div key={req._id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{req.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {req.completed_hours} / {req.total_hours} hours
                          </span>
                        </div>
                        <Progress 
                          value={calculateRequirementProgress(req)} 
                          className="h-2 bg-green-900/50 dark:bg-green-800/30" 
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Training Status Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Training Status</CardTitle>
                    <CardDescription>Current stage and next milestone</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                <div className="space-y-2">
                      <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Stage</span>
                    {isEditing ? (
                      <Select value={editedStage} onValueChange={setEditedStage}>
                        <SelectTrigger className="w-[180px] h-8">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {trainingStages.map((stage) => (
                            <SelectItem key={stage} value={stage}>
                              {stage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                          <Badge variant="outline" className="font-medium">
                            {getCurrentStage(student?.progress?.stages)?.name || 'No stage set'}
                          </Badge>
                    )}
                  </div>
                      <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Next Milestone</span>
                        <Badge variant="secondary" className="font-medium">
                          {getNextMilestone(student?.progress?.milestones)?.name || 'All milestones completed'}
                        </Badge>
                  </div>
                      <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Enrollment Date</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(student.enrollmentDate).toLocaleDateString()}
                        </span>
                  </div>
                </div>
                  </CardContent>
                </Card>

                {/* Contact Information Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                    <CardDescription>Student and emergency contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Email</span>
                        <a 
                          href={`mailto:${student.contact_email}`}
                          className="text-sm text-muted-foreground hover:text-primary hover:underline"
                        >
                          {student.contact_email}
                        </a>
                  </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Phone</span>
                        <a 
                          href={`tel:${student.phone}`}
                          className="text-sm text-muted-foreground hover:text-primary hover:underline"
                        >
                          {student.phone}
                        </a>
                </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">License</span>
                        <span className="text-sm text-muted-foreground">{student.license_number}</span>
                  </div>
                  </div>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Emergency Contact</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Name</span>
                          <span className="text-sm text-muted-foreground">{student.emergency_contact?.name || 'Not provided'}</span>
                </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Relationship</span>
                          <span className="text-sm text-muted-foreground">{student.emergency_contact?.relationship || 'Not provided'}</span>
              </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Phone</span>
                          <a 
                            href={`tel:${student.emergency_contact?.phone || ''}`}
                            className="text-sm text-muted-foreground hover:text-primary hover:underline"
                          >
                            {student.emergency_contact?.phone || 'Not provided'}
                          </a>
                      </div>
                    </div>
                </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Hour Requirements</CardTitle>
                    <CardDescription>Track and manage flight training requirements</CardDescription>
                </div>
                  {isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setIsAddingRequirement(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Custom Requirement
                    </Button>
                  )}
              </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isAddingRequirement && (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <h4 className="text-sm font-medium mb-4">Add Custom Requirement</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="requirement-name">Requirement Name</Label>
                        <Input
                          id="requirement-name"
                          value={newRequirement.name}
                          onChange={(e) => setNewRequirement({ ...newRequirement, name: e.target.value })}
                          placeholder="e.g., Mountain Flying"
                        />
            </div>
                      <div className="space-y-2">
                        <Label htmlFor="requirement-hours">Total Hours Required</Label>
                        <Input
                          id="requirement-hours"
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={newRequirement.total_hours || ""}
                          onChange={(e) => setNewRequirement({ ...newRequirement, total_hours: parseFloat(e.target.value) || 0 })}
                          placeholder="e.g., 5.0"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => setIsAddingRequirement(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleAddRequirement}>
                        Add Requirement
                      </Button>
                    </div>
                  </div>
                )}

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                        <TableHead className="w-[250px]">Requirement</TableHead>
                    <TableHead className="w-[100px] text-right">Required</TableHead>
                    <TableHead className="w-[100px] text-right">Completed</TableHead>
                    <TableHead className="w-[100px] text-right">Remaining</TableHead>
                        <TableHead className="w-[150px] text-right">Progress</TableHead>
                        {isEditing && <TableHead className="w-[80px] text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                      {requirements.map((req: Requirement) => {
                        const completed = isEditing ? editedHours[req.name] || 0 : req.completed_hours
                        const remaining = Math.max(req.total_hours - completed, 0)
                        const progressPercent = Math.min(Math.round((completed / req.total_hours) * 100), 100)
                        const isMarkedForDeletion = requirementsToDelete.includes(req._id)

                    return (
                          <TableRow key={req.name} className={isMarkedForDeletion ? "opacity-50" : ""}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {req.name}
                                {req.is_custom && (
                                  <Badge variant="outline" className="text-xs">Custom</Badge>
                                )}
                                {req.type === "Key" && (
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">Key</Badge>
                                )}
                              </div>
                        </TableCell>
                            <TableCell className="text-right font-medium">{req.total_hours}</TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editedHours[req.name] || 0}
                              onChange={(e) => handleHourChange(req.name, e.target.value)}
                              className="h-8 w-20 text-right"
                              step="0.1"
                              min="0"
                            />
                          ) : (
                                <span className="font-medium">{completed}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                              <span className={remaining === 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                                {remaining}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Progress 
                                  value={progressPercent} 
                                  className={`h-2 w-24 ${progressPercent === 100 ? "bg-green-900/50 dark:bg-green-800/30" : ""}`}
                                />
                                <span className={`text-xs font-medium ${progressPercent === 100 ? "text-green-400 dark:text-green-300" : ""}`}>
                                  {progressPercent}%
                                </span>
                          </div>
                        </TableCell>
                            {isEditing && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteRequirement(req._id, req.name)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Milestones Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                        <div>
                      <CardTitle className="text-lg">Training Milestones</CardTitle>
                      <CardDescription>Key achievements in the training program</CardDescription>
                          </div>
                    {isEditing && (
                      <Badge variant="outline" className="text-xs">
                        {student?.progress?.milestones?.filter((m: Milestone) => 
                          isEditing ? editedMilestones[m._id] : m.completed
                        ).length || 0} / {student?.progress?.milestones?.length || 0} Completed
                      </Badge>
                    )}
                        </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {student?.progress?.milestones
                    ?.sort((a, b) => a.order - b.order)
                    .map((milestone) => {
                      const isCompleted = isEditing 
                        ? editedMilestones[milestone._id] 
                        : milestone.completed
                      
                      return (
                        <div 
                          key={milestone._id} 
                          className={`relative p-4 rounded-lg border transition-colors ${
                            isCompleted 
                              ? 'bg-green-950/50 border-green-800 dark:bg-green-900/20 dark:border-green-800' 
                              : 'bg-muted/30 hover:bg-muted/50 dark:bg-muted/10 dark:hover:bg-muted/20'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => isEditing && handleToggleMilestone(milestone._id, isCompleted)}
                              className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                isCompleted 
                                  ? 'border-green-500 bg-green-900/50 hover:bg-green-900/70 dark:border-green-400 dark:bg-green-800/30 dark:hover:bg-green-800/50' 
                                  : 'border-muted-foreground/30 hover:border-primary hover:bg-muted dark:border-muted-foreground/20 dark:hover:border-primary/80 dark:hover:bg-muted/30'
                              } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              {isCompleted ? (
                                <Check className="h-4 w-4 text-green-400 dark:text-green-300" />
                              ) : (
                                <span className="text-sm text-muted-foreground">{milestone.order}</span>
                              )}
                            </button>
                            <div className="flex-grow space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{milestone.name}</h4>
                      </div>
                              <p className="text-sm text-muted-foreground">
                                {milestone.description}
                              </p>
                    </div>
                  </div>
                </div>
                      )
                    })}
                </CardContent>
              </Card>

              {/* Stages Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                        <div>
                      <CardTitle className="text-lg">Training Stages</CardTitle>
                      <CardDescription>Major phases of the training program</CardDescription>
                          </div>
                    {isEditing && (
                      <Badge variant="outline" className="text-xs">
                        {student?.progress?.stages?.filter((s: Stage) => 
                          isEditing ? editedStages[s._id] : s.completed
                        ).length || 0} / {student?.progress?.stages?.length || 0} Completed
                      </Badge>
                    )}
                        </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {student?.progress?.stages
                    ?.sort((a, b) => a.order - b.order)
                    .map((stage) => {
                      const isCompleted = isEditing 
                        ? editedStages[stage._id] 
                        : stage.completed
                      
                      return (
                        <div 
                          key={stage._id} 
                          className={`relative p-4 rounded-lg border transition-colors ${
                            isCompleted 
                              ? 'bg-green-950/50 border-green-800 dark:bg-green-900/20 dark:border-green-800' 
                              : 'bg-muted/30 hover:bg-muted/50 dark:bg-muted/10 dark:hover:bg-muted/20'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => isEditing && handleToggleStage(stage._id, isCompleted)}
                              className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                isCompleted 
                                  ? 'border-green-500 bg-green-900/50 hover:bg-green-900/70 dark:border-green-400 dark:bg-green-800/30 dark:hover:bg-green-800/50' 
                                  : 'border-muted-foreground/30 hover:border-primary hover:bg-muted dark:border-muted-foreground/20 dark:hover:border-primary/80 dark:hover:bg-muted/30'
                              } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              {isCompleted ? (
                                <Check className="h-4 w-4 text-green-400 dark:text-green-300" />
                              ) : (
                                <span className="text-sm text-muted-foreground">{stage.order}</span>
                              )}
                            </button>
                            <div className="flex-grow space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{stage.name}</h4>
                          </div>
                              <p className="text-sm text-muted-foreground">
                                {stage.description}
                              </p>
                        </div>
                        </div>
                      </div>
                      )
                    })}
                </CardContent>
              </Card>
                  </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            {/* Instructor Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Instructor Notes</CardTitle>
                <CardDescription>General notes about the student's progress</CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <textarea
                    id="notes"
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    className="mt-1 w-full min-h-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Add notes about the student's progress..."
                  />
                ) : (
                  <div className="rounded-md bg-muted/30 p-3 text-sm">
                    {student.notes || "No instructor notes available."}
                </div>
                )}
              </CardContent>
            </Card>

            {/* Training History */}
            <Card>
              <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                    <CardTitle className="text-lg">Training History</CardTitle>
                    <CardDescription>Record of training sessions and progress notes</CardDescription>
                        </div>
                  {!isAddingNote && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddNoteClick}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Note
                    </Button>
                  )}
                      </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAddingNote && (
                  <div className="rounded-lg border bg-card p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="note-type">Note Type</Label>
                          <Select 
                            value={newNote.type} 
                            onValueChange={(value) => setNewNote({...newNote, type: value})}
                          >
                            <SelectTrigger id="note-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="flight">Flight</SelectItem>
                              <SelectItem value="ground">Ground</SelectItem>
                              <SelectItem value="exam">Exam</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                      </div>
                        <div className="space-y-2">
                          <Label htmlFor="note-title">Title</Label>
                          <Input
                            id="note-title"
                            value={newNote.title}
                            onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                            placeholder="e.g., First Flight Lesson"
                          />
                    </div>
                        </div>
                      <div className="space-y-2">
                        <Label htmlFor="note-content">Content</Label>
                        <textarea
                          id="note-content"
                          value={newNote.content}
                          onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                          className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          placeholder="Enter detailed notes about the training session..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="note-tags">Tags</Label>
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                          {(newNote.tags || []).map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs bg-secondary/30"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => {
                                  setNewNote({
                                    ...newNote,
                                    tags: newNote.tags?.filter((_, i) => i !== index) || []
                                  })
                                }}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                          <Input
                            id="note-tags"
                            value={newNote.tagInput || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.endsWith(',')) {
                                const tag = value.slice(0, -1).trim();
                                if (tag) {
                                  setNewNote({
                                    ...newNote,
                                    tags: [...(newNote.tags || []), tag],
                                    tagInput: ""
                                  });
                                }
                              } else {
                                setNewNote({
                                  ...newNote,
                                  tagInput: value
                                });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newNote.tagInput?.trim()) {
                                e.preventDefault();
                                setNewNote({
                                  ...newNote,
                                  tags: [...(newNote.tags || []), newNote.tagInput.trim()],
                                  tagInput: ""
                                });
                              }
                            }}
                            className="border-0 p-0 h-6 flex-1 min-w-[120px] focus-visible:ring-0"
                            placeholder="Type and press Enter or add comma"
                          />
                      </div>
                        <p className="text-xs text-muted-foreground">
                          Press Enter or add a comma to create a tag
                        </p>
                    </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="note-private"
                          checked={newNote.is_private}
                          onCheckedChange={(checked) => 
                            setNewNote({...newNote, is_private: checked as boolean})
                          }
                        />
                        <Label htmlFor="note-private">Private Note</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setNewNote({
                              student_id: studentId,
                              author_id: "",
                              author_name: "",
                              type: "flight",
                              title: "",
                              content: "",
                              tags: [],
                              is_private: false,
                              attachments: [],
                              tagInput: ""
                            })
                            setIsAddingNote(false)
                          }}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddNote}>
                          Add Note
                    </Button>
                  </div>
                </div>
              </div>
                )}
                
                {student.studentNotes?.length > 0 ? (
                  student.studentNotes.map((note: StudentNote) => (
                    <div 
                      key={note._id} 
                      className="rounded-lg border bg-card transition-colors hover:bg-muted/50"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
              <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{note.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {note.type}
                              </Badge>
                    </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{note.author_name}</span>
                              <span>•</span>
                              <span>{new Date(note.created_at).toLocaleDateString()}</span>
                  </div>
                    </div>
                          <div className="flex items-center gap-2">
                            {note.is_private && (
                              <Badge variant="secondary" className="text-xs">
                                Private
                              </Badge>
                            )}
                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteNote(note._id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                  </div>
                    </div>
                        
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {note.content}
                        </p>

                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {note.tags.map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="secondary" 
                                className="text-xs bg-secondary/30"
                              >
                                {tag}
                              </Badge>
                            ))}
                  </div>
                        )}

                        {note.attachments && note.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs font-medium">Attachments</span>
                    </div>
                            <div className="mt-2 space-y-1">
                              {note.attachments.map((attachment) => (
                                <a
                                  key={attachment._id}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs text-primary hover:underline p-1.5 rounded-md hover:bg-muted/50"
                                >
                                  <FileText className="h-3 w-3" />
                                  <span>{attachment.name}</span>
                                </a>
                              ))}
                  </div>
                </div>
                        )}
              </div>
            </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No training history available.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
