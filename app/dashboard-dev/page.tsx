"use client"

import { Box, Grid, GridCol, SimpleGrid, Skeleton } from '@mantine/core';
import dynamic from 'next/dynamic';
import { StudentProgress } from '@/components/student-progress-new';

// Dynamically import the FlightTrackingMap to avoid SSR issues with Leaflet
const FlightTrackingMap = dynamic(
  () => import('@/components/flight-tracking-map-new').then(mod => ({ default: mod.FlightTrackingMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex-1 w-full rounded-md overflow-hidden border relative bg-gray-50 dark:bg-gray-800">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-8 h-8">
              <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-500"></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading map...</p>
          </div>
        </div>
      </div>
    )
  }
);

export default function LeadGrid() {
  return (
    <Box p="md" style={{ height: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 2rem)', gap: 'var(--mantine-spacing-md)' }}>
        {/* Future header/stats section can go here */}
        
        {/* Main content area - flexible for future layout changes */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
          {/* Flight tracking map - takes full width */}
          <div style={{ flex: '1', minHeight: '350px', display: 'flex', flexDirection: 'column' }}>
            <FlightTrackingMap className="flex-1" dashboard={true} />
          </div>
        </div>
        
        {/* Bottom widgets section */}
        <div style={{ height: '400px' }}>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" style={{ height: '100%' }}>
            <Skeleton height="100%" radius="md" animate={false} />
            <StudentProgress className="h-full" />
          </SimpleGrid>
        </div>
      </div>
    </Box>
  );
}