
export interface Enrollment {
  id: string;
  user_id: string;
  course_offering_id: string;
  enrollment_date: string;
  status: 'ENROLLED' | 'WAITLISTED' | 'CANCELLED' | 'COMPLETED';
  attendance: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | null;
  attendance_notes?: string | null;
  waitlist_position?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentInsert extends Omit<Enrollment, 'id' | 'created_at' | 'updated_at' | 'enrollment_date'> {
  enrollment_date?: string;
  attendance_notes?: string;
}

export interface WaitlistEntry extends Enrollment {
  position: number;
  notification_sent: boolean;
}

export interface CoursePrerequisite {
  id: string;
  course_id: string;
  prerequisite_course_id: string;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnrollmentFormData {
  user_id: string;
  course_offering_id: string;
  attendance_notes?: string;
}
