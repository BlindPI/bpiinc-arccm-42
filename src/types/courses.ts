// Course related types
export interface Course {
  id: string;
  name: string;
  description?: string;
  expiration_months: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  created_by: string | null;
  updated_at: string;
  course_type_id?: string | null;
  assessment_type_id?: string | null;
  first_aid_level?: string | null;
  cpr_level?: string | null;
  length?: number | null;
  // Added nested relationships for course type and assessment type
  course_type?: {
    id: string;
    name: string;
  } | null;
  assessment_type?: {
    id: string;
    name: string;
  } | null;
}

export interface CourseInsert extends Omit<Course, 'id' | 'created_at' | 'updated_at'> {}

export interface CoursePrerequisite {
  id: string;
  course_id: string;
  prerequisite_course_id: string; 
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseType {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseTypeInsert extends Omit<CourseType, 'id' | 'created_at' | 'updated_at'> {}

export interface AssessmentType {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentTypeInsert extends Omit<AssessmentType, 'id' | 'created_at' | 'updated_at'> {}

export interface CourseTypeCertificationLevel {
  id: string;
  course_type_id: string;
  certification_level_id: string;
  created_at: string;
}

// Location related types
export interface Location {
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

export interface CourseEnrollment {
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
}
