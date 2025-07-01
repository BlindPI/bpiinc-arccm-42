
export interface CourseSchedule {
  id: string;
  course_id: string;
  start_date: string;
  end_date: string;
  max_capacity: number;
  current_enrollment: number;
  instructor_id?: string | null;
  location_id?: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  recurring_pattern?: RecurringPattern | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[];
  [key: string]: any; // Add index signature for Json compatibility
}

export interface ConflictResult {
  conflict_id: string;
  conflict_start: string;
  conflict_end: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  conflictReason?: string;
}

export interface EnrollmentResult {
  success: boolean;
  enrollmentId?: string;
  waitlistPosition?: number;
  message: string;
}

export interface ScheduleFormData {
  course_id: string;
  instructor_id: string;
  location_id: string;
  start_date: string;
  end_date: string;
  max_capacity: number;
  recurring_pattern?: RecurringPattern;
}
