"use client"

import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  Group,
  Paper,
  Switch,
  Button,
  Stack,
  Alert,
  Divider,
  ScrollArea,
  Tabs,
  Checkbox,
} from '@mantine/core';
import {
  IconUser,
  IconReceipt2,
  IconCoin,
  IconDiscount2,
  IconInfoCircle,
  IconRestore,
  IconDeviceFloppy,
  IconPlane,
  IconChartBar,
  IconCalendar,
  IconClock,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import { type StatConfig } from '@/components/StatsGrid';

interface EnhancedStatsCustomizationModalProps {
  opened: boolean;
  onClose: () => void;
  onSave?: () => void;
  configs: StatConfig[];
  onSaveConfigs: (newConfigs: StatConfig[]) => void;
  defaultConfigs?: StatConfig[];
  rawData?: any;
  onGenerateDynamicStats?: (programs: string[], metrics: string[]) => StatConfig[];
}

const iconMap = {
  user: IconUser,
  receipt: IconReceipt2,
  coin: IconCoin,
  discount: IconDiscount2,
  plane: IconPlane,
  chart: IconChartBar,
  calendar: IconCalendar,
  clock: IconClock,
} as const;

const formatLabels = {
  number: 'Number',
  percentage: 'Percentage',
  currency: 'Currency',
  duration: 'Duration',
} as const;

interface DynamicStatTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  dataPath: string;
  format: 'number' | 'percentage' | 'currency' | 'duration';
  suffix?: string;
  prefix?: string;
  icon: keyof typeof iconMap;
}

const DYNAMIC_STAT_TEMPLATES: DynamicStatTemplate[] = [
  // Student Program Templates (Dashboard Compatible)
  {
    id: 'program_count',
    title: 'Students in Program',
    description: 'Total students enrolled in this program',
    category: 'Student Programs',
    dataPath: 'student_metrics.students_by_program.{program}.count',
    format: 'number',
    icon: 'user'
  },
  {
    id: 'program_active',
    title: 'Active Students in Program',
    description: 'Active students in this program',
    category: 'Student Programs',
    dataPath: 'student_metrics.students_by_program.{program}.active',
    format: 'number',
    icon: 'user'
  },
  
  // Flight Status Templates
  {
    id: 'flight_status_count',
    title: 'Flights by Status',
    description: 'Number of flights with this status',
    category: 'Flight Operations',
    dataPath: 'flight_operations.flight_status_breakdown.{status}.count',
    format: 'number',
    icon: 'plane'
  },
  {
    id: 'flight_status_duration',
    title: 'Average Flight Duration by Status',
    description: 'Average duration of flights with this status',
    category: 'Flight Operations',
    dataPath: 'flight_operations.flight_status_breakdown.{status}.avgScheduledDuration',
    format: 'duration',
    suffix: ' hrs',
    icon: 'clock'
  },
  
  // Flight Type Templates
  {
    id: 'flight_type_count',
    title: 'Flights by Type',
    description: 'Number of flights of this type',
    category: 'Flight Operations',
    dataPath: 'flight_operations.flight_type_breakdown.{type}.count',
    format: 'number',
    icon: 'plane'
  },
  {
    id: 'flight_type_duration',
    title: 'Average Flight Duration by Type',
    description: 'Average duration of flights of this type',
    category: 'Flight Operations',
    dataPath: 'flight_operations.flight_type_breakdown.{type}.avgDuration',
    format: 'duration',
    suffix: ' hrs',
    icon: 'clock'
  },
  
  // Aircraft Templates
  {
    id: 'aircraft_utilization',
    title: 'Aircraft Flight Hours',
    description: 'Recent flight hours for this aircraft',
    category: 'Aircraft',
    dataPath: 'aircraft_efficiency.aircraft_utilization.{aircraft}.recentFlightHours',
    format: 'duration',
    suffix: ' hrs',
    icon: 'plane'
  },
  {
    id: 'aircraft_flights',
    title: 'Aircraft Recent Flights',
    description: 'Number of recent flights for this aircraft',
    category: 'Aircraft',
    dataPath: 'aircraft_efficiency.aircraft_utilization.{aircraft}.recentFlightsCount',
    format: 'number',
    icon: 'plane'
  },
  
  // Instructor Templates
  {
    id: 'instructor_workload',
    title: 'Instructor Teaching Hours',
    description: 'Teaching hours for this instructor',
    category: 'Instructors',
    dataPath: 'instructor_efficiency.instructor_workload.{instructor}.teachingHours',
    format: 'number',
    suffix: ' hrs',
    icon: 'clock'
  },
  {
    id: 'instructor_students',
    title: 'Instructor Student Count',
    description: 'Number of students for this instructor',
    category: 'Instructors',
    dataPath: 'instructor_efficiency.instructor_workload.{instructor}.students',
    format: 'number',
    icon: 'user'
  },
  {
    id: 'instructor_utilization',
    title: 'Instructor Utilization Rate',
    description: 'Utilization rate for this instructor',
    category: 'Instructors',
    dataPath: 'instructor_efficiency.instructor_workload.{instructor}.utilization',
    format: 'percentage',
    suffix: '%',
    icon: 'chart'
  }
];

// Utility function to remove duplicate configurations
const deduplicateConfigs = (configs: StatConfig[]): StatConfig[] => {
  const uniqueConfigsMap = new Map();
  configs.forEach(config => {
    uniqueConfigsMap.set(config.id, config);
  });
  return Array.from(uniqueConfigsMap.values());
};

interface AvailableStat {
  id: string;
  title: string;
  description: string;
  dataPath: string;
  format: 'number' | 'percentage' | 'currency' | 'duration';
  suffix?: string;
  prefix?: string;
  icon: keyof typeof iconMap;
  category: string;
}

// Generate available stats from API response
const generateAvailableStats = (rawData: any): AvailableStat[] => {
  if (!rawData) return [];
  
  const availableStats: AvailableStat[] = [];
  
  // Overview stats (both dashboard and students page)
  if (rawData.overview) {
    const overview = rawData.overview;
    if (overview.total_students !== undefined) {
      availableStats.push({
        id: 'overview_total_students',
        title: 'Total Students',
        description: 'Total number of students in the organization',
        dataPath: 'overview.total_students',
        format: 'number',
        icon: 'user',
        category: 'Overview'
      });
    }
    if (overview.active_students !== undefined) {
      availableStats.push({
        id: 'overview_active_students',
        title: 'Active Students',
        description: 'Number of currently active students',
        dataPath: 'overview.active_students',
        format: 'number',
        icon: 'user',
        category: 'Overview'
      });
    }
    if (overview.new_enrollments_period !== undefined) {
      availableStats.push({
        id: 'overview_new_enrollments',
        title: 'New Enrollments (Period)',
        description: 'Number of new student enrollments in the current period',
        dataPath: 'overview.new_enrollments_period',
        format: 'number',
        icon: 'user',
        category: 'Overview'
      });
    }
    if (overview.graduated_students_period !== undefined) {
      availableStats.push({
        id: 'overview_graduated_students',
        title: 'Graduated This Period',
        description: 'Number of students who graduated in the current period',
        dataPath: 'overview.graduated_students_period',
        format: 'number',
        icon: 'user',
        category: 'Overview'
      });
    }
    if (overview.completion_rate !== undefined) {
      availableStats.push({
        id: 'overview_completion_rate',
        title: 'Completion Rate',
        description: 'Overall student completion rate',
        dataPath: 'overview.completion_rate',
        format: 'percentage',
        suffix: '%',
        icon: 'chart',
        category: 'Overview'
      });
    }
    if (overview.retention_rate !== undefined) {
      availableStats.push({
        id: 'overview_retention_rate',
        title: 'Retention Rate',
        description: 'Student retention rate',
        dataPath: 'overview.retention_rate',
        format: 'percentage',
        suffix: '%',
        icon: 'chart',
        category: 'Overview'
      });
    }
    if (overview.total_instructors !== undefined) {
      availableStats.push({
        id: 'overview_total_instructors',
        title: 'Total Instructors',
        description: 'Total number of instructors',
        dataPath: 'overview.total_instructors',
        format: 'number',
        icon: 'user',
        category: 'Overview'
      });
    }
    if (overview.active_instructors !== undefined) {
      availableStats.push({
        id: 'overview_active_instructors',
        title: 'Active Instructors',
        description: 'Number of currently active instructors',
        dataPath: 'overview.active_instructors',
        format: 'number',
        icon: 'user',
        category: 'Overview'
      });
    }
    if (overview.total_planes !== undefined) {
      availableStats.push({
        id: 'overview_total_planes',
        title: 'Total Aircraft',
        description: 'Total number of aircraft',
        dataPath: 'overview.total_planes',
        format: 'number',
        icon: 'plane',
        category: 'Overview'
      });
    }
    if (overview.active_planes !== undefined) {
      availableStats.push({
        id: 'overview_active_planes',
        title: 'Active Aircraft',
        description: 'Number of currently active aircraft',
        dataPath: 'overview.active_planes',
        format: 'number',
        icon: 'plane',
        category: 'Overview'
      });
    }
    if (overview.upcoming_lessons !== undefined) {
      availableStats.push({
        id: 'overview_upcoming_lessons',
        title: 'Upcoming Lessons',
        description: 'Number of upcoming scheduled lessons',
        dataPath: 'overview.upcoming_lessons',
        format: 'number',
        icon: 'calendar',
        category: 'Overview'
      });
    }
  }
  
  // Flight Activity stats (students page specific)
  if (rawData.flight_activity) {
    const activity = rawData.flight_activity;
    if (activity.total_flights_period !== undefined) {
      availableStats.push({
        id: 'flight_activity_total_flights',
        title: 'Total Flights (Period)',
        description: 'Total number of flights in the current period',
        dataPath: 'flight_activity.total_flights_period',
        format: 'number',
        icon: 'plane',
        category: 'Flight Activity'
      });
    }
    if (activity.completed_flights_period !== undefined) {
      availableStats.push({
        id: 'flight_activity_completed_flights',
        title: 'Completed Flights (Period)',
        description: 'Number of completed flights in the current period',
        dataPath: 'flight_activity.completed_flights_period',
        format: 'number',
        icon: 'plane',
        category: 'Flight Activity'
      });
    }
    if (activity.total_hours_period !== undefined) {
      availableStats.push({
        id: 'flight_activity_total_hours',
        title: 'Total Flight Hours (Period)',
        description: 'Total flight hours in the current period',
        dataPath: 'flight_activity.total_hours_period',
        format: 'duration',
        suffix: ' hrs',
        icon: 'clock',
        category: 'Flight Activity'
      });
    }
  }
  
  // Performance Metrics (students page specific)
  if (rawData.performance_metrics) {
    const metrics = rawData.performance_metrics;
    if (metrics.overall_on_time_rate !== undefined) {
      availableStats.push({
        id: 'performance_on_time_rate',
        title: 'On-Time Rate',
        description: 'Overall on-time rate for flights',
        dataPath: 'performance_metrics.overall_on_time_rate',
        format: 'percentage',
        suffix: '%',
        icon: 'chart',
        category: 'Performance Metrics'
      });
    }
    if (metrics.avg_flights_per_student !== undefined) {
      availableStats.push({
        id: 'performance_avg_flights_per_student',
        title: 'Avg Flights/Student',
        description: 'Average number of flights per student',
        dataPath: 'performance_metrics.avg_flights_per_student',
        format: 'number',
        icon: 'chart',
        category: 'Performance Metrics'
      });
    }
  }
  
  // Progress Tracking (students page specific)
  if (rawData.progress_tracking) {
    const progress = rawData.progress_tracking;
    if (progress.overall_progress !== undefined) {
      availableStats.push({
        id: 'progress_overall_progress',
        title: 'Overall Progress',
        description: 'Overall student progress percentage',
        dataPath: 'progress_tracking.overall_progress',
        format: 'percentage',
        suffix: '%',
        icon: 'chart',
        category: 'Progress Tracking'
      });
    }
  }
  
  // Certification Breakdown (students page specific)
  if (rawData.certification_breakdown) {
    const certs = rawData.certification_breakdown;
    if (certs.private !== undefined) {
      availableStats.push({
        id: 'certification_private',
        title: 'Private Certifications',
        description: 'Number of private pilot certifications',
        dataPath: 'certification_breakdown.private',
        format: 'number',
        icon: 'user',
        category: 'Certification Breakdown'
      });
    }
    if (certs.instrument !== undefined) {
      availableStats.push({
        id: 'certification_instrument',
        title: 'Instrument Certifications',
        description: 'Number of instrument rating certifications',
        dataPath: 'certification_breakdown.instrument',
        format: 'number',
        icon: 'user',
        category: 'Certification Breakdown'
      });
    }
    if (certs.commercial !== undefined) {
      availableStats.push({
        id: 'certification_commercial',
        title: 'Commercial Certifications',
        description: 'Number of commercial pilot certifications',
        dataPath: 'certification_breakdown.commercial',
        format: 'number',
        icon: 'user',
        category: 'Certification Breakdown'
      });
    }
  }
  
  // Flight Operations stats (dashboard specific)
  if (rawData.flight_operations) {
    const ops = rawData.flight_operations;
    if (ops.total_flights_period !== undefined) {
      availableStats.push({
        id: 'flight_ops_total_flights',
        title: 'Total Flights (Period)',
        description: 'Total number of flights in the current period',
        dataPath: 'flight_operations.total_flights_period',
        format: 'number',
        icon: 'plane',
        category: 'Flight Operations'
      });
    }
    if (ops.completed_flights !== undefined) {
      availableStats.push({
        id: 'flight_ops_completed_flights',
        title: 'Completed Flights',
        description: 'Number of completed flights',
        dataPath: 'flight_operations.completed_flights',
        format: 'number',
        icon: 'plane',
        category: 'Flight Operations'
      });
    }
    if (ops.completion_rate !== undefined) {
      availableStats.push({
        id: 'flight_ops_completion_rate',
        title: 'Flight Completion Rate',
        description: 'Percentage of flights completed',
        dataPath: 'flight_operations.completion_rate',
        format: 'percentage',
        suffix: '%',
        icon: 'chart',
        category: 'Flight Operations'
      });
    }
    if (ops.recent_flights_7_days !== undefined) {
      availableStats.push({
        id: 'flight_ops_recent_flights',
        title: 'Recent Flights (7 days)',
        description: 'Number of flights in the last 7 days',
        dataPath: 'flight_operations.recent_flights_7_days',
        format: 'number',
        icon: 'plane',
        category: 'Flight Operations'
      });
    }
    if (ops.schedule_adherence_percentage !== undefined) {
      availableStats.push({
        id: 'flight_ops_schedule_adherence',
        title: 'Schedule Adherence',
        description: 'Percentage of flights adhering to schedule',
        dataPath: 'flight_operations.schedule_adherence_percentage',
        format: 'percentage',
        suffix: '%',
        icon: 'chart',
        category: 'Flight Operations'
      });
    }
    if (ops.avg_delay_minutes !== undefined) {
      availableStats.push({
        id: 'flight_ops_avg_delay',
        title: 'Average Delay',
        description: 'Average delay in minutes',
        dataPath: 'flight_operations.avg_delay_minutes',
        format: 'number',
        suffix: ' min',
        icon: 'clock',
        category: 'Flight Operations'
      });
    }
  }
  
  // Instructor Efficiency stats (dashboard specific)
  if (rawData.instructor_efficiency) {
    const inst = rawData.instructor_efficiency;
    if (inst.total_teaching_hours !== undefined) {
      availableStats.push({
        id: 'instructor_total_teaching_hours',
        title: 'Total Teaching Hours',
        description: 'Total teaching hours across all instructors',
        dataPath: 'instructor_efficiency.total_teaching_hours',
        format: 'number',
        suffix: ' hrs',
        icon: 'clock',
        category: 'Instructor Efficiency'
      });
    }
    if (inst.total_flight_hours !== undefined) {
      availableStats.push({
        id: 'instructor_total_flight_hours',
        title: 'Total Flight Hours',
        description: 'Total flight hours across all instructors',
        dataPath: 'instructor_efficiency.total_flight_hours',
        format: 'number',
        suffix: ' hrs',
        icon: 'clock',
        category: 'Instructor Efficiency'
      });
    }
    if (inst.average_utilization !== undefined) {
      availableStats.push({
        id: 'instructor_avg_utilization',
        title: 'Average Instructor Utilization',
        description: 'Average utilization rate of instructors',
        dataPath: 'instructor_efficiency.average_utilization',
        format: 'percentage',
        suffix: '%',
        icon: 'chart',
        category: 'Instructor Efficiency'
      });
    }
    if (inst.total_students_taught !== undefined) {
      availableStats.push({
        id: 'instructor_total_students',
        title: 'Total Students Taught',
        description: 'Total number of students taught by all instructors',
        dataPath: 'instructor_efficiency.total_students_taught',
        format: 'number',
        icon: 'user',
        category: 'Instructor Efficiency'
      });
    }
    if (inst.avg_students_per_instructor !== undefined) {
      availableStats.push({
        id: 'instructor_avg_students_per',
        title: 'Avg Students per Instructor',
        description: 'Average number of students per instructor',
        dataPath: 'instructor_efficiency.avg_students_per_instructor',
        format: 'number',
        icon: 'user',
        category: 'Instructor Efficiency'
      });
    }
  }
  
  // Student Metrics stats (dashboard specific)
  if (rawData.student_metrics) {
    const student = rawData.student_metrics;
    if (student.new_enrollments_period !== undefined) {
      availableStats.push({
        id: 'student_new_enrollments',
        title: 'New Enrollments (Period)',
        description: 'Number of new student enrollments in the current period',
        dataPath: 'student_metrics.new_enrollments_period',
        format: 'number',
        icon: 'user',
        category: 'Student Metrics'
      });
    }
  }
  
  // Aircraft Efficiency stats (dashboard specific)
  if (rawData.aircraft_efficiency) {
    const aircraft = rawData.aircraft_efficiency;
    if (aircraft.average_utilization_rate !== undefined) {
      availableStats.push({
        id: 'aircraft_avg_utilization',
        title: 'Aircraft Utilization Rate',
        description: 'Average utilization rate of aircraft',
        dataPath: 'aircraft_efficiency.average_utilization_rate',
        format: 'percentage',
        suffix: '%',
        icon: 'chart',
        category: 'Aircraft Efficiency'
      });
    }
  }
  
  // Operational Metrics stats (dashboard specific)
  if (rawData.operational_metrics) {
    const operational = rawData.operational_metrics;
    if (operational.total_scheduled_hours !== undefined) {
      availableStats.push({
        id: 'ops_total_scheduled_hours',
        title: 'Total Scheduled Hours',
        description: 'Total scheduled flight hours',
        dataPath: 'operational_metrics.total_scheduled_hours',
        format: 'duration',
        suffix: ' hrs',
        icon: 'clock',
        category: 'Operational Metrics'
      });
    }
    if (operational.total_actual_hours !== undefined) {
      availableStats.push({
        id: 'ops_total_actual_hours',
        title: 'Total Actual Hours',
        description: 'Total actual flight hours',
        dataPath: 'operational_metrics.total_actual_hours',
        format: 'duration',
        suffix: ' hrs',
        icon: 'clock',
        category: 'Operational Metrics'
      });
    }
    if (operational.average_flight_duration !== undefined) {
      availableStats.push({
        id: 'ops_avg_flight_duration',
        title: 'Average Flight Duration',
        description: 'Average duration of flights',
        dataPath: 'operational_metrics.average_flight_duration',
        format: 'duration',
        suffix: ' hrs',
        icon: 'clock',
        category: 'Operational Metrics'
      });
    }
    if (operational.capacity_utilization !== undefined) {
      availableStats.push({
        id: 'ops_capacity_utilization',
        title: 'Capacity Utilization',
        description: 'Overall capacity utilization percentage',
        dataPath: 'operational_metrics.capacity_utilization',
        format: 'percentage',
        suffix: '%',
        icon: 'chart',
        category: 'Operational Metrics'
      });
    }
    if (operational.efficiency_ratio !== undefined) {
      availableStats.push({
        id: 'ops_efficiency_ratio',
        title: 'Efficiency Ratio',
        description: 'Overall operational efficiency ratio',
        dataPath: 'operational_metrics.efficiency_ratio',
        format: 'number',
        icon: 'chart',
        category: 'Operational Metrics'
      });
    }
  }
  
  // Individual program stats (both dashboard and students page)
  if (rawData.student_metrics?.students_by_program) {
    rawData.student_metrics.students_by_program.forEach((program: any) => {
      if (program._id) {
        availableStats.push({
          id: `program_count_${program._id.toLowerCase().replace(/\s+/g, '_')}`,
          title: `${program._id} - Student Count`,
          description: `Number of students enrolled in ${program._id}`,
          dataPath: `student_metrics.students_by_program[${program._id}].count`,
          format: 'number',
          icon: 'user',
          category: 'Program Statistics'
        });
        
        if (program.active !== undefined) {
          availableStats.push({
            id: `program_active_${program._id.toLowerCase().replace(/\s+/g, '_')}`,
            title: `${program._id} - Active Students`,
            description: `Number of active students in ${program._id}`,
            dataPath: `student_metrics.students_by_program[${program._id}].active`,
            format: 'number',
            icon: 'user',
            category: 'Program Statistics'
          });
        }
      }
    });
  }
  
  // Individual flight status stats (dashboard specific)
  if (rawData.flight_operations?.flight_status_breakdown) {
    rawData.flight_operations.flight_status_breakdown.forEach((status: any) => {
      if (status._id) {
        availableStats.push({
          id: `flight_status_${status._id.toLowerCase().replace(/\s+/g, '_')}`,
          title: `${status._id} Flights`,
          description: `Number of flights with ${status._id} status`,
          dataPath: `flight_operations.flight_status_breakdown[${status._id}].count`,
          format: 'number',
          icon: 'plane',
          category: 'Flight Status'
        });
        
        if (status.avgScheduledDuration !== undefined && status.avgScheduledDuration !== null) {
          availableStats.push({
            id: `flight_status_avg_duration_${status._id.toLowerCase().replace(/\s+/g, '_')}`,
            title: `${status._id} - Avg Duration`,
            description: `Average scheduled duration for ${status._id} flights`,
            dataPath: `flight_operations.flight_status_breakdown[${status._id}].avgScheduledDuration`,
            format: 'duration',
            suffix: ' hrs',
            icon: 'clock',
            category: 'Flight Status'
          });
        }
      }
    });
  }
  
  // Individual flight type stats (dashboard specific)
  if (rawData.flight_operations?.flight_type_breakdown) {
    rawData.flight_operations.flight_type_breakdown.forEach((type: any) => {
      if (type._id) {
        availableStats.push({
          id: `flight_type_${type._id.toLowerCase().replace(/\s+/g, '_')}`,
          title: `${type._id} Flights`,
          description: `Number of ${type._id} flights`,
          dataPath: `flight_operations.flight_type_breakdown[${type._id}].count`,
          format: 'number',
          icon: 'plane',
          category: 'Flight Types'
        });
        
        if (type.avgDuration !== undefined && type.avgDuration !== null) {
          availableStats.push({
            id: `flight_type_avg_duration_${type._id.toLowerCase().replace(/\s+/g, '_')}`,
            title: `${type._id} - Avg Duration`,
            description: `Average duration for ${type._id} flights`,
            dataPath: `flight_operations.flight_type_breakdown[${type._id}].avgDuration`,
            format: 'duration',
            suffix: ' hrs',
            icon: 'clock',
            category: 'Flight Types'
          });
        }
      }
    });
  }
  
  return availableStats;
};

export function EnhancedStatsCustomizationModal({ 
  opened, 
  onClose, 
  onSave, 
  configs, 
  onSaveConfigs, 
  defaultConfigs,
  rawData
}: EnhancedStatsCustomizationModalProps) {
  const [localConfigs, setLocalConfigs] = useState<StatConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [selectedStats, setSelectedStats] = useState<string[]>([]);
  const [availableStats, setAvailableStats] = useState<AvailableStat[]>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  useEffect(() => {
    console.log('EnhancedStatsCustomizationModal - useEffect triggered');
    console.log('EnhancedStatsCustomizationModal - rawData:', rawData);
    
    if (rawData) {
      console.log('EnhancedStatsCustomizationModal - Generating available stats from:', rawData);
      const stats = generateAvailableStats(rawData);
      console.log('EnhancedStatsCustomizationModal - Generated stats:', stats);
      setAvailableStats(stats);
    } else {
      console.log('EnhancedStatsCustomizationModal - No rawData provided');
      setAvailableStats([]);
    }
  }, [rawData, opened]);

  React.useEffect(() => {
    if (opened) {
      // Remove any duplicates that might exist in the configs
      const deduplicatedConfigs = deduplicateConfigs(configs);
      
      // If we found duplicates, immediately save the cleaned version
      if (deduplicatedConfigs.length !== configs.length) {
        console.warn(`Found ${configs.length - deduplicatedConfigs.length} duplicate configurations. Cleaning up...`);
        onSaveConfigs(deduplicatedConfigs);
        setFeedbackMessage(`Removed ${configs.length - deduplicatedConfigs.length} duplicate statistics.`);
        setTimeout(() => setFeedbackMessage(''), 3000);
      }
      
      setLocalConfigs([...deduplicatedConfigs]);
      setHasChanges(false);
    }
  }, [opened, configs, onSaveConfigs, rawData]);

  const handleToggle = (statId: string) => {
    const newConfigs = localConfigs.map(config =>
      config.id === statId ? { ...config, enabled: !config.enabled } : config
    );
    setLocalConfigs(newConfigs);
    setHasChanges(true);
  };

  const handleSave = () => {
    // Remove duplicates and preserve original properties
    const deduplicatedConfigs = deduplicateConfigs(localConfigs).map(config => {
      const original = configs.find(c => c.id === config.id);
      return original ? { ...original, enabled: config.enabled } : config;
    });

    onSaveConfigs(deduplicatedConfigs);
    setHasChanges(false);
    
    setTimeout(() => {
      onSave?.();
    }, 50);
    
    onClose();
  };

  const handleReset = () => {
    if (defaultConfigs) {
      setLocalConfigs([...defaultConfigs]);
      setHasChanges(true); // Mark as changed so it gets saved
      
      // Also immediately save to localStorage to clear any duplicates
      onSaveConfigs([...defaultConfigs]);
      
      setFeedbackMessage('Statistics reset to default configuration.');
      setTimeout(() => setFeedbackMessage(''), 3000);
    }
  };

  const handleCancel = () => {
    setLocalConfigs([...configs]);
    setHasChanges(false);
    onClose();
  };

  const generateDynamicStats = () => {
    if (selectedStats.length === 0) {
      return;
    }

    const newStats: StatConfig[] = [];
    const existingIds = new Set(localConfigs.map(config => config.id));
    let nextOrder = Math.max(...localConfigs.map(c => c.order), 0) + 1;
    let duplicatesFound = 0;

    selectedStats.forEach(statId => {
      const availableStat = availableStats.find(s => s.id === statId);
      if (availableStat) {
        // Check if this stat already exists
        if (existingIds.has(statId)) {
          duplicatesFound++;
          return; // Skip this stat as it already exists
        }

        const newStatConfig: StatConfig = {
          id: statId,
          title: availableStat.title,
          icon: availableStat.icon,
          enabled: true,
          order: nextOrder++,
          dataPath: availableStat.dataPath,
          format: availableStat.format,
          suffix: availableStat.suffix,
          prefix: availableStat.prefix
        };
        newStats.push(newStatConfig);
        existingIds.add(statId); // Add to set to prevent duplicates within this generation
      }
    });

    if (newStats.length > 0) {
      const updatedConfigs = [...localConfigs, ...newStats];
      const finalConfigs = deduplicateConfigs(updatedConfigs);
      setLocalConfigs(finalConfigs);
      setHasChanges(true);
    }

    // Show feedback to user
    let message = '';
    if (newStats.length > 0 && duplicatesFound > 0) {
      message = `Added ${newStats.length} new statistics. Skipped ${duplicatesFound} duplicates.`;
    } else if (newStats.length > 0) {
      message = `Added ${newStats.length} new statistics.`;
    } else if (duplicatesFound > 0) {
      message = `All selected statistics already exist. No new statistics added.`;
    } else {
      message = 'No statistics were generated.';
    }
    
    setFeedbackMessage(message);
    
    // Clear feedback after 3 seconds
    setTimeout(() => setFeedbackMessage(''), 3000);
    
    setSelectedStats([]);
  };

  const removeDynamicStat = (statId: string) => {
    const updatedConfigs = localConfigs.filter(config => config.id !== statId);
    setLocalConfigs(updatedConfigs);
    setHasChanges(true);
  };

  const getStatValue = (config: StatConfig) => {
    if (!rawData) {
      return 'N/A';
    }

    // Handle dynamic stats that reference specific items in arrays by name
    if (config.dataPath.includes('[') && config.dataPath.includes(']')) {
      // Extract the array path and the item name
      const arrayPathMatch = config.dataPath.match(/^(.+?)\[(.+?)\]\.(.+)$/);
      if (arrayPathMatch) {
        const [, arrayPath, itemName, property] = arrayPathMatch;
        
        // Get the array from the data
        const keys = arrayPath.split('.');
        let current: any = rawData;
        
        for (const key of keys) {
          if (current && typeof current === 'object' && key in current) {
            current = current[key];
          } else {
            return 'N/A';
          }
        }
        
        if (Array.isArray(current)) {
          // Find the item by name
          const item = current.find((item: any) => 
            item._id === itemName || 
            item.registration === itemName || 
            item.contact_email === itemName
          );
          
          if (item && property in item) {
            const value = item[property];
            if (value === null || value === undefined) return 'N/A';
            
            switch (config.format) {
              case 'percentage':
                return `${Number(value).toFixed(1)}%`;
              case 'number':
                return Number(value).toLocaleString();
              case 'currency':
                return `$${Number(value).toFixed(2)}`;
              case 'duration':
                return `${Number(value).toFixed(1)} hrs`;
              default:
                return String(value);
            }
          }
        }
        
        return 'N/A';
      }
    }

    // Handle regular stats with direct paths
    const keys = config.dataPath.split('.');
    let current = rawData;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return 'N/A';
      }
    }
    
    if (current === null || current === undefined) return 'N/A';
    
    switch (config.format) {
      case 'percentage':
        return `${Number(current).toFixed(1)}%`;
      case 'number':
        return Number(current).toLocaleString();
      case 'currency':
        return `$${Number(current).toFixed(2)}`;
      case 'duration':
        return `${Number(current).toFixed(1)} hrs`;
      default:
        return String(current);
    }
  };

  const enabledStats = localConfigs.filter(config => config.enabled);
  const disabledStats = localConfigs.filter(config => !config.enabled);

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title="Customize Statistics"
      size="xl"
      styles={{
        title: { fontWeight: 600, fontSize: '1.1rem' }
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            Customize which statistics are displayed. You can enable/disable existing statistics and add dynamic program-based statistics.
          </Text>
        </Alert>

        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'basic')}>
          <Tabs.List>
            <Tabs.Tab value="basic">Basic Stats</Tabs.Tab>
            <Tabs.Tab value="dynamic">Dynamic Stats</Tabs.Tab>
            <Tabs.Tab value="preview">Preview</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="basic">
            <div style={{ marginTop: '1rem' }}>
              <ScrollArea h={400}>
                <Stack gap="sm">
                  {enabledStats.length > 0 && (
                    <>
                      <Text size="sm" fw={500} c="dimmed">Enabled Statistics</Text>
                      {enabledStats.map((config) => (
                        <Paper key={config.id} p="sm" withBorder>
                          <Group justify="space-between">
                            <Group gap="sm">
                              {iconMap[config.icon as keyof typeof iconMap] && 
                                React.createElement(iconMap[config.icon as keyof typeof iconMap], { size: 16 })
                              }
                              <div>
                                <Text size="sm" fw={500}>{config.title}</Text>
                                <Text size="xs" c="dimmed">
                                  {config.format ? formatLabels[config.format] : 'Unknown'}
                                </Text>
                              </div>
                            </Group>
                            <Switch
                              checked={config.enabled}
                              onChange={() => handleToggle(config.id)}
                              size="sm"
                            />
                          </Group>
                        </Paper>
                      ))}
                    </>
                  )}

                  {disabledStats.length > 0 && (
                    <>
                      <Divider />
                      <Text size="sm" fw={500} c="dimmed">Disabled Statistics</Text>
                      {disabledStats.map((config) => (
                        <Paper key={config.id} p="sm" withBorder style={{ opacity: 0.6 }}>
                          <Group justify="space-between">
                            <Group gap="sm">
                              {iconMap[config.icon as keyof typeof iconMap] && 
                                React.createElement(iconMap[config.icon as keyof typeof iconMap], { size: 16 })
                              }
                              <div>
                                <Text size="sm" fw={500}>{config.title}</Text>
                                <Text size="xs" c="dimmed">
                                  {config.format ? formatLabels[config.format] : 'Unknown'}
                                </Text>
                              </div>
                            </Group>
                            <Switch
                              checked={config.enabled}
                              onChange={() => handleToggle(config.id)}
                              size="sm"
                            />
                          </Group>
                        </Paper>
                      ))}
                    </>
                  )}
                </Stack>
              </ScrollArea>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="dynamic">
            <div style={{ marginTop: '1rem' }}>
              <Stack gap="md">
                <Alert icon={<IconInfoCircle size={16} />} color="green" variant="light">
                  <Text size="sm">
                    Select statistics from your organization's data to add to your dashboard. Statistics are organized by category for easy browsing.
                  </Text>
                </Alert>

                {availableStats.length > 0 ? (
                  <div>
                    <Text size="sm" fw={500} mb="sm">Available Statistics</Text>
                    <Text size="xs" c="dimmed" mb="md">Select the statistics you want to add to your dashboard</Text>
                    
                    <ScrollArea h={400}>
                      <Stack gap="lg">
                        {/* Group stats by category */}
                        {Object.entries(
                          availableStats.reduce((acc, stat) => {
                            if (!acc[stat.category]) {
                              acc[stat.category] = [];
                            }
                            acc[stat.category].push(stat);
                            return acc;
                          }, {} as Record<string, AvailableStat[]>)
                        ).map(([category, stats]) => (
                          <div key={category}>
                            <Text size="sm" fw={600} c="blue" mb="xs">{category}</Text>
                            <Stack gap="xs">
                              {stats.map((stat) => (
                                <Paper key={stat.id} p="xs" withBorder style={{ backgroundColor: selectedStats.includes(stat.id) ? 'var(--mantine-color-blue-0)' : 'transparent' }}>
                                  <Group gap="sm" style={{ width: '100%' }}>
                                    {iconMap[stat.icon] && React.createElement(iconMap[stat.icon], { size: 16 })}
                                    <Checkbox
                                      label={stat.title}
                                      description={stat.description}
                                      checked={selectedStats.includes(stat.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedStats([...selectedStats, stat.id]);
                                        } else {
                                          setSelectedStats(selectedStats.filter(s => s !== stat.id));
                                        }
                                      }}
                                      style={{ flex: 1 }}
                                    />
                                  </Group>
                                </Paper>
                              ))}
                            </Stack>
                          </div>
                        ))}
                      </Stack>
                    </ScrollArea>
                  </div>
                ) : (
                  <Alert color="orange" variant="light">
                    <Text size="sm">
                      No additional statistics are available. This could be because:
                      <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                        <li>Data is still loading</li>
                        <li>Your organization has limited data</li>
                        <li>All available statistics are already added</li>
                      </ul>
                    </Text>
                  </Alert>
                )}

                <Group justify="space-between">
                  <Text size="sm" c="dimmed">
                    {selectedStats.length} statistics selected
                  </Text>
                  <Button
                    onClick={generateDynamicStats}
                    disabled={selectedStats.length === 0}
                    leftSection={<IconPlus size={16} />}
                  >
                    Add Selected Statistics ({selectedStats.length})
                  </Button>
                </Group>

                {feedbackMessage && (
                  <Alert color={feedbackMessage.includes('Skipped') ? 'orange' : 'green'} variant="light">
                    <Text size="sm">{feedbackMessage}</Text>
                  </Alert>
                )}

                {localConfigs.filter(config => config.id.includes('_')).length > 0 && (
                  <div>
                    <Text size="sm" fw={500} c="dimmed" mb="sm">Custom Statistics</Text>
                    <ScrollArea h={200}>
                      <Stack gap="sm">
                        {localConfigs
                          .filter(config => config.id.includes('_'))
                          .sort((a, b) => {
                            // Sort by enabled status first (enabled at top), then by order
                            if (a.enabled !== b.enabled) {
                              return a.enabled ? -1 : 1;
                            }
                            return a.order - b.order;
                          })
                          .map((config) => (
                            <Paper key={config.id} p="sm" withBorder>
                              <Group justify="space-between">
                                <Group gap="sm">
                                  {iconMap[config.icon as keyof typeof iconMap] && 
                                    React.createElement(iconMap[config.icon as keyof typeof iconMap], { size: 16 })
                                  }
                                  <div>
                                    <Text size="sm" fw={500}>{config.title}</Text>
                                  </div>
                                </Group>
                                <Group gap="xs">
                                  <Switch
                                    checked={config.enabled}
                                    onChange={() => handleToggle(config.id)}
                                    size="sm"
                                  />
                                  <Button
                                    variant="subtle"
                                    color="red"
                                    size="xs"
                                    onClick={() => removeDynamicStat(config.id)}
                                    leftSection={<IconTrash size={12} />}
                                  >
                                    Remove
                                  </Button>
                                </Group>
                              </Group>
                            </Paper>
                          ))}
                      </Stack>
                    </ScrollArea>
                  </div>
                )}
              </Stack>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="preview">
            <div style={{ marginTop: '1rem' }}>
              <Stack gap="md">
                <Text size="sm" fw={500}>Preview of Enabled Statistics</Text>
                <ScrollArea h={400}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {enabledStats.map((config) => (
                      <Paper key={config.id} p="md" withBorder>
                        <Group gap="sm" mb="xs">
                          {iconMap[config.icon as keyof typeof iconMap] && 
                            React.createElement(iconMap[config.icon as keyof typeof iconMap], { size: 20 })
                          }
                          <Text size="sm" fw={500}>{config.title}</Text>
                        </Group>
                        <Text size="xl" fw={700} c="blue">
                          {getStatValue(config)}
                        </Text>
                        <Text size="xs" c="dimmed" mt="xs">
                          {config.dataPath}
                        </Text>
                      </Paper>
                    ))}
                  </div>
                </ScrollArea>
              </Stack>
            </div>
          </Tabs.Panel>
        </Tabs>

        <Divider />

        <Group justify="space-between">
          <Group>
            <Button
              variant="outline"
              leftSection={<IconRestore size={16} />}
              onClick={handleReset}
              disabled={!defaultConfigs}
            >
              Reset to Default
            </Button>
            <Text size="sm" c="dimmed">
              {enabledStats.length} of {localConfigs.length} statistics enabled
            </Text>
          </Group>
          
          <Group>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </Group>
        </Group>
      </div>
    </Modal>
  );
} 