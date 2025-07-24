import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCoin,
  IconDiscount2,
  IconReceipt2,
  IconUserPlus,
  IconSettings,
  IconRefresh,
  IconPlane,
  IconChartBar,
  IconCalendar,
  IconClock,
} from '@tabler/icons-react';
import { Group, Paper, SimpleGrid, Text, ActionIcon, LoadingOverlay, Button } from '@mantine/core';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useStatsData } from '@/hooks/useStatsData';
import { useStatsPreferences } from '@/hooks/useStatsPreferences';
import classes from './StatsGrid.module.css';

// Dynamically import the StatsCustomizationModal to avoid SSR issues with drag and drop
const StatsCustomizationModal = dynamic(() => import('@/components/StatsCustomizationModal').then(mod => ({ default: mod.StatsCustomizationModal })), {
  ssr: false,
});

// Dynamically import the EnhancedStatsCustomizationModal
const EnhancedStatsCustomizationModal = dynamic(() => import('@/components/EnhancedStatsCustomizationModal').then(mod => ({ default: mod.EnhancedStatsCustomizationModal })), {
  ssr: false,
});

const icons = {
  user: IconUserPlus,
  discount: IconDiscount2,
  receipt: IconReceipt2,
  coin: IconCoin,
  plane: IconPlane,
  chart: IconChartBar,
  calendar: IconCalendar,
  clock: IconClock,
} as const;

export interface StatsGridProps {
  // API configuration
  apiEndpoint?: string;
  apiMethod?: 'GET' | 'POST';
  apiHeaders?: Record<string, string>;
  apiBody?: any;
  
  // Data configuration
  dataPath?: string; // Path to the stats object in the API response (e.g., 'data.stats')
  defaultConfigs?: StatConfig[];
  storageKey?: string; // Unique key for localStorage preferences
  
  // UI configuration
  title?: string;
  showRefreshButton?: boolean;
  showCustomizeButton?: boolean;
  className?: string;
  
  // Custom data fetching function (alternative to API endpoint)
  customFetchFunction?: () => Promise<any>;
  
  // Custom data processing function
  processData?: (rawData: any) => any;
  
  // Enhanced modal configuration
  useEnhancedModal?: boolean; // Use the enhanced modal with dynamic stats support
  rawData?: any; // Raw API response data for enhanced modal
}

export interface StatConfig {
  id: string;
  title: string;
  icon: string;
  enabled: boolean;
  order: number;
  dataPath: string; // Path to the data in the API response
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  suffix?: string;
  prefix?: string;
}

// Default configuration for the main dashboard
export const DEFAULT_DASHBOARD_CONFIGS: StatConfig[] = [
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
    id: 'total_flights_period',
    title: 'Flights This Period',
    icon: 'plane',
    enabled: true,
    order: 3,
    dataPath: 'flight_operations.total_flights_period',
    format: 'number'
  },
  {
    id: 'completion_rate',
    title: 'Flight Completion Rate',
    icon: 'chart',
    enabled: true,
    order: 4,
    dataPath: 'flight_operations.completion_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'total_instructors',
    title: 'Total Instructors',
    icon: 'user',
    enabled: false,
    order: 5,
    dataPath: 'overview.total_instructors',
    format: 'number'
  },
  {
    id: 'active_instructors',
    title: 'Active Instructors',
    icon: 'user',
    enabled: false,
    order: 6,
    dataPath: 'overview.active_instructors',
    format: 'number'
  },
  {
    id: 'total_planes',
    title: 'Total Aircraft',
    icon: 'plane',
    enabled: false,
    order: 7,
    dataPath: 'overview.total_planes',
    format: 'number'
  },
  {
    id: 'active_planes',
    title: 'Active Aircraft',
    icon: 'plane',
    enabled: false,
    order: 8,
    dataPath: 'overview.active_planes',
    format: 'number'
  },
  {
    id: 'upcoming_lessons',
    title: 'Upcoming Lessons',
    icon: 'calendar',
    enabled: false,
    order: 9,
    dataPath: 'overview.upcoming_lessons',
    format: 'number'
  },
  {
    id: 'avg_delay_minutes',
    title: 'Average Delay',
    icon: 'clock',
    enabled: false,
    order: 10,
    dataPath: 'flight_operations.avg_delay_minutes',
    format: 'duration',
    suffix: ' min'
  },
  {
    id: 'schedule_adherence_percentage',
    title: 'Schedule Adherence',
    icon: 'chart',
    enabled: false,
    order: 11,
    dataPath: 'flight_operations.schedule_adherence_percentage',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'average_utilization',
    title: 'Aircraft Utilization',
    icon: 'chart',
    enabled: false,
    order: 12,
    dataPath: 'aircraft_efficiency.average_utilization_rate',
    format: 'percentage',
    suffix: '%'
  }
];

export function StatsGrid({
  apiEndpoint,
  apiMethod = 'GET',
  apiHeaders = {},
  apiBody,
  dataPath = 'data.stats',
  defaultConfigs = DEFAULT_DASHBOARD_CONFIGS,
  storageKey = 'skytrack-stats-preferences',
  title = 'Statistics',
  showRefreshButton = true,
  showCustomizeButton = true,
  className,
  customFetchFunction,
  processData,
  useEnhancedModal = false,
  rawData
}: StatsGridProps) {
  // Create a custom hook for this specific StatsGrid instance
  const useCustomStatsData = () => {
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastFetch, setLastFetch] = useState<Date | null>(null);

    const fetchStats = async (forceRefresh = false) => {
      // Don't fetch if we recently fetched and it's not a forced refresh
      if (lastFetch && !forceRefresh) {
        const timeSinceLastFetch = Date.now() - lastFetch.getTime();
        if (timeSinceLastFetch < 60000) { // 1 minute cache
          return;
        }
      }

      try {
        setLoading(true);
        setError(null);
        
        let responseData: any;

        if (customFetchFunction) {
          // Use custom fetch function if provided
          responseData = await customFetchFunction();
        } else {
          // Use default API endpoint if no custom endpoint provided
          const organizationId = localStorage.getItem("organizationId") || localStorage.getItem("schoolId");
          const token = localStorage.getItem("token");
          const apiKey = process.env.NEXT_PUBLIC_API_KEY;
          
          if (!organizationId || !token) {
            throw new Error("Organization ID or authentication token not found");
          }

          if (!apiKey) {
            throw new Error("API key is not configured");
          }

          const defaultEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/organizations/${organizationId}/stats`;
          const response = await fetch(apiEndpoint || defaultEndpoint, {
            method: apiMethod,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'Authorization': `Bearer ${token}`,
              'X-CSRF-Token': localStorage.getItem("csrfToken") || "",
              ...apiHeaders
            },
            body: apiBody ? JSON.stringify(apiBody) : undefined,
            credentials: 'include'
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Stats API error:', {
              status: response.status,
              statusText: response.statusText,
              error: errorData
            });
            throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`);
          }

          responseData = await response.json();
        }

        // Process the data if a custom processor is provided
        let processedData = processData ? processData(responseData) : responseData;

        // Extract data from the specified path
        const keys = dataPath.split('.');
        let current: any = processedData;
        
        for (const key of keys) {
          if (current && typeof current === 'object' && key in current) {
            current = current[key];
          } else {
            throw new Error(`Data path '${dataPath}' not found in response`);
          }
        }
        setStatsData(current);
        setLastFetch(new Date());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching stats';
        setError(errorMessage);
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    // Auto-fetch on mount
    useEffect(() => {
      fetchStats();
    }, []);

    // Helper function to get a specific stat value by path
    const getStatValue = (path: string, config?: StatConfig): number | string | null => {
      if (!statsData) return null;
      
      // Handle dynamic stats that reference arrays by program name
      if (config && (path.includes('{program}') || config.id.includes('program_'))) {
        // Extract program name from the config title
        const titleParts = config.title.split(' ');
        let programName = '';
        
        // Find the program name (everything before the last word which is the metric type)
        if (titleParts.length >= 2) {
          programName = titleParts.slice(0, -1).join(' ');
        }
        
        if (!programName) return null;

        // For program_breakdown data
        if (path.includes('program_breakdown')) {
          const programs = statsData.program_breakdown || [];
          const programData = programs.find((p: any) => p._id === programName);
          
          if (path.includes('.count')) return programData?.count || 0;
          if (path.includes('.active')) return programData?.active || 0;
          if (path.includes('.graduated')) return programData?.graduated || 0;
        }
        
        // For enhanced_program_analysis data
        if (path.includes('enhanced_program_analysis')) {
          const programs = statsData.enhanced_program_analysis || [];
          const programData = programs.find((p: any) => p.program === programName);
          
          if (path.includes('.completionRate')) return programData?.completionRate || 0;
          if (path.includes('.activeRate')) return programData?.activeRate || 0;
          if (path.includes('.totalStudents')) return programData?.totalStudents || 0;
          if (path.includes('.activeStudents')) return programData?.activeStudents || 0;
        }
        
        // For engagement_metrics data
        if (path.includes('engagement_metrics')) {
          const programs = statsData.engagement_metrics || [];
          const programData = programs.find((p: any) => p.program === programName);
          
          if (path.includes('.engagement_rate')) return programData?.engagement_rate || 0;
          if (path.includes('.students_with_recent_flights')) return programData?.students_with_recent_flights || 0;
        }
        
        // For flight_status_breakdown data
        if (path.includes('flight_status_breakdown')) {
          const statuses = statsData.flight_operations?.flight_status_breakdown || [];
          const statusData = statuses.find((s: any) => s._id === programName);
          
          if (path.includes('.count')) return statusData?.count || 0;
          if (path.includes('.avgScheduledDuration')) return statusData?.avgScheduledDuration || 0;
          if (path.includes('.avgActualDuration')) return statusData?.avgActualDuration || 0;
        }
        
        // For flight_type_breakdown data
        if (path.includes('flight_type_breakdown')) {
          const types = statsData.flight_operations?.flight_type_breakdown || [];
          const typeData = types.find((t: any) => t._id === programName);
          
          if (path.includes('.count')) return typeData?.count || 0;
          if (path.includes('.avgDuration')) return typeData?.avgDuration || 0;
          if (path.includes('.totalDuration')) return typeData?.totalDuration || 0;
        }
        
        // For aircraft_utilization data
        if (path.includes('aircraft_utilization')) {
          const aircraft = statsData.aircraft_efficiency?.aircraft_utilization || [];
          const aircraftData = aircraft.find((a: any) => a.registration === programName);
          
          if (path.includes('.recentFlightHours')) return aircraftData?.recentFlightHours || 0;
          if (path.includes('.recentFlightsCount')) return aircraftData?.recentFlightsCount || 0;
          if (path.includes('.total_hours')) return aircraftData?.total_hours || 0;
        }
        
        // For instructor_workload data
        if (path.includes('instructor_workload')) {
          const instructors = statsData.instructor_efficiency?.instructor_workload || [];
          const instructorData = instructors.find((i: any) => i.contact_email === programName);
          
          if (path.includes('.teachingHours')) return instructorData?.teachingHours || 0;
          if (path.includes('.students')) return instructorData?.students || 0;
          if (path.includes('.utilization')) return instructorData?.utilization || 0;
          if (path.includes('.recentFlightsCount')) return instructorData?.recentFlightsCount || 0;
        }
        
        return null;
      }
      
      // Handle regular stats with direct paths
      const keys = path.split('.');
      let current: any = statsData;
      
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return null;
        }
      }
      
      return current;
    };

    // Helper function to format stat values
    const formatStatValue = (value: number | string | null, format?: string, suffix?: string, prefix?: string): string => {
      if (value === null || value === undefined) return 'N/A';
      
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      if (isNaN(numValue)) return 'N/A';
      
      let formatted = '';
      
      switch (format) {
        case 'percentage':
          formatted = numValue.toFixed(1);
          break;
        case 'currency':
          formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
          }).format(numValue);
          break;
        case 'duration':
          formatted = numValue.toFixed(0);
          break;
        case 'number':
        default:
          formatted = new Intl.NumberFormat('en-US').format(numValue);
          break;
      }
      
      return `${prefix || ''}${formatted}${suffix || ''}`;
    };

    return {
      statsData,
      loading,
      error,
      lastFetch,
      fetchStats,
      getStatValue,
      formatStatValue
    };
  };

  // Create a custom preferences hook for this specific StatsGrid instance
  const useCustomStatsPreferences = () => {
    const [preferences, setPreferences] = useState<{ configs: StatConfig[]; lastUpdated: string }>(() => {
      // During SSR, always return default config to prevent hydration mismatches
      if (typeof window === 'undefined') {
        return {
          configs: defaultConfigs,
          lastUpdated: 'never'
        };
      }
      
      // Only try to load from localStorage on client side
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          
          // Migrate old data paths that start with 'stats.' to remove the prefix
          const migratedConfigs = parsed.configs.map((config: StatConfig) => {
            if (config.dataPath && config.dataPath.startsWith('stats.')) {
              return {
                ...config,
                dataPath: config.dataPath.replace('stats.', '')
              };
            }
            return config;
          });
          
          // If any configs were migrated, save the updated preferences
          if (migratedConfigs.some((config: StatConfig, index: number) => 
            config.dataPath !== parsed.configs[index].dataPath
          )) {
            const updatedPreferences = {
              configs: migratedConfigs,
              lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(storageKey, JSON.stringify(updatedPreferences));
            return updatedPreferences;
          }
          
          return parsed;
        } catch (e) {
          console.error('Error parsing saved stats preferences:', e);
        }
      }
      
      return {
        configs: defaultConfigs,
        lastUpdated: new Date().toISOString()
      };
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load preferences from localStorage after component mounts (client-side only)
    useEffect(() => {
      const loadPreferences = () => {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            setPreferences(parsed);
          } catch (e) {
            console.error('Error parsing saved stats preferences:', e);
          }
        }
        setIsInitialized(true);
      };

      loadPreferences();
    }, [storageKey]);

    // Manual refresh function to force re-read from localStorage
    const refreshFromStorage = () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            
            // Migrate old data paths that start with 'stats.' to remove the prefix
            const migratedConfigs = parsed.configs.map((config: StatConfig) => {
              if (config.dataPath && config.dataPath.startsWith('stats.')) {
                return {
                  ...config,
                  dataPath: config.dataPath.replace('stats.', '')
                };
              }
              return config;
            });
            
            // If any configs were migrated, save the updated preferences
            if (migratedConfigs.some((config: StatConfig, index: number) => 
              config.dataPath !== parsed.configs[index].dataPath
            )) {
              const updatedPreferences = {
                configs: migratedConfigs,
                lastUpdated: new Date().toISOString()
              };
              localStorage.setItem(storageKey, JSON.stringify(updatedPreferences));
              setPreferences(updatedPreferences);
            } else {
              setPreferences(parsed);
            }
          } catch (e) {
            console.error('Error parsing saved stats preferences during refresh:', e);
          }
        }
      }
    };

    // Save preferences to localStorage
    const savePreferences = (newPreferences: { configs: StatConfig[]; lastUpdated: string }) => {
      const updatedPreferences = {
        configs: [...newPreferences.configs],
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(updatedPreferences));
      setPreferences(updatedPreferences);
    };

    return {
      preferences,
      isLoading,
      isInitialized,
      savePreferences,
      refreshFromStorage
    };
  };

  const { statsData, loading, error, fetchStats, getStatValue, formatStatValue } = useCustomStatsData();
  const { preferences, isInitialized, refreshFromStorage, savePreferences } = useCustomStatsPreferences();
  const [showCustomization, setShowCustomization] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [formattedLastUpdated, setFormattedLastUpdated] = useState('Never');
  
  // Ensure we're on the client side before rendering time-sensitive content
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update formatted time only on client side
  useEffect(() => {
    if (isClient && preferences.lastUpdated && preferences.lastUpdated !== 'never') {
      setFormattedLastUpdated(new Date(preferences.lastUpdated).toLocaleTimeString());
    }
  }, [preferences.lastUpdated, isClient]);
  
  // Calculate enabled stats reactively based on preferences
  const enabledStats = useMemo(() => {
    return preferences.configs
      .filter(config => config.enabled)
      .sort((a, b) => a.order - b.order);
  }, [preferences.configs, preferences.lastUpdated, refreshCounter]);

  const handleCustomizationClose = () => {
    setShowCustomization(false);
    refreshFromStorage();
    setRefreshCounter(prev => prev + 1);
  };

  const handleRefresh = () => {
    fetchStats(true); // Force refresh
  };

  if (error) {
    return (
      <div className={`${classes.root} ${className || ''}`}>
        <Paper withBorder p="md" radius="md" className={classes.errorContainer}>
          <Text c="red" fw={500} mb="sm">
            Failed to load statistics
          </Text>
          <Text size="sm" c="dimmed" mb="md">
            {error}
          </Text>
          <Button variant="light" onClick={handleRefresh} leftSection={<IconRefresh size={16} />}>
            Try Again
          </Button>
        </Paper>
      </div>
    );
  }

  // Only render stats after client hydration AND preferences are initialized
  const shouldRenderStats = isClient && isInitialized;
  
  const stats = shouldRenderStats ? enabledStats.map((config) => {
    const Icon = icons[config.icon as keyof typeof icons] || IconReceipt2;
    
    // Get the value from the API data
    const rawValue = statsData ? getStatValue(config.dataPath, config) : null;
    const value = rawValue !== null ? formatStatValue(rawValue, config.format, config.suffix, config.prefix) : 'Loading...';

    return (
      <Paper withBorder p="md" radius="md" key={config.id} className={classes.statCard}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed" className={classes.title}>
            {config.title}
          </Text>
          <Icon className={classes.icon} size={22} stroke={1.5} />
        </Group>

        <Group align="flex-end" gap="xs" mt={25}>
          <Text className={classes.value}>{value}</Text>
        </Group>
      </Paper>
    );
  }) : [];

  return (
    <div key={`stats-${preferences.lastUpdated}-${refreshCounter}`} className={`${classes.root} ${className || ''}`}>
      <div className={classes.header}>
        <Group justify="space-between" mb="md">
          <div>
            <Text size="lg" fw={600}>
              {title}
            </Text>
            <Text size="xs" c="dimmed">
              {shouldRenderStats ? `${enabledStats.length} enabled • Last updated: ${formattedLastUpdated}` : 'Loading...'}
            </Text>
          </div>
          <Group gap="xs">
            {showRefreshButton && (
              <ActionIcon
                variant="light"
                onClick={handleRefresh}
                loading={loading}
                disabled={loading}
                size={36}
              >
                <IconRefresh size={18} />
              </ActionIcon>
            )}
            {showCustomizeButton && (
              <ActionIcon
                variant="light"
                onClick={() => setShowCustomization(true)}
                size={36}
              >
                <IconSettings size={18} />
              </ActionIcon>
            )}
          </Group>
        </Group>
      </div>

      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} />
        
        {!shouldRenderStats ? (
          // Show skeleton during SSR/initial load
          <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Paper withBorder p="md" radius="md" key={index} className={classes.statCard}>
                <Group justify="space-between">
                  <div style={{ width: '70%', height: '12px', backgroundColor: '#e9ecef', borderRadius: '4px' }} />
                  <div style={{ width: '22px', height: '22px', backgroundColor: '#e9ecef', borderRadius: '4px' }} />
                </Group>
                <Group align="flex-end" gap="xs" mt={25}>
                  <div style={{ width: '60%', height: '24px', backgroundColor: '#e9ecef', borderRadius: '4px' }} />
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        ) : enabledStats.length === 0 ? (
          <Paper withBorder p="md" radius="md" className={classes.emptyState}>
            <Text c="dimmed" ta="center" mb="md">
              No statistics are currently enabled
            </Text>
            <Button
              variant="light"
              onClick={() => setShowCustomization(true)}
              leftSection={<IconSettings size={16} />}
            >
              Configure Statistics
            </Button>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, xs: 2, md: enabledStats.length >= 4 ? 4 : enabledStats.length }}>
            {stats}
          </SimpleGrid>
        )}
      </div>

      {useEnhancedModal ? (
        <EnhancedStatsCustomizationModal
          key={showCustomization ? 'open' : 'closed'}
          opened={showCustomization}
          onClose={handleCustomizationClose}
          onSave={() => {
            refreshFromStorage();
            setRefreshCounter(prev => prev + 1);
          }}
          configs={preferences.configs}
          onSaveConfigs={(newConfigs) => {
            savePreferences({
              configs: newConfigs,
              lastUpdated: new Date().toISOString()
            });
          }}
          defaultConfigs={defaultConfigs}
          rawData={statsData || rawData}
        />
      ) : (
        <StatsCustomizationModal
          key={showCustomization ? 'open' : 'closed'}
          opened={showCustomization}
          onClose={handleCustomizationClose}
          onSave={() => {
            refreshFromStorage();
            setRefreshCounter(prev => prev + 1);
          }}
          configs={preferences.configs}
          onSaveConfigs={(newConfigs) => {
            savePreferences({
              configs: newConfigs,
              lastUpdated: new Date().toISOString()
            });
          }}
          defaultConfigs={defaultConfigs}
        />
      )}
    </div>
  );
}