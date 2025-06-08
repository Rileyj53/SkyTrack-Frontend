"use client"

import { useState, useEffect } from "react"
import { Check, CreditCard, Save, X, FileText, Plus, Trash2, CheckCircle, BarChart3, Pencil, Target, Filter, ChevronDown } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
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

interface Charge {
  _id: string
  flight_schedule_id: string
  rate_type: string
  amount: number
  status: string
  created_at: string
}

interface Payment {
  _id?: string
  payment_id?: string
  amount: number
  payment_method: string
  notes: string
  created_at?: string
}

interface Ledger {
  _id: string
  school_id: {
    _id: string
    name: string
    address: {
      street: string
      city: string
      state: string
      zip: string
      country: string
    }
    airport: string
    phone: string
    email: string
  }
  student_id: {
    _id: string
    school_id: string
    user_id: {
      _id: string
      email: string
      first_name: string
      last_name: string
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
  }
  balance: number
  charges: Charge[]
  payments: Payment[]
  last_updated: string
  created_at: string
  updated_at: string
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
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingRequirementLoading, setIsAddingRequirementLoading] = useState(false)
  const [isDeletingRequirement, setIsDeletingRequirement] = useState<string | null>(null)
  const [editedHours, setEditedHours] = useState<Record<string, number>>({})
  const [editedStage, setEditedStage] = useState("")
  const [editedNotes, setEditedNotes] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingRequirement, setIsAddingRequirement] = useState(false)
  const [newRequirement, setNewRequirement] = useState({ name: "", total_hours: 0 })
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false)
  const [editedMilestones, setEditedMilestones] = useState<Record<string, boolean>>({})
  const [editedStages, setEditedStages] = useState<Record<string, boolean>>({})
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [isAddingNoteLoading, setIsAddingNoteLoading] = useState(false)
  const [isDeletingNote, setIsDeletingNote] = useState<string | null>(null)
  
  // Filter states
  const [selectedNoteTypes, setSelectedNoteTypes] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showPrivateOnly, setShowPrivateOnly] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Ledger states
  const [ledger, setLedger] = useState<Ledger | null>(null)
  const [ledgerLoading, setLedgerLoading] = useState(false)
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [isAddingPaymentLoading, setIsAddingPaymentLoading] = useState(false)
  const [newPayment, setNewPayment] = useState<Payment>({
    amount: 0,
    payment_method: "cash",
    notes: ""
  })
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
  
  // New state variables for milestone and stage operations
  const [isTogglingMilestone, setIsTogglingMilestone] = useState<string | null>(null)
  const [isTogglingStage, setIsTogglingStage] = useState<string | null>(null)
  const [isDeletingMilestone, setIsDeletingMilestone] = useState<string | null>(null)
  const [isDeletingStage, setIsDeletingStage] = useState<string | null>(null)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [editingStage, setEditingStage] = useState<Stage | null>(null)
    const [user, setUser] = useState<{
    role: string
    _id?: string
    first_name?: string
    last_name?: string
    email?: string
    school_id?: string
  } | null>(null)
  
  // Modal states
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [isAddingStage, setIsAddingStage] = useState(false)
  const [isEditingMilestone, setIsEditingMilestone] = useState(false)
  const [isEditingStage, setIsEditingStage] = useState(false)
  
  // Form states
  const [milestoneForm, setMilestoneForm] = useState({ name: "", description: "" })
  const [stageForm, setStageForm] = useState({ name: "", description: "" })

  // Get the current certification requirements from the student's progress
  const requirements = student?.progress?.requirements || []
  
  // Debug logging
  console.log("Current requirements in render:", requirements.length, requirements)

  // Move fetchStudent outside useEffect so it can be called from other functions
  const fetchStudent = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      // Fetch complete user data
      try {
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
            "Authorization": `Bearer ${token}`,
            "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
          },
          credentials: "include"
        })

        if (userResponse.ok) {
          const userData = await userResponse.json()
          console.log("User data from API:", userData)
          
          // Set user state with complete data
          setUser({
            role: userData.user.role,
            _id: userData.user._id,
            first_name: userData.user.first_name,
            last_name: userData.user.last_name,
            email: userData.user.email
          })
          
          setIsSchoolAdmin(userData.user.role === "school_admin" || userData.user.role === "sys_admin")
        } else {
          throw new Error("Failed to fetch user data")
        }
      } catch (userError) {
        console.error("Error fetching user data:", userError)
        // Fallback to localStorage
        const userRole = localStorage.getItem("userRole") || localStorage.getItem("role")
        console.log("User role from localStorage:", userRole)
        
        setUser({ role: userRole || 'student' })
        setIsSchoolAdmin(userRole === "school_admin" || userRole === "sys_admin")
      }

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
      console.log("Fetched student data:", data)
      console.log("Requirements from API:", data.progress?.requirements)
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

  useEffect(() => {
    fetchStudent()
  }, [studentId])

  // Fetch ledger when expenses tab is accessed
  useEffect(() => {
    if (activeTab === 'expenses' && user?.role === 'school_admin' && !ledger) {
      fetchLedger()
    }
  }, [activeTab, user])

  // Calculate total progress percentage
  const calculateTotalProgress = () => {
    if (!student?.progress?.requirements) return 0;
    
    const totalFlightTime = requirements.find(req => req.name === "Total Flight Time");
    if (!totalFlightTime || totalFlightTime.total_hours === 0) return 0;
    
    return Math.min(Math.round((totalFlightTime.completed_hours / totalFlightTime.total_hours) * 100), 100);
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

  // Helper functions for filtering notes
  const getAllUniqueTags = (notes: StudentNote[]) => {
    const tagSet = new Set<string>()
    notes.forEach(note => {
      note.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }

  const getNoteTypes = () => ['flight', 'ground', 'exam', 'other']

  const getFilteredNotes = (notes: StudentNote[]) => {
    return notes.filter(note => {
      // Filter by note type
      if (selectedNoteTypes.length > 0 && !selectedNoteTypes.includes(note.type)) {
        return false
      }

      // Filter by tags
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some(tag => note.tags?.includes(tag))
        if (!hasSelectedTag) return false
      }

      // Filter by privacy
      if (showPrivateOnly && !note.is_private) {
        return false
      }

      return true
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (selectedNoteTypes.length > 0) count++
    if (selectedTags.length > 0) count++
    if (showPrivateOnly) count++
    return count
  }

  const clearAllFilters = () => {
    setSelectedNoteTypes([])
    setSelectedTags([])
    setShowPrivateOnly(false)
  }

  // Fetch ledger data
  const fetchLedger = async () => {
    if (!user || user.role !== 'school_admin') return
    
    setLedgerLoading(true)
    try {
      const token = localStorage.getItem("token")
      const schoolId = localStorage.getItem("schoolId")
      
      if (!schoolId) {
        throw new Error("School ID not found")
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students/${studentId}/ledger`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch ledger')
      }

      const data = await response.json()
      setLedger(data.ledger)
    } catch (error) {
      console.error('Error fetching ledger:', error)
      toast.error('Failed to load account information')
    } finally {
      setLedgerLoading(false)
    }
  }

  // Recalculate balance function
  const recalculateBalance = async () => {
    try {
      const token = localStorage.getItem("token")
      const schoolId = localStorage.getItem("schoolId")
      
      if (!schoolId) {
        throw new Error("School ID not found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students/${studentId}/ledger/recalculate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Recalculate error:', errorData)
        // Don't throw error here as this is a background operation
      }
    } catch (error) {
      console.error('Error recalculating balance:', error)
      // Don't show user error for background recalculation
    }
  }

  // Add payment function
  const handleAddPayment = async () => {
    if (!newPayment.amount || newPayment.amount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    setIsAddingPaymentLoading(true)
    try {
      const token = localStorage.getItem("token")
      const schoolId = localStorage.getItem("schoolId")
      
      if (!schoolId) {
        throw new Error("School ID not found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students/${studentId}/ledger`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || "",
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include',
        body: JSON.stringify({
          payments: [{
            ...newPayment,
            payment_id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to add payment')
      }

      toast.success('Payment added successfully')
      
      // Reset form and refresh ledger
      setNewPayment({
        amount: 0,
        payment_method: "cash",
        notes: ""
      })
      setIsAddingPayment(false)
      
      // Recalculate balance and refresh ledger
      await recalculateBalance()
      await fetchLedger()
      
    } catch (error) {
      console.error('Error adding payment:', error)
      toast.error('Failed to add payment')
    } finally {
      setIsAddingPaymentLoading(false)
    }
  }

  const handleAddPaymentClick = () => {
    setIsAddingPayment(true)
    setNewPayment({
      amount: 0,
      payment_method: "cash",
      notes: ""
    })
  }

  // Start editing mode
  const handleStartEdit = () => {
    // Initialize editedHours with current values
    const initialHours: Record<string, number> = {}
    requirements.forEach(req => {
      initialHours[req.name] = req.completed_hours
    })
    setEditedHours(initialHours)
    setIsEditing(true)
  }

  // Start editing mode


  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  // Add a new custom requirement
  const handleAddRequirement = async () => {
    if (!newRequirement.name || newRequirement.total_hours <= 0) {
      toast.error("Please enter a valid requirement name and hours")
      return
    }

    // Check if requirement with this name already exists
    if (requirements.some(req => req.name === newRequirement.name)) {
      toast.error("A requirement with this name already exists")
      return
    }

    if (!student) {
      toast.error("Student data not found")
      return
    }

    try {
      setIsAddingRequirementLoading(true)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      // Create the new requirement object (without _id - let server generate it)
      const newReq = {
        name: newRequirement.name,
        total_hours: newRequirement.total_hours,
        completed_hours: 0,
        is_custom: true,
        type: "Custom"
      }

      // Create updated requirements array  
      const requirementsWithNew = [...requirements, newReq as Requirement]
      
      // Update Total Flight Time to reflect the new requirement
      const updatedRequirements = requirementsWithNew.map(req => {
        if (req.name === "Total Flight Time") {
          // Calculate total required hours from all OTHER requirements (excluding Total Flight Time)
          const totalRequired = requirementsWithNew
            .filter(r => r.name !== "Total Flight Time")
            .reduce((sum, r) => sum + r.total_hours, 0)
          
          // Calculate total completed hours from all OTHER requirements (excluding Total Flight Time)  
          const totalCompleted = requirementsWithNew
            .filter(r => r.name !== "Total Flight Time")
            .reduce((sum, r) => sum + r.completed_hours, 0)
            
          return {
            ...req,
            total_hours: totalRequired,
            completed_hours: totalCompleted
          }
        }
        return req
      })

      // Prepare the update payload - only send what we need to update
      const updatePayload = {
        progress: {
          requirements: updatedRequirements,
          milestones: student.progress?.milestones || [],
          stages: student.progress?.stages || [],
          lastUpdated: new Date().toISOString()
        }
      }

      console.log("Adding requirement:", newReq)
      console.log("Updated Total Flight Time after adding requirement:", 
        updatedRequirements.find(r => r.name === "Total Flight Time"))
      console.log("Add requirement payload:", updatePayload)

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
        const errorData = await response.json()
        console.error("Add requirement failed:", errorData)
        throw new Error(`Failed to add requirement: ${errorData.message || 'Unknown error'}`)
      }

      const updatedStudent = await response.json()
      console.log("Requirement added successfully:", updatedStudent)
      console.log("Updated requirements from server:", updatedStudent.progress?.requirements)
      
      // Update local state with server response
      // Ensure we preserve the progress structure
      setStudent({
        ...student,
        ...updatedStudent,
        progress: {
          ...student.progress,
          ...updatedStudent.progress,
          requirements: updatedStudent.progress?.requirements || updatedRequirements
        }
      })
      
      // Add to edited hours if in editing mode
      if (isEditing) {
        setEditedHours({
          ...editedHours,
          [newRequirement.name]: 0
        })
      }

      // Reset the form and close dialog
      setNewRequirement({ name: "", total_hours: 0 })
      setIsAddingRequirement(false)
      
      toast.success("Custom requirement added successfully")
    } catch (err) {
      console.error("Add requirement error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to add requirement')
    } finally {
      setIsAddingRequirementLoading(false)
    }
  }

  // Delete a requirement immediately
  const handleDeleteRequirement = async (requirementId: string, requirementName: string) => {
    if (!student) {
      toast.error("Student data not found")
      return
    }

    try {
      setIsDeletingRequirement(requirementId)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      // Create updated requirements array without the deleted requirement
      const filteredRequirements = requirements.filter(req => req._id !== requirementId)
      
      // Update Total Flight Time to reflect the removed requirement
      const updatedRequirements = filteredRequirements.map(req => {
        if (req.name === "Total Flight Time") {
          // Calculate total required hours from all OTHER requirements (excluding Total Flight Time)
          const totalRequired = filteredRequirements
            .filter(r => r.name !== "Total Flight Time")
            .reduce((sum, r) => sum + r.total_hours, 0)
          
          // Calculate total completed hours from all OTHER requirements (excluding Total Flight Time)  
          const totalCompleted = filteredRequirements
            .filter(r => r.name !== "Total Flight Time")
            .reduce((sum, r) => sum + r.completed_hours, 0)
            
          return {
            ...req,
            total_hours: totalRequired,
            completed_hours: totalCompleted
          }
        }
        return req
      })
      
      console.log("Before deletion - Total requirements:", requirements.length)
      console.log("After deletion - Total requirements:", updatedRequirements.length)
      console.log("Deleted requirement ID:", requirementId)
      console.log("Updated Total Flight Time after deletion:", 
        updatedRequirements.find(r => r.name === "Total Flight Time"))
      console.log("Updated requirements:", updatedRequirements)

      // Prepare the update payload - only send what we need to update
      const updatePayload = {
        progress: {
          requirements: updatedRequirements,
          milestones: student.progress?.milestones || [],
          stages: student.progress?.stages || [],
          lastUpdated: new Date().toISOString()
        }
      }

      console.log("Deleting requirement:", requirementId, requirementName)
      console.log("Current student status:", student.status)
      console.log("Full update payload:", updatePayload)

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
        const errorData = await response.json()
        console.error("Delete requirement failed:", errorData)
        throw new Error(`Failed to delete requirement: ${errorData.message || 'Unknown error'}`)
      }

      const updatedStudent = await response.json()
      console.log("Requirement deleted successfully:", updatedStudent)
      console.log("Updated requirements from server:", updatedStudent.progress?.requirements)
      
      // Update local state with server response
      // Ensure we preserve the progress structure
      setStudent({
        ...student,
        ...updatedStudent,
        progress: {
          ...student.progress,
          ...updatedStudent.progress,
          requirements: updatedStudent.progress?.requirements || updatedRequirements
        }
      })
      
      // Remove from edited hours if in editing mode
      if (isEditing) {
        const updatedHours = { ...editedHours }
        delete updatedHours[requirementName]
        setEditedHours(updatedHours)
      }
      
      toast.success("Requirement deleted successfully")
    } catch (err) {
      console.error("Delete requirement error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete requirement')
    } finally {
      setIsDeletingRequirement(null)
    }
  }

  // Toggle milestone completion - immediate API call
  const handleToggleMilestone = async (milestoneId: string, currentState: boolean) => {
    if (!user?.role || (user.role !== 'school_admin' && user.role !== 'sys_admin')) {
      toast.error("You don't have permission to modify milestones")
      return
    }
    
    if (isTogglingMilestone === milestoneId) return
    
    try {
      setIsTogglingMilestone(milestoneId)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!student) {
        throw new Error("Student data not found")
      }

      // Update milestones with new state
      const updatedMilestones = (student.progress?.milestones || []).map(milestone => ({
        ...milestone,
        completed: milestone._id === milestoneId ? !currentState : milestone.completed
      }))

      const updatePayload = {
        progress: {
          requirements: student.progress?.requirements || [],
          milestones: updatedMilestones,
          stages: student.progress?.stages || [],
          lastUpdated: new Date().toISOString()
        }
      }

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
        const errorData = await response.json()
        throw new Error(`Failed to update milestone: ${errorData.message || 'Unknown error'}`)
      }

      // Update local state
      setStudent({
        ...student,
        progress: {
          ...student.progress,
          milestones: updatedMilestones,
          lastUpdated: new Date().toISOString()
        }
      })

      // Update edited state
      setEditedMilestones({
        ...editedMilestones,
        [milestoneId]: !currentState
      })

      toast.success(`Milestone ${!currentState ? 'completed' : 'marked incomplete'}`)
    } catch (err) {
      console.error("Toggle milestone error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to update milestone')
    } finally {
      setIsTogglingMilestone(null)
    }
  }

  // Toggle stage completion - immediate API call
  const handleToggleStage = async (stageId: string, currentState: boolean) => {
    if (!user?.role || (user.role !== 'school_admin' && user.role !== 'sys_admin')) {
      toast.error("You don't have permission to modify stages")
      return
    }
    
    if (isTogglingStage === stageId) return
    
    try {
      setIsTogglingStage(stageId)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!student) {
        throw new Error("Student data not found")
      }

      // Update stages with new state
      const updatedStages = (student.progress?.stages || []).map(stage => ({
        ...stage,
        completed: stage._id === stageId ? !currentState : stage.completed
      }))

      const updatePayload = {
        progress: {
          requirements: student.progress?.requirements || [],
          milestones: student.progress?.milestones || [],
          stages: updatedStages,
          lastUpdated: new Date().toISOString()
        }
      }

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
        const errorData = await response.json()
        throw new Error(`Failed to update stage: ${errorData.message || 'Unknown error'}`)
      }

      // Update local state
      setStudent({
        ...student,
        progress: {
          ...student.progress,
          stages: updatedStages,
          lastUpdated: new Date().toISOString()
        }
      })

      // Update edited state
      setEditedStages({
        ...editedStages,
        [stageId]: !currentState
      })

      toast.success(`Stage ${!currentState ? 'completed' : 'marked incomplete'}`)
    } catch (err) {
      console.error("Toggle stage error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to update stage')
    } finally {
      setIsTogglingStage(null)
    }
  }

  // Add new milestone
  const handleAddMilestone = () => {
    if (!user?.role || (user.role !== 'school_admin' && user.role !== 'sys_admin')) {
      toast.error("You don't have permission to add milestones")
      return
    }
    setMilestoneForm({ name: "", description: "" })
    setIsAddingMilestone(true)
  }

  const handleSaveMilestone = async () => {
    if (!milestoneForm.name.trim() || !milestoneForm.description.trim()) {
      toast.error("Please fill in both name and description")
      return
    }

    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!student) {
        throw new Error("Student data not found")
      }

      const newMilestone = {
        name: milestoneForm.name.trim(),
        description: milestoneForm.description.trim(),
        order: (student.progress?.milestones?.length || 0) + 1,
        completed: false
      }

      const updatedMilestones = [...(student.progress?.milestones || []), newMilestone]

      const updatePayload = {
        progress: {
          requirements: student.progress?.requirements || [],
          milestones: updatedMilestones,
          stages: student.progress?.stages || [],
          lastUpdated: new Date().toISOString()
        }
      }

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
        const errorData = await response.json()
        throw new Error(`Failed to add milestone: ${errorData.message || 'Unknown error'}`)
      }

      // Refetch student data to get the new milestone with proper _id
      await fetchStudent()
      
      setIsAddingMilestone(false)
      setMilestoneForm({ name: "", description: "" })
      toast.success("Milestone added successfully")
    } catch (err) {
      console.error("Add milestone error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to add milestone')
    }
  }

  // Add new stage
  const handleAddStage = () => {
    if (!user?.role || (user.role !== 'school_admin' && user.role !== 'sys_admin')) {
      toast.error("You don't have permission to add stages")
      return
    }
    setStageForm({ name: "", description: "" })
    setIsAddingStage(true)
  }

  const handleSaveStage = async () => {
    if (!stageForm.name.trim() || !stageForm.description.trim()) {
      toast.error("Please fill in both name and description")
      return
    }

    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!student) {
        throw new Error("Student data not found")
      }

      const newStage = {
        name: stageForm.name.trim(),
        description: stageForm.description.trim(),
        order: (student.progress?.stages?.length || 0) + 1,
        completed: false
      }

      const updatedStages = [...(student.progress?.stages || []), newStage]

      const updatePayload = {
        progress: {
          requirements: student.progress?.requirements || [],
          milestones: student.progress?.milestones || [],
          stages: updatedStages,
          lastUpdated: new Date().toISOString()
        }
      }

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
        const errorData = await response.json()
        throw new Error(`Failed to add stage: ${errorData.message || 'Unknown error'}`)
      }

      // Refetch student data to get the new stage with proper _id
      await fetchStudent()
      
      setIsAddingStage(false)
      setStageForm({ name: "", description: "" })
      toast.success("Stage added successfully")
    } catch (err) {
      console.error("Add stage error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to add stage')
    }
  }

  // Edit milestone
  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone)
    setMilestoneForm({ name: milestone.name, description: milestone.description })
    setIsEditingMilestone(true)
  }

  const handleUpdateMilestone = async () => {
    if (!milestoneForm.name.trim() || !milestoneForm.description.trim()) {
      toast.error("Please fill in both name and description")
      return
    }

    if (!editingMilestone) return

    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!student) {
        throw new Error("Student data not found")
      }

      const updatedMilestones = (student.progress?.milestones || []).map(m => 
        m._id === editingMilestone._id 
          ? { ...m, name: milestoneForm.name.trim(), description: milestoneForm.description.trim() }
          : m
      )

      const updatePayload = {
        progress: {
          requirements: student.progress?.requirements || [],
          milestones: updatedMilestones,
          stages: student.progress?.stages || [],
          lastUpdated: new Date().toISOString()
        }
      }

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
        const errorData = await response.json()
        throw new Error(`Failed to update milestone: ${errorData.message || 'Unknown error'}`)
      }

      // Update local state immediately
      setStudent({
        ...student,
        progress: {
          ...student.progress,
          milestones: updatedMilestones,
          lastUpdated: new Date().toISOString()
        }
      })
      
      setIsEditingMilestone(false)
      setEditingMilestone(null)
      setMilestoneForm({ name: "", description: "" })
      toast.success("Milestone updated successfully")
    } catch (err) {
      console.error("Update milestone error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to update milestone')
    }
  }

  // Edit stage
  const handleEditStage = (stage: Stage) => {
    setEditingStage(stage)
    setStageForm({ name: stage.name, description: stage.description })
    setIsEditingStage(true)
  }

  const handleUpdateStage = async () => {
    if (!stageForm.name.trim() || !stageForm.description.trim()) {
      toast.error("Please fill in both name and description")
      return
    }

    if (!editingStage) return

    try {
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!student) {
        throw new Error("Student data not found")
      }

      const updatedStages = (student.progress?.stages || []).map(s => 
        s._id === editingStage._id 
          ? { ...s, name: stageForm.name.trim(), description: stageForm.description.trim() }
          : s
      )

      const updatePayload = {
        progress: {
          requirements: student.progress?.requirements || [],
          milestones: student.progress?.milestones || [],
          stages: updatedStages,
          lastUpdated: new Date().toISOString()
        }
      }

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
        const errorData = await response.json()
        throw new Error(`Failed to update stage: ${errorData.message || 'Unknown error'}`)
      }

      // Update local state immediately
      setStudent({
        ...student,
        progress: {
          ...student.progress,
          stages: updatedStages,
          lastUpdated: new Date().toISOString()
        }
      })
      
      setIsEditingStage(false)
      setEditingStage(null)
      setStageForm({ name: "", description: "" })
      toast.success("Stage updated successfully")
    } catch (err) {
      console.error("Update stage error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to update stage')
    }
  }

  // Delete milestone
  const handleDeleteMilestone = async (milestoneId: string, milestoneName: string) => {
    if (!user?.role || (user.role !== 'school_admin' && user.role !== 'sys_admin')) {
      toast.error("You don't have permission to delete milestones")
      return
    }

    if (isDeletingMilestone === milestoneId) return

    const confirmed = window.confirm(`Are you sure you want to delete the milestone "${milestoneName}"?`)
    if (!confirmed) return

    try {
      setIsDeletingMilestone(milestoneId)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!student) {
        throw new Error("Student data not found")
      }

      const updatedMilestones = (student.progress?.milestones || []).filter(m => m._id !== milestoneId)

      const updatePayload = {
        progress: {
          requirements: student.progress?.requirements || [],
          milestones: updatedMilestones,
          stages: student.progress?.stages || [],
          lastUpdated: new Date().toISOString()
        }
      }

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
        const errorData = await response.json()
        throw new Error(`Failed to delete milestone: ${errorData.message || 'Unknown error'}`)
      }

      // Update local state
      setStudent({
        ...student,
        progress: {
          ...student.progress,
          milestones: updatedMilestones,
          lastUpdated: new Date().toISOString()
        }
      })

      toast.success(`Milestone "${milestoneName}" deleted successfully`)
    } catch (err) {
      console.error("Delete milestone error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete milestone')
    } finally {
      setIsDeletingMilestone(null)
    }
  }

  // Delete stage
  const handleDeleteStage = async (stageId: string, stageName: string) => {
    if (!user?.role || (user.role !== 'school_admin' && user.role !== 'sys_admin')) {
      toast.error("You don't have permission to delete stages")
      return
    }

    if (isDeletingStage === stageId) return

    const confirmed = window.confirm(`Are you sure you want to delete the stage "${stageName}"?`)
    if (!confirmed) return

    try {
      setIsDeletingStage(stageId)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!student) {
        throw new Error("Student data not found")
      }

      const updatedStages = (student.progress?.stages || []).filter(s => s._id !== stageId)

      const updatePayload = {
        progress: {
          requirements: student.progress?.requirements || [],
          milestones: student.progress?.milestones || [],
          stages: updatedStages,
          lastUpdated: new Date().toISOString()
        }
      }

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
        const errorData = await response.json()
        throw new Error(`Failed to delete stage: ${errorData.message || 'Unknown error'}`)
      }

      // Update local state
      setStudent({
        ...student,
        progress: {
          ...student.progress,
          stages: updatedStages,
          lastUpdated: new Date().toISOString()
        }
      })

      toast.success(`Stage "${stageName}" deleted successfully`)
    } catch (err) {
      console.error("Delete stage error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete stage')
    } finally {
      setIsDeletingStage(null)
    }
  }

  // Save changes
  const handleSaveChanges = async () => {
    if (isSaving) return; // Prevent double-click
    
    try {
      setIsSaving(true);
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!student) {
        throw new Error("Student data not found")
      }

      // Update requirements with edited hours
      const updatedRequirements = requirements.map(req => ({
        ...req,
        completed_hours: editedHours[req.name] !== undefined ? editedHours[req.name] : req.completed_hours
      }));
      
      // Update milestones based on edited states
      const updatedMilestones = (student.progress?.milestones || []).map(milestone => ({
        ...milestone,
        completed: editedMilestones[milestone._id] !== undefined ? editedMilestones[milestone._id] : milestone.completed
      }));
      
      // Update stages based on edited states
      const updatedStages = (student.progress?.stages || []).map(stage => ({
        ...stage,
        completed: editedStages[stage._id] !== undefined ? editedStages[stage._id] : stage.completed
      }));

      // Prepare the update payload - only send fields that are being updated
      const updatePayload = {
        // Only send the fields we're actually updating
        stage: editedStage,
        notes: editedNotes,
        progress: {
          requirements: updatedRequirements,
          milestones: updatedMilestones,
          stages: updatedStages,
          lastUpdated: new Date().toISOString()
        }
      };

      console.log("Student status value:", student.status)
      console.log("Student status type:", typeof student.status)
      console.log("Sending update payload:", updatePayload);

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
        const errorData = await response.json()
        console.error("Update failed:", errorData)
        throw new Error(`Failed to update student: ${errorData.message || 'Unknown error'}`)
      }

      const updatedStudent = await response.json()
      console.log("Received updated student:", updatedStudent);
      
      // Update local state with the response from the server
      setStudent({
        ...student,
        ...updatedStudent,
        progress: {
          requirements: updatedRequirements,
          milestones: updatedMilestones,
          stages: updatedStages,
          lastUpdated: new Date().toISOString()
        },
        stage: editedStage,
        notes: editedNotes
      })
      
      // Clear edit state
      setIsEditing(false)
      setEditedHours({})
      setEditedMilestones({})
      setEditedStages({})
      
      toast.success("Student progress updated successfully")
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err instanceof Error ? err.message : 'Failed to update student')
    } finally {
      setIsSaving(false);
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
    if (!newNote.title?.trim() || !newNote.content?.trim()) {
      toast.error("Please fill in both title and content")
      return
    }

    if (!student) {
      toast.error("Student data not found")
      return
    }

    try {
      setIsAddingNoteLoading(true)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      // Get user info from the state
      if (!user?._id) {
        throw new Error("User information not available. Please refresh the page.")
      }

      const userId = user._id
      const userName = user.first_name && user.last_name 
        ? `${user.first_name} ${user.last_name}` 
        : user.email || "Unknown User"

      // Create the new note object
      const newNoteToAdd = {
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

      // Use simplified payload - only send what we need to update
      const updatePayload = {
        studentNotes: [...(student.studentNotes || []), newNoteToAdd]
      }

      console.log("Adding note:", newNoteToAdd)
      console.log("Update payload:", updatePayload)

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
        const errorData = await response.json()
        console.error("Add note failed:", errorData)
        throw new Error(`Failed to add note: ${errorData.message || 'Unknown error'}`)
      }

      const updatedStudent = await response.json()
      console.log("Note added successfully:", updatedStudent)

      // Update local state with server response
      setStudent({
        ...student,
        ...updatedStudent,
        studentNotes: updatedStudent.studentNotes || [...(student.studentNotes || []), {
          ...newNoteToAdd,
          _id: `temp-${Date.now()}` // Fallback if server doesn't return the note
        }]
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
      console.error("Add note error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to add note')
    } finally {
      setIsAddingNoteLoading(false)
    }
  }

  // Update the handleAddNoteClick function
  const handleAddNoteClick = () => {
    setActiveTab("notes"); // Ensure we're on the notes tab
    setIsAddingNote(true);
  };

  // Add handleDeleteNote function
  const handleDeleteNote = async (noteId: string) => {
    if (!student) {
      toast.error("Student data not found")
      return
    }

    try {
      setIsDeletingNote(noteId)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      // Filter out the note to be deleted
      const updatedNotes = student.studentNotes.filter(note => note._id !== noteId)

      // Use simplified payload - only send what we need to update
      const updatePayload = {
        studentNotes: updatedNotes
      }

      console.log("Deleting note with ID:", noteId)
      console.log("Updated notes after deletion:", updatedNotes)

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
        const errorData = await response.json()
        console.error("Delete note failed:", errorData)
        throw new Error(`Failed to delete note: ${errorData.message || 'Unknown error'}`)
      }

      const updatedStudent = await response.json()
      console.log("Note deleted successfully:", updatedStudent)

      // Update local state with server response
      setStudent({
        ...student,
        ...updatedStudent,
        studentNotes: updatedStudent.studentNotes || updatedNotes
      })

      toast.success("Training note deleted successfully")
    } catch (err) {
      console.error("Delete note error:", err)
      toast.error(err instanceof Error ? err.message : 'Failed to delete note')
    } finally {
      setIsDeletingNote(null)
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
            {student.user_id 
              ? `${student.user_id.first_name} ${student.user_id.last_name}`
              : student.contact_email}
          </CardTitle>
          <CardDescription className="text-base mt-1 text-slate-600 dark:text-slate-400">
            {student.program} • Student
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={student.status === "Active" ? "default" : "secondary"} 
            className={
              student.status === "Active" 
                ? "bg-green-500 hover:bg-green-600 text-white border-none" 
                : student.status === "On Hold"
                ? "bg-orange-500 hover:bg-orange-600 text-white border-none"
                : student.status === "Graduated"
                ? "bg-blue-500 hover:bg-blue-600 text-white border-none"
                : "bg-slate-500 hover:bg-slate-600 text-white border-none"
            }
          >
            {student.status}
          </Badge>
                    {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} className="border-slate-300 hover:border-red-500 hover:text-red-600 dark:border-slate-600 dark:hover:border-red-400 dark:hover:text-red-400">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSaveChanges} 
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="requirements" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Hour Requirements</TabsTrigger>
            <TabsTrigger value="milestones" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Milestones & Stages</TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Notes</TabsTrigger>
          {user?.role === 'school_admin' && (
            <TabsTrigger value="expenses" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">Expenses</TabsTrigger>
          )}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Overall Progress Card */}
                <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Overall Progress</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">Total flight time progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Total Flight Time</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                          {requirements.find(req => req.name === "Total Flight Time")?.completed_hours || 0} / {requirements.find(req => req.name === "Total Flight Time")?.total_hours || 0} hours
                    </span>
                  </div>
                      <Progress 
                        value={calculateTotalProgress()} 
                        className="h-3" 
                      />
                </div>
                  </CardContent>
                </Card>

                {/* Key Requirements Card */}
                <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white dark:from-green-950/20 dark:to-background">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Key Requirements</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">Essential training milestones</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {getKeyRequirements(requirements).map((req: Requirement) => (
                      <div key={req._id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{req.name}</span>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {req.completed_hours} / {req.total_hours} hours
                          </span>
                        </div>
                        <Progress 
                          value={calculateRequirementProgress(req)} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Training Status Card */}
                <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Training Status</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">Current stage and next milestone</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                <div className="space-y-2">
                      <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Current Stage</span>
                    {isEditing ? (
                      <Select value={editedStage} onValueChange={setEditedStage}>
                        <SelectTrigger className="w-[180px] h-8 border-slate-300 focus:border-blue-500 dark:border-slate-600 dark:focus:border-blue-400">
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
                          <Badge variant="outline" className="font-medium border-orange-300 text-orange-700 dark:border-orange-600 dark:text-orange-300">
                            {getCurrentStage(student?.progress?.stages)?.name || 'No stage set'}
                          </Badge>
                    )}
                  </div>
                      <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Next Milestone</span>
                        <Badge variant="secondary" className="font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {getNextMilestone(student?.progress?.milestones)?.name || 'All milestones completed'}
                        </Badge>
                  </div>
                      <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Enrollment Date</span>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {new Date(student.enrollmentDate).toLocaleDateString()}
                        </span>
                  </div>
                </div>
                  </CardContent>
                </Card>

                {/* Contact Information Card */}
                <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Contact Information</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">Student and emergency contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Email</span>
                        <a 
                          href={`mailto:${student.contact_email}`}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {student.contact_email}
                        </a>
                  </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">Phone</span>
                        <a 
                          href={`tel:${student.phone}`}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {student.phone}
                        </a>
                </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">License</span>
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">{student.license_number}</span>
                  </div>
                  </div>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-900 dark:text-white">Emergency Contact</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">Name</span>
                          <span className="text-sm text-slate-600 dark:text-slate-300">{student.emergency_contact?.name || 'Not provided'}</span>
                </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">Relationship</span>
                          <span className="text-sm text-slate-600 dark:text-slate-300">{student.emergency_contact?.relationship || 'Not provided'}</span>
              </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">Phone</span>
                          <a 
                            href={`tel:${student.emergency_contact?.phone || ''}`}
                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
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
            <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-slate-50 to-white dark:from-slate-950/20 dark:to-background">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-slate-900 dark:text-white">Hour Requirements</CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-300">Track and manage flight training requirements</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setIsAddingRequirement(true)}
                          className="flex items-center gap-2 border-slate-300 hover:border-blue-500 hover:text-blue-600 dark:border-slate-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
                        >
                          <Plus className="h-4 w-4" />
                          Add Custom
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelEdit}
                          className="flex items-center gap-2 border-slate-300 hover:border-red-500 hover:text-red-600 dark:border-slate-600 dark:hover:border-red-400 dark:hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSaveChanges}
                          disabled={isSaving}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSaving ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    ) : (
                      user && (user.role === 'school_admin' || user.role === 'sys_admin') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleStartEdit}
                          className="flex items-center gap-2 border-slate-300 hover:border-blue-500 hover:text-blue-600 dark:border-slate-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit Hours
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isAddingRequirement && (
                  <div className="p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-medium mb-4 text-slate-900 dark:text-white">Add Custom Requirement</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="requirement-name">Requirement Name</Label>
                        <Input
                          id="requirement-name"
                          value={newRequirement.name}
                          onChange={(e) => setNewRequirement({ ...newRequirement, name: e.target.value })}
                          placeholder="e.g., Mountain Flying"
                          className="border-slate-300 focus:border-blue-500 dark:border-slate-600 dark:focus:border-blue-400"
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
                          className="border-slate-300 focus:border-blue-500 dark:border-slate-600 dark:focus:border-blue-400"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => setIsAddingRequirement(false)} className="border-slate-300 hover:border-red-500 hover:text-red-600 dark:border-slate-600 dark:hover:border-red-400 dark:hover:text-red-400">
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleAddRequirement} 
                        disabled={isAddingRequirementLoading}
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white disabled:opacity-50"
                      >
                        {isAddingRequirementLoading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Requirement
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

            <div className="rounded-md border border-slate-200 dark:border-slate-700">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-800/50">
                        <TableHead className="w-[250px] font-semibold text-slate-700 dark:text-slate-300">Requirement</TableHead>
                    <TableHead className="w-[100px] text-right font-semibold text-slate-700 dark:text-slate-300">Required</TableHead>
                    <TableHead className="w-[100px] text-right font-semibold text-slate-700 dark:text-slate-300">Completed</TableHead>
                    <TableHead className="w-[100px] text-right font-semibold text-slate-700 dark:text-slate-300">Remaining</TableHead>
                        <TableHead className="w-[150px] text-right font-semibold text-slate-700 dark:text-slate-300">Progress</TableHead>
                        {isEditing && <TableHead className="w-[80px] text-right font-semibold text-slate-700 dark:text-slate-300">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                      {requirements.map((req: Requirement) => {
                        const completed = isEditing ? editedHours[req.name] || 0 : req.completed_hours
                        const remaining = Math.max(req.total_hours - completed, 0)
                        const progressPercent = Math.min(Math.round((completed / req.total_hours) * 100), 100)

                    return (
                          <TableRow key={req.name} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-slate-900 dark:text-white">
                              <div className="flex items-center gap-2">
                                {req.name}
                                {req.is_custom && (
                                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300">Custom</Badge>
                                )}
                                {req.type === "Key" && (
                                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600">Key</Badge>
                                )}
                              </div>
                        </TableCell>
                            <TableCell className="text-right font-medium text-slate-900 dark:text-white">{req.total_hours}</TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={editedHours[req.name] || 0}
                              onChange={(e) => handleHourChange(req.name, e.target.value)}
                              className="h-8 w-20 text-right border-slate-300 focus:border-blue-500 dark:border-slate-600 dark:focus:border-blue-400"
                              step="0.1"
                              min="0"
                            />
                          ) : (
                                <span className="font-medium text-slate-900 dark:text-white">{completed}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                              <span className={remaining === 0 ? "text-green-600 font-medium dark:text-green-400" : "text-slate-600 dark:text-slate-300"}>
                                {remaining}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Progress 
                                  value={progressPercent} 
                                  className="h-2 w-24"
                                />
                                <span className={`text-xs font-medium ${progressPercent === 100 ? "text-green-600 dark:text-green-400" : "text-slate-900 dark:text-white"}`}>
                                  {progressPercent}%
                                </span>
                          </div>
                        </TableCell>
                            {isEditing && (
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isDeletingRequirement === req._id}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-50"
                                  onClick={() => handleDeleteRequirement(req._id, req.name)}
                                >
                                  {isDeletingRequirement === req._id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent dark:border-red-400" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Milestones Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Training Milestones</h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Key achievements in the training program</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">
                      {student?.progress?.milestones?.filter((m: Milestone) => 
                        isEditing ? editedMilestones[m._id] !== undefined ? editedMilestones[m._id] : m.completed : m.completed
                      ).length || 0} / {student?.progress?.milestones?.length || 0} Completed
                    </Badge>
                    {(user?.role === 'school_admin' || user?.role === 'sys_admin') && (
                      <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={handleAddMilestone}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Milestone
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Milestone</DialogTitle>
                            <DialogDescription>
                              Create a new training milestone for this student.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="milestone-name">Milestone Name</Label>
                              <Input
                                id="milestone-name"
                                value={milestoneForm.name}
                                onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                                placeholder="e.g., First Solo Flight"
                              />
                            </div>
                            <div>
                              <Label htmlFor="milestone-description">Description</Label>
                              <Textarea
                                id="milestone-description"
                                value={milestoneForm.description}
                                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                                placeholder="Describe what this milestone represents..."
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsAddingMilestone(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveMilestone} className="bg-green-600 hover:bg-green-700">
                              Add Milestone
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {student?.progress?.milestones
                    ?.sort((a, b) => a.order - b.order)
                    .map((milestone, index) => {
                      const isCompleted = isEditing 
                        ? editedMilestones[milestone._id] !== undefined ? editedMilestones[milestone._id] : milestone.completed
                        : milestone.completed
                      
                      return (
                        <div 
                          key={milestone._id} 
                          className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-gradient-to-r from-green-50 to-green-100 border-green-300 shadow-md dark:from-green-900/20 dark:to-green-800/10 dark:border-green-700' 
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:hover:border-slate-600'
                          }`}
                        >
                          {/* Progress indicator line */}
                          <div className={`absolute left-0 top-0 w-1 h-full ${
                            isCompleted ? 'bg-green-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`} />
                          
                          <div className="p-6">
                            <div className="flex items-start gap-4">
                              {/* Completion Button */}
                              <button
                                onClick={() => handleToggleMilestone(milestone._id, isCompleted)}
                                disabled={isTogglingMilestone === milestone._id || (user?.role !== 'school_admin' && user?.role !== 'sys_admin')}
                                className={`flex-shrink-0 w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-200 font-bold ${
                                  isCompleted 
                                                                      ? 'bg-green-600 border-green-600 text-white shadow-lg transform scale-105' 
                                  : 'bg-white border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:shadow-md dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400 dark:hover:border-blue-400 dark:hover:text-blue-400'
                                } ${(user?.role === 'school_admin' || user?.role === 'sys_admin') ? 'cursor-pointer' : 'cursor-default'} disabled:opacity-50`}
                              >
                                {isTogglingMilestone === milestone._id ? (
                                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : isCompleted ? (
                                  <Check className="h-7 w-7" />
                                ) : (
                                  <span className="text-lg">{milestone.order}</span>
                                )}
                              </button>
                              
                              <div className="flex-grow min-w-0">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className={`text-xl font-semibold ${
                                      isCompleted 
                                        ? 'text-green-800 dark:text-green-200' 
                                        : 'text-slate-900 dark:text-white'
                                    }`}>
                                      {milestone.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                      {isCompleted ? (
                                        <Badge className="bg-green-600 text-white border-none">
                                          <Check className="h-3 w-3 mr-1" />
                                          Completed
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-slate-600 dark:text-slate-300">
                                          Pending
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Admin Actions */}
                                  {(user?.role === 'school_admin' || user?.role === 'sys_admin') && (
                                    <div className="flex items-center gap-1">
                                      <Dialog open={isEditingMilestone && editingMilestone?._id === milestone._id} onOpenChange={(open) => !open && setIsEditingMilestone(false)}>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditMilestone(milestone)}
                                            className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Edit Milestone</DialogTitle>
                                            <DialogDescription>
                                              Update the milestone details.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div>
                                              <Label htmlFor="edit-milestone-name">Milestone Name</Label>
                                              <Input
                                                id="edit-milestone-name"
                                                value={milestoneForm.name}
                                                onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                                                placeholder="e.g., First Solo Flight"
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="edit-milestone-description">Description</Label>
                                              <Textarea
                                                id="edit-milestone-description"
                                                value={milestoneForm.description}
                                                onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                                                placeholder="Describe what this milestone represents..."
                                                rows={3}
                                              />
                                            </div>
                                          </div>
                                          <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setIsEditingMilestone(false)}>
                                              Cancel
                                            </Button>
                                            <Button onClick={handleUpdateMilestone} className="bg-blue-600 hover:bg-blue-700">
                                              Update Milestone
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteMilestone(milestone._id, milestone.name)}
                                        disabled={isDeletingMilestone === milestone._id}
                                        className="h-9 w-9 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      >
                                        {isDeletingMilestone === milestone._id ? (
                                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                
                                <p className={`text-sm leading-relaxed ${
                                  isCompleted 
                                    ? 'text-green-700 dark:text-green-300' 
                                    : 'text-slate-600 dark:text-slate-300'
                                }`}>
                                  {milestone.description}
                                </p>
                                
                                {/* Action Hint for Admins - only show on first milestone */}
                                {!isCompleted && (user?.role === 'school_admin' || user?.role === 'sys_admin') && index === 0 && (
                                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                      <Target className="h-3 w-3" />
                                      Click the circle to mark as completed
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  
                  {(!student?.progress?.milestones || student.progress.milestones.length === 0) && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <Target className="h-16 w-16 mx-auto opacity-30 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No milestones yet</h3>
                      <p className="text-sm">Add training milestones to track student progress</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stages Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Training Stages</h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">Major phases of the training program</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 whitespace-nowrap">
                      {student?.progress?.stages?.filter((s: Stage) => 
                        isEditing ? editedStages[s._id] !== undefined ? editedStages[s._id] : s.completed : s.completed
                      ).length || 0} / {student?.progress?.stages?.length || 0} Completed
                    </Badge>
                    {(user?.role === 'school_admin' || user?.role === 'sys_admin') && (
                      <Dialog open={isAddingStage} onOpenChange={setIsAddingStage}>
                        <DialogTrigger asChild>
                          <Button 
                            onClick={handleAddStage}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Stage
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Stage</DialogTitle>
                            <DialogDescription>
                              Create a new training stage for this student.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="stage-name">Stage Name</Label>
                              <Input
                                id="stage-name"
                                value={stageForm.name}
                                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                                placeholder="e.g., Pre-Solo Training"
                              />
                            </div>
                            <div>
                              <Label htmlFor="stage-description">Description</Label>
                              <Textarea
                                id="stage-description"
                                value={stageForm.description}
                                onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                                placeholder="Describe what this stage involves..."
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsAddingStage(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveStage} className="bg-blue-600 hover:bg-blue-700">
                              Add Stage
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {student?.progress?.stages
                    ?.sort((a, b) => a.order - b.order)
                    .map((stage, index) => {
                      const isCompleted = isEditing 
                        ? editedStages[stage._id] !== undefined ? editedStages[stage._id] : stage.completed
                        : stage.completed
                      const isCurrentStage = !isCompleted && (index === 0 || student?.progress?.stages?.[index - 1]?.completed)
                      
                      return (
                        <div 
                          key={stage._id} 
                          className={`relative overflow-hidden rounded-lg border transition-all duration-300 ${
                            isCompleted 
                              ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 shadow-md dark:from-blue-900/20 dark:to-blue-800/10 dark:border-blue-700' 
                              : isCurrentStage
                                ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300 shadow-md ring-2 ring-orange-200 dark:from-orange-900/20 dark:to-orange-800/10 dark:border-orange-700 dark:ring-orange-800'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:hover:border-slate-600'
                          }`}
                        >
                          {/* Progress indicator line */}
                          <div className={`absolute left-0 top-0 w-1 h-full ${
                            isCompleted 
                              ? 'bg-blue-600' 
                              : isCurrentStage 
                                ? 'bg-orange-500' 
                                : 'bg-slate-300 dark:bg-slate-600'
                          }`} />
                          
                          <div className="p-6">
                            <div className="flex items-start gap-4">
                              {/* Completion Button */}
                              <button
                                onClick={() => handleToggleStage(stage._id, isCompleted)}
                                disabled={isTogglingStage === stage._id || (user?.role !== 'school_admin' && user?.role !== 'sys_admin')}
                                className={`flex-shrink-0 w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-200 font-bold ${
                                  isCompleted 
                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg transform scale-105' 
                                    : isCurrentStage
                                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                                      : 'bg-white border-slate-300 text-slate-600 hover:border-purple-500 hover:text-purple-600 hover:shadow-md dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400 dark:hover:border-purple-400 dark:hover:text-purple-400'
                                } ${(user?.role === 'school_admin' || user?.role === 'sys_admin') ? 'cursor-pointer' : 'cursor-default'} disabled:opacity-50`}
                              >
                                {isTogglingStage === stage._id ? (
                                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : isCompleted ? (
                                  <Check className="h-7 w-7" />
                                ) : isCurrentStage ? (
                                  <div className="h-4 w-4 rounded-full bg-white animate-pulse" />
                                ) : (
                                  <span className="text-lg">{stage.order}</span>
                                )}
                              </button>
                              
                              <div className="flex-grow min-w-0">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className={`text-xl font-semibold ${
                                      isCompleted 
                                        ? 'text-blue-800 dark:text-blue-200' 
                                        : isCurrentStage
                                          ? 'text-orange-800 dark:text-orange-200'
                                          : 'text-slate-900 dark:text-white'
                                    }`}>
                                      {stage.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-2">
                                      {isCompleted ? (
                                        <Badge className="bg-blue-600 text-white border-none">
                                          <Check className="h-3 w-3 mr-1" />
                                          Completed
                                        </Badge>
                                      ) : isCurrentStage ? (
                                        <Badge className="bg-orange-500 text-white border-none">
                                          <div className="h-3 w-3 rounded-full bg-white mr-1 animate-pulse" />
                                          Current Stage
                                        </Badge>
                                      ) : (
                                        <Badge variant="outline" className="text-slate-600 dark:text-slate-300">
                                          Upcoming
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Admin Actions */}
                                  {(user?.role === 'school_admin' || user?.role === 'sys_admin') && (
                                    <div className="flex items-center gap-1">
                                      <Dialog open={isEditingStage && editingStage?._id === stage._id} onOpenChange={(open) => !open && setIsEditingStage(false)}>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditStage(stage)}
                                            className="h-9 w-9 p-0 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                          <DialogHeader>
                                            <DialogTitle>Edit Stage</DialogTitle>
                                            <DialogDescription>
                                              Update the stage details.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div>
                                              <Label htmlFor="edit-stage-name">Stage Name</Label>
                                              <Input
                                                id="edit-stage-name"
                                                value={stageForm.name}
                                                onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })}
                                                placeholder="e.g., Pre-Solo Training"
                                              />
                                            </div>
                                            <div>
                                              <Label htmlFor="edit-stage-description">Description</Label>
                                              <Textarea
                                                id="edit-stage-description"
                                                value={stageForm.description}
                                                onChange={(e) => setStageForm({ ...stageForm, description: e.target.value })}
                                                placeholder="Describe what this stage involves..."
                                                rows={3}
                                              />
                                            </div>
                                          </div>
                                          <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setIsEditingStage(false)}>
                                              Cancel
                                            </Button>
                                            <Button onClick={handleUpdateStage} className="bg-purple-600 hover:bg-purple-700">
                                              Update Stage
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteStage(stage._id, stage.name)}
                                        disabled={isDeletingStage === stage._id}
                                        className="h-9 w-9 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      >
                                        {isDeletingStage === stage._id ? (
                                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                
                                <p className={`text-sm leading-relaxed ${
                                  isCompleted 
                                    ? 'text-blue-700 dark:text-blue-300' 
                                    : isCurrentStage
                                      ? 'text-orange-700 dark:text-orange-300'
                                      : 'text-slate-600 dark:text-slate-300'
                                }`}>
                                  {stage.description}
                                </p>
                                
                                {/* Action Hint for Admins - only show on first stage */}
                                {!isCompleted && (user?.role === 'school_admin' || user?.role === 'sys_admin') && index === 0 && (
                                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                      <Target className="h-3 w-3" />
                                      Click the circle to mark as completed
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  
                  {(!student?.progress?.stages || student.progress.stages.length === 0) && (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <BarChart3 className="h-16 w-16 mx-auto opacity-30 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No stages yet</h3>
                      <p className="text-sm">Add training stages to organize the program progression</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            {/* Instructor Notes */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Instructor Notes</CardTitle>
                    <CardDescription>General notes about the student's progress</CardDescription>
                  </div>
                  {!isEditing && (user?.role === 'school_admin' || user?.role === 'sys_admin') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        setEditedNotes(student.notes)
                        setIsEditing(true)
                      }}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      id="notes"
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      className="w-full min-h-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="Add notes about the student's progress..."
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setEditedNotes(student.notes)
                          setIsEditing(false)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSaving ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-muted/30 p-3 text-sm min-h-[60px] flex items-center">
                    {student.notes ? (
                      <p className="whitespace-pre-wrap">{student.notes}</p>
                    ) : (
                      <p className="text-muted-foreground italic">No instructor notes available. Click "Edit" to add notes.</p>
                    )}
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
                    <CardDescription>
                      Record of training sessions and progress notes
                      {student.studentNotes?.length > 0 && (
                        <span className="ml-2 text-xs">
                          ({getFilteredNotes(student.studentNotes).length} of {student.studentNotes.length} {student.studentNotes.length === 1 ? 'note' : 'notes'})
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.studentNotes?.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Filters
                        {getActiveFilterCount() > 0 && (
                          <Badge variant="secondary" className="h-5 w-5 p-0 text-xs rounded-full bg-blue-500 text-white">
                            {getActiveFilterCount()}
                          </Badge>
                        )}
                        <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                      </Button>
                    )}
                    {!isAddingNote && user && (user.role === 'school_admin' || user.role === 'sys_admin') && (
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
                </div>
                
                {/* Filter Panel */}
                {showFilters && student.studentNotes?.length > 0 && (
                  <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-sm text-slate-900 dark:text-white">Filter Notes</h4>
                      {getActiveFilterCount() > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="text-xs h-7 px-2"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {/* Note Types Filter */}
                      <div>
                        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                          Note Types
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {getNoteTypes().map(type => (
                            <Button
                              key={type}
                              variant={selectedNoteTypes.includes(type) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setSelectedNoteTypes(prev => 
                                  prev.includes(type) 
                                    ? prev.filter(t => t !== type)
                                    : [...prev, type]
                                )
                              }}
                              className={`h-7 text-xs capitalize ${
                                selectedNoteTypes.includes(type)
                                  ? type === 'flight' ? 'bg-blue-600 hover:bg-blue-700' :
                                    type === 'ground' ? 'bg-green-600 hover:bg-green-700' :
                                    type === 'exam' ? 'bg-purple-600 hover:bg-purple-700' :
                                    'bg-slate-600 hover:bg-slate-700'
                                  : ''
                              }`}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Tags Filter */}
                      {getAllUniqueTags(student.studentNotes).length > 0 && (
                        <div>
                          <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                            Tags ({getAllUniqueTags(student.studentNotes).length} available)
                          </Label>
                          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                            {getAllUniqueTags(student.studentNotes).map(tag => (
                              <Button
                                key={tag}
                                variant={selectedTags.includes(tag) ? "default" : "outline"}
                                size="sm"
                                onClick={() => {
                                  setSelectedTags(prev => 
                                    prev.includes(tag) 
                                      ? prev.filter(t => t !== tag)
                                      : [...prev, tag]
                                  )
                                }}
                                className="h-7 text-xs"
                              >
                                {tag}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Privacy Filter */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="show-private-only"
                          checked={showPrivateOnly}
                          onCheckedChange={(checked) => setShowPrivateOnly(checked as boolean)}
                        />
                        <Label htmlFor="show-private-only" className="text-xs text-slate-700 dark:text-slate-300">
                          Show private notes only
                        </Label>
                      </div>
                    </div>
                  </div>
                )}
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
                          disabled={isAddingNoteLoading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleAddNote}
                          disabled={isAddingNoteLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isAddingNoteLoading ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Note
                            </>
                          )}
                        </Button>
                  </div>
                </div>
              </div>
                )}
                
                {student.studentNotes?.length > 0 ? (
                  getFilteredNotes(student.studentNotes).length > 0 ? (
                    getFilteredNotes(student.studentNotes)
                    .map((note: StudentNote) => (
                    <div 
                      key={note._id} 
                      className="rounded-lg border bg-card transition-all hover:shadow-sm"
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                {note.title}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={`text-xs flex-shrink-0 ${
                                  note.type === 'flight' ? 'border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-600 dark:text-blue-300 dark:bg-blue-900/20' :
                                  note.type === 'ground' ? 'border-green-300 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-300 dark:bg-green-900/20' :
                                  note.type === 'exam' ? 'border-purple-300 text-purple-700 bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:bg-purple-900/20' :
                                  'border-slate-300 text-slate-700 bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:bg-slate-900/20'
                                }`}
                              >
                                {note.type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-medium">{note.author_name}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {note.is_private && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600">
                                Private
                              </Badge>
                            )}
                            {(user?.role === 'school_admin' || user?.role === 'sys_admin') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => handleDeleteNote(note._id)}
                                disabled={isDeletingNote === note._id}
                                title="Delete note"
                              >
                                {isDeletingNote === note._id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {note.content}
                          </p>
                        </div>

                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mr-2">
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Tags:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {note.tags.map((tag) => (
                                <Badge 
                                  key={tag} 
                                  variant="secondary" 
                                  className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
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
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 dark:bg-slate-800">
                        <Filter className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">No notes match your filters</h3>
                      <p className="text-sm text-muted-foreground mb-3">Try adjusting your filter criteria</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearAllFilters}
                        className="inline-flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear Filters
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 dark:bg-slate-800">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-1">No training history yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start tracking training progress by adding your first note</p>
                    {user && (user.role === 'school_admin' || user.role === 'sys_admin') && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddNoteClick}
                        className="inline-flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add First Note
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses Tab */}
          {user?.role === 'school_admin' && (
            <TabsContent value="expenses" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Account Balance</CardTitle>
                      <CardDescription>
                        Student account balance and transaction history
                      </CardDescription>
                    </div>
                    {!isAddingPayment && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddPaymentClick}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Payment
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {ledgerLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Loading account information...</span>
                    </div>
                  ) : ledger ? (
                    <>
                      {/* Balance Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
                          <CardContent className="p-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                                ${ledger.balance.toFixed(2)}
                              </div>
                              <div className="text-sm text-blue-600 dark:text-blue-300">Current Balance</div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
                          <CardContent className="p-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                                ${ledger.charges.reduce((sum, charge) => sum + charge.amount, 0).toFixed(2)}
                              </div>
                              <div className="text-sm text-red-600 dark:text-red-300">Total Charges</div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
                          <CardContent className="p-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                                ${ledger.payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
                              </div>
                              <div className="text-sm text-green-600 dark:text-green-300">Total Payments</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Add Payment Form */}
                      {isAddingPayment && (
                        <Card className="border-blue-200 dark:border-blue-800">
                          <CardHeader>
                            <CardTitle className="text-base">Add New Payment</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="payment-amount" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Payment Amount ($)
                                </Label>
                                <Input
                                  id="payment-amount"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={newPayment.amount || ''}
                                  onChange={(e) => setNewPayment({...newPayment, amount: parseFloat(e.target.value) || 0})}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="payment-method" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  Payment Method
                                </Label>
                                <Select
                                  value={newPayment.payment_method}
                                  onValueChange={(value) => setNewPayment({...newPayment, payment_method: value})}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="stripe">Stripe</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="check">Check</SelectItem>
                                    <SelectItem value="credit_card">Credit Card</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="payment-notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Payment Notes
                              </Label>
                              <Textarea
                                id="payment-notes"
                                placeholder="Enter payment notes..."
                                value={newPayment.notes}
                                onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsAddingPayment(false)
                                  setNewPayment({
                                    amount: 0,
                                    payment_method: "cash",
                                    notes: ""
                                  })
                                }}
                                disabled={isAddingPaymentLoading}
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleAddPayment}
                                disabled={isAddingPaymentLoading}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                {isAddingPaymentLoading ? (
                                  <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Payment
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Charges Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Charges</CardTitle>
                          <CardDescription>
                            Flight and instruction charges
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {ledger.charges.length > 0 ? (
                            <div className="space-y-3">
                              {ledger.charges.map((charge) => (
                                <div key={charge._id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="capitalize text-xs">
                                        {charge.rate_type}
                                      </Badge>
                                      <Badge 
                                        variant={charge.status === 'approved' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {charge.status}
                                      </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Flight ID: {charge.flight_schedule_id}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-red-600 dark:text-red-400">
                                      ${charge.amount.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No charges recorded</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Payments Section */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Payments</CardTitle>
                          <CardDescription>
                            Payment history and transactions
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {ledger.payments.length > 0 ? (
                            <div className="space-y-3">
                              {ledger.payments.map((payment, index) => (
                                <div key={payment._id || index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="capitalize text-xs">
                                        {payment.payment_method.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    {payment.notes && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {payment.notes}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-green-600 dark:text-green-400">
                                      ${payment.amount.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>No payments recorded</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-medium text-slate-900 dark:text-white mb-2">No account information available</h3>
                      <p className="text-sm text-muted-foreground">Account ledger has not been created yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
