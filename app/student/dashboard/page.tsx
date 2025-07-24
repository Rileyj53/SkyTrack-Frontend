"use client"

import { StatsGrid, type StatConfig } from "@/components/StatsGrid"
import { useState, useEffect } from "react"

// Student-specific statistics configuration
const STUDENT_STATS_CONFIG: StatConfig[] = [
  {
    id: 'total_flights',
    title: 'Total Flights',
    icon: 'plane',
    enabled: true,
    order: 1,
    dataPath: 'student_stats.total_flights',
    format: 'number'
  },
  {
    id: 'flight_hours',
    title: 'Flight Hours',
    icon: 'clock',
    enabled: true,
    order: 2,
    dataPath: 'student_stats.total_hours',
    format: 'number',
    suffix: ' hrs'
  },
  {
    id: 'completion_rate',
    title: 'Completion Rate',
    icon: 'chart',
    enabled: true,
    order: 3,
    dataPath: 'student_stats.completion_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'upcoming_lessons',
    title: 'Upcoming Lessons',
    icon: 'calendar',
    enabled: true,
    order: 4,
    dataPath: 'student_stats.upcoming_lessons',
    format: 'number'
  },
  {
    id: 'progress_percentage',
    title: 'Course Progress',
    icon: 'chart',
    enabled: false,
    order: 5,
    dataPath: 'student_stats.progress_percentage',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'instructor_rating',
    title: 'Instructor Rating',
    icon: 'user',
    enabled: false,
    order: 6,
    dataPath: 'student_stats.instructor_rating',
    format: 'number',
    suffix: '/5'
  }
];

export default function StudentDashboard() {
  // State to store client-side values
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side values after component mounts
  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
    setToken(localStorage.getItem("token"));
    setCsrfToken(localStorage.getItem("csrfToken") || "");
    setOrganizationId(localStorage.getItem("organizationId") || localStorage.getItem("schoolId") || "");
    setIsClient(true);
  }, []);

  // Custom fetch function for student-specific data
  const fetchStudentStats = async () => {
    // Only run on client-side
    if (typeof window === 'undefined') return { success: false };
    
    const studentId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const apiKey = process.env.NEXT_PUBLIC_API_KEY;
    
    if (!studentId || !token) {
      throw new Error("Student ID or authentication token not found");
    }

    if (!apiKey) {
      throw new Error("API key is not configured");
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/students/${studentId}/stats`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'Authorization': `Bearer ${token}`,
          'X-CSRF-Token': localStorage.getItem("csrfToken") || ""
        },
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch student stats: ${response.status}`);
    }

    return await response.json();
  };

  // Custom data processing function
  const processStudentData = (rawData: any) => {
    // Transform the API response to match our expected format
    return {
      student_stats: {
        total_flights: rawData.data?.total_flights || 0,
        total_hours: rawData.data?.total_hours || 0,
        completion_rate: rawData.data?.completion_rate || 0,
        upcoming_lessons: rawData.data?.upcoming_lessons || 0,
        progress_percentage: rawData.data?.progress_percentage || 0,
        instructor_rating: rawData.data?.instructor_rating || 0
      }
    };
  };

  // Don't render stats components until we're on the client side
  if (!isClient) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Student Dashboard</h1>
      
      {/* Student-specific statistics using custom fetch function */}
      <div style={{ marginBottom: '2rem' }}>
        <StatsGrid 
          title="My Statistics"
          storageKey="skytrack-student-stats-preferences"
          defaultConfigs={STUDENT_STATS_CONFIG}
          customFetchFunction={fetchStudentStats}
          processData={processStudentData}
          dataPath="student_stats"
        />
      </div>

      {/* Example of using a different API endpoint */}
      <div style={{ marginBottom: '2rem' }}>
        <StatsGrid 
          title="School Overview"
          storageKey="skytrack-student-school-stats-preferences"
          apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/stats`}
          dataPath="data.stats"
          showRefreshButton={false}
          showCustomizeButton={false}
        />
      </div>

      {/* Additional student dashboard content would go here */}
      <div>
        <h2>Recent Activity</h2>
        <p>Your recent flight activities and progress will be displayed here.</p>
      </div>
    </div>
  )
}
