
// Foundation Types - Unified System for Complete Frontend Transplant
// Direct mapping to database schema with enterprise patterns

export type UserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT' | 'IN';

export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING' | 'EXPIRED';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

// Core User Profile Interface
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  role: UserRole;
  status: UserStatus;
  compliance_status?: ComplianceStatus;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  phone?: string;
  organization?: string;
}

// Team Management
export interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'ACTIVE' | 'INACTIVE';
  location_id?: string;
  ap_user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: UserRole;
  status: UserStatus;
  joined_at: string;
  user?: UserProfile;
  team?: Team;
}

// Certificate Management
export interface Certificate {
  id: string;
  recipient_name: string;
  recipient_email: string;
  course_name: string;
  course_type: string;
  issue_date: string;
  expiration_date?: string;
  certificate_number: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  location_name?: string;
  instructor_name?: string;
  created_at: string;
}

// Notification System
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  read: boolean;
  read_at?: string;
  created_at: string;
  user_id: string;
  metadata?: Record<string, any>;
}

// Dashboard Configuration
export interface DashboardConfig {
  layout: 'grid' | 'list';
  theme: 'light' | 'dark';
  compactMode: boolean;
  showQuickActions: boolean;
  refreshInterval: number;
}

export interface DashboardWidget {
  id: string;
  type: 'metrics' | 'chart' | 'table' | 'list';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  data?: any;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'date' | 'textarea';
  required?: boolean;
  validation?: any;
  options?: Array<{ label: string; value: string }>;
}

// Filter and Search Types
export interface FilterConfig {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'between';
  value: any;
}

export interface SearchConfig {
  query: string;
  fields: string[];
  filters: FilterConfig[];
}
