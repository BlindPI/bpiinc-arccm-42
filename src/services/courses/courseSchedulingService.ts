
import { supabase } from '@/integrations/supabase/client';

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
  [key: string]: any;
}

export interface ConflictResult {
  conflict_id: string;
  conflict_start: string;
  conflict_end: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

export interface EnrollmentResult {
  success: boolean;
  message: string;
  enrollment?: any;
}

export class CourseSchedulingService {
  static async createSchedule(schedule: Partial<CourseSchedule>): Promise<CourseSchedule> {
    const { data, error } = await supabase
      .from('course_schedules')
      .insert({
        course_id: schedule.course_id,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        max_capacity: schedule.max_capacity || 40,
        instructor_id: schedule.instructor_id,
        location_id: schedule.location_id,
        status: schedule.status || 'scheduled',
        recurring_pattern: schedule.recurring_pattern as any
      })
      .select()
      .single();

    if (error) throw error;
    return data as CourseSchedule;
  }

  static async getCourseSchedules(courseId?: string): Promise<CourseSchedule[]> {
    let query = supabase
      .from('course_schedules')
      .select('*');
    
    if (courseId) {
      query = query.eq('course_id', courseId);
    }
    
    const { data, error } = await query.order('start_date', { ascending: true });

    if (error) throw error;
    return (data || []) as CourseSchedule[];
  }

  static async checkScheduleConflicts(
    instructorId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ConflictResult[]> {
    const { data, error } = await supabase
      .rpc('check_schedule_conflicts', {
        p_instructor_id: instructorId,
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) throw error;
    return data || [];
  }

  static async enrollStudent(scheduleId: string, studentId: string): Promise<EnrollmentResult> {
    try {
      // Check capacity first
      const { data: schedule, error: scheduleError } = await supabase
        .from('course_schedules')
        .select('max_capacity, current_enrollment')
        .eq('id', scheduleId)
        .single();

      if (scheduleError) throw scheduleError;

      if (schedule.current_enrollment >= schedule.max_capacity) {
        return {
          success: false,
          message: 'Course schedule is at full capacity'
        };
      }

      // Enroll student
      const { data, error } = await supabase
        .from('course_enrollments')
        .insert({
          course_schedule_id: scheduleId,
          user_id: studentId,
          status: 'enrolled'
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Student enrolled successfully',
        enrollment: data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  static async getAvailableSlots(
    instructorId: string, 
    date: Date
  ): Promise<TimeSlot[]> {
    // Get existing schedules for the instructor on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existingSchedules, error } = await supabase
      .from('course_schedules')
      .select('start_date, end_date')
      .eq('instructor_id', instructorId)
      .gte('start_date', startOfDay.toISOString())
      .lte('end_date', endOfDay.toISOString());

    if (error) throw error;

    // Generate available time slots (simplified - 9 AM to 5 PM)
    const slots: TimeSlot[] = [];
    for (let hour = 9; hour < 17; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      const isAvailable = !existingSchedules?.some(schedule => {
        const scheduleStart = new Date(schedule.start_date);
        const scheduleEnd = new Date(schedule.end_date);
        return slotStart < scheduleEnd && slotEnd > scheduleStart;
      });

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: isAvailable
      });
    }

    return slots;
  }
}
