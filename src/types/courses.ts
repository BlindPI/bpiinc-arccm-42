// Course related types
export type CourseType = {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  updated_at?: string;
};

export type CourseTypeInsert = Omit<CourseType, 'id' | 'updated_at'>;

export type AssessmentType = {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  updated_at?: string;
};

export type AssessmentTypeInsert = Omit<AssessmentType, 'id' | 'updated_at'>;

export type Course = {
  id: string;
  name: string;
  description?: string;
  expiration_months: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  created_by: string | null;
  updated_at: string;
  course_type?: CourseType;
  course_type_id?: string;
  assessment_type?: AssessmentType;
  assessment_type_id?: string;
  first_aid_level?: string;
  cpr_level?: string;
  length?: number;
  certification_values?: Record<string, string>;
};

export type CourseInsert = Omit<Course, 'id' | 'created_at' | 'updated_at'>;

export type CoursePrerequisite = {
  id: string;
  course_id: string;
  prerequisite_course_id: string;
  prerequisite_course?: Course;
  is_required: boolean;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  capacity?: number | null;
  amenities?: Record<string, any> | null;
  contact_info?: Record<string, any> | null;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
};

export type LocationInsert = Omit<Location, 'id' | 'created_at' | 'updated_at'>;

export type CourseOffering = {
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
};

export type CourseOfferingInsert = Omit<CourseOffering, 'id' | 'created_at' | 'updated_at'>;

export type CourseEnrollment = {
  id: string;
  user_id: string;
  course_offering_id: string;
  enrollment_date: string;
  status: 'ENROLLED' | 'WAITLISTED' | 'CANCELLED' | 'COMPLETED';
  attendance: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
  waitlist_position?: number | null;
  attendance_notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type CourseEnrollmentInsert = Omit<CourseEnrollment, 'id' | 'created_at' | 'updated_at'>;

// Make this a type alias to import from supabase-schema
export type UserRole = any;

export type UserFilters = {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  search?: string;
};

export type ExtendedProfile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string; // Optional to match ExtendedUser
  phone?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
};

// Keep as interface but modify the base type
export interface ExtendedUser extends ExtendedProfile {
  // No need to redefine properties as email is now optional in ExtendedProfile
}

export type CreateRosterData = {
  course_offering_id: string;
  users: Array<string>;
  name: string;
  description?: string;
  created_by?: string;
  location_id?: string;
  course_id?: string; // Added this field
};

export type NotificationQueueEntry = {
  id: string;
  recipient: string;
  subject: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  created_at: string;
  updated_at: string;
};

// For use in NotificationTester.tsx - use a wrapper type instead of module augmentation
export type QueryWithStatus<TData> = {
  data?: TData;
  error?: Error | null;
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  status?: 'idle' | 'loading' | 'error' | 'success';
};

export type RosterEntry = {
  name: string;
  course_id?: string;
  course_offering_id?: string;
  users?: Array<string>;
  certificate_count?: number;
  created_at?: string;
  created_by?: string;
  description?: string;
  id?: string;
  issue_date?: string;
  location_id?: string;
  metadata?: any;
  status?: string;
  updated_at?: string;
};