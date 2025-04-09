
import { UserRole } from "@/types/supabase-schema";

export interface DocumentRequirement {
  id: string;
  document_type: string;
  is_mandatory: boolean;
  from_role: UserRole;
  to_role: UserRole;
  description?: string;
}

export interface DocumentSubmission {
  id: string;
  requirement_id: string;
  instructor_id: string;
  document_url?: string;
  status: 'PENDING' | 'APPROVED' | 'MISSING' | 'REJECTED';
  feedback?: string;
  feedback_text?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewer_id?: string;
  document_requirements?: DocumentRequirement;
  expiry_date?: string;
}

export interface TeachingSession {
  id: string;
  instructor_id: string;
  course_id: string;
  hours_taught: number;
  session_date: string;
  completion_status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CompletionSummary {
  course_id: string;
  course_name: string;
  total_sessions: number;
  completed_sessions: number;
  total_hours: number;
  hours_remaining: number;
  completion_percentage: number;
  completion_statuses: Record<string, number>;
}

export interface CertificationRequirement {
  course_id: string;
  required_hours: number;
  min_sessions: number;
}

export interface SupervisorEvaluation {
  id: string;
  teaching_session_id: string;
  evaluator_id: string;
  instructor_id: string;
  teaching_competency: number;
  student_feedback: string;
  areas_for_improvement: string;
  additional_notes?: string;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface RoleRequirements {
  id: string;
  from_role: UserRole;
  to_role: UserRole;
  teaching_hours: number;
  completed_teaching_hours: number;
  min_sessions: number; 
  completed_sessions: number;
  required_documents: number;
  submitted_documents: number;
  required_videos: number;
  submitted_videos: number;
  time_in_role_days: number;
  min_time_in_role_days: number;
  meets_teaching_requirement: boolean;
  meets_evaluation_requirement: boolean;
  meets_time_requirement: boolean;
  document_compliance: boolean;
  supervisor_evaluations_required: number;
  supervisor_evaluations_completed: number;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  metadata: {
    visibility: 'public' | 'private';
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  created_at: string;
  updated_at: string;
  profiles?: any;
  display_name?: string;
}
