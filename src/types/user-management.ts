
import { UserRole } from "@/lib/roles";

export interface Profile {
  id: string;
  role: UserRole;
  display_name?: string | null;
  created_at: string;
  updated_at: string;
  compliance_status?: boolean;
  last_check_date?: string | null;
}

export interface ProfileInsert extends Omit<Profile, 'id' | 'created_at' | 'updated_at'> {}

export interface Supervision {
  id: string;
  supervisor_id: string;
  supervisee_id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'REQUESTED';
  supervisor_name?: string;
  supervisor_role?: UserRole;
  supervisee_name?: string;
  supervisee_role?: UserRole;
  created_at: string;
  updated_at: string;
}

export interface SupervisionInsert extends Omit<Supervision, 'id' | 'created_at' | 'updated_at'> {}

export interface RoleTransitionRequest {
  id: string;
  user_id: string;
  from_role: UserRole;
  to_role: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_id?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  profiles?: {
    role: UserRole;
  };
}

export interface RoleTransitionRequestInsert extends Omit<RoleTransitionRequest, 'id' | 'created_at' | 'profiles'> {}

export interface DocumentRequirement {
  id: string;
  from_role: UserRole;
  to_role: UserRole;
  document_type: string;
  is_mandatory: boolean;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentSubmission {
  id: string;
  requirement_id: string;
  instructor_id: string;
  document_url?: string;
  status: 'PENDING' | 'APPROVED' | 'MISSING' | 'REJECTED';
  feedback?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewer_id?: string | null;
  document_requirements?: {
    id: string;
    document_type: string;
    is_mandatory: boolean;
    from_role: UserRole;
    to_role: UserRole;
  };
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
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  created_at: string;
  updated_at: string;
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

export interface RoleRequirements {
  id: string;
  from_role: UserRole;
  to_role: UserRole;
  teaching_hours_required: number;
  supervision_hours_required: number;
  document_requirements_count: number;
  evaluation_score_required: number;
  has_exam_requirement: boolean;
  has_video_requirement: boolean;
  has_audit_requirement: boolean;
  has_interview_requirement: boolean;
  min_experience_months: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface VideoSubmission {
  id: string;
  user_id: string;
  transition_request_id?: string;
  video_url: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_id?: string;
  feedback?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface AuditSubmission {
  id: string;
  user_id: string;
  transition_request_id?: string;
  audit_document_url: string;
  audit_date: string;
  auditor_id?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback?: string;
  submitted_at: string;
  reviewed_at?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
  metadata?: {
    visibility: 'public' | 'private';
    [key: string]: any;
  };
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface CompletionSummary {
  instructor_id: string;
  course_id: string;
  course_name: string;
  total_hours: number;
  completed_sessions: number;
  total_sessions: number;
  completion_statuses: string[];
  last_session_date: string;
}

export interface CertificationRequirement {
  course_id: string;
  min_sessions: number;
  required_hours: number;
}
