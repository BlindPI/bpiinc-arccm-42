
export type UserRole = 'IT' | 'IP' | 'IC' | 'AP' | 'AD' | 'SA';

export interface Profile {
  id: string;
  role: UserRole;
  display_name?: string;
  created_at: string;
  updated_at: string;
  email?: string;
  phone?: string;
  address?: string;
  bio?: string;
  preferences?: object;
  teaching_hours?: number;
  supervision_hours?: number;
  certification_date?: string;
  avatar_url?: string;
  status: 'ACTIVE' | 'INACTIVE'; // Now status is required (SQL default)
  compliance_status?: boolean; // Added compliance_status property
}

export interface Certificate {
  id: string;
  certificate_request_id: string | null;
  issued_by: string | null;
  verification_code: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  certificate_url: string | null;
  expiry_date: string;
  issue_date: string;
  course_name: string;
  recipient_name: string;
  created_at: string;
  updated_at: string;
}

export interface CertificateRequest {
  id: string;
  user_id: string | null;
  course_name: string;
  reviewer_id: string | null;
  expiry_date: string;
  // Change from a union type to string to match the database
  status: string;
  created_at: string;
  updated_at: string;
  assessment_status: string | null;
  cpr_level: string | null;
  rejection_reason: string | null;
  first_aid_level: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  recipient_name: string;
  issue_date: string;
  instructor_name: string | null;
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  expiration_months: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  first_aid_level: string | null;
  cpr_level: string | null;
  length: number | null;
}

export interface CourseOffering {
  id: string;
  course_id: string;
  instructor_id: string | null;
  location_id: string | null;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION';
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
}

export interface TeachingSession {
  id: string;
  instructor_id: string;
  course_id: string;
  hours_taught: number;
  session_date: string;
  completion_status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRequirement {
  id: string;
  document_type: string;
  is_mandatory: boolean;
  from_role: UserRole;
  to_role: UserRole;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentSubmission {
  id: string;
  requirement_id: string;
  instructor_id: string;
  document_url: string | null;
  status: 'PENDING' | 'APPROVED' | 'MISSING' | 'REJECTED';
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_id: string | null;
}

export interface RoleRequirement {
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
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleTransitionRequest {
  id: string;
  user_id: string;
  from_role: UserRole;
  to_role: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupervisorEvaluation {
  id: string;
  teaching_session_id: string;
  evaluator_id: string;
  instructor_id: string;
  teaching_competency: number;
  student_feedback: string;
  areas_for_improvement: string;
  additional_notes: string | null;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  created_at: string;
  updated_at: string;
}

export interface SupervisionRelationship {
  id: string;
  supervisor_id: string;
  supervisee_id: string;
  status: 'REQUESTED' | 'ACTIVE' | 'REJECTED' | 'TERMINATED';
  created_at: string;
  updated_at: string;
}

export interface RoleVideoSubmission {
  id: string;
  user_id: string;
  transition_request_id: string | null;
  video_url: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_id: string | null;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface RoleAuditSubmission {
  id: string;
  user_id: string;
  transition_request_id: string | null;
  audit_document_url: string;
  audit_date: string;
  auditor_id: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  metadata: Record<string, any>;
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
  profiles?: Profile;
  display_name?: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  initial_role: UserRole;
  invitation_token: string;
  invited_by: string;
  used: boolean;
  created_at: string;
  expires_at: string;
}

export interface SystemSetting {
  key: string;
  value: any;
  description: string | null;
  updated_at: string;
}

// Mock types for views that will be created later
export interface SupervisionProgress {
  user_id: string;
  supervisee_count: number;
  active_supervisees: number;
  pending_supervisees: number;
  total_hours_supervised: number;
}

export interface CourseCompletionSummary {
  course_id: string;
  course_name: string;
  total_sessions: number;
  completed_sessions: number;
  total_hours: number;
  hours_remaining: number;
  completion_percentage: number;
  completion_statuses: Record<string, number>;
}

export interface NotificationQueue {
  id: string;
  notification_id: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  processed_at: string | null;
  error: string | null;
  created_at: string;
}

// Add ExtendedProfile type used in UserManagement.tsx
export interface ExtendedProfile extends Profile {
  // Status is now inherited from Profile; leave for compatibility
  // compliance_status is inherited from Profile
}
