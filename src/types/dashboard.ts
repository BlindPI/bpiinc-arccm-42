
// Dashboard configuration types

export interface DashboardConfig {
  layout: 'grid' | 'list' | 'card';
  theme: 'light' | 'dark' | 'auto';
  theme_color?: string;
  showQuickActions: boolean;
  refreshInterval: number;
  compactMode: boolean;
  showNotifications: boolean;
  defaultView: string;
  customSections?: string[];
  filterPresets?: Record<string, any>;
  chartPreferences?: {
    type: 'bar' | 'line' | 'pie';
    colors: string[];
    showLegend: boolean;
  };
}

export interface DashboardState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: string;
  filters: Record<string, any>;
  view: string;
  selectedTimeRange: string;
}
