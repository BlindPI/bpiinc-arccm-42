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
};

export type CourseInsert = Omit<Course, 'id' | 'created_at' | 'updated_at'>;

export type CoursePrerequisite = {
  id: string;
  course_id: string;
  prerequisite_course_id: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
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

export type CourseEnrollmentInsert = Omit<CourseEnrollment, 'id' | 'created_at' | 'updated_at'>;