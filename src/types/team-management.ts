
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
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberWithProfile extends TeamMember {
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
  updated_at: string;
  location_name?: string;
}
