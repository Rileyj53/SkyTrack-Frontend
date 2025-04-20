"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface UserData {
  user: {
    _id: string
    email: string
    first_name: string
    last_name: string
    role: string
    school_id: string
    school: {
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
      website: string
    }
    student: {
      _id: string
      school_id: string
      user_id: string
      contact_email: string
      phone: string
      certifications: string[]
      license_number: string
      emergency_contact: {
        name: string
        relationship: string
        phone: string
      }
    } | null
    instructor: {
      _id: string
      school_id: string
      user_id: string
      contact_email: string
      phone: string
      certifications: string[]
      license_number: string
      emergency_contact: {
        name: string
        relationship: string
        phone: string
      }
    } | null
  }
}

export default function ProtectedPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token from localStorage as backup
        const token = localStorage.getItem('token')
        const csrfToken = localStorage.getItem('csrfToken')
        
        const response = await fetch(`${process.env.API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-api-key': process.env.API_KEY || '',
            'X-CSRF-Token': csrfToken || '',
          },
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Not authenticated')
        }

        const data = await response.json()
        console.log('Auth check successful:', data)
        setUserData(data)
        setIsLoading(false)
      } catch (err) {
        console.error('Auth check failed:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Protected Page</CardTitle>
        </CardHeader>
        <CardContent>
          {userData && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">User Information</h3>
                <p>Name: {userData.user.first_name} {userData.user.last_name}</p>
                <p>Email: {userData.user.email}</p>
                <p>Role: {userData.user.role}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">School Information</h3>
                <p>School: {userData.user.school.name}</p>
                <p>Location: {userData.user.school.address.city}, {userData.user.school.address.state}</p>
                <p>Airport: {userData.user.school.airport}</p>
              </div>

              {userData.user.role === 'student' && userData.user.student && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Student Information</h3>
                  <p>Contact Email: {userData.user.student.contact_email}</p>
                  <p>Phone: {userData.user.student.phone}</p>
                  <p>License Number: {userData.user.student.license_number}</p>
                  <div>
                    <p className="font-medium">Certifications:</p>
                    <ul className="list-disc list-inside">
                      {userData.user.student.certifications.map((cert, index) => (
                        <li key={index} className="ml-4">{cert.toUpperCase()}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Emergency Contact:</p>
                    <p>Name: {userData.user.student.emergency_contact.name}</p>
                    <p>Relationship: {userData.user.student.emergency_contact.relationship}</p>
                    <p>Phone: {userData.user.student.emergency_contact.phone}</p>
                  </div>
                </div>
              )}

              {userData.user.role === 'instructor' && userData.user.instructor && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Instructor Information</h3>
                  <p>Contact Email: {userData.user.instructor.contact_email}</p>
                  <p>Phone: {userData.user.instructor.phone}</p>
                  <p>License Number: {userData.user.instructor.license_number}</p>
                  <div>
                    <p className="font-medium">Certifications:</p>
                    <ul className="list-disc list-inside">
                      {userData.user.instructor.certifications.map((cert, index) => (
                        <li key={index} className="ml-4">{cert.toUpperCase()}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">Emergency Contact:</p>
                    <p>Name: {userData.user.instructor.emergency_contact.name}</p>
                    <p>Relationship: {userData.user.instructor.emergency_contact.relationship}</p>
                    <p>Phone: {userData.user.instructor.emergency_contact.phone}</p>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 