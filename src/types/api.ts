
import { Profile, CourseOffering, UserRole } from '@/types/supabase-schema';

export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface TeachingData {
  id: string;
  instructor_id: string;
  course_id: string;
  course_name: string;
  hours_taught: number;
  session_date: string;
  completion_status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
  notes?: string;
  [key: string]: any;
}

export interface ComplianceData {
  id: string;
  user_id: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';
  expiry_date?: string;
  items: {
    id: string;
    name: string;
    status: 'VALID' | 'EXPIRED' | 'MISSING';
    expiry_date?: string;
  }[];
  [key: string]: any;
}

// Define interfaces that map to the created database tables
export interface RoleTransitionProgressData {
  required_teaching_hours: number;
  completed_teaching_hours: number;
  required_evaluations: number;
  completed_evaluations: number;
  total_required_documents: number;
  total_submitted_documents: number;
  total_required_videos: number;
  total_submitted_videos: number;
  days_in_current_role: number;
  required_days_in_role: number;
  meets_teaching_requirement: boolean;
  meets_evaluation_requirement: boolean;
  meets_time_requirement: boolean;
  document_compliance: number;
}

export type EvaluationStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}