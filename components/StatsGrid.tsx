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

export function StatsGrid() {
  const { statsData, loading, error, fetchStats } = useStatsData();
  const { preferences, isInitialized, refreshFromStorage } = useStatsPreferences();
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
    console.log('StatsGrid - Recalculating enabled stats, refreshCounter:', refreshCounter);
    return preferences.configs
      .filter(config => config.enabled)
      .sort((a, b) => a.order - b.order);
  }, [preferences.configs, preferences.lastUpdated, refreshCounter]);

  // Debug logging
  useEffect(() => {
    console.log('StatsGrid - statsData loaded:', !!statsData);
    console.log('StatsGrid - loading:', loading);
    console.log('StatsGrid - error:', error);
  }, [statsData, loading, error]);

  // Track preference changes specifically
  useEffect(() => {
    console.log('StatsGrid - Preferences changed!', preferences);
    console.log('StatsGrid - Enabled stats count:', enabledStats.length);
    console.log('StatsGrid - Enabled stats IDs:', enabledStats.map(s => s.id));
  }, [preferences, enabledStats]);

  const handleCustomizationClose = () => {
    console.log('StatsGrid - Modal closing, forcing refresh');
    setShowCustomization(false);
    // Manually refresh from localStorage and force re-render
    refreshFromStorage();
    setRefreshCounter(prev => prev + 1);
  };

  const handleRefresh = () => {
    fetchStats(true); // Force refresh
  };

  if (error) {
    return (
      <div className={classes.root}>
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
    const rawValue = statsData ? getStatValue(config.dataPath) : null;
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

  // Helper function to get stat value from API data
  function getStatValue(path: string): number | string | null {
    if (!statsData) return null;
    
    const keys = path.split('.');
    let current: any = { stats: statsData };
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return null;
      }
    }
    
    return current;
  }

  // Helper function to format stat values
  function formatStatValue(value: number | string | null, format?: string, suffix?: string, prefix?: string): string {
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
  }

  return (
    <div key={`stats-${preferences.lastUpdated}-${refreshCounter}`} className={classes.root}>
      <div className={classes.header}>
        <Group justify="space-between" mb="md">
          <div>
            <Text size="lg" fw={600}>
              Statistics
            </Text>
            <Text size="xs" c="dimmed">
              {shouldRenderStats ? `${enabledStats.length} enabled • Last updated: ${formattedLastUpdated}` : 'Loading...'}
            </Text>
          </div>
          <Group gap="xs">
            <ActionIcon
              variant="light"
              onClick={handleRefresh}
              loading={loading}
              disabled={loading}
              size={36}
            >
              <IconRefresh size={18} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              onClick={() => setShowCustomization(true)}
              size={36}
            >
              <IconSettings size={18} />
            </ActionIcon>
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

      <StatsCustomizationModal
        key={showCustomization ? 'open' : 'closed'}
        opened={showCustomization}
        onClose={handleCustomizationClose}
        onSave={() => {
          console.log('StatsGrid - onSave callback triggered');
          refreshFromStorage();
          setRefreshCounter(prev => prev + 1);
        }}
      />
    </div>
  );
}