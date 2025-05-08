
export interface Course {
  id: string;
  name: string;
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

export type CourseInput = Omit<Course, 'id' | 'created_at' | 'updated_at'>;
