
import { supabase } from '@/integrations/supabase/client';
import type { 
  CourseSchedule, 
  ConflictResult, 
  TimeSlot, 
  EnrollmentResult, 
  RecurringPattern,
  ScheduleFormData 
} from '@/types/courseScheduling';

export class CourseSchedulingService {
  static async createSchedule(scheduleData: ScheduleFormData): Promise<CourseSchedule> {
    console.log('Creating course schedule:', scheduleData);
    
    // Check for conflicts before creating
    const conflicts = await this.checkScheduleConflicts(
      scheduleData.instructor_id,
      scheduleData.start_date,
      scheduleData.end_date
    );

    if (conflicts.length > 0) {
      throw new Error(`Schedule conflicts detected: ${conflicts.map(c => c.message).join(', ')}`);
    }

    const { data, error } = await supabase
      .from('course_schedules')
      .insert({
        course_id: scheduleData.course_id,
        instructor_id: scheduleData.instructor_id,
        location_id: scheduleData.location_id,
        start_date: scheduleData.start_date,
        end_date: scheduleData.end_date,
        max_capacity: scheduleData.max_capacity,
        recurring_pattern: scheduleData.recurring_pattern as any, // Cast to Json type
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course schedule:', error);
      throw error;
    }

    return this.transformDatabaseSchedule(data);
  }

  static async checkScheduleConflicts(
    instructorId: string,
    startDate: string,
    endDate: string
  ): Promise<ConflictResult[]> {
    console.log('Checking schedule conflicts for instructor:', instructorId);
    
    const conflicts: ConflictResult[] = [];

    // Check instructor conflicts
    const { data: instructorConflicts, error } = await supabase
      .from('course_schedules')
      .select('id, start_date, end_date, status')
      .eq('instructor_id', instructorId)
      .in('status', ['scheduled', 'in_progress'])
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (error) {
      console.error('Error checking instructor conflicts:', error);
      throw error;
    }

    if (instructorConflicts && instructorConflicts.length > 0) {
      instructorConflicts.forEach(conflict => {
        conflicts.push({
          id: conflict.id,
          conflictType: 'instructor',
          message: 'Instructor has conflicting schedule',
          startDate: conflict.start_date,
          endDate: conflict.end_date
        });
      });
    }

    return conflicts;
  }

  static async getAvailableSlots(
    instructorId: string,
    date: string
  ): Promise<TimeSlot[]> {
    console.log('Getting available slots for instructor:', instructorId, 'on date:', date);
    
    // Get existing schedules for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existingSchedules, error } = await supabase
      .from('course_schedules')
      .select('start_date, end_date')
      .eq('instructor_id', instructorId)
      .gte('start_date', startOfDay.toISOString())
      .lte('end_date', endOfDay.toISOString())
      .in('status', ['scheduled', 'in_progress']);

    if (error) {
      console.error('Error getting existing schedules:', error);
      throw error;
    }

    // Generate time slots (simplified - 9 AM to 5 PM, 1-hour slots)
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
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: isAvailable,
        conflictReason: isAvailable ? undefined : 'Instructor already scheduled'
      });
    }

    return slots;
  }

  static async enrollStudent(scheduleId: string, studentId: string): Promise<EnrollmentResult> {
    console.log('Enrolling student:', studentId, 'in schedule:', scheduleId);
    
    // Get schedule info
    const { data: schedule, error: scheduleError } = await supabase
      .from('course_schedules')
      .select('max_capacity, current_enrollment')
      .eq('id', scheduleId)
      .single();

    if (scheduleError) {
      console.error('Error getting schedule:', scheduleError);
      throw scheduleError;
    }

    if (!schedule) {
      return {
        success: false,
        message: 'Schedule not found'
      };
    }

    // Check if student is already enrolled
    const { data: existingEnrollment } = await supabase
      .from('course_enrollments')
      .select('id, status')
      .eq('course_schedule_id', scheduleId)
      .eq('user_id', studentId)
      .single();

    if (existingEnrollment) {
      return {
        success: false,
        message: 'Student already enrolled in this course'
      };
    }

    // Determine enrollment status
    const isWaitlisted = schedule.current_enrollment >= schedule.max_capacity;
    const status = isWaitlisted ? 'waitlisted' : 'enrolled';

    // Get waitlist position if needed
    let waitlistPosition;
    if (isWaitlisted) {
      const { count } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_schedule_id', scheduleId)
        .eq('status', 'waitlisted');
      
      waitlistPosition = (count || 0) + 1;
    }

    // Create enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: studentId,
        course_schedule_id: scheduleId,
        status,
        waitlist_position: waitlistPosition
      })
      .select()
      .single();

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      throw enrollmentError;
    }

    // Update current enrollment count if not waitlisted
    if (!isWaitlisted) {
      await supabase
        .from('course_schedules')
        .update({ current_enrollment: schedule.current_enrollment + 1 })
        .eq('id', scheduleId);
    }

    return {
      success: true,
      enrollmentId: enrollment.id,
      waitlistPosition,
      message: isWaitlisted 
        ? `Added to waitlist at position ${waitlistPosition}` 
        : 'Successfully enrolled'
    };
  }

  static async generateRecurringSchedules(
    baseSchedule: CourseSchedule,
    pattern: RecurringPattern
  ): Promise<CourseSchedule[]> {
    console.log('Generating recurring schedules:', pattern);
    
    const schedules: CourseSchedule[] = [];
    const startDate = new Date(baseSchedule.start_date);
    const endDate = new Date(baseSchedule.end_date);
    const patternEndDate = pattern.endDate ? new Date(pattern.endDate) : new Date();
    patternEndDate.setMonth(patternEndDate.getMonth() + 6); // Default 6 months if no end date

    let currentDate = new Date(startDate);
    
    while (currentDate <= patternEndDate) {
      // Calculate next occurrence based on pattern
      switch (pattern.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + pattern.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (pattern.interval * 7));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + pattern.interval);
          break;
      }

      if (currentDate <= patternEndDate) {
        const duration = endDate.getTime() - startDate.getTime();
        const newEndDate = new Date(currentDate.getTime() + duration);

        const newScheduleData: ScheduleFormData = {
          course_id: baseSchedule.course_id,
          instructor_id: baseSchedule.instructor_id || '',
          location_id: baseSchedule.location_id || '',
          start_date: currentDate.toISOString(),
          end_date: newEndDate.toISOString(),
          max_capacity: baseSchedule.max_capacity,
          recurring_pattern: pattern
        };

        try {
          const newSchedule = await this.createSchedule(newScheduleData);
          schedules.push(newSchedule);
        } catch (error) {
          console.warn('Skipping conflicting recurring schedule:', error);
        }
      }
    }

    return schedules;
  }

  static async getCourseSchedules(courseId?: string): Promise<CourseSchedule[]> {
    console.log('Getting course schedules for course:', courseId);
    
    let query = supabase
      .from('course_schedules')
      .select(`
        *,
        courses!inner(name),
        profiles!course_schedules_instructor_id_fkey(display_name),
        locations(name)
      `)
      .order('start_date', { ascending: true });

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting course schedules:', error);
      throw error;
    }

    return (data || []).map(item => this.transformDatabaseSchedule(item));
  }

  // Helper method to transform database response to CourseSchedule
  private static transformDatabaseSchedule(dbSchedule: any): CourseSchedule {
    return {
      id: dbSchedule.id,
      course_id: dbSchedule.course_id,
      start_date: dbSchedule.start_date,
      end_date: dbSchedule.end_date,
      max_capacity: dbSchedule.max_capacity || 40,
      current_enrollment: dbSchedule.current_enrollment || 0,
      instructor_id: dbSchedule.instructor_id,
      location_id: dbSchedule.location_id,
      status: dbSchedule.status as CourseSchedule['status'],
      recurring_pattern: dbSchedule.recurring_pattern ? 
        dbSchedule.recurring_pattern as RecurringPattern : null,
      created_at: dbSchedule.created_at,
      updated_at: dbSchedule.updated_at
    };
  }
}
