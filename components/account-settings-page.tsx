"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, Save, X, Edit3, Shield, Smartphone, Key, Download, Copy, Check, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { MainNav } from "@/components/main-nav-new"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  mfaEnabled?: boolean
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

interface MFASetupResponse {
  success: boolean
  message: string
  data: {
    qrCode: string
    qrCodeType: string
    backupCodes: string[]
    secret: string
    instructions: string[]
  }
}

interface MFAVerifyResponse {
  success: boolean
  message: string
  data: {
    mfaEnabled: boolean
    mfaVerified: boolean
  }
}

interface MFADisableResponse {
  success: boolean
  message: string
  data: {
    mfaEnabled: boolean
  }
}

interface MFAStatusResponse {
  success: boolean
  message: string
  data: {
    mfaEnabled: boolean
    mfaVerified?: boolean
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

  // MFA related state
  const [mfaSetupOpen, setMfaSetupOpen] = useState(false)
  const [mfaDisableOpen, setMfaDisableOpen] = useState(false)
  const [mfaData, setMfaData] = useState<MFASetupResponse | null>(null)
  const [mfaToken, setMfaToken] = useState("")
  const [mfaDisableToken, setMfaDisableToken] = useState("")
  const [mfaLoading, setMfaLoading] = useState(false)
  const [mfaVerifying, setMfaVerifying] = useState(false)
  const [mfaDisabling, setMfaDisabling] = useState(false)
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())

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

        // Fetch MFA status
        await fetchMFAStatus()
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
      case 'member':
        return 'Member'
      case 'club_admin':
        return 'Club Administrator'
      default:
        return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }

  const fetchMFAStatus = async () => {
    try {
      const token = localStorage.getItem("token")
      
      if (!token) {
        console.warn("No authentication token found for MFA status check")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/mfa/status`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
        },
        credentials: "include"
      })

      if (!response.ok) {
        // Don't throw error for MFA status check failure - it's not critical
        console.warn(`Failed to fetch MFA status: ${response.status}`)
        return
      }

      const statusResponse: MFAStatusResponse = await response.json()
      
      if (statusResponse.success && statusResponse.data) {
        // Update user data with accurate MFA status
        setUserData(prev => prev ? { 
          ...prev, 
          mfaEnabled: statusResponse.data.mfaEnabled 
        } : null)
      }
      
    } catch (error) {
      console.warn("Error fetching MFA status:", error)
      // Don't show error toast for this - it's not critical to page functionality
    }
  }

  const handleMFASetup = async () => {
    try {
      setMfaLoading(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/mfa/setup`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
        },
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to setup MFA: ${response.status}`)
      }

      const mfaResponse: MFASetupResponse = await response.json()
      
      if (mfaResponse.success) {
        setMfaData(mfaResponse)
        setMfaSetupOpen(true)
        toast.success("MFA setup initiated successfully!")
      } else {
        throw new Error(mfaResponse.message || "Failed to setup MFA")
      }
      
    } catch (error) {
      console.error("Error setting up MFA:", error)
      toast.error(error instanceof Error ? error.message : "Failed to setup MFA")
    } finally {
      setMfaLoading(false)
    }
  }

  const handleMFAVerify = async () => {
    if (!mfaToken || mfaToken.length !== 6) {
      toast.error("Please enter a valid 6-digit code")
      return
    }

    try {
      setMfaVerifying(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/mfa/verify`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          token: mfaToken
        }),
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to verify MFA: ${response.status}`)
      }

      const verifyResponse: MFAVerifyResponse = await response.json()
      
      if (verifyResponse.success && verifyResponse.data.mfaEnabled) {
        setUserData(prev => prev ? { ...prev, mfaEnabled: true } : null)
        setMfaSetupOpen(false)
        setMfaData(null)
        setMfaToken("")
        toast.success("MFA enabled successfully!")
      } else {
        throw new Error(verifyResponse.message || "Failed to verify MFA")
      }
      
    } catch (error) {
      console.error("Error verifying MFA:", error)
      toast.error(error instanceof Error ? error.message : "Failed to verify MFA")
    } finally {
      setMfaVerifying(false)
    }
  }

  const copyToClipboard = async (text: string, itemKey: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItems(prev => new Set(prev).add(itemKey))
      toast.success("Copied to clipboard!")
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemKey)
          return newSet
        })
      }, 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
      toast.error("Failed to copy to clipboard")
    }
  }

  const downloadBackupCodes = () => {
    if (!mfaData?.data.backupCodes) return
    
    const codesText = mfaData.data.backupCodes.join('\n')
    const blob = new Blob([`Albatross MFA Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\n${codesText}\n\nKeep these codes safe and secure. Each code can only be used once.`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'albatross-mfa-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Backup codes downloaded!")
  }

  const handleMFADisable = async () => {
    if (!mfaDisableToken || mfaDisableToken.length !== 6) {
      toast.error("Please enter a valid 6-digit code")
      return
    }

    try {
      setMfaDisabling(true)
      const token = localStorage.getItem("token")
      
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/mfa/disable`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
        },
        body: JSON.stringify({
          token: mfaDisableToken
        }),
        credentials: "include"
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Failed to disable MFA: ${response.status}`)
      }

      const disableResponse: MFADisableResponse = await response.json()
      
      if (disableResponse.success && !disableResponse.data.mfaEnabled) {
        setUserData(prev => prev ? { ...prev, mfaEnabled: false } : null)
        setMfaDisableOpen(false)
        setMfaDisableToken("")
        toast.success("MFA disabled successfully!")
      } else {
        throw new Error(disableResponse.message || "Failed to disable MFA")
      }
      
    } catch (error) {
      console.error("Error disabling MFA:", error)
      toast.error(error instanceof Error ? error.message : "Failed to disable MFA")
    } finally {
      setMfaDisabling(false)
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
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 bg-foreground rounded-lg">
                <User className="h-5 w-5 text-background" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Account Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your personal information and preferences
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Personal Information Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium">Personal Information</CardTitle>
                    <CardDescription className="text-sm">
                      Update your personal details
                    </CardDescription>
                  </div>
                  {!editing ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="h-8 text-xs"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium text-foreground">First Name</Label>
                    {editing ? (
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="Enter your first name"
                        className="border-border/40 focus:border-border"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-muted/50 rounded-md text-sm">
                        {userData.first_name || 'Not set'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium text-foreground">Last Name</Label>
                    {editing ? (
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Enter your last name"
                        className="border-border/40 focus:border-border"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-muted/50 rounded-md text-sm">
                        {userData.last_name || 'Not set'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</Label>
                  {editing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email address"
                      className="border-border/40 focus:border-border"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-muted/50 rounded-md text-sm">
                      {userData.email || 'Not set'}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number (Optional)</Label>
                    {editing ? (
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        className="border-border/40 focus:border-border"
                      />
                    ) : (
                      <div className="px-3 py-2 bg-muted/50 rounded-md text-sm">
                        {userData.phone || 'Not set'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Role</Label>
                    <div className="px-3 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                      {getRoleDisplayName(userData.role)}
                    </div>
                  </div>
                </div>
              </CardContent>

              {editing && (
                <CardFooter className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                    size="sm"
                    className="h-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                    className="h-8"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              )}
            </Card>

            {/* Account Information Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium">Account Information</CardTitle>
                <CardDescription className="text-sm">
                  View your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Account Created</Label>
                    <div className="px-3 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                      {formatDate(userData.createdAt)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Last Updated</Label>
                    <div className="px-3 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
                      {formatDate(userData.updatedAt)}
                    </div>
                  </div>
                </div>

                {userData.organization && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Organization</Label>
                    <div className="px-3 py-2 bg-muted/50 rounded-md">
                      <div className="font-medium text-sm">{userData.organization.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {userData.organization.address.city}, {userData.organization.address.state}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Settings Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Security Settings
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Manage your account security and two-factor authentication
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-background rounded-lg border border-border/40">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">Two-Factor Authentication</div>
                      <div className="text-xs text-muted-foreground">
                        Add an extra layer of security to your account
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {userData.mfaEnabled ? (
                      <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                        Disabled
                      </Badge>
                    )}
                    {!userData.mfaEnabled ? (
                      <Button
                        onClick={handleMFASetup}
                        size="sm"
                        disabled={mfaLoading}
                        className="h-8 text-xs bg-foreground hover:bg-foreground/90"
                      >
                        {mfaLoading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                            Setting up...
                          </>
                        ) : (
                          'Enable MFA'
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setMfaDisableOpen(true)}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-red-200 text-red-700 hover:bg-red-50"
                      >
                        Disable MFA
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* MFA Setup Modal */}
      <Dialog open={mfaSetupOpen} onOpenChange={setMfaSetupOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Enable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Set up two-factor authentication to secure your account with an additional layer of protection.
            </DialogDescription>
          </DialogHeader>

          {mfaData && (
            <div className="space-y-6 py-4">
              {/* Step 1: QR Code */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">1</div>
                  Scan QR Code
                </h3>
                <p className="text-sm text-muted-foreground">
                  Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code:
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg border">
                  <img 
                    src={mfaData.data.qrCode} 
                    alt="MFA QR Code" 
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Can't scan? Use manual entry with the secret key below.
                </p>
              </div>

              <Separator />

              {/* Step 2: Manual Entry */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">2</div>
                  Manual Entry (Alternative)
                </h3>
                <p className="text-sm text-muted-foreground">
                  If you can't scan the QR code, manually enter this secret key in your authenticator app:
                </p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                  <code className="flex-1">{mfaData.data.secret}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(mfaData.data.secret, 'secret')}
                  >
                    {copiedItems.has('secret') ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Step 3: Backup Codes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">3</div>
                  Save Backup Codes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Save these backup codes in a secure location. Each code can only be used once to access your account if you lose your device:
                </p>
                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                  {mfaData.data.backupCodes.map((code, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                      <code className="font-mono text-sm">{code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(code, `backup-${index}`)}
                      >
                        {copiedItems.has(`backup-${index}`) ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={downloadBackupCodes}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Backup Codes
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Step 4: Verification */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">4</div>
                  Verify Setup
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code from your authenticator app to complete the setup:
                </p>
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="000000"
                    value={mfaToken}
                    onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setMfaSetupOpen(false)
                setMfaData(null)
                setMfaToken("")
              }}
              disabled={mfaVerifying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMFAVerify}
              disabled={!mfaToken || mfaToken.length !== 6 || mfaVerifying}
            >
              {mfaVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MFA Disable Dialog */}
      <Dialog open={mfaDisableOpen} onOpenChange={setMfaDisableOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              This will remove the extra layer of security from your account. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-destructive mb-1">Warning</p>
                  <p className="text-muted-foreground">
                    Disabling MFA will make your account less secure. Anyone with access to your password will be able to log in.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="disable-token" className="text-sm font-medium">
                Enter your authenticator code to confirm
              </Label>
              <Input
                id="disable-token"
                type="text"
                placeholder="000000"
                value={mfaDisableToken}
                onChange={(e) => setMfaDisableToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-lg font-mono tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setMfaDisableOpen(false)
                setMfaDisableToken("")
              }}
              disabled={mfaDisabling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleMFADisable}
              disabled={!mfaDisableToken || mfaDisableToken.length !== 6 || mfaDisabling}
              variant="destructive"
            >
              {mfaDisabling ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Disabling...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Disable MFA
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 