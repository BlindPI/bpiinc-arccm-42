
// Dashboard component prop interfaces

export interface DashboardMetrics {
  totalUsers?: number;
  activeSessions?: number;
  completionRate?: number;
  complianceScore?: number;
  [key: string]: any;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  [key: string]: any;
}

export interface TeamContext {
  teamId: string;
  teamName: string;
  locationName: string;
  locationCity?: string;
  locationState?: string;
  apUserId?: string;
  apUserName?: string;
  apUserEmail?: string;
  apUserPhone?: string;
}

export interface DashboardConfig {
  layout?: string;
  theme?: string;
  showQuickActions?: boolean;
  refreshInterval?: number;
  compactMode?: boolean;
  showNotifications?: boolean;
  defaultView?: string;
  customSections?: any[];
  filterPresets?: Record<string, any>;
  chartPreferences?: {
    type?: string;
    colors?: string[];
    showLegend?: boolean;
  };
}

export interface UserProfile {
  id: string;
  role: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

// Updated dashboard component interfaces with required props
export interface SystemAdminDashboardProps {
  config?: DashboardConfig;
  profile?: UserProfile;
}

export interface AdminDashboardProps {
  config?: DashboardConfig;
  profile?: UserProfile;
}

export interface ProviderDashboardProps {
  teamContext?: TeamContext;
  config?: DashboardConfig;
  profile?: UserProfile;
}

export interface InstructorDashboardProps {
  teamContext?: TeamContext;
  config?: DashboardConfig;
  profile?: UserProfile;
}

export interface StudentDashboardProps {
  config?: DashboardConfig;
  profile?: UserProfile;
}
