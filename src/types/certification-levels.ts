export interface CertificationLevel {
  id: string;
  name: string;
  type: string; // Dynamic type instead of enum
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CertificationLevelInput = Omit<
  CertificationLevel,
  'id' | 'created_at' | 'updated_at'
>;

// Interface to manage the relationship between course types and certification level types
export interface CourseTypeCertificationLevel {
  id: string;
  course_type_id: string;
  certification_level_id: string;
  created_at: string;
  certification_level?: {
    id: string;
    name: string;
    type: string;
    active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export type CourseTypeCertificationLevelInput = Omit<
  CourseTypeCertificationLevel,
  'id' | 'created_at'
>;

// Define a structure for certification values for a course
export interface CourseCertifications {
  [certType: string]: string | null;
}

// Utility type to help with dynamic certification level handling
export type CertificationTypes = Record<string, CertificationLevel[]>;
