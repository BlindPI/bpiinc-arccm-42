// Define UserRole type
export type UserRole = 'SA' | 'AD' | 'AP' | 'IC' | 'IP' | 'IT';

export interface CourseType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseTypeInsert {
  name: string;
  description?: string;
  active?: boolean;
}

export interface AssessmentType {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentTypeInsert {
  name: string;
  description?: string;
  active?: boolean;
}

export interface Course {
  id: string;
  name: string;
  description?: string;
  course_type_id?: string;
  assessment_type_id?: string;
  expiration_months: number;
  created_at: string;
  created_by: string;
  length?: number;
  status?: string;
  course_type?: CourseType;
  assessment_type?: AssessmentType;
  certification_values?: Record<string, string>;
}

export interface CourseInsert {
  name: string;
  description?: string;
  course_type_id?: string;
  assessment_type_id?: string;
  expiration_months: number;
  created_by: string;
  length?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CourseOffering {
  id: string;
  course_id: string;
  location_id?: string;
  instructor_id?: string;
  start_date: string;
  end_date: string;
  status: string;
  max_participants: number;
  created_at: string;
  updated_at: string;
}

export interface CourseOfferingInsert {
  course_id: string;
  location_id?: string;
  instructor_id?: string;
  start_date: string;
  end_date: string;
  status?: string;
  max_participants: number;
}

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

export interface UserFilters {
  search?: string;
  role?: UserRole | null;
  status?: 'ACTIVE' | 'INACTIVE' | null;
  compliance?: boolean | null;
}