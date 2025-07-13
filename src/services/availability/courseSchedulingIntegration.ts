import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { AvailabilityConflictService, ConflictResult } from './availabilityConflictService';
import { CourseSchedulingService } from '../courses/courseSchedulingService';

type AvailabilityBooking = Database['public']['Tables']['availability_bookings']['Row'];
type AvailabilityBookingInsert = Database['public']['Tables']['availability_bookings']['Insert'];

export interface CourseSchedulingRequest {
  courseId: string;
  instructorId: string;
  locationId?: string;
  startDateTime: string;
  endDateTime: string;
  title: string;
  description?: string;
}

export interface SchedulingResult {
  success: boolean;
  bookingId?: string;
  conflicts?: ConflictResult;
  message: string;
}

export class CourseSchedulingIntegration {
  /**
   * Schedule a course while checking for availability conflicts
   */
  static async scheduleInstructorForCourse(
    request: CourseSchedulingRequest
  ): Promise<SchedulingResult> {
    try {
      // First, check for conflicts
      const conflictCheck = await AvailabilityConflictService.checkAvailabilityConflicts({
        userId: request.instructorId,
        startTime: request.startDateTime,
        endTime: request.endDateTime,
        bookingType: 'course_instruction'
      });
      
      if (conflictCheck.hasConflicts) {
        // Return conflicts without scheduling
        return {
          success: false,
          conflicts: conflictCheck,
          message: `Scheduling conflicts detected for instructor. ${conflictCheck.conflicts.length} conflict(s) found.`
        };
      }
      
      // No conflicts, proceed with scheduling
      const booking = await this.createAvailabilityBooking({
        user_id: request.instructorId,
        course_id: request.courseId,
        booking_date: request.startDateTime.split('T')[0],
        start_time: request.startDateTime.split('T')[1].slice(0, 8),
        end_time: request.endDateTime.split('T')[1].slice(0, 8),
        booking_type: 'course_instruction',
        title: request.title,
        description: request.description,
        status: 'confirmed'
      });
      
      return {
        success: true,
        bookingId: booking.id,
        message: 'Course scheduled successfully'
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to schedule course: ${error.message}`
      };
    }
  }
  
  /**
   * Create an availability booking for course teaching
   */
  private static async createAvailabilityBooking(
    booking: AvailabilityBookingInsert
  ): Promise<AvailabilityBooking> {
    const { data, error } = await supabase
      .from('availability_bookings')
      .insert(booking)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Find available instructors for a course time slot
   */
  static async findAvailableInstructors(
    courseId: string,
    startDateTime: string,
    endDateTime: string,
    requiredRole: string = 'IN'
  ): Promise<{
    availableInstructors: Array<{
      id: string;
      display_name: string | null;
      role: string;
      available: boolean;
      conflicts?: ConflictResult;
    }>;
  }> {
    // Get all instructors
    const { data: instructors, error } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('role', requiredRole);
    
    if (error) throw error;
    
    const availableInstructors = [];
    
    for (const instructor of instructors || []) {
      const conflictCheck = await AvailabilityConflictService.checkAvailabilityConflicts({
        userId: instructor.id,
        startTime: startDateTime,
        endTime: endDateTime,
        bookingType: 'course_instruction'
      });
      
      availableInstructors.push({
        ...instructor,
        available: !conflictCheck.hasConflicts,
        conflicts: conflictCheck.hasConflicts ? conflictCheck : undefined
      });
    }
    
    return { availableInstructors };
  }
  
  /**
   * Reschedule an existing course booking
   */
  static async rescheduleCourseBooking(
    bookingId: string,
    newStartDateTime: string,
    newEndDateTime: string
  ): Promise<SchedulingResult> {
    try {
      // Get the existing booking
      const { data: booking, error: fetchError } = await supabase
        .from('availability_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Check for conflicts with the new time (excluding the current booking)
      const conflictCheck = await AvailabilityConflictService.checkAvailabilityConflicts({
        userId: booking.user_id,
        startTime: newStartDateTime,
        endTime: newEndDateTime,
        bookingType: booking.booking_type,
        excludeBookingId: bookingId
      });
      
      if (conflictCheck.hasConflicts) {
        return {
          success: false,
          conflicts: conflictCheck,
          message: `Rescheduling conflicts detected. ${conflictCheck.conflicts.length} conflict(s) found.`
        };
      }
      
      // Update the booking
      const { error: updateError } = await supabase
        .from('availability_bookings')
        .update({
          booking_date: newStartDateTime.split('T')[0],
          start_time: newStartDateTime.split('T')[1].slice(0, 8),
          end_time: newEndDateTime.split('T')[1].slice(0, 8),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (updateError) throw updateError;
      
      return {
        success: true,
        bookingId,
        message: 'Course rescheduled successfully'
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to reschedule course: ${error.message}`
      };
    }
  }
  
  /**
   * Cancel a course booking
   */
  static async cancelCourseBooking(bookingId: string): Promise<SchedulingResult> {
    try {
      const { error } = await supabase
        .from('availability_bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      return {
        success: true,
        bookingId,
        message: 'Course booking cancelled successfully'
      };
      
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to cancel course booking: ${error.message}`
      };
    }
  }
  
  /**
   * Get instructor's teaching schedule for a date range
   */
  static async getInstructorSchedule(
    instructorId: string,
    startDate: string,
    endDate: string
  ): Promise<AvailabilityBooking[]> {
    const { data, error } = await supabase
      .from('availability_bookings')
      .select('*')
      .eq('user_id', instructorId)
      .eq('booking_type', 'course_instruction')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate)
      .neq('status', 'cancelled')
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Calculate teaching hours for an instructor in a date range
   */
  static async calculateTeachingHours(
    instructorId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalHours: number;
    scheduledHours: number;
    completedHours: number;
    billableHours: number;
  }> {
    const schedule = await this.getInstructorSchedule(instructorId, startDate, endDate);
    
    let totalHours = 0;
    let scheduledHours = 0;
    let completedHours = 0;
    let billableHours = 0;
    
    for (const booking of schedule) {
      const startTime = new Date(`2000-01-01T${booking.start_time}`);
      const endTime = new Date(`2000-01-01T${booking.end_time}`);
      const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      
      totalHours += hours;
      
      if (booking.status === 'scheduled' || booking.status === 'confirmed') {
        scheduledHours += hours;
      } else if (booking.status === 'completed') {
        completedHours += hours;
      }
      
      if (booking.billable_hours) {
        billableHours += booking.billable_hours;
      }
    }
    
    return {
      totalHours,
      scheduledHours,
      completedHours,
      billableHours
    };
  }
}