"use client"

import { useState } from "react"
import { CalendarDays, Clock, Plane, Users } from "lucide-react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { FlightLogTable } from "@/components/flight-log-table"
import { FlightStats } from "@/components/flight-stats"
import { FlightTrackingMap } from "@/components/flight-tracking-map"
import { MainNav } from "@/components/main-nav"
import { StudentProgress } from "@/components/student-progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserNav } from "@/components/user-nav"

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader>
        <MainNav />
        <UserNav />
      </DashboardHeader>
      <DashboardShell>
        <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="flights">Flight Log</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="aircraft">Aircraft</TabsTrigger>
            <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FlightStats
                title="Daily Flight Hours"
                value="24.5"
                description="Today's flights"
                icon={<Clock className="h-4 w-4 text-muted-foreground" />}
              />
              <FlightStats
                title="Students in Session"
                value="8"
                description="Currently training"
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
              />
              <FlightStats
                title="Aircraft Utilization"
                value="78%"
                description="12% increase"
                icon={<Plane className="h-5 w-5 text-primary" strokeWidth={2.5} />}
              />
              <FlightStats
                title="Upcoming Flights"
                value="9"
                description="Next 2 days"
                icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
              />
            </div>
            <FlightTrackingMap />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <FlightLogTable className="col-span-4" />
              <StudentProgress className="col-span-3" />
            </div>
          </TabsContent>
          <TabsContent value="flights">
            <FlightLogTable />
          </TabsContent>
          <TabsContent value="students">
            <StudentProgress fullView />
          </TabsContent>
          <TabsContent value="aircraft">
            <div className="rounded-md border p-4">
              <h2 className="text-xl font-bold">Aircraft Status</h2>
              <p className="text-sm text-muted-foreground">
                This tab would display aircraft status, maintenance schedules, and availability.
              </p>
            </div>
          </TabsContent>
          <TabsContent value="tracking">
            <FlightTrackingMap />
          </TabsContent>
        </Tabs>
      </DashboardShell>
    </div>
  )
}
