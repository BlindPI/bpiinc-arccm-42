
// Course related types
export type Course = {
  id: string;
  name: string;
  description?: string;
  expiration_months: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  created_by: string | null;
  updated_at: string;
  // Add missing properties based on the error messages
  course_type_id?: string | null;
  assessment_type_id?: string | null;
  first_aid_level?: string | null;
  cpr_level?: string | null;
  length?: number | null;
  // Add related objects that are accessed in components
  course_type?: {
    id: string;
    name: string;
  } | null;
  assessment_type?: {
    id: string;
    name: string;
  } | null;
  // Add certification_values property
  certification_values?: Record<string, string>;
};

export type CourseInsert = Omit<Course, 'id' | 'created_at' | 'updated_at'>;

export type CoursePrerequisite = {
  id: string;
  course_id: string;
  prerequisite_course_id: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  // Add the prerequisite_course property that's being accessed
  prerequisite_course?: {
    id: string;
    name: string;
  } | null;
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
  // Add missing properties for Location
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
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

// Define the CreateRosterData type to include certificate_count
export interface CreateRosterData {
  name: string;
  description?: string;
  created_by: string;
  location_id: string | null;
  course_id?: string | null;
  issue_date?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  certificate_count?: number; // Add this field to fix the error
}

// Add missing types for AssessmentType and CourseType
export interface AssessmentType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type AssessmentTypeInsert = Omit<AssessmentType, 'id' | 'created_at' | 'updated_at'>;

export interface CourseType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CourseTypeInsert = Omit<CourseType, 'id' | 'created_at' | 'updated_at'>;

// Add UserFilters type for user management
export interface UserFilters {
  search: string;
  role: string | null;
  status: string | null;
}

// Add ExtendedProfile type referenced in UserManagementPage
export interface ExtendedProfile {
  id: string;
  role: string;
  display_name?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  status: string;
  compliance_status?: boolean;
}
