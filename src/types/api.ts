
import { Profile, CourseOffering } from '@/types/supabase-schema';

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

export interface DocumentRequirement {
  id: string;
  from_role: string;
  to_role: string;
  document_type: string;
  is_mandatory: boolean;
  description?: string;
  [key: string]: any;
}
