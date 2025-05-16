
// Define the Location type with all required fields
export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  status: string;
  created_at: string;
  updated_at: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
}

export interface LocationInsert extends Omit<Location, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

// Add Course and CourseInsert interfaces
export interface Course {
  id: string;
  name: string;
  description?: string;
  expiration_months: number;
  length?: number;
  course_type_id?: string;
  assessment_type_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  status: string;
  first_aid_level?: string;
  cpr_level?: string;
  course_type?: {
    id: string;
    name: string;
  };
  assessment_type?: {
    id: string;
    name: string;
  };
  certification_values?: Record<string, string>;
}

export interface CourseInsert extends Omit<Course, 'id' | 'created_at' | 'updated_at' | 'course_type' | 'assessment_type'> {
  id?: string;
}

// Add CourseType and CourseTypeInsert interfaces
export interface CourseType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseTypeInsert extends Omit<CourseType, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

// Add AssessmentType and AssessmentTypeInsert interfaces
export interface AssessmentType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentTypeInsert extends Omit<AssessmentType, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
}

// Add CourseOffering and CourseOfferingInsert interfaces
export interface CourseOffering {
  id: string;
  course_id: string;
  location_id?: string;
  instructor_id?: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  created_at: string;
  updated_at: string;
  status: string;
  courses?: {
    name: string;
    description?: string;
  };
  locations?: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  instructors?: {
    display_name?: string;
  };
}

export interface CourseOfferingInsert extends Omit<CourseOffering, 'id' | 'created_at' | 'updated_at' | 'courses' | 'locations' | 'instructors'> {
  id?: string;
}

// Add CoursePrerequisite interface
export interface CoursePrerequisite {
  id: string;
  course_id: string;
  prerequisite_course_id: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
  prerequisite_course?: {
    id: string;
    name: string;
  };
}

export interface CoursePrerequisiteInsert extends Omit<CoursePrerequisite, 'id' | 'created_at' | 'updated_at' | 'prerequisite_course'> {
  id?: string;
}

// Update DateRange interface to include from/to properties
export interface DateRange {
  from?: Date;
  to?: Date;
  start?: Date;
  end?: Date;
}

// Define the CourseMatchType for batch upload matching
export type CourseMatchType = 'exact' | 'partial' | 'manual' | 'default' | 'fallback';

// Define UserFilters interface for UserManagementPage
export interface UserFilters {
  search: string;
  role: UserRole | null;
  status: string | null;
}

// Import UserRole type from supabase-schema to ensure consistency
import { UserRole } from '@/types/supabase-schema';
export { UserRole };

// Define ExtendedProfile interface
export interface ExtendedProfile {
  id: string;
  role: UserRole;
  display_name?: string;
  created_at: string;
  updated_at: string;
  email?: string;
  status: string;
  compliance_status?: boolean;
}

