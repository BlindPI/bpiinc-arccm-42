
// This file contains type definitions for the Supabase database schema

export type UserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT';

export interface Profile {
  id: string;
  display_name?: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  is_test_data?: boolean;
  credentials?: {
    email: string;
    password: string;
  };
}

export interface Course {
  id: string;
  name: string;
  description?: string | null;
  expiration_months: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  created_by?: string | null;
  updated_at: string;
}

export interface CourseInsert extends Omit<Course, 'id' | 'created_at' | 'updated_at'> {}

export interface Location {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface LocationInsert extends Omit<Location, 'id' | 'created_at' | 'updated_at'> {}

export interface CourseOffering {
  id: string;
  course_id: string;
  location_id: string | null;
  instructor_id: string | null;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export interface CourseOfferingInsert extends Omit<CourseOffering, 'id' | 'created_at' | 'updated_at'> {}

export interface Certificate {
  id: string;
  recipient_name: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  verification_code: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  certificate_url?: string | null;
  certificate_request_id?: string | null;
  issued_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateInsert extends Omit<Certificate, 'id' | 'created_at' | 'updated_at'> {}

export interface CertificateRequest {
  id: string;
  user_id?: string | null;
  recipient_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_id?: string | null;
  rejection_reason?: string | null;
  first_aid_level?: string | null;
  cpr_level?: string | null;
  assessment_status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateRequestInsert extends Omit<CertificateRequest, 'id' | 'created_at' | 'updated_at'> {}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ACTION';
  read: boolean;
  read_at: string | null;
  created_at: string;
  action_url?: string | null;
}

export interface NotificationInsert extends Omit<Notification, 'id' | 'created_at' | 'read' | 'read_at'> {
  read?: boolean;
  read_at?: string | null;
}

export interface SystemSettings {
  key: string;
  value: any;
  description?: string | null;
  updated_at: string;
}

export interface SupabaseSystemSettings extends SystemSettings {
  value: {
    enabled: boolean;
    [key: string]: any;
  };
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
  description?: string | null;
  created_at: string;
  updated_at: string;
}
