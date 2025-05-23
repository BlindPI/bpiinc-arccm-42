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