export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  location_assignment?: string | null;
  assignment_start_date?: string | null;
  assignment_end_date?: string | null;
  team_position?: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_activity: string;
  joined_at: string;
  display_name: string;
  profiles: {
    id: string;
    display_name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
    compliance_status?: boolean | null;
    last_training_date?: string | null;
    next_training_due?: string | null;
    performance_score?: number | null;
    training_hours?: number | null;
    certifications_count?: number | null;
    location_id?: string | null;
    department?: string | null;
    supervisor_id?: string | null;
    user_id?: string;
  };
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score?: number;
  location_id?: string;
  provider_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  monthly_targets?: Record<string, any>;
  current_metrics?: Record<string, any>;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  location_assignment?: string | null;
  assignment_start_date?: string | null;
  assignment_end_date?: string | null;
  team_position?: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_activity?: string;
}

// Add missing interfaces that were causing build errors
export interface EnhancedTeam {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score: number;
  location_id?: string;
  provider_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any>;
  monthly_targets: Record<string, any>;
  current_metrics: Record<string, any>;
  location?: any;
  provider?: any;
  member_count?: number;
  members?: TeamMemberWithProfile[];
}

export interface TeamAnalytics {
  totalTeams: number;
  totalMembers: number;
  averagePerformance: number;
  averageCompliance: number;
  teamsByLocation: Record<string, number>;
  performanceByTeamType: Record<string, number>;
}

export interface InstructorPerformanceMetrics {
  instructorId: string;
  instructorName: string;
  role?: string;
  coursesDelivered: number;
  totalStudents: number;
  totalSessions?: number;
  averageRating: number;
  certificationRate: number;
  certificatesIssued?: number;
  hoursDelivered: number;
  totalHours?: number;
  complianceStatus: 'compliant' | 'at_risk' | 'non_compliant';
  complianceScore?: number;
  studentsCount?: number;
  averageSessionRating?: number;
}

export interface TeamPerformanceMetrics {
  teamId: string;
  teamName: string;
  memberCount: number;
  averagePerformance: number;
  complianceRate: number;
  certificatesIssued: number;
  coursesCompleted: number;
  trainingHours: number;
}

// Fix TeamLocationAssignment to include location_name
export interface TeamLocationAssignment {
  id: string;
  team_id: string;
  location_id: string;
  location_name?: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive';
}

// Fix WorkflowRequest interface to match database schema
export interface WorkflowRequest {
  id: string;
  type: 'role_change' | 'team_transfer' | 'permission_update';
  workflow_type: string;
  requesterId: string;
  requester?: string;
  requested_by?: string;
  targetUserId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestData: Record<string, any>;
  request_data?: Record<string, any>;
  created_at: string;
  completed_at?: string;
  approved_by?: string;
}

// Fix CreateTeamRequest to include metadata
export interface CreateTeamRequest {
  name: string;
  description?: string;
  team_type: string;
  location_id?: string;
  provider_id?: string;
  created_by?: string;
  metadata?: Record<string, any>;
}

// Fix AuthorizedProvider interface to match database schema
export interface AuthorizedProvider {
  id: bigint;
  name: string;
  description?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  provider_type?: string;
  primary_location_id?: string;
  performance_rating: number;
  compliance_score: number;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  address?: string;
  logo_url?: string;
  approval_date?: string;
  approved_by?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  provider_name?: string;
  provider_url?: string;
  certification_levels?: any[];
  specializations?: any[];
  contract_start_date?: string;
  contract_end_date?: string;
  provider_team_id?: string;
  metadata?: Record<string, any>;
}
