import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type UserAvailability = Database['public']['Tables']['user_availability']['Row'];
type AvailabilityException = Database['public']['Tables']['availability_exceptions']['Row'];
type AvailabilityBooking = Database['public']['Tables']['availability_bookings']['Row'];
type BookingType = Database['public']['Enums']['booking_type'];
type AvailabilityType = Database['public']['Enums']['availability_type'];
type DayOfWeek = Database['public']['Enums']['day_of_week'];

export interface ConflictCheck {
  userId: string;
  startTime: string;
  endTime: string;
  bookingType?: BookingType;
  excludeBookingId?: string;
}

export interface AvailabilityConflict {
  type: 'availability' | 'booking' | 'exception';
  conflictWith: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  suggestedAlternatives?: TimeSlot[];
}

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  conflictReason?: string;
}

export interface ConflictResult {
  hasConflicts: boolean;
  conflicts: AvailabilityConflict[];
  suggestedTimes?: TimeSlot[];
}

export class AvailabilityConflictService {
  /**
   * Check for conflicts when scheduling a new booking
   */
  static async checkAvailabilityConflicts(conflictCheck: ConflictCheck): Promise<ConflictResult> {
    const { userId, startTime, endTime, bookingType, excludeBookingId } = conflictCheck;
    
    const conflicts: AvailabilityConflict[] = [];
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    // Check against user's regular availability
    const availabilityConflicts = await this.checkRegularAvailability(userId, startDate, endDate);
    conflicts.push(...availabilityConflicts);
    
    // Check against existing bookings
    const bookingConflicts = await this.checkBookingConflicts(userId, startTime, endTime, excludeBookingId);
    conflicts.push(...bookingConflicts);
    
    // Check against availability exceptions
    const exceptionConflicts = await this.checkExceptionConflicts(userId, startDate, endDate);
    conflicts.push(...exceptionConflicts);
    
    // Generate suggested alternatives if conflicts exist
    let suggestedTimes: TimeSlot[] | undefined;
    if (conflicts.length > 0) {
      suggestedTimes = await this.generateAlternativeTimeSlots(userId, startDate, endDate);
    }
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      suggestedTimes
    };
  }
  
  /**
   * Check against user's regular weekly availability
   */
  private static async checkRegularAvailability(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<AvailabilityConflict[]> {
    const dayOfWeek = startDate.getDay().toString() as DayOfWeek;
    const startTime = startDate.toTimeString().slice(0, 8);
    const endTime = endDate.toTimeString().slice(0, 8);
    
    const { data: availability, error } = await supabase
      .from('user_availability')
      .select('*')
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)
      .eq('availability_type', 'available');
    
    if (error) throw error;
    
    const conflicts: AvailabilityConflict[] = [];
    
    if (!availability || availability.length === 0) {
      conflicts.push({
        type: 'availability',
        conflictWith: 'User not available on this day',
        reason: `User is not available on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][startDate.getDay()]}`,
        severity: 'high'
      });
    } else {
      // Check if time falls within available hours
      const isWithinAvailableHours = availability.some(slot => 
        slot.start_time <= startTime && slot.end_time >= endTime
      );
      
      if (!isWithinAvailableHours) {
        conflicts.push({
          type: 'availability',
          conflictWith: 'Outside available hours',
          reason: `Requested time ${startTime}-${endTime} is outside user's available hours`,
          severity: 'high'
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * Check against existing bookings
   */
  private static async checkBookingConflicts(
    userId: string, 
    startTime: string, 
    endTime: string,
    excludeBookingId?: string
  ): Promise<AvailabilityConflict[]> {
    const bookingDate = startTime.split('T')[0];
    const requestStartTime = startTime.split('T')[1]?.slice(0, 8) || '00:00:00';
    const requestEndTime = endTime.split('T')[1]?.slice(0, 8) || '23:59:59';

    let query = supabase
      .from('availability_bookings')
      .select('*')
      .eq('user_id', userId)
      .eq('booking_date', bookingDate)
      .neq('status', 'cancelled');
    
    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }
    
    const { data: bookings, error } = await query;
    
    if (error) throw error;
    
    const conflicts: AvailabilityConflict[] = [];
    
    for (const booking of bookings || []) {
      // Check for time overlap
      if (booking.start_time < requestEndTime && booking.end_time > requestStartTime) {
        conflicts.push({
          type: 'booking',
          conflictWith: booking.title,
          reason: `Overlaps with existing booking: ${booking.title}`,
          severity: 'high'
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * Check against availability exceptions
   */
  private static async checkExceptionConflicts(
    userId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<AvailabilityConflict[]> {
    const date = startDate.toISOString().split('T')[0];
    
    const { data: exceptions, error } = await supabase
      .from('availability_exceptions')
      .select('*')
      .eq('user_id', userId)
      .eq('exception_date', date);
    
    if (error) throw error;
    
    const conflicts: AvailabilityConflict[] = [];
    
    for (const exception of exceptions || []) {
      if (exception.availability_type === 'out_of_office') {
        if (!exception.start_time || !exception.end_time) {
          // All-day unavailable
          conflicts.push({
            type: 'exception',
            conflictWith: 'Unavailable exception',
            reason: `User is unavailable all day: ${exception.reason || 'No reason provided'}`,
            severity: 'high'
          });
        } else {
          // Check time overlap
          const exceptionStart = exception.start_time;
          const exceptionEnd = exception.end_time;
          const requestStart = startDate.toTimeString().slice(0, 8);
          const requestEnd = endDate.toTimeString().slice(0, 8);
          
          if (exceptionStart < requestEnd && exceptionEnd > requestStart) {
            conflicts.push({
              type: 'exception',
              conflictWith: 'Unavailable exception',
              reason: `User is unavailable during this time: ${exception.reason || 'No reason provided'}`,
              severity: 'high'
            });
          }
        }
      }
    }
    
    return conflicts;
  }
  
  /**
   * Generate alternative time slots when conflicts exist
   */
  private static async generateAlternativeTimeSlots(
    userId: string, 
    requestedStart: Date, 
    requestedEnd: Date
  ): Promise<TimeSlot[]> {
    const alternatives: TimeSlot[] = [];
    const duration = requestedEnd.getTime() - requestedStart.getTime();
    
    // Check same day, different times
    const dayStart = new Date(requestedStart);
    dayStart.setHours(8, 0, 0, 0);
    
    const dayEnd = new Date(requestedStart);
    dayEnd.setHours(18, 0, 0, 0);
    
    for (let time = dayStart.getTime(); time <= dayEnd.getTime() - duration; time += 30 * 60 * 1000) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time + duration);
      
      const conflict = await this.checkAvailabilityConflicts({
        userId,
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString()
      });
      
      if (!conflict.hasConflicts) {
        alternatives.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: true
        });
        
        if (alternatives.length >= 3) break; // Limit to 3 suggestions
      }
    }
    
    return alternatives;
  }
  
  /**
   * Get available time slots for a user on a specific date
   */
  static async getAvailableTimeSlots(
    userId: string, 
    date: Date, 
    durationMinutes: number = 60
  ): Promise<TimeSlot[]> {
    const slots: TimeSlot[] = [];
    const dayOfWeek = date.getDay().toString() as DayOfWeek;
    
    // Get user's availability for this day
    const { data: availability, error } = await supabase
      .from('user_availability')
      .select('*')
      .eq('user_id', userId)
      .eq('day_of_week', dayOfWeek)
      .eq('availability_type', 'available');
    
    if (error || !availability || availability.length === 0) {
      return slots;
    }
    
    // For each availability slot, generate time slots
    for (const avail of availability) {
      const startTime = avail.start_time;
      const endTime = avail.end_time;
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const slotStart = new Date(date);
      slotStart.setHours(startHour, startMin, 0, 0);
      
      const slotEnd = new Date(date);
      slotEnd.setHours(endHour, endMin, 0, 0);
      
      // Generate slots of specified duration
      for (let time = slotStart.getTime(); time < slotEnd.getTime() - (durationMinutes * 60 * 1000); time += 30 * 60 * 1000) {
        const currentSlotStart = new Date(time);
        const currentSlotEnd = new Date(time + (durationMinutes * 60 * 1000));
        
        const conflict = await this.checkAvailabilityConflicts({
          userId,
          startTime: currentSlotStart.toISOString(),
          endTime: currentSlotEnd.toISOString()
        });
        
        slots.push({
          start: currentSlotStart.toISOString(),
          end: currentSlotEnd.toISOString(),
          available: !conflict.hasConflicts,
          conflictReason: conflict.hasConflicts ? conflict.conflicts[0]?.reason : undefined
        });
      }
    }
    
    return slots;
  }
}