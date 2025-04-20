"use client"

import { useEffect, useState } from "react"
import { Check, Pencil, Save, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Address {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

interface PaymentInfo {
  subscription_plan: string
  billing_cycle: string
  next_billing_date: string
  payment_status: string
  _id: string
}

interface School {
  _id: string
  name: string
  airport: string
  email: string
  phone: string
  website: string
  address: Address
  payment_info: PaymentInfo
  createdAt: string
  updatedAt: string
}

export function SettingsGeneral() {
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isInstructor, setIsInstructor] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [school, setSchool] = useState<School>({
    _id: "",
    name: "",
    airport: "",
    email: "",
    phone: "",
    website: "",
    address: {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: ""
    },
    payment_info: {
      subscription_plan: "",
      billing_cycle: "",
      next_billing_date: "",
      payment_status: "",
      _id: ""
    },
    createdAt: "",
    updatedAt: ""
  })

  useEffect(() => {
    // Check user role
    const userRole = localStorage.getItem("userRole") || localStorage.getItem("role")
    setIsInstructor(userRole === "instructor")
    
    fetchSchoolData()
  }, [])

  const fetchSchoolData = async () => {
    try {
      setLoading(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.API_KEY
      
      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      const response = await fetch(
        `${process.env.API_URL}/schools/${schoolId}`,
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
        throw new Error("Failed to fetch school data")
      }

      const data = await response.json()
      setSchool(data.school)
    } catch (error) {
      console.error("Error fetching school data:", error)
      toast.error("Failed to load school data")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    // Prevent instructors from saving changes
    if (isInstructor) {
      toast.error("You do not have permission to update school information")
      return
    }

    try {
      setIsSaving(true)
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      const apiKey = process.env.API_KEY
      
      if (!schoolId || !token || !apiKey) {
        throw new Error("Missing required credentials")
      }

      const response = await fetch(
        `${process.env.API_URL}/schools/${schoolId}`,
        {
          method: "PUT",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "Authorization": `Bearer ${token}`,
            "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
          },
          body: JSON.stringify(school),
          credentials: "include"
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update school data")
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      setIsEditing(false)
      toast.success("School information updated successfully")
    } catch (error) {
      console.error("Error updating school data:", error)
      toast.error("Failed to update school information")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    fetchSchoolData() // Reset to original data
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Flight School Information</CardTitle>
            <CardDescription>Loading school data...</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Flight School Information</CardTitle>
            <CardDescription>
              {isInstructor 
                ? "View your flight school details."
                : isEditing 
                  ? "Update your flight school details. This information will be displayed on reports and invoices."
                  : "View your flight school details. Click edit to make changes."}
            </CardDescription>
          </div>
          {!isInstructor && !isEditing && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="school-name">School Name</Label>
              <Input
                id="school-name"
                value={school.name}
                onChange={(e) => setSchool({ ...school, name: e.target.value })}
                disabled={!isEditing || isInstructor}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airport">Airport</Label>
              <Input
                id="airport"
                value={school.airport}
                onChange={(e) => setSchool({ ...school, airport: e.target.value })}
                disabled={!isEditing || isInstructor}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={school.phone}
                onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                disabled={!isEditing || isInstructor}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={school.email}
                onChange={(e) => setSchool({ ...school, email: e.target.value })}
                disabled={!isEditing || isInstructor}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={school.website}
                onChange={(e) => setSchool({ ...school, website: e.target.value })}
                disabled={!isEditing || isInstructor}
              />
            </div>
          </div>
          <div className="space-y-4">
            <Label>Address</Label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="street">Street</Label>
                <Input
                  id="street"
                  value={school.address.street}
                  onChange={(e) => setSchool({
                    ...school,
                    address: { ...school.address, street: e.target.value }
                  })}
                  disabled={!isEditing || isInstructor}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={school.address.city}
                  onChange={(e) => setSchool({
                    ...school,
                    address: { ...school.address, city: e.target.value }
                  })}
                  disabled={!isEditing || isInstructor}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={school.address.state}
                  onChange={(e) => setSchool({
                    ...school,
                    address: { ...school.address, state: e.target.value }
                  })}
                  disabled={!isEditing || isInstructor}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  value={school.address.zip}
                  onChange={(e) => setSchool({
                    ...school,
                    address: { ...school.address, zip: e.target.value }
                  })}
                  disabled={!isEditing || isInstructor}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={school.address.country}
                  onChange={(e) => setSchool({
                    ...school,
                    address: { ...school.address, country: e.target.value }
                  })}
                  disabled={!isEditing || isInstructor}
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {isEditing && !isInstructor && (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="mr-2 h-4 w-4 animate-spin">...</span>
                ) : saved ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saved ? "Saved" : "Save Changes"}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
