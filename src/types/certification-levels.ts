
export interface CertificationLevel {
  id: string;
  name: string;
  type: string; // Changed from 'FIRST_AID' | 'CPR' to allow dynamic types
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type CertificationLevelInput = Omit<
  CertificationLevel,
  'id' | 'created_at' | 'updated_at'
>;

// Add a new interface to manage the relationship between course types and certification level types
export interface CourseTypeCertificationLevel {
  id: string;
  course_type_id: string;
  certification_level_id: string;
  created_at: string;
}

export type CourseTypeCertificationLevelInput = Omit<
  CourseTypeCertificationLevel,
  'id' | 'created_at'
>;
