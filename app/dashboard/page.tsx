"use client"

import { Box, Grid, GridCol, SimpleGrid, Skeleton } from '@mantine/core';
import dynamic from 'next/dynamic';
import { StudentProgress } from '@/components/student-progress-new';
import { Progress } from "@/components/ui/progress"
import React from 'react';
import { UserNav } from '@/components/user-nav'
import { DashboardHeader } from "@/components/dashboard-header"
import { MainNav } from "@/components/main-nav"
import FlightLogOverview from '@/components/flight-log-overview-new'
import { StatsGrid } from '@/components/StatsGrid'

// Dynamically import the FlightTrackingMap to avoid SSR issues with Leaflet
const FlightTrackingMap = dynamic(
  () => import('@/components/flight-tracking-map-new').then(mod => ({ default: mod.FlightTrackingMap })),
  {
    ssr: false,
    loading: () => {
      // const [progress, setProgress] = React.useState(0)
      const [progress, setProgress] = React.useState(25)
      React.useEffect(() => {
        let current = 0
        const interval = setInterval(() => {
          current = Math.min(current + Math.random() * 10, 90)
          setProgress(50)
        }, 200)
        return () => clearInterval(interval)
      }, [])
      return (
        <div className="flex flex-col items-center justify-center min-h-[350px] w-full flex-1 bg-background">
          <div className="w-full max-w-md flex flex-col items-center gap-6">
            <Progress value={progress} className="w-full h-4" />
            <div className="text-base font-medium text-muted-foreground text-center">
              Loading map...
            </div>
          </div>
        </div>
      )
    }
  }
);

export default function LeadGrid() {
  return (
    <Box p="md" style={{ height: '100vh' }}>
            <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <DashboardHeader>
          <MainNav />
          <UserNav />
        </DashboardHeader>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)', gap: 'var(--mantine-spacing-sm)', paddingTop: '3rem' }}> 
        {/* Future header/stats section can go here */}
        <StatsGrid />
        {/* Main content area - flexible for future layout changes */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          {/* Flight tracking map - takes full width */}
          <div style={{ flex: '1', minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <FlightTrackingMap className="flex-1" dashboard={true} />
          </div>
        </div>
        
        {/* Bottom widgets section */}
        <div style={{ height: '400px' }}>
          <Grid style={{ height: '100%' }} gutter="md">
            <Grid.Col span={{ base: 12, md: 7 }} style={{ height: '100%' }}>
              <FlightLogOverview className="h-full" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 5 }} style={{ height: '100%' }}>
              <StudentProgress className="h-full" />
            </Grid.Col>
          </Grid>
        </div>
      </div>
    </Box>
  );
}