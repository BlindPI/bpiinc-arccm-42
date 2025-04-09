
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
}

export interface CourseInsert extends Omit<Course, 'id' | 'created_at' | 'updated_at'> {}

export interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
}

export interface LocationInsert extends Omit<Location, 'id' | 'created_at' | 'updated_at'> {}

export interface CourseOffering {
  id: string;
  course_id: string;
  location_id: string;
  instructor_id: string | null;
  start_date: string;
  end_date: string;
  max_participants: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
}

export interface CourseOfferingInsert extends Omit<CourseOffering, 'id' | 'created_at' | 'updated_at'> {}
