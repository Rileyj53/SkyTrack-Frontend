"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { MainNav } from "@/components/main-nav"
import { StudentDetailProgress } from "@/components/student-detail-progress"
import { UserNav } from "@/components/user-nav"

interface StudentDetailPageProps {
  studentId: number
}

export function StudentDetailPage({ studentId }: StudentDetailPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader>
        <MainNav />
        <UserNav />
      </DashboardHeader>
      <DashboardShell>
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
      </DashboardShell>
    </div>
  )
}
