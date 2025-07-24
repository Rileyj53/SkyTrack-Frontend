"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, RefreshCw, BarChart3 } from "lucide-react"
import { StatsCustomizationModal } from "@/components/StatsCustomizationModal"
import { toast } from "sonner"

// Import all the default configurations from different pages
import { DEFAULT_DASHBOARD_CONFIGS, type StatConfig } from "@/components/StatsGrid"

// Comprehensive Dashboard stats config covering all organization stats
const DASHBOARD_STATS_CONFIG: StatConfig[] = [
  // Overview Statistics
  {
    id: 'total_students',
    title: 'Total Students',
    icon: 'user',
    enabled: true,
    order: 1,
    dataPath: 'overview.total_students',
    format: 'number'
  },
  {
    id: 'active_students',
    title: 'Active Students',
    icon: 'user',
    enabled: true,
    order: 2,
    dataPath: 'overview.active_students',
    format: 'number'
  },
  {
    id: 'total_instructors',
    title: 'Total Instructors',
    icon: 'user',
    enabled: true,
    order: 3,
    dataPath: 'overview.total_instructors',
    format: 'number'
  },
  {
    id: 'active_instructors',
    title: 'Active Instructors',
    icon: 'user',
    enabled: false,
    order: 4,
    dataPath: 'overview.active_instructors',
    format: 'number'
  },
  {
    id: 'total_planes',
    title: 'Total Aircraft',
    icon: 'plane',
    enabled: true,
    order: 5,
    dataPath: 'overview.total_planes',
    format: 'number'
  },
  {
    id: 'active_planes',
    title: 'Active Aircraft',
    icon: 'plane',
    enabled: false,
    order: 6,
    dataPath: 'overview.active_planes',
    format: 'number'
  },
  {
    id: 'upcoming_lessons',
    title: 'Upcoming Lessons',
    icon: 'calendar',
    enabled: false,
    order: 7,
    dataPath: 'overview.upcoming_lessons',
    format: 'number'
  },
  {
    id: 'upcoming_lessons_next_7_days',
    title: 'Lessons Next 7 Days',
    icon: 'calendar',
    enabled: false,
    order: 8,
    dataPath: 'overview.upcoming_lessons_next_7_days',
    format: 'number'
  },
  
  // Flight Operations
  {
    id: 'total_flights_period',
    title: 'Total Flights',
    icon: 'plane',
    enabled: true,
    order: 9,
    dataPath: 'flight_operations.total_flights_period',
    format: 'number'
  },
  {
    id: 'completed_flights',
    title: 'Completed Flights',
    icon: 'plane',
    enabled: false,
    order: 10,
    dataPath: 'flight_operations.completed_flights',
    format: 'number'
  },
  {
    id: 'completion_rate',
    title: 'Flight Completion Rate',
    icon: 'chart',
    enabled: true,
    order: 11,
    dataPath: 'flight_operations.completion_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'recent_flights_7_days',
    title: 'Recent Flights (7 Days)',
    icon: 'plane',
    enabled: false,
    order: 12,
    dataPath: 'flight_operations.recent_flights_7_days',
    format: 'number'
  },
  {
    id: 'schedule_adherence_percentage',
    title: 'Schedule Adherence',
    icon: 'chart',
    enabled: false,
    order: 13,
    dataPath: 'flight_operations.schedule_adherence_percentage',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'avg_delay_minutes',
    title: 'Average Delay',
    icon: 'clock',
    enabled: false,
    order: 14,
    dataPath: 'flight_operations.avg_delay_minutes',
    format: 'number',
    suffix: ' min'
  },
  
  // Aircraft Efficiency
  {
    id: 'average_utilization_rate',
    title: 'Aircraft Utilization Rate',
    icon: 'chart',
    enabled: false,
    order: 15,
    dataPath: 'aircraft_efficiency.average_utilization_rate',
    format: 'percentage',
    suffix: '%'
  },
  
  // Instructor Efficiency
  {
    id: 'total_teaching_hours',
    title: 'Total Teaching Hours',
    icon: 'clock',
    enabled: false,
    order: 16,
    dataPath: 'instructor_efficiency.total_teaching_hours',
    format: 'number',
    suffix: ' hrs'
  },
  {
    id: 'total_flight_hours',
    title: 'Total Flight Hours',
    icon: 'clock',
    enabled: false,
    order: 17,
    dataPath: 'instructor_efficiency.total_flight_hours',
    format: 'number',
    suffix: ' hrs'
  },
  {
    id: 'average_utilization',
    title: 'Instructor Utilization',
    icon: 'chart',
    enabled: false,
    order: 18,
    dataPath: 'instructor_efficiency.average_utilization',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'total_students_taught',
    title: 'Students Taught',
    icon: 'user',
    enabled: false,
    order: 19,
    dataPath: 'instructor_efficiency.total_students_taught',
    format: 'number'
  },
  {
    id: 'avg_students_per_instructor',
    title: 'Avg Students/Instructor',
    icon: 'user',
    enabled: false,
    order: 20,
    dataPath: 'instructor_efficiency.avg_students_per_instructor',
    format: 'number'
  },
  
  // Student Metrics
  {
    id: 'new_enrollments_period',
    title: 'New Enrollments',
    icon: 'user',
    enabled: false,
    order: 21,
    dataPath: 'student_metrics.new_enrollments_period',
    format: 'number'
  },
  
  // Operational Metrics
  {
    id: 'total_scheduled_hours',
    title: 'Total Scheduled Hours',
    icon: 'clock',
    enabled: false,
    order: 22,
    dataPath: 'operational_metrics.total_scheduled_hours',
    format: 'number',
    suffix: ' hrs'
  },
  {
    id: 'total_actual_hours',
    title: 'Total Actual Hours',
    icon: 'clock',
    enabled: false,
    order: 23,
    dataPath: 'operational_metrics.total_actual_hours',
    format: 'number',
    suffix: ' hrs'
  },
  {
    id: 'average_flight_duration',
    title: 'Average Flight Duration',
    icon: 'clock',
    enabled: false,
    order: 24,
    dataPath: 'operational_metrics.average_flight_duration',
    format: 'number',
    suffix: ' hrs'
  },
  {
    id: 'capacity_utilization',
    title: 'Capacity Utilization',
    icon: 'chart',
    enabled: false,
    order: 25,
    dataPath: 'operational_metrics.capacity_utilization',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'efficiency_ratio',
    title: 'Efficiency Ratio',
    icon: 'chart',
    enabled: false,
    order: 26,
    dataPath: 'operational_metrics.efficiency_ratio',
    format: 'number'
  }
];

// Student stats config with comprehensive coverage
const STUDENT_STATS_CONFIG: StatConfig[] = [
  // Overview Statistics
  {
    id: 'total_students',
    title: 'Total Students',
    icon: 'user',
    enabled: true,
    order: 1,
    dataPath: 'overview.total_students',
    format: 'number'
  },
  {
    id: 'active_students',
    title: 'Active Students',
    icon: 'user',
    enabled: true,
    order: 2,
    dataPath: 'overview.active_students',
    format: 'number'
  },
  {
    id: 'new_enrollments_period',
    title: 'New Enrollments',
    icon: 'user',
    enabled: true,
    order: 3,
    dataPath: 'overview.new_enrollments_period',
    format: 'number'
  },
  {
    id: 'graduated_students_period',
    title: 'Graduated This Period',
    icon: 'user',
    enabled: true,
    order: 4,
    dataPath: 'overview.graduated_students_period',
    format: 'number'
  },
  {
    id: 'completion_rate',
    title: 'Completion Rate',
    icon: 'chart',
    enabled: false,
    order: 5,
    dataPath: 'overview.completion_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'retention_rate',
    title: 'Retention Rate',
    icon: 'chart',
    enabled: false,
    order: 6,
    dataPath: 'overview.retention_rate',
    format: 'percentage',
    suffix: '%'
  },
  
  // Flight Activity
  {
    id: 'total_flights_period',
    title: 'Total Flights',
    icon: 'plane',
    enabled: false,
    order: 7,
    dataPath: 'flight_activity.total_flights_period',
    format: 'number'
  },
  {
    id: 'completed_flights_period',
    title: 'Completed Flights',
    icon: 'plane',
    enabled: false,
    order: 8,
    dataPath: 'flight_activity.completed_flights_period',
    format: 'number'
  },
  {
    id: 'total_hours_period',
    title: 'Total Flight Hours',
    icon: 'clock',
    enabled: false,
    order: 9,
    dataPath: 'flight_activity.total_hours_period',
    format: 'number',
    suffix: ' hrs'
  },
  
  // Performance Metrics
  {
    id: 'overall_on_time_rate',
    title: 'On-Time Rate',
    icon: 'chart',
    enabled: false,
    order: 10,
    dataPath: 'performance_metrics.overall_on_time_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'avg_flights_per_student',
    title: 'Avg Flights/Student',
    icon: 'chart',
    enabled: false,
    order: 11,
    dataPath: 'performance_metrics.avg_flights_per_student',
    format: 'number'
  },
  
  // Progress Tracking
  {
    id: 'overall_progress',
    title: 'Overall Progress',
    icon: 'chart',
    enabled: false,
    order: 12,
    dataPath: 'progress_tracking.overall_progress',
    format: 'percentage',
    suffix: '%'
  },
  
  // Certification Breakdown
  {
    id: 'private_certifications',
    title: 'Private Certifications',
    icon: 'user',
    enabled: false,
    order: 13,
    dataPath: 'certification_breakdown.private',
    format: 'number'
  },
  {
    id: 'instrument_certifications',
    title: 'Instrument Certifications',
    icon: 'user',
    enabled: false,
    order: 14,
    dataPath: 'certification_breakdown.instrument',
    format: 'number'
  }
];

// Instructor stats config
const INSTRUCTOR_STATS_CONFIG: StatConfig[] = [
  {
    id: 'total_instructors',
    title: 'Total Instructors',
    icon: 'user',
    enabled: true,
    order: 1,
    dataPath: 'overview.total_instructors',
    format: 'number'
  },
  {
    id: 'active_instructors',
    title: 'Active Instructors',
    icon: 'user',
    enabled: true,
    order: 2,
    dataPath: 'overview.active_instructors',
    format: 'number'
  },
  {
    id: 'total_teaching_hours',
    title: 'Total Teaching Hours',
    icon: 'clock',
    enabled: true,
    order: 3,
    dataPath: 'instructor_efficiency.total_teaching_hours',
    format: 'number'
  },
  {
    id: 'average_utilization',
    title: 'Average Utilization',
    icon: 'chart',
    enabled: true,
    order: 4,
    dataPath: 'instructor_efficiency.average_utilization',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'total_students_taught',
    title: 'Students Taught',
    icon: 'user',
    enabled: false,
    order: 5,
    dataPath: 'instructor_efficiency.total_students_taught',
    format: 'number'
  },
  {
    id: 'avg_students_per_instructor',
    title: 'Avg Students/Instructor',
    icon: 'user',
    enabled: false,
    order: 6,
    dataPath: 'instructor_efficiency.avg_students_per_instructor',
    format: 'number'
  }
];

interface PageConfig {
  id: string;
  name: string;
  description: string;
  storageKey: string;
  defaultConfigs: StatConfig[];
  currentConfigs: StatConfig[];
  enabledCount: number;
  totalCount: number;
}

export function SettingsStatistics() {
  const [pageConfigs, setPageConfigs] = useState<PageConfig[]>([]);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load all statistics configurations from localStorage
  useEffect(() => {
    const loadConfigurations = () => {
      const configs: PageConfig[] = [
        {
          id: 'dashboard',
          name: 'Dashboard',
          description: 'Main dashboard statistics and overview metrics',
          storageKey: 'skytrack-dashboard-stats-preferences',
          defaultConfigs: DASHBOARD_STATS_CONFIG,
          currentConfigs: [],
          enabledCount: 0,
          totalCount: DASHBOARD_STATS_CONFIG.length
        },
        {
          id: 'students',
          name: 'Students Page',
          description: 'Student enrollment, progress, and performance metrics',
          storageKey: 'skytrack-student-stats-preferences',
          defaultConfigs: STUDENT_STATS_CONFIG,
          currentConfigs: [],
          enabledCount: 0,
          totalCount: STUDENT_STATS_CONFIG.length
        },
        {
          id: 'instructors',
          name: 'Instructors Page',
          description: 'Instructor performance and teaching metrics',
          storageKey: 'skytrack-instructor-stats-preferences',
          defaultConfigs: INSTRUCTOR_STATS_CONFIG,
          currentConfigs: [],
          enabledCount: 0,
          totalCount: INSTRUCTOR_STATS_CONFIG.length
        }
      ];

      // Load current configurations from localStorage
      configs.forEach(config => {
        const saved = localStorage.getItem(config.storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            config.currentConfigs = parsed.configs || config.defaultConfigs;
          } catch (e) {
            console.error(`Error parsing ${config.storageKey}:`, e);
            config.currentConfigs = config.defaultConfigs;
          }
        } else {
          config.currentConfigs = config.defaultConfigs;
        }
        
        config.enabledCount = config.currentConfigs.filter(c => c.enabled).length;
      });

      setPageConfigs(configs);
      setLoading(false);
    };

    loadConfigurations();
  }, []);

  const handleSaveConfigs = (newConfigs: StatConfig[]) => {
    if (!selectedPage) return;

    const pageConfig = pageConfigs.find(p => p.id === selectedPage);
    if (!pageConfig) return;

    // Update the page configuration
    const updatedConfigs = pageConfigs.map(config => {
      if (config.id === selectedPage) {
        return {
          ...config,
          currentConfigs: newConfigs,
          enabledCount: newConfigs.filter(c => c.enabled).length
        };
      }
      return config;
    });

    setPageConfigs(updatedConfigs);

    // Save to localStorage
    const saveData = {
      configs: newConfigs,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(pageConfig.storageKey, JSON.stringify(saveData));

    toast.success(`Statistics updated for ${pageConfig.name}`);
  };

  const handleResetToDefault = (pageId: string) => {
    const pageConfig = pageConfigs.find(p => p.id === pageId);
    if (!pageConfig) return;

    const updatedConfigs = pageConfigs.map(config => {
      if (config.id === pageId) {
        return {
          ...config,
          currentConfigs: config.defaultConfigs,
          enabledCount: config.defaultConfigs.filter(c => c.enabled).length
        };
      }
      return config;
    });

    setPageConfigs(updatedConfigs);

    // Save to localStorage
    const saveData = {
      configs: pageConfig.defaultConfigs,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(pageConfig.storageKey, JSON.stringify(saveData));

    toast.success(`Statistics reset to default for ${pageConfig.name}`);
  };

  const getSelectedPageConfig = () => {
    return pageConfigs.find(p => p.id === selectedPage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading statistics configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Statistics Management</h2>
        <p className="text-muted-foreground">
          Customize which statistics are displayed on each page. Your preferences are saved automatically.
        </p>
      </div>

      <div className="grid gap-6">
        {pageConfigs.map((config) => (
          <Card key={config.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {config.name}
                  </CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {config.enabledCount} of {config.totalCount} enabled
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Storage key: <code className="bg-muted px-1 py-0.5 rounded text-xs">{config.storageKey}</code>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetToDefault(config.id)}
                  >
                    Reset to Default
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedPage(config.id);
                      setShowModal(true);
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Customize
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics Customization Modal */}
      {selectedPage && (
        <StatsCustomizationModal
          opened={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedPage(null);
          }}
          onSave={() => {
            setShowModal(false);
            setSelectedPage(null);
          }}
          configs={getSelectedPageConfig()?.currentConfigs || []}
          onSaveConfigs={handleSaveConfigs}
          defaultConfigs={getSelectedPageConfig()?.defaultConfigs}
        />
      )}
    </div>
  );
} 