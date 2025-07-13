"use client"

import { useEffect, useState } from "react"
import { GraduationCap, Clock, DollarSign, CheckCircle, MapPin, FileText, ArrowLeft, X, Pencil, Save, AlertTriangle, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Requirement {
  _id: string
  name: string
  hours: number
  type: "Key" | "Standard"
}

interface Milestone {
  _id: string
  name: string
  description: string
  order: number
}

interface Stage {
  _id: string
  name: string
  description: string
  order: number
}

interface Program {
  _id: string
  school_id: string
  program_name: string
  requirements: Requirement[]
  milestones: Milestone[]
  stages: Stage[]
  description: string
  duration: string
  cost: number
  created_at: string
  updated_at: string
}

export function SettingsPrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProgram, setEditedProgram] = useState<Program | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setSaving] = useState(false)

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      if (!apiKey) {
        throw new Error("API key is not configured")
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/programs`,
        {
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
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        })
        throw new Error(`Failed to fetch programs: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Programs data:', data)
      
      // Access the programs data from the nested data.programs property
      const programsData = data.data?.programs || []
      
      if (Array.isArray(programsData)) {
        setPrograms(programsData)
      } else {
        throw new Error("Invalid data format received from API")
      }
    } catch (err) {
      console.error("Error fetching programs:", err)
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleProgramClick = (program: Program) => {
    setSelectedProgram(program)
  }

  const handleBackToList = () => {
    setSelectedProgram(null)
    setIsEditing(false)
    setEditedProgram(null)
  }

  const handleEditClick = () => {
    if (selectedProgram) {
      setEditedProgram({...selectedProgram})
      setIsEditing(true)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedProgram(null)
  }

  const handleSaveEdit = async () => {
    if (!editedProgram) return

    try {
      setSaving(true)
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

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/programs/${editedProgram._id}`
      
      console.log('Updating program:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          program_name: editedProgram.program_name,
          description: editedProgram.description,
          duration: editedProgram.duration,
          cost: editedProgram.cost,
          requirements: editedProgram.requirements,
          milestones: editedProgram.milestones,
          stages: editedProgram.stages
        }),
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
        throw new Error(`Failed to update program: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Updated program:', data)
      
      // Update the program in the list
      setPrograms(programs.map(program => 
        program._id === editedProgram._id ? editedProgram : program
      ))
      
      // Update the selected program
      setSelectedProgram(editedProgram)
      
      // Exit edit mode
      setIsEditing(false)
      
      toast.success("Program updated successfully")
    } catch (err) {
      console.error("Error updating program:", err)
      toast.error(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProgram = async () => {
    if (!selectedProgram) return

    try {
      setIsDeleting(true)
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

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/programs/${selectedProgram._id}`
      
      console.log('Deleting program:', apiUrl)
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
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
        throw new Error(`Failed to delete program: ${response.status} ${response.statusText}`)
      }

      console.log('Program deleted successfully')
      
      // Remove the program from the list
      setPrograms(programs.filter(program => program._id !== selectedProgram._id))
      
      // Go back to list view
      setSelectedProgram(null)
      setIsEditing(false)
      setEditedProgram(null)
      
      toast.success("Program deleted successfully")
    } catch (err) {
      console.error("Error deleting program:", err)
      toast.error(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleInputChange = (field: keyof Program, value: any) => {
    if (editedProgram) {
      setEditedProgram({
        ...editedProgram,
        [field]: value
      })
    }
  }

  const handleRequirementChange = (index: number, field: keyof Requirement, value: any) => {
    if (editedProgram) {
      const updatedRequirements = [...editedProgram.requirements]
      updatedRequirements[index] = {
        ...updatedRequirements[index],
        [field]: value
      }
      setEditedProgram({
        ...editedProgram,
        requirements: updatedRequirements
      })
    }
  }

  const addRequirement = () => {
    if (editedProgram) {
      const newRequirement: Requirement = {
        _id: '', // Will be assigned by backend
        name: '',
        hours: 0,
        type: 'Standard'
      }
      setEditedProgram({
        ...editedProgram,
        requirements: [...editedProgram.requirements, newRequirement]
      })
    }
  }

  const removeRequirement = (index: number) => {
    if (editedProgram) {
      const updatedRequirements = editedProgram.requirements.filter((_, i) => i !== index)
      setEditedProgram({
        ...editedProgram,
        requirements: updatedRequirements
      })
    }
  }

  const handleMilestoneChange = (index: number, field: keyof Milestone, value: any) => {
    if (editedProgram) {
      const updatedMilestones = [...editedProgram.milestones]
      updatedMilestones[index] = {
        ...updatedMilestones[index],
        [field]: value
      }
      setEditedProgram({
        ...editedProgram,
        milestones: updatedMilestones
      })
    }
  }

  const addMilestone = () => {
    if (editedProgram) {
      const newMilestone: Milestone = {
        _id: '', // Will be assigned by backend
        name: '',
        description: '',
        order: editedProgram.milestones.length + 1
      }
      setEditedProgram({
        ...editedProgram,
        milestones: [...editedProgram.milestones, newMilestone]
      })
    }
  }

  const removeMilestone = (index: number) => {
    if (editedProgram) {
      const updatedMilestones = editedProgram.milestones.filter((_, i) => i !== index)
      // Reorder the remaining milestones
      const reorderedMilestones = updatedMilestones.map((milestone, i) => ({
        ...milestone,
        order: i + 1
      }))
      setEditedProgram({
        ...editedProgram,
        milestones: reorderedMilestones
      })
    }
  }

  const handleStageChange = (index: number, field: keyof Stage, value: any) => {
    if (editedProgram) {
      const updatedStages = [...editedProgram.stages]
      updatedStages[index] = {
        ...updatedStages[index],
        [field]: value
      }
      setEditedProgram({
        ...editedProgram,
        stages: updatedStages
      })
    }
  }

  const addStage = () => {
    if (editedProgram) {
      const newStage: Stage = {
        _id: '', // Will be assigned by backend
        name: '',
        description: '',
        order: editedProgram.stages.length + 1
      }
      setEditedProgram({
        ...editedProgram,
        stages: [...editedProgram.stages, newStage]
      })
    }
  }

  const removeStage = (index: number) => {
    if (editedProgram) {
      const updatedStages = editedProgram.stages.filter((_, i) => i !== index)
      // Reorder the remaining stages
      const reorderedStages = updatedStages.map((stage, i) => ({
        ...stage,
        order: i + 1
      }))
      setEditedProgram({
        ...editedProgram,
        stages: reorderedStages
      })
    }
  }

  useEffect(() => {
    fetchPrograms()
  }, [])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Training Programs</CardTitle>
          <CardDescription>Error loading programs data</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={fetchPrograms} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full h-full">
      {/* Main container with responsive layout */}
      <div className={`h-full ${selectedProgram ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : ''}`}>
        <Card className="h-full flex flex-col border-0 shadow-none">
          <CardHeader>
            <CardTitle>Training Programs</CardTitle>
            <CardDescription>View and manage training programs offered by your flight school.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Requirements</TableHead>
                    <TableHead>Milestones</TableHead>
                    <TableHead>Stages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-5 rounded-full" />
                            <Skeleton className="h-4 w-32 rounded" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-48 rounded" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-16 rounded" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20 rounded" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-12 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-12 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-6 w-12 rounded-full" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : programs.length > 0 ? (
                    programs.map((program) => (
                      <TableRow 
                        key={program._id}
                        className={`cursor-pointer hover:bg-muted/50 ${
                          selectedProgram?._id === program._id ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => handleProgramClick(program)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{program.program_name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={program.description}>
                            {program.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{program.duration}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{formatCurrency(program.cost)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {program.requirements.length} total
                            </Badge>
                            <div className="flex gap-1">
                              {program.requirements.filter(r => r.type === "Key").length > 0 && (
                                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800">
                                  {program.requirements.filter(r => r.type === "Key").length} key
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs">
                              {program.milestones.length}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <Badge variant="outline" className="text-xs">
                              {program.stages.length}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 py-6">
                          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/20">
                            <GraduationCap className="h-8 w-8 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No programs found</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                              No training programs have been set up for your flight school yet.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {selectedProgram && (
          <Card className="h-full">
            <CardHeader className="border-b dark:border-muted-foreground/20 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Program Details</CardTitle>
                  <CardDescription className="text-sm">
                    {selectedProgram.program_name} • {selectedProgram.duration} • {formatCurrency(selectedProgram.cost)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            className="flex items-center gap-2"
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-md">
                          <AlertDialogHeader>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                                <Trash2 className="h-5 w-5 text-destructive" />
                              </div>
                              <div>
                                <AlertDialogTitle className="text-lg font-semibold">Delete Program</AlertDialogTitle>
                              </div>
                            </div>
                            <AlertDialogDescription className="text-sm text-muted-foreground mt-4">
                              Are you sure you want to delete this training program? This action cannot be undone and will permanently remove all program data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          
                          {/* Program Details Card */}
                          <div className="my-4 p-4 rounded-lg bg-muted/30 border border-muted">
                            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              Program Details
                            </h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Name:</span>
                                <span className="font-medium">{selectedProgram.program_name}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Duration:</span>
                                <span className="font-medium">{selectedProgram.duration}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Cost:</span>
                                <span className="font-medium">{formatCurrency(selectedProgram.cost)}</span>
                              </div>
                            </div>
                          </div>

                          <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="flex-1">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDeleteProgram}
                              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/50"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <>
                                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Program
                                </>
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleCancelEdit}
                        className="dark:border-muted-foreground/20"
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2 dark:border-muted-foreground/20"
                        onClick={handleEditClick}
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleBackToList}
                        className="hover:bg-muted dark:hover:bg-muted/30"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {isEditing && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Note: Updating a program does not affect students already assigned to this program. Changes will only apply to new enrollments.
                  </AlertDescription>
                </Alert>
              )}
              
              {isEditing ? (
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#b3c6ff]/20 to-[#809fff]/20 dark:from-[#3366ff]/20 dark:to-[#3366ff]/10 rounded-lg border border-[#809fff]/30 dark:border-[#3366ff]/30">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3366ff]/10 dark:bg-[#3366ff]/20">
                        <GraduationCap className="h-4 w-4 text-[#3366ff] dark:text-[#3366ff]" strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-[#3366ff] dark:text-[#b3c6ff]">Basic Information</h3>
                        <p className="text-xs text-[#3366ff]/80 dark:text-[#809fff]">Program name, description, duration, and cost</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2 p-3 rounded-md bg-card border">
                        <Label htmlFor="program_name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Program Name</Label>
                        <Input
                          id="program_name"
                          value={editedProgram?.program_name || ''}
                          onChange={(e) => handleInputChange('program_name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-2 p-3 rounded-md bg-card border">
                        <Label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</Label>
                        <Textarea
                          id="description"
                          value={editedProgram?.description || ''}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          className="min-h-20 text-sm"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2 p-3 rounded-md bg-card border">
                          <Label htmlFor="duration" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration</Label>
                          <Input
                            id="duration"
                            value={editedProgram?.duration || ''}
                            onChange={(e) => handleInputChange('duration', e.target.value)}
                            className="h-8 text-sm"
                            placeholder="e.g., 6 months"
                          />
                        </div>
                        <div className="space-y-2 p-3 rounded-md bg-card border">
                          <Label htmlFor="cost" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost ($)</Label>
                          <Input
                            id="cost"
                            type="number"
                            min="0"
                            value={editedProgram?.cost || 0}
                            onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 dark:bg-emerald-400/10">
                        <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                      </div>
                                             <div className="flex-1">
                         <h3 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Requirements</h3>
                         <p className="text-xs text-emerald-700 dark:text-emerald-300">{editedProgram?.requirements.length || 0} total requirements</p>
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                       {editedProgram?.requirements.map((requirement, index) => (
                        <div key={requirement._id} className="flex items-center justify-between p-3 rounded-md bg-card border">
                          <div className="flex-1">
                            <Input
                              value={requirement.name}
                              onChange={(e) => handleRequirementChange(index, 'name', e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Input
                              type="number"
                              min="0"
                              value={requirement.hours}
                              onChange={(e) => handleRequirementChange(index, 'hours', parseFloat(e.target.value) || 0)}
                              className="h-8 text-sm mt-1"
                            />
                          </div>
                                                     <div className="flex items-center gap-2">
                             <Select value={requirement.type} onValueChange={(value) => handleRequirementChange(index, 'type', value as "Key" | "Standard")}>
                               <SelectTrigger className="h-8 w-[100px] text-xs">
                                 <SelectValue placeholder="Select type" />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="Key">Key</SelectItem>
                                 <SelectItem value="Standard">Standard</SelectItem>
                               </SelectContent>
                             </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRequirement(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addRequirement}
                        className="w-full text-xs"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Requirement
                      </Button>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 dark:bg-amber-400/10">
                        <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                      </div>
                                             <div className="flex-1">
                         <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100">Milestones</h3>
                         <p className="text-xs text-amber-700 dark:text-amber-300">{editedProgram?.milestones.length || 0} key milestones</p>
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                       {editedProgram?.milestones.map((milestone, index) => (
                        <div key={milestone._id} className="flex items-start justify-between p-3 rounded-md bg-card border">
                          <div className="flex-1">
                            <Input
                              value={milestone.name}
                              onChange={(e) => handleMilestoneChange(index, 'name', e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Textarea
                              value={milestone.description}
                              onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                              className="min-h-10 text-sm mt-1"
                              rows={1}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMilestone(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addMilestone}
                        className="w-full text-xs"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Milestone
                      </Button>
                    </div>
                  </div>

                  {/* Stages */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-lg border border-violet-100 dark:border-violet-800/30">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 dark:bg-violet-400/10">
                        <MapPin className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                      </div>
                                             <div className="flex-1">
                         <h3 className="text-sm font-medium text-violet-900 dark:text-violet-100">Training Stages</h3>
                         <p className="text-xs text-violet-700 dark:text-violet-300">{editedProgram?.stages.length || 0} training stages</p>
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                       {editedProgram?.stages.map((stage, index) => (
                        <div key={stage._id} className="flex items-start justify-between p-3 rounded-md bg-card border">
                          <div className="flex-1">
                            <Input
                              value={stage.name}
                              onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Textarea
                              value={stage.description}
                              onChange={(e) => handleStageChange(index, 'description', e.target.value)}
                              className="min-h-10 text-sm mt-1"
                              rows={1}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStage(index)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addStage}
                        className="w-full text-xs"
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Stage
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[#b3c6ff]/20 to-[#809fff]/20 dark:from-[#3366ff]/20 dark:to-[#3366ff]/10 rounded-lg border border-[#809fff]/30 dark:border-[#3366ff]/30">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#3366ff]/10 dark:bg-[#3366ff]/20">
                        <GraduationCap className="h-4 w-4 text-[#3366ff] dark:text-[#3366ff]" strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-[#3366ff] dark:text-[#b3c6ff]">Program Information</h3>
                        <p className="text-xs text-[#3366ff]/80 dark:text-[#809fff]">Basic program details</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1 p-3 rounded-md bg-card border">
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</h4>
                        <p className="text-sm text-foreground">{selectedProgram.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 p-3 rounded-md bg-card border">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration</h4>
                          <p className="text-sm font-semibold text-foreground">{selectedProgram.duration}</p>
                        </div>
                        <div className="space-y-1 p-3 rounded-md bg-card border">
                          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cost</h4>
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(selectedProgram.cost)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Requirements */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 dark:bg-emerald-400/10">
                        <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Requirements</h3>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">{selectedProgram.requirements.length} total requirements</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedProgram.requirements.map((requirement) => (
                        <div key={requirement._id} className="flex items-center justify-between p-3 rounded-md bg-card border">
                          <div>
                            <p className="text-sm font-medium">{requirement.name}</p>
                            <p className="text-xs text-muted-foreground">{requirement.hours} hours</p>
                          </div>
                          <Badge variant={requirement.type === "Key" ? "default" : "outline"} className="text-xs">
                            {requirement.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Milestones */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-lg border border-amber-100 dark:border-amber-800/30">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 dark:bg-amber-400/10">
                        <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-amber-900 dark:text-amber-100">Milestones</h3>
                        <p className="text-xs text-amber-700 dark:text-amber-300">{selectedProgram.milestones.length} key milestones</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedProgram.milestones.map((milestone) => (
                        <div key={milestone._id} className="flex items-start justify-between p-3 rounded-md bg-card border">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{milestone.name}</p>
                            <p className="text-xs text-muted-foreground">{milestone.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2">
                            {milestone.order}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Stages */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 rounded-lg border border-violet-100 dark:border-violet-800/30">
                      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 dark:bg-violet-400/10">
                        <MapPin className="h-4 w-4 text-violet-600 dark:text-violet-400" strokeWidth={2} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-violet-900 dark:text-violet-100">Training Stages</h3>
                        <p className="text-xs text-violet-700 dark:text-violet-300">{selectedProgram.stages.length} training stages</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedProgram.stages.map((stage) => (
                        <div key={stage._id} className="flex items-start justify-between p-3 rounded-md bg-card border">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{stage.name}</p>
                            <p className="text-xs text-muted-foreground">{stage.description}</p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2">
                            Stage {stage.order}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 