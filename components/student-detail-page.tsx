"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav-new"
import { StudentDetailProgress } from "@/components/student-detail-progress"

interface StudentDetailPageProps {
  studentId: string
}

export function StudentDetailPage({ studentId }: StudentDetailPageProps) {
  return (
    <div style={{ padding: 'var(--mantine-spacing-md)', height: '100vh' }}>
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MainNav />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)', gap: 'var(--mantine-spacing-sm)', paddingTop: '3rem' }}>
        <div className="flex flex-col space-y-6">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/students">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Students
              </Link>
            </Button>
          </div>

          <StudentDetailProgress studentId={studentId} />
        </div>
      </div>
    </div>
  )
}
