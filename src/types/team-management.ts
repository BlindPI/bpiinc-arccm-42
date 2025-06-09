// Unified Team Management Types - Single Source of Truth
// Aligned with actual Supabase database schema

export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string; // Changed from number to string for consistency
  name: string;
  provider_type: string;
  status: string;
  primary_location_id?: string;
  performance_rating: number;
  compliance_score: number;
  created_at: string;
  updated_at: string;
  // Additional properties from database
  description?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  // For populated relations
  primary_location?: Location;
}

export interface Profile {
  id: string;
  display_name: string;
  email?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  location_assignment?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_activity?: string;
}

export interface TeamMemberWithProfile extends TeamMember {
  joined_at: string; // Added required property
  display_name: string;
  profiles?: Profile;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score: number;
  location_id?: string;
  provider_id?: string; // Changed from number to string for consistency
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  monthly_targets?: Record<string, any>;
  current_metrics?: Record<string, any>;
}

export interface EnhancedTeam extends Team {
  location?: Location;
  provider?: Provider;
  members?: TeamMemberWithProfile[];
  metadata: Record<string, any>; // Required for EnhancedTeam
  monthly_targets: Record<string, any>; // Required for EnhancedTeam
  current_metrics: Record<string, any>; // Required for EnhancedTeam
  member_count?: number; // Added missing property
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  team_type: string;
  location_id?: string;
  provider_id?: string; // Changed from number to string
  metadata?: Record<string, any>;
  created_by: string;
}

export interface TeamPerformanceMetrics {
  team_id: string;
  location_name?: string;
  totalCertificates: number;
  totalCourses: number;
  averageSatisfaction: number;
  complianceScore: number;
  performanceTrend: number;
  total_certificates: number; // DB field name
  total_courses: number; // DB field name
  avg_satisfaction: number; // DB field name
  compliance_score: number; // DB field name
  performance_trend: number; // DB field name
}

export interface TeamAnalytics {
  totalTeams: number;
  totalMembers: number;
  averagePerformance: number;
  averageCompliance: number;
  teamsByLocation: Record<string, number>;
  performanceByTeamType: Record<string, number>;
}

export interface TeamLocationAssignment {
  id: string;
  team_id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string; // Now required since we added it to the database
  location_name?: string;
}

// Team Lifecycle Types
export interface TeamWorkflow {
  id: string;
  team_id: string;
  workflow_type: string;
  request_data: Record<string, any>;
  requested_by: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_data?: Record<string, any>;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  // Relations for joins
  teams?: {
    name: string;
  };
  requester?: {
    display_name: string;
  };
}

export interface TeamLifecycleEvent {
  id: string;
  team_id: string;
  event_type: string;
  event_data: Record<string, any>;
  performed_by: string;
  affected_user_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  created_at: string;
}

export interface TeamBulkOperation {
  id: string;
  team_id: string;
  operation_type: string;
  operation_data: Record<string, any>;
  performed_by: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  results?: Record<string, any>;
  error_details?: string;
  created_at: string;
  completed_at?: string;
}

export interface BulkMemberOperation {
  type: 'add' | 'remove' | 'update_role' | 'transfer';
  member_ids?: string[];
  new_role?: 'MEMBER' | 'ADMIN';
  target_team_id?: string;
  user_emails?: string[];
}

// Membership Statistics
export interface MembershipStatistics {
  totalMembers: number;
  activeMembers: number;
  adminMembers: number;
  recentJoins: number;
  membersByStatus: Record<string, number>;
}

// Analytics Types
export interface InstructorPerformanceMetrics {
  instructorId: string;
  instructorName: string;
  role: string; // Added missing property
  totalSessions: number;
  totalHours: number;
  averageRating: number;
  averageSessionRating: number; // Added missing property
  certificatesIssued: number;
  complianceScore: number;
  studentsCount: number; // Added missing property
}

export interface ExecutiveDashboardMetrics {
  totalUsers: number;
  activeInstructors: number;
  totalCertificates: number;
  monthlyGrowth: number;
  complianceScore: number;
  performanceIndex: number;
  revenueMetrics: {
    current: number;
    target: number;
    variance: number;
  };
  trainingMetrics: {
    sessionsCompleted: number;
    averageSatisfaction: number;
    certificationRate: number;
  };
  operationalMetrics: {
    systemUptime: number;
    processingTime: number;
    errorRate: number;
  };
}

// Workflow Types
export interface WorkflowRequest {
  id: string;
  team_id: string;
  workflow_type: string;
  request_data: Record<string, any>;
  requested_by: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  approval_data?: Record<string, any>;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  teams?: {
    name: string;
  };
  requester?: {
    display_name: string;
  };
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  stepName: string;
  stepType: 'approval' | 'notification' | 'automation';
  approverRole?: string;
  approverIds?: string[];
  conditions?: Record<string, any>;
  actions?: Record<string, any>;
  isRequired: boolean;
}

// Role Change Request Types
export interface RoleChangeRequest {
  id: string;
  userId: string;
  fromRole: string;
  toRole: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  requiresApproval: boolean;
  processed: boolean;
  createdAt: string;
}

// Workflow Statistics
export interface WorkflowStatistics {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  avgProcessingTime: string;
  complianceRate: number;
}
