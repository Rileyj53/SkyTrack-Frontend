# StatsGrid Component Usage Guide

The `StatsGrid` component has been refactored to be fully reusable across different pages with different API endpoints while maintaining the same look, design, and customizability.

## Basic Usage

### Default Dashboard Usage (No Props)
```tsx
import { StatsGrid } from '@/components/StatsGrid';

export default function Dashboard() {
  return (
    <div>
      <StatsGrid />
    </div>
  );
}
```

This will use the default configuration and API endpoint for the main dashboard statistics.

## Advanced Usage with Custom Configuration

### 1. Custom API Endpoint
```tsx
<StatsGrid 
  apiEndpoint="/api/custom-stats"
  dataPath="data.stats"
  title="Custom Statistics"
  storageKey="custom-stats-preferences"
/>
```

### 2. Custom Statistics Configuration
```tsx
import { StatsGrid, type StatConfig } from '@/components/StatsGrid';

const CUSTOM_STATS_CONFIG: StatConfig[] = [
  {
    id: 'custom_metric',
    title: 'Custom Metric',
    icon: 'chart',
    enabled: true,
    order: 1,
    dataPath: 'custom_metric', // Note: no 'stats.' prefix needed
    format: 'number'
  },
  // ... more stats
];

<StatsGrid 
  defaultConfigs={CUSTOM_STATS_CONFIG}
  title="Custom Statistics"
  storageKey="custom-stats-preferences"
/>
```

### 3. Custom Fetch Function
```tsx
const fetchCustomStats = async () => {
  // Your custom fetch logic here
  const response = await fetch('/api/custom-endpoint');
  return response.json();
};

<StatsGrid 
  customFetchFunction={fetchCustomStats}
  dataPath="custom_data"
  title="Custom Statistics"
/>
```

### 4. Custom Data Processing
```tsx
const processData = (rawData: any) => {
  // Transform the API response to match expected format
  return {
    stats: {
      metric1: rawData.custom_field,
      metric2: rawData.another_field
    }
  };
};

<StatsGrid 
  processData={processData}
  dataPath="stats"
  title="Processed Statistics"
/>
```

## Props Interface

```tsx
interface StatsGridProps {
  // API configuration
  apiEndpoint?: string;                    // Custom API endpoint URL
  apiMethod?: 'GET' | 'POST';             // HTTP method (default: 'GET')
  apiHeaders?: Record<string, string>;    // Additional headers
  apiBody?: any;                          // Request body for POST requests
  
  // Data configuration
  dataPath?: string;                      // Path to stats object in response (default: 'data.stats')
  defaultConfigs?: StatConfig[];          // Custom statistics configuration
  storageKey?: string;                    // Unique localStorage key (default: 'skytrack-stats-preferences')
  
  // UI configuration
  title?: string;                         // Component title (default: 'Statistics')
  showRefreshButton?: boolean;            // Show refresh button (default: true)
  showCustomizeButton?: boolean;          // Show customize button (default: true)
  className?: string;                     // Additional CSS classes
  
  // Custom data fetching function (alternative to API endpoint)
  customFetchFunction?: () => Promise<any>;
  
  // Custom data processing function
  processData?: (rawData: any) => any;
}
```

## StatConfig Interface

```tsx
interface StatConfig {
  id: string;                             // Unique identifier
  title: string;                          // Display title
  icon: string;                           // Icon name (user, plane, chart, etc.)
  enabled: boolean;                       // Whether stat is enabled by default
  order: number;                          // Display order
  dataPath: string;                       // Path to data in API response (relative to the extracted stats object)
  format?: 'number' | 'percentage' | 'currency' | 'duration';
  suffix?: string;                        // Value suffix (e.g., '%', ' hrs')
  prefix?: string;                        // Value prefix (e.g., '$')
}
```

**Important Note about dataPath**: The `dataPath` should be relative to the stats object extracted from the API response. For example:
- If your API returns `{ data: { stats: { overview: { total_students: 20 } } } }`
- And you set `dataPath="data.stats"` in the component props
- Then individual stat configurations should use `dataPath="overview.total_students"` (not `"stats.overview.total_students"`)

## Available Icons

- `user` - User icon
- `plane` - Plane icon
- `chart` - Chart icon
- `calendar` - Calendar icon
- `clock` - Clock icon
- `coin` - Coin icon
- `receipt` - Receipt icon
- `discount` - Discount icon

## Format Types

- `number` - Plain number formatting
- `percentage` - Percentage with decimal places
- `currency` - Currency formatting (USD)
- `duration` - Duration formatting

## Examples

### Instructor Page Example
```tsx
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
    id: 'teaching_hours',
    title: 'Teaching Hours',
    icon: 'clock',
    enabled: true,
    order: 2,
    dataPath: 'instructor_efficiency.total_teaching_hours',
    format: 'number'
  }
];

<StatsGrid 
  title="Instructor Statistics"
  storageKey="instructor-stats-preferences"
  defaultConfigs={INSTRUCTOR_STATS_CONFIG}
/>
```

### Student Dashboard Example
```tsx
const fetchStudentStats = async () => {
  const studentId = localStorage.getItem("userId");
  const response = await fetch(`/api/students/${studentId}/stats`);
  return response.json();
};

const processStudentData = (rawData: any) => ({
  student_stats: {
    total_flights: rawData.data?.total_flights || 0,
    flight_hours: rawData.data?.total_hours || 0
  }
});

<StatsGrid 
  title="My Statistics"
  storageKey="student-stats-preferences"
  defaultConfigs={STUDENT_STATS_CONFIG}
  customFetchFunction={fetchStudentStats}
  processData={processStudentData}
  dataPath="student_stats"
/>
```

### Read-Only Statistics
```tsx
<StatsGrid 
  title="School Overview"
  showRefreshButton={false}
  showCustomizeButton={false}
/>
```

## Key Features

1. **Reusable**: Use the same component across different pages with different configurations
2. **Customizable**: Each instance can have its own statistics configuration
3. **Persistent**: User preferences are saved per storage key
4. **Flexible Data Sources**: Support for custom API endpoints or fetch functions
5. **Data Processing**: Custom data transformation functions
6. **Consistent UI**: Same look and feel across all instances
7. **Responsive**: Automatically adapts to different screen sizes

## Storage and Preferences

Each StatsGrid instance uses a unique `storageKey` to store user preferences independently. This means:

- Users can customize statistics differently on different pages
- Preferences persist across browser sessions
- No conflicts between different instances of the component

## Error Handling

The component includes built-in error handling for:
- Network errors
- Authentication failures
- Invalid data paths
- Missing API keys

Error states are displayed with retry functionality.

## Performance Considerations

- Data is cached for 1 minute to reduce API calls
- Component uses dynamic imports for heavy dependencies
- SSR-safe with proper hydration handling
- Efficient re-rendering with React.memo patterns 