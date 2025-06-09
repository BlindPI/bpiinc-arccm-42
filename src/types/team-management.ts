
export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'active' | 'inactive' | 'pending';
  team_position?: string;
  joined_at: string;
  display_name?: string;
  profiles?: {
    id: string;
    email: string;
    display_name?: string;
    role: string;
    status?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'archived';
  location_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  members?: TeamMemberWithProfile[];
  performance_score?: number;
}

export interface EnhancedTeam extends Team {
  location?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  provider?: {
    id: string;
    name: string;
    provider_type: string;
    status: string;
  };
  metrics?: {
    performance_score: number;
    compliance_score: number;
    member_count: number;
  };
}

export interface InstructorPerformanceMetrics {
  instructorId: string;
  instructorName: string;
  role: string;
  totalSessions: number;
  totalHours: number;
  averageRating: number;
  averageSessionRating: number;
  certificatesIssued: number;
  complianceScore: number;
  studentsCount: number;
  monthlyBreakdown?: {
    month: string;
    sessions: number;
    hours: number;
    rating: number;
  }[];
}

export interface TeamCreationData {
  name: string;
  description?: string;
  team_type: string;
  location_id?: string;
  initial_members?: string[];
}
