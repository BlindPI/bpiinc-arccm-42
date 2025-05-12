
export interface Course {
  id: string;
  name: string;
  code?: string; // New field for course code
  description?: string;
  length?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DRAFT';
  course_type_id?: string;
  course_type?: {
    id: string;
    name: string;
  };
  first_aid_level?: string;
  cpr_level?: string;
  expiration_months: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  assessment_type_id?: string;
  assessment_type?: {
    id: string;
    name: string;
  };
  certification_values?: Record<string, string>;
}

export interface CourseAuditLog {
  id: string;
  course_id: string;
  action: string;
  performed_by?: string;
  performed_at: string;
  changes?: Record<string, any>;
  reason?: string;
  performer?: {
    id: string;
    display_name?: string;
  };
  performer_name?: string;
}

export type CourseInput = Omit<Course, 'id' | 'created_at' | 'updated_at'>;

export interface CoursePrerequisite {
  id: string;
  course_id: string;
  prerequisite_course_id: string; 
  is_required: boolean;
  created_at: string;
  updated_at: string;
  prerequisite_course?: {  // Add this field to match the data shape
    id?: string;
    name: string;
  };
}

export interface CourseType {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CourseTypeInsert = Omit<CourseType, 'id' | 'created_at' | 'updated_at'>;

export interface AssessmentType {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type AssessmentTypeInsert = Omit<AssessmentType, 'id' | 'created_at' | 'updated_at'>;

// Location related types
export interface Location {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export type LocationInsert = Omit<Location, 'id' | 'created_at' | 'updated_at'>;

export interface CourseOffering {
  id: string;
  course_id: string;
  location_id?: string | null;
  instructor_id?: string | null;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export type CourseOfferingInsert = Omit<CourseOffering, 'id' | 'created_at' | 'updated_at'>;
