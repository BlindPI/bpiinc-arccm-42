
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

// Basic dashboard component interfaces
export interface SystemAdminDashboardProps {
  // Add any required props here in the future
}

export interface AdminDashboardProps {
  // Add any required props here in the future
}

export interface ProviderDashboardProps {
  teamContext?: TeamContext;
}

export interface InstructorDashboardProps {
  teamContext?: TeamContext;
}

export interface StudentDashboardProps {
  // Add any required props here in the future
}
