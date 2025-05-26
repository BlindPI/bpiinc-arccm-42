
export interface TeachingSession {
  id: string;
  instructor_id: string;
  course_id: string;
  course_schedule_id?: string;
  session_date: string;
  duration_minutes: number;
  attendees: string[];
  attendance_count: number;
  compliance_status: 'pending' | 'compliant' | 'non_compliant';
  teaching_hours_credit: number;
  session_notes?: string;
  materials_used?: Record<string, any>;
  assessment_conducted: boolean;
  hours_taught: number;
  completion_status: string;
  created_at: string;
  updated_at: string;
}

export interface InstructorWorkload {
  instructor_id: string;
  display_name: string;
  role: string;
  total_sessions_all_time: number;
  total_hours_all_time: number;
  sessions_this_month: number;
  hours_this_month: number;
  compliance_percentage: number;
}

export interface ComplianceCheck {
  id: string;
  instructor_id: string;
  check_type: 'teaching_hours' | 'session_quality' | 'documentation' | 'attendance';
  check_date: string;
  status: 'pending' | 'passed' | 'failed' | 'requires_attention';
  score?: number;
  notes?: string;
  checked_by?: string;
  due_date?: string;
  resolved_at?: string;
}

export interface SessionAttendance {
  id: string;
  teaching_session_id: string;
  student_id: string;
  attendance_status: 'present' | 'absent' | 'late' | 'excused';
  arrival_time?: string;
  departure_time?: string;
  notes?: string;
  recorded_by?: string;
}

export interface ComplianceReport {
  instructor_id: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  total_sessions: number;
  compliant_sessions: number;
  compliance_rate: number;
  hours_logged: number;
  recommendations: string[];
}

export interface LoadBalancingResult {
  current_distribution: InstructorWorkload[];
  recommendations: LoadBalancingRecommendation[];
  optimal_distribution: InstructorWorkload[];
}

export interface LoadBalancingRecommendation {
  type: 'redistribute' | 'hire_more' | 'reduce_load';
  priority: 'high' | 'medium' | 'low';
  message: string;
  affected_instructors: string[];
}
