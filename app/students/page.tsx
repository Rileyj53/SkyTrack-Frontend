"use client"

import { StudentsPage } from "@/components/students-page"
import { useEffect } from "react"

export default function Students() {
  useEffect(() => {
    // Ensure organizationId is available for students page components
    const checkAndStoreOrganizationId = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
            headers: {
              "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
              "X-CSRF-Token": localStorage.getItem("csrfToken") || "",
              "Authorization": `Bearer ${token}`
            },
            credentials: "include"
          })

          if (response.ok) {
            const data = await response.json()
            
            // Store the organization ID in localStorage for other components to use
            if (data.data?.user?.organizationId) {
              localStorage.setItem("organizationId", data.data.user.organizationId)
            } else if (data.data?.user?.school_id) {
              // Fallback for legacy data
              localStorage.setItem("schoolId", data.data.user.school_id)
            }
          }
        } catch (error) {
          console.error("Failed to fetch user data:", error)
        }
      }
    }

    checkAndStoreOrganizationId()
  }, [])

  return <StudentsPage />
}
