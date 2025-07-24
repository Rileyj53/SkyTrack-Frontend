import React, { useState } from 'react';
import {
  Modal,
  Text,
  Group,
  Paper,
  Switch,
  Button,
  Stack,
  Box,
  Alert,
  Badge,
  Divider,
  ScrollArea,
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
} from '@tabler/icons-react';
import { type StatConfig } from '@/components/StatsGrid';

interface StatsCustomizationModalProps {
  opened: boolean;
  onClose: () => void;
  onSave?: () => void;
  // New props for reusability
  configs: StatConfig[];
  onSaveConfigs: (newConfigs: StatConfig[]) => void;
  defaultConfigs?: StatConfig[];
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

export function StatsCustomizationModal({ 
  opened, 
  onClose, 
  onSave, 
  configs, 
  onSaveConfigs, 
  defaultConfigs 
}: StatsCustomizationModalProps) {
  const [localConfigs, setLocalConfigs] = useState<StatConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  React.useEffect(() => {
    if (opened) {
      console.log('StatsCustomizationModal - Modal opened');
      console.log('StatsCustomizationModal - Current configs:', configs);
      
      setLocalConfigs([...configs]);
      setHasChanges(false);
    }
  }, [opened, configs]);

  const handleToggle = (statId: string) => {
    console.log('StatsCustomizationModal - Toggling stat:', statId);
    
    const newConfigs = localConfigs.map(config =>
      config.id === statId ? { ...config, enabled: !config.enabled } : config
    );
    
    console.log('StatsCustomizationModal - New local configs after toggle:', newConfigs);
    
    setLocalConfigs(newConfigs);
    setHasChanges(true);
  };

  const handleSave = () => {
    console.log('Saving configs...');
    console.log('localConfigs:', localConfigs);
    console.log('current configs:', configs);
    
    // Batch all changes into a single update
    const newConfigs = localConfigs.map(config => {
      const original = configs.find(c => c.id === config.id);
      if (original) {
        return {
          ...original,
          enabled: config.enabled,
          // Add other properties that might have changed
        };
      }
      return config;
    });

    console.log('newConfigs:', newConfigs);

    // Save configs using the provided function
    onSaveConfigs(newConfigs);

    setHasChanges(false);
    
    // Small delay to ensure changes are processed before notifying parent
    setTimeout(() => {
      onSave?.(); // Call the onSave callback to notify parent
    }, 50);
    
    onClose();
  };

  const handleReset = () => {
    if (defaultConfigs) {
      setLocalConfigs([...defaultConfigs]);
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    setLocalConfigs([...configs]);
    setHasChanges(false);
    onClose();
  };

  const enabledCount = localConfigs.filter(config => config.enabled).length;
  const totalCount = localConfigs.length;

  return (
    <Modal
      opened={opened}
      onClose={handleCancel}
      title={
        <Group gap="sm">
          <Text fw={600} size="lg">
            Customize Statistics
          </Text>
          <Badge variant="light" size="sm">
            {enabledCount} of {totalCount} enabled
          </Badge>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm">
            Toggle statistics on/off to customize what you see on your dashboard. 
            Your preferences will be saved automatically and persist when you refresh the page.
          </Text>
        </Alert>

        <ScrollArea h={400}>
          <Stack gap="xs">
            {localConfigs.map((config) => {
              const Icon = iconMap[config.icon as keyof typeof iconMap] || IconReceipt2;
              
              return (
                <Paper
                  key={config.id}
                  p="md"
                  withBorder
                  style={{
                    backgroundColor: config.enabled ? 'var(--mantine-color-blue-0)' : undefined,
                    borderColor: config.enabled ? 'var(--mantine-color-blue-3)' : undefined,
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Group gap="sm" flex={1}>
                      <Icon size={20} style={{ 
                        color: config.enabled ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-6)' 
                      }} />
                      
                      <Box flex={1}>
                        <Text fw={500} size="sm">
                          {config.title}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {config.dataPath.replace('stats.', '')} • {formatLabels[config.format || 'number']}
                          {config.suffix && ` • Suffix: "${config.suffix}"`}
                          {config.prefix && ` • Prefix: "${config.prefix}"`}
                        </Text>
                      </Box>
                    </Group>
                    
                    <Switch
                      checked={config.enabled}
                      onChange={() => handleToggle(config.id)}
                      size="md"
                    />
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        </ScrollArea>

        <Divider />

        <Group justify="space-between">
          <Button
            variant="subtle"
            leftSection={<IconRestore size={16} />}
            onClick={handleReset}
            color="orange"
          >
            Reset to Default
          </Button>
          
          <Group gap="sm">
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
      </Stack>
    </Modal>
  );
} 