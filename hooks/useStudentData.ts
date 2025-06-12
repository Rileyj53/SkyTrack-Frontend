import { useState, useEffect, useCallback } from 'react'

interface Student {
  _id: string
  user_id?: {
    _id: string
    email: string
    first_name: string
    last_name: string
    role: string
  }
  contact_email: string
  program: string
  status: string
  stage: string
  nextMilestone: string
  progress: {
    requirements: {
      name: string
      total_hours: number
      completed_hours: number
      _id: string
    }[]
    lastUpdated: string
  }
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalStudents: number
  hasNext: boolean
  hasPrev: boolean
}

export function useStudentData(studentsPerPage: number) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalStudents: 0,
    hasNext: false,
    hasPrev: false
  })

  const fetchStudents = useCallback(async (page = 1, search = "") => {
    try {
      setLoading(true)
      setError(null)
      
      const schoolId = localStorage.getItem("schoolId")
      const token = localStorage.getItem("token")
      
      if (!schoolId || !token) {
        throw new Error("School ID or authentication token not found")
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: studentsPerPage.toString()
      })
      
      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schools/${schoolId}/students?${params.toString()}`,
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
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()
      setStudents(data.students || [])
      
      if (data.pagination) {
        setPagination(data.pagination)
        setCurrentPage(data.pagination.currentPage)
      } else {
        const totalStudents = data.students?.length || 0
        setPagination({
          currentPage: page,
          totalPages: Math.ceil(totalStudents / studentsPerPage),
          totalStudents,
          hasNext: false,
          hasPrev: page > 1
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [studentsPerPage])

  const handlePageChange = useCallback((page: number) => {
    if (loading) return
    setCurrentPage(page)
    return page
  }, [loading])

  return {
    students,
    loading,
    error,
    currentPage,
    pagination,
    fetchStudents,
    handlePageChange
  }
} 