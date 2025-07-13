"use client"

import { Box, Grid, GridCol, SimpleGrid, Skeleton } from '@mantine/core';
import React from 'react';
import { MainNav } from "@/components/main-nav-new"
import FlightLogOverview from '@/components/flight-log-table';
import { StartFlightModal } from "@/components/start-flight-modal"


export default function DashboardDev() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <MainNav />
        </div>
  )
} 