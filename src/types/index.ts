
// Core enterprise type definitions
export interface User {
  id: string;
  email: string;
  role: 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT' | 'IN' | 'ST';
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  recipient_name: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  verification_code: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  activeCertifications: number;
  systemHealth: {
    critical: number;
    warnings: number;
    healthy: number;
  };
}
