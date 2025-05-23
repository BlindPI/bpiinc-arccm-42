
import { User } from '@supabase/supabase-js';

// Update to match supabase-schema types
export type UserRole = 'SA' | 'AD' | 'IC' | 'IP' | 'IT' | 'AP' | 'IN';

// src/types/auth.ts
export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  organization?: string;
  job_title?: string;
  phone?: string;
  compliance_status?: boolean;
  compliance_notes?: string;
  last_compliance_check?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUserWithProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  organization?: string;
  job_title?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at: string;
}

export interface AuthContextType {
  user: AuthUserWithProfile | null;
  session: any;
  loading: boolean;
  authReady: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: any; error?: any }>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profileData?: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  acceptInvitation: (token: string, userData: any) => Promise<{ success: boolean; error?: any }>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: any }>;
  refreshUser: () => Promise<void>;
  isAdmin: () => boolean;
  hasRole: (roles: string[]) => boolean;
}

// src/types/certificates.ts
export interface CertificateRequestData {
  recipientName: string;
  courseName: string;
  issueDate: string;
  expiryDate: string;
  locationId?: string;
  batchId?: string;
  batchName?: string;
  rosterId?: string;
}

export interface CertificateRequest {
  id: string;
  user_id: string;
  recipient_name: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  location_id?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  batch_id?: string;
  batch_name?: string;
  roster_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  recipient_name: string;
  recipient_email?: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  verification_code: string;
  certificate_url?: string;
  issued_by?: string;
  certificate_request_id?: string;
  location_id?: string;
  user_id?: string;
  batch_id?: string;
  batch_name?: string;
  roster_id?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'REVOKED';
  email_status: 'PENDING' | 'SENT' | 'FAILED';
  last_emailed_at?: string;
  created_at: string;
  updated_at: string;
}

// src/types/dashboard.ts
export interface ProviderMetrics {
  active_instructors: number;
  total_students: number;
  courses_offered: number;
  avg_satisfaction: number;
  completion_rate: number;
  revenue_ytd: number;
  upcoming_courses: number;
  certifications_issued: number;
  instructor_applications: number;
  last_updated: string;
}

export interface InstructorApplication {
  id: string;
  applicant_id: string;
  provider_id: string;
  status: 'pending' | 'approved' | 'rejected';
  application_date: string;
  qualifications?: string;
  experience?: string;
  applicant_references?: string[];
  notes?: string;
  reviewer_id?: string;
  review_date?: string;
  created_at: string;
  updated_at: string;
  applicant?: UserProfile;
}

export interface InstructorProfile {
  id: string;
  user_id: string;
  provider_id?: string;
  status: 'active' | 'inactive' | 'suspended';
  certification_level?: string;
  specialty_areas?: string[];
  teaching_since?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
}

export interface CourseOffering {
  id: string;
  course_id?: string;
  provider_id?: string;
  location_id?: string;
  start_date: string;
  end_date?: string;
  max_participants: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
  course?: Course;
  location?: Location;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  duration_hours?: number;
  certification_type?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

// src/types/notifications.ts
export interface Notification {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CERTIFICATE_REQUEST' | 'CERTIFICATE_APPROVED' | 'CERTIFICATE_REJECTED' | 'WELCOME' | 'INVITATION';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: 'GENERAL' | 'CERTIFICATE' | 'ACCOUNT' | 'SYSTEM' | 'TEST';
  action_url?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationQueue {
  id: string;
  notification_id: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: string;
  created_at: string;
  processed_at?: string;
  error?: string;
  notification?: Notification;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  category: string;
  email_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// src/types/documents.ts
export interface DocumentRequirement {
  id: string;
  from_role: string;
  to_role: string;
  document_type: string;
  is_mandatory: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentSubmission {
  id: string;
  instructor_id: string;
  requirement_id: string;
  document_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  expiry_date?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes?: string;
  requirement?: DocumentRequirement;
}

// src/types/teaching.ts
export interface TeachingSession {
  id: string;
  instructor_id: string;
  course_offering_id?: string;
  session_date: string;
  hours_taught: number;
  students_present: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupervisorEvaluation {
  id: string;
  instructor_id: string;
  supervisor_id: string;
  evaluation_date: string;
  overall_rating: number;
  teaching_skills_rating: number;
  knowledge_rating: number;
  professionalism_rating: number;
  comments?: string;
  recommendations?: string;
  areas_for_improvement?: string;
  created_at: string;
  updated_at: string;
  supervisor?: UserProfile;
}

// src/types/api.ts
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

// src/types/ui.ts - For component prop types
export interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

// Database table types for better type safety
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id'>>;
      };
      certificates: {
        Row: Certificate;
        Insert: Omit<Certificate, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Certificate, 'id'>>;
      };
      certificate_requests: {
        Row: CertificateRequest;
        Insert: Omit<CertificateRequest, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CertificateRequest, 'id'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
      locations: {
        Row: Location;
        Insert: Omit<Location, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Location, 'id'>>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Course, 'id'>>;
      };
      course_offerings: {
        Row: CourseOffering;
        Insert: Omit<CourseOffering, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CourseOffering, 'id'>>;
      };
    };
  };
}