"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Save, X, Edit3 } from "lucide-react"
import { toast } from "sonner"

import { MainNav } from "@/components/main-nav-new"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface UserProfile {
  _id: string
  email: string
  first_name: string
  last_name: string
  role: string
  organization_id?: string
  phone?: string
  createdAt: string
  updatedAt: string
  organization?: {
    _id: string
    name: string
    type: string
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
    website: string
  }
}

export function AccountSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: ""
  })

  useEffect(() => {
    const checkAuthAndFetchUser = async () => {
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

        const data: any = await response.json()
        
        // Check for success response format
        if (!data.success || !data.data?.user) {
          console.error("Invalid user data response:", data)
          throw new Error("Invalid user data response")
        }

        const user = data.data.user
        
        if (!user || !user._id) {
          console.error("Invalid user data:", user)
          throw new Error("Invalid user data response")
        }

        setUserData(user)
        setFormData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          phone: user.phone || ""
        })
      } catch (error) {
        console.error("Failed to fetch user data:", error)
        toast.error("Failed to load user information")
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndFetchUser()
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!userData) return

    // Basic validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("First name and last name are required")
      return
    }

    if (!formData.email.trim()) {
      toast.error("Email is required")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return
    }

    try {
      setSaving(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/update-profile`, {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim()
        }),
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to update profile: ${response.status}`)
      }

      const updatedUserData = await response.json()
      
      // Handle response format - check for success
      if (updatedUserData.success && updatedUserData.data?.user) {
        const updatedUser = updatedUserData.data.user
        setUserData(updatedUser)
      } else {
        // If no specific user data returned, just update the current data with form values
        setUserData(prev => ({
          ...prev!,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone
        }))
      }
      setEditing(false)
      toast.success("Profile updated successfully!")
      
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!userData) return
    
    // Reset form data to original values
    setFormData({
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
      email: userData.email || "",
      phone: userData.phone || ""
    })
    setEditing(false)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not available'
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'school_admin':
        return 'School Administrator'
      case 'sys_admin':
        return 'System Administrator'
      case 'instructor':
        return 'Instructor'
      case 'student':
        return 'Student'
      default:
        return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <MainNav />
        </div>
        <div className="flex min-h-screen items-center justify-center pt-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-lg mb-4 animate-pulse">
              <User className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Loading Account Settings</h2>
            <p className="text-muted-foreground">Please wait while we fetch your information...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <MainNav />
        </div>
        <div className="flex min-h-screen items-center justify-center pt-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-destructive rounded-lg mb-4">
              <X className="h-6 w-6 text-destructive-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Unable to Load Account</h2>
            <p className="text-muted-foreground mb-6">We couldn't fetch your account information. Please try refreshing the page.</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MainNav />
      </div>

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-lg">
                <User className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
                <p className="text-muted-foreground">
                  Manage your personal information and preferences
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details
                    </CardDescription>
                  </div>
                  {!editing ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    {editing ? (
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md">
                        {userData.first_name || 'Not set'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    {editing ? (
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <div className="p-3 bg-muted rounded-md">
                        {userData.last_name || 'Not set'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  {editing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md">
                      {userData.email || 'Not set'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  {editing ? (
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="p-3 bg-muted rounded-md">
                      {userData.phone || 'Not set'}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <div className="p-3 bg-muted rounded-md text-muted-foreground">
                    {getRoleDisplayName(userData.role)}
                  </div>
                </div>
              </CardContent>

              {editing && (
                <CardFooter className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Account Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Account Information</CardTitle>
                <CardDescription>
                  View your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Account Created</Label>
                    <div className="p-3 bg-muted rounded-md text-muted-foreground">
                      {formatDate(userData.createdAt)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Last Updated</Label>
                    <div className="p-3 bg-muted rounded-md text-muted-foreground">
                      {formatDate(userData.updatedAt)}
                    </div>
                  </div>
                </div>

                {userData.organization && (
                  <div className="space-y-2">
                    <Label>Organization</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <div className="font-medium">{userData.organization.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {userData.organization.address.city}, {userData.organization.address.state}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 