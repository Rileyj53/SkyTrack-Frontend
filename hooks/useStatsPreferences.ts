import { useState, useEffect, useCallback } from 'react'

export interface StatConfig {
  id: string
  title: string
  icon: string
  enabled: boolean
  order: number
  dataPath: string // Path to the data in the API response
  format?: 'number' | 'percentage' | 'currency' | 'duration'
  suffix?: string
  prefix?: string
}

export interface StatsPreferences {
  configs: StatConfig[]
  lastUpdated: string
}

const DEFAULT_STATS_CONFIG: StatConfig[] = [
  {
    id: 'total_students',
    title: 'Total Students',
    icon: 'user',
    enabled: true,
    order: 1,
    dataPath: 'stats.overview.total_students',
    format: 'number'
  },
  {
    id: 'active_students',
    title: 'Active Students',
    icon: 'user',
    enabled: true,
    order: 2,
    dataPath: 'stats.overview.active_students',
    format: 'number'
  },
  {
    id: 'total_flights_period',
    title: 'Flights This Period',
    icon: 'plane',
    enabled: true,
    order: 3,
    dataPath: 'stats.flight_operations.total_flights_period',
    format: 'number'
  },
  {
    id: 'completion_rate',
    title: 'Flight Completion Rate',
    icon: 'chart',
    enabled: true,
    order: 4,
    dataPath: 'stats.flight_operations.completion_rate',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'total_instructors',
    title: 'Total Instructors',
    icon: 'user',
    enabled: false,
    order: 5,
    dataPath: 'stats.overview.total_instructors',
    format: 'number'
  },
  {
    id: 'active_instructors',
    title: 'Active Instructors',
    icon: 'user',
    enabled: false,
    order: 6,
    dataPath: 'stats.overview.active_instructors',
    format: 'number'
  },
  {
    id: 'total_planes',
    title: 'Total Aircraft',
    icon: 'plane',
    enabled: false,
    order: 7,
    dataPath: 'stats.overview.total_planes',
    format: 'number'
  },
  {
    id: 'active_planes',
    title: 'Active Aircraft',
    icon: 'plane',
    enabled: false,
    order: 8,
    dataPath: 'stats.overview.active_planes',
    format: 'number'
  },
  {
    id: 'upcoming_lessons',
    title: 'Upcoming Lessons',
    icon: 'calendar',
    enabled: false,
    order: 9,
    dataPath: 'stats.overview.upcoming_lessons',
    format: 'number'
  },
  {
    id: 'avg_delay_minutes',
    title: 'Average Delay',
    icon: 'clock',
    enabled: false,
    order: 10,
    dataPath: 'stats.flight_operations.avg_delay_minutes',
    format: 'duration',
    suffix: ' min'
  },
  {
    id: 'schedule_adherence_percentage',
    title: 'Schedule Adherence',
    icon: 'chart',
    enabled: false,
    order: 11,
    dataPath: 'stats.flight_operations.schedule_adherence_percentage',
    format: 'percentage',
    suffix: '%'
  },
  {
    id: 'average_utilization',
    title: 'Aircraft Utilization',
    icon: 'chart',
    enabled: false,
    order: 12,
    dataPath: 'stats.aircraft_efficiency.average_utilization_rate',
    format: 'percentage',
    suffix: '%'
  }
]

const STORAGE_KEY = 'skytrack-stats-preferences'

export function useStatsPreferences() {
  const [preferences, setPreferences] = useState<StatsPreferences>(() => {
    // During SSR, always return default config to prevent hydration mismatches
    if (typeof window === 'undefined') {
      return {
        configs: DEFAULT_STATS_CONFIG,
        lastUpdated: 'never' // Use static value to prevent hydration mismatch
      }
    }
    
    // Only try to load from localStorage on client side
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Error parsing saved stats preferences:', e)
      }
    }
    
    return {
      configs: DEFAULT_STATS_CONFIG,
      lastUpdated: new Date().toISOString()
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load preferences from localStorage after component mounts (client-side only)
  useEffect(() => {
    const loadPreferences = () => {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setPreferences(parsed)
        } catch (e) {
          console.error('Error parsing saved stats preferences:', e)
        }
      }
      setIsInitialized(true)
    }

    loadPreferences()
  }, [])

  // Debug: Track when preferences change
  useEffect(() => {
    console.log('useStatsPreferences - Preferences state changed:', preferences);
    console.log('useStatsPreferences - Enabled configs:', preferences.configs.filter(c => c.enabled));
  }, [preferences]);

  // Manual refresh function to force re-read from localStorage
  const refreshFromStorage = useCallback(() => {
    console.log('useStatsPreferences - Manual refresh from localStorage');
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log('useStatsPreferences - Refreshed data from storage:', parsed);
          setPreferences(parsed);
        } catch (e) {
          console.error('Error parsing saved stats preferences during refresh:', e);
        }
      }
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: StatsPreferences) => {
    console.log('useStatsPreferences - savePreferences called with:', newPreferences);
    console.log('useStatsPreferences - current preferences before update:', preferences);
    
    // Create a completely new object with new timestamp to ensure React detects the change
    const updatedPreferences = {
      configs: [...newPreferences.configs], // Create new array
      lastUpdated: new Date().toISOString() // Always update timestamp
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences))
    setPreferences(updatedPreferences)
    
    console.log('useStatsPreferences - preferences saved to localStorage');
    console.log('useStatsPreferences - localStorage now contains:', localStorage.getItem(STORAGE_KEY));
  }, [])

  // Update a specific stat configuration
  const updateStatConfig = useCallback((statId: string, updates: Partial<StatConfig>) => {
    const newConfigs = preferences.configs.map(config => 
      config.id === statId ? { ...config, ...updates } : config
    )
    
    savePreferences({
      configs: newConfigs,
      lastUpdated: new Date().toISOString()
    })
  }, [preferences.configs, savePreferences])

  // Toggle a stat's enabled state
  const toggleStat = useCallback((statId: string) => {
    updateStatConfig(statId, { enabled: !preferences.configs.find(c => c.id === statId)?.enabled })
  }, [preferences.configs, updateStatConfig])

  // Reorder stats
  const reorderStats = useCallback((statId: string, newOrder: number) => {
    const newConfigs = preferences.configs.map(config => {
      if (config.id === statId) {
        return { ...config, order: newOrder }
      }
      return config
    })
    
    savePreferences({
      configs: newConfigs,
      lastUpdated: new Date().toISOString()
    })
  }, [preferences.configs, savePreferences])

  // Reset to default configuration
  const resetToDefault = useCallback(() => {
    savePreferences({
      configs: DEFAULT_STATS_CONFIG,
      lastUpdated: new Date().toISOString()
    })
  }, [savePreferences])

  // Get enabled stats sorted by order
  const getEnabledStats = useCallback(() => {
    return preferences.configs
      .filter(config => config.enabled)
      .sort((a, b) => a.order - b.order)
  }, [preferences.configs])

  // Get all stats sorted by order
  const getAllStats = useCallback(() => {
    return preferences.configs.sort((a, b) => a.order - b.order)
  }, [preferences.configs])

  // Sync preferences with server (placeholder for future implementation)
  const syncWithServer = useCallback(async () => {
    setIsLoading(true)
    try {
      // TODO: Implement server sync
      // const response = await fetch('/api/user/stats-preferences', {
      //   method: 'POST',
      //   body: JSON.stringify(preferences)
      // })
      console.log('Server sync placeholder - preferences:', preferences)
    } catch (error) {
      console.error('Error syncing preferences with server:', error)
    } finally {
      setIsLoading(false)
    }
  }, [preferences])

  return {
    preferences,
    isLoading,
    isInitialized,
    updateStatConfig,
    toggleStat,
    reorderStats,
    resetToDefault,
    getEnabledStats,
    getAllStats,
    syncWithServer,
    savePreferences,
    refreshFromStorage
  }
} 