"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Clock, Award, ChevronRight, AlertCircle } from "lucide-react"

interface Requirement {
  _id: string
  name: string
  total_hours: number
  completed_hours: number
  type: "Standard" | "Key" // This needs to match exactly
}

interface Milestone {
  _id: string
  name: string
  description: string
  order: number
  completed: boolean
}

interface Stage {
  _id: string
  name: string
  description: string
  order: number
  completed: boolean
}

interface StudentProgress {
  requirements: Requirement[]
  milestones: Milestone[]
  stages: Stage[]
  lastUpdated: string
}

interface StudentData {
  _id: string
  organization_id: string
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
  progress: StudentProgress
  studentNotes: any[]
  created_at: string
  updated_at: string
  __v?: number
}

interface StudentProgressOverviewProps {
  studentId: string
  organizationId: string
  compact?: boolean // Add a compact mode option
}

export function StudentProgressOverview({ 
  studentId, 
  organizationId,
  compact = false // Default to full view
}: StudentProgressOverviewProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [studentData, setStudentData] = useState<StudentData | null>(null)

  useEffect(() => {
    if (!studentId || !organizationId) {
      setError("Student ID and Organization ID are required")
      setLoading(false)
      return
    }

    const fetchStudentData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // In development, we might not have a token
        const token = localStorage.getItem("token") || "dev-token"
        
        // Get API URL from environment variable
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL
        if (!apiBaseUrl) {
          throw new Error("API URL not configured. Please set NEXT_PUBLIC_API_URL environment variable.")
        }
        
        // Construct the full API URL
        const apiUrl = `${apiBaseUrl}/organizations/${organizationId}/students/${studentId}`
        console.log("Fetching student data from:", apiUrl)
        
        // Prepare headers with API key
        const headers: Record<string, string> = {
          "Content-Type": "application/json"
        }
        
        // Add API key from environment variable
        const apiKey = process.env.NEXT_PUBLIC_API_KEY
        if (!apiKey) {
          console.warn("API key not configured. Please set NEXT_PUBLIC_API_KEY environment variable.")
        } else {
          headers["x-api-key"] = apiKey
        }
        
        // Add authentication token
        if (token) {
          headers["Authorization"] = `Bearer ${token}`
        }
        
        // Add CSRF token if available
        const csrfToken = localStorage.getItem("csrfToken")
        if (csrfToken) {
          headers["X-CSRF-Token"] = csrfToken
        }
        
        console.log("Request headers:", Object.keys(headers))
        
        const response = await fetch(apiUrl, {
          headers,
          credentials: "include"
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("API error response:", errorText)
          throw new Error(`Failed to fetch student data: ${response.status} ${response.statusText}`)
        }

        const result = await response.json()
        
        // Debug the API response
        console.log("API Response:", result)
        
        if (!result.success || !result.data) {
          throw new Error("Invalid API response format")
        }
        
        // Ensure the API data has the correct type for requirements
        const typedData: StudentData = {
          ...result.data,
          progress: {
            ...result.data.progress,
            requirements: result.data.progress.requirements.map((req: any) => ({
              ...req,
              type: req.type as "Standard" | "Key" // Cast to the correct type
            }))
          }
        };
        
        setStudentData(typedData)
      } catch (err) {
        console.error("Error fetching student data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
        
        // Dispatch a custom event for parent components to listen for errors
        const errorEvent = new CustomEvent('student-progress-error', { 
          detail: { message: err instanceof Error ? err.message : "An unknown error occurred" }
        });
        window.dispatchEvent(errorEvent);
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [studentId, organizationId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading student progress...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No student data available</p>
        </div>
      </div>
    )
  }

  // Calculate overall progress percentage
  const calculateOverallProgress = () => {
    if (!studentData || !studentData.progress.requirements.length) return 0
    
    const totalRequired = studentData.progress.requirements.reduce(
      (sum, req) => sum + req.total_hours, 0
    )
    
    const totalCompleted = studentData.progress.requirements.reduce(
      (sum, req) => sum + req.completed_hours, 0
    )
    
    // Debug progress calculation
    console.log("Total required hours:", totalRequired)
    console.log("Total completed hours:", totalCompleted)
    
    return totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
  
  // Get zero progress message
  const getZeroProgressMessage = () => {
    if (!studentData) return ""
    
    const hasProgress = studentData.progress.requirements.some(req => req.completed_hours > 0)
    if (!hasProgress) {
      return "No flight hours logged yet"
    }
    return ""
  }

  // If compact mode is enabled, show a simplified version
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Program Progress</span>
            <Badge variant={studentData?.status === "Active" ? "default" : "outline"}>
              {studentData?.status}
            </Badge>
          </CardTitle>
          <CardDescription>{studentData?.program}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{calculateOverallProgress()}%</span>
              </div>
              <Progress value={calculateOverallProgress()} className="h-2" />
              {getZeroProgressMessage() && (
                <p className="text-xs text-muted-foreground mt-1 text-center">{getZeroProgressMessage()}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Current Stage</span>
                <span className="text-sm font-medium">{studentData?.stage}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">Next Milestone</span>
                <span className="text-sm font-medium">{studentData?.nextMilestone}</span>
              </div>
            </div>
            
            {/* Key requirements */}
            <div className="pt-1">
              <h4 className="text-xs font-medium mb-2">Key Requirements</h4>
              <div className="space-y-2">
                {studentData?.progress.requirements
                  .filter(req => req.type === "Key")
                  .slice(0, 2)
                  .map(req => (
                    <div key={req._id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{req.name}</span>
                        <span>{req.completed_hours}/{req.total_hours} hrs</span>
                      </div>
                      <Progress 
                        value={(req.completed_hours / req.total_hours) * 100} 
                        className="h-1.5"
                      />
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full view (default)
  return (
    <div className="space-y-6">
      {/* Header with student info and overall progress */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center justify-between">
              <span>Program Progress</span>
              <Badge variant={studentData?.status === "Active" ? "default" : "outline"}>
                {studentData?.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {studentData?.program}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Overall Progress</span>
                  <span className="font-medium">{calculateOverallProgress()}%</span>
                </div>
                <Progress value={calculateOverallProgress()} className="h-2" />
                {getZeroProgressMessage() && (
                  <p className="text-xs text-muted-foreground mt-1 text-center">{getZeroProgressMessage()}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Current Stage</span>
                  <span className="font-medium">{studentData?.stage}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Next Milestone</span>
                  <span className="font-medium">{studentData?.nextMilestone}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Enrolled</span>
                  <span className="font-medium">{studentData?.enrollmentDate ? formatDate(studentData.enrollmentDate) : 'N/A'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">License #</span>
                  <span className="font-medium font-mono">{studentData?.license_number}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed progress tabs */}
      <Tabs defaultValue="requirements" className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="requirements">Flight Requirements</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="stages">Stages</TabsTrigger>
        </TabsList>
        
        {/* Flight Requirements Tab */}
        <TabsContent value="requirements">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Flight Requirements</CardTitle>
              <CardDescription>
                Track your progress toward required flight hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getZeroProgressMessage() ? (
                <div className="py-6 text-center">
                  <p className="text-muted-foreground">{getZeroProgressMessage()}</p>
                  <p className="text-sm text-muted-foreground mt-1">Flight hours will appear here as they are logged.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentData?.progress.requirements.map((req) => {
                    // Calculate percentage and ensure it's between 0-100
                    const percentage = req.total_hours > 0 
                      ? Math.min(Math.max(Math.round((req.completed_hours / req.total_hours) * 100), 0), 100)
                      : 0;
                      
                    return (
                      <div key={req._id} className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{req.name}</span>
                            {req.type === "Key" && (
                              <Badge variant="secondary" className="text-xs">Key Requirement</Badge>
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {req.completed_hours} / {req.total_hours} hours
                          </span>
                        </div>
                        <Progress 
                          value={percentage}
                          className={`h-2 ${req.type === "Key" ? "bg-muted/70" : "bg-muted/40"}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Last updated: {studentData?.progress.lastUpdated ? formatDate(studentData.progress.lastUpdated) : 'N/A'}
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Training Milestones</CardTitle>
              <CardDescription>
                Key achievements in your training program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentData?.progress.milestones
                  .sort((a, b) => a.order - b.order)
                  .map((milestone) => (
                    <div 
                      key={milestone._id} 
                      className={`p-4 rounded-lg border flex items-center justify-between ${
                        milestone.completed 
                          ? "bg-primary/5 border-primary/20" 
                          : "bg-background border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {milestone.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">{milestone.name}</div>
                          <div className="text-sm text-muted-foreground">{milestone.description}</div>
                        </div>
                      </div>
                      {milestone.completed && (
                        <Badge variant="outline" className="bg-primary/10">Completed</Badge>
                      )}
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Stages Tab */}
        <TabsContent value="stages">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Training Stages</CardTitle>
              <CardDescription>
                Your progression through training phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Stage progression line */}
                <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-muted-foreground/20 z-0"></div>
                
                <div className="space-y-6 relative z-10">
                  {studentData?.progress.stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage, index) => {
                      // Find the first incomplete stage
                      const firstIncompleteStage = studentData.progress.stages
                        .sort((a, b) => a.order - b.order)
                        .find(s => !s.completed);
                      
                      const isCurrentStage = !stage.completed && 
                        (!firstIncompleteStage || stage._id === firstIncompleteStage._id);
                      
                      return (
                        <div 
                          key={stage._id} 
                          className="flex items-start gap-4"
                        >
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            stage.completed 
                              ? "bg-primary text-primary-foreground" 
                              : isCurrentStage
                                ? "bg-primary/20 text-primary border border-primary"
                                : "bg-muted text-muted-foreground"
                          }`}>
                            {stage.completed ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <span>{stage.order}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className={`p-4 rounded-lg border ${
                              stage.completed 
                                ? "bg-primary/5 border-primary/20" 
                                : isCurrentStage
                                  ? "bg-primary/5 border-primary/20"
                                  : "bg-muted/5 border-border"
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{stage.name}</span>
                                {stage.completed && (
                                  <Badge variant="outline" className="bg-primary/10">Completed</Badge>
                                )}
                                {isCurrentStage && !stage.completed && (
                                  <Badge variant="outline" className="bg-primary/10">Current</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">{stage.description}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 