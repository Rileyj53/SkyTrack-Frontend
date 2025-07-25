'use client';

import { Box, Grid, GridCol, SimpleGrid, Skeleton } from '@mantine/core';
import dynamic from 'next/dynamic';
import { StudentProgress } from '@/components/student-progress-new';
import { StudentProgressOverview } from '@/components/student/progress-overview';
import { Progress } from '@/components/ui/progress';
import React from 'react';
import { MainNav } from '@/components/main-nav-new';
import FlightLogOverview from '@/components/flight-log-overview-new';
import { StatsGrid } from '@/components/StatsGrid';

// Dynamically import the FlightTrackingMap to avoid SSR issues with Leaflet
const FlightTrackingMap = dynamic(() => import('@/components/flight-tracking-map-new').then((mod) => ({ default: mod.FlightTrackingMap })), {
  ssr: false,
  loading: () => {
    // const [progress, setProgress] = React.useState(0)
    const [progress, setProgress] = React.useState(25);
    React.useEffect(() => {
      let current = 0;
      const interval = setInterval(() => {
        current = Math.min(current + Math.random() * 10, 90);
        setProgress(50);
      }, 200);
      return () => clearInterval(interval);
    }, []);
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] w-full flex-1 bg-background">
        <div className="w-full max-w-md flex flex-col items-center gap-6">
          <Progress value={progress} className="w-full h-4" />
          <div className="text-base font-medium text-muted-foreground text-center">Loading map...</div>
        </div>
      </div>
    );
  },
});

export default function LeadGrid() {
  const [statsData, setStatsData] = React.useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userData, setUserData] = React.useState<any>(null);
  const [userRole, setUserRole] = React.useState<string | null>(null);

  // Fetch user data to determine role
  const fetchUserData = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_KEY || "",
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": localStorage.getItem("csrfToken") || ""
        },
        credentials: "include"
      });

      if (response.ok) {
        const responseData = await response.json();
        const data = responseData.data;
        setUserData(data);
        setUserRole(data.user.role);
        console.log('Dashboard - User role:', data.user.role);
        console.log('Dashboard - User data:', data);
        console.log('Dashboard - Has student data:', !!data.user.student);
        console.log('Dashboard - Student ID:', data.user.student?._id);
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  // Fetch organization stats
  const fetchStats = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const organizationId = localStorage.getItem('organizationId') || localStorage.getItem('schoolId');
      if (!organizationId) return;

      const apiKey = process.env.NEXT_PUBLIC_API_KEY;
      
      if (!apiKey) {
        console.error('API key is not configured');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || "",
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard - Fetched API response:', data);
        console.log('Dashboard - Setting statsData to:', data.data.stats);
        setStatsData(data.data.stats);
      } else {
        console.error('Failed to fetch organization stats');
      }
    } catch (error) {
      console.error('Error fetching organization stats:', error);
    }
  }, []);

  // Check authentication and fetch stats
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchUserData();
      fetchStats();
    }
  }, [fetchStats, fetchUserData]);

  return (
    <Box p="md" style={{ height: '100vh' }}>
      <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <MainNav />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)', gap: 'var(--mantine-spacing-sm)', paddingTop: '3rem' }}>
        {/* Future header/stats section can go here */}
        {userRole !== 'student' && (
          <StatsGrid 
            title="Dashboard Statistics"
            storageKey="skytrack-dashboard-stats-preferences"
            apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/organizations/${typeof window !== 'undefined' ? (localStorage.getItem("organizationId") || localStorage.getItem("schoolId")) : ''}/stats`}
            dataPath="data.stats"
            useEnhancedModal={true}
            rawData={statsData}
          />
        )}
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
              {(() => {
                console.log('Dashboard Render - userRole:', userRole);
                console.log('Dashboard Render - userData:', userData);
                const shouldShowStudentComponent = userRole === 'student' && userData?.user;
                console.log('Dashboard Render - Should show student component:', shouldShowStudentComponent);
                
                if (shouldShowStudentComponent) {
                  return (
                    <div className="h-full">
                      <StudentProgressOverview 
                        studentId={userData.user._id}
                        organizationId={userData.user.organization_id || userData.user.school_id}
                        compact={true}
                      />
                    </div>
                  );
                } else {
                  return <StudentProgress className="h-full" />;
                }
              })()}
            </Grid.Col>
          </Grid>
        </div>
      </div>
    </Box>
  );
}
