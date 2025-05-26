
import { supabase } from '@/integrations/supabase/client';
import type { Enrollment, EnrollmentInsert } from '@/types/enrollment';

export interface EnrollmentMetrics {
  totalEnrollments: number;
  activeEnrollments: number;
  waitlistCount: number;
  completedCount: number;
  cancelledCount: number;
  enrollmentTrends: {
    thisMonth: number;
    lastMonth: number;
    percentageChange: number;
  };
}

export interface EnrollmentFilters {
  status?: string;
  courseOfferingId?: string;
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class EnrollmentService {
  static async getEnrollmentMetrics(): Promise<EnrollmentMetrics> {
    try {
      // Get total enrollments by status
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select('status, enrollment_date');

      if (error) throw error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const totalEnrollments = enrollments?.length || 0;
      const activeEnrollments = enrollments?.filter(e => e.status === 'ENROLLED').length || 0;
      const waitlistCount = enrollments?.filter(e => e.status === 'WAITLISTED').length || 0;
      const completedCount = enrollments?.filter(e => e.status === 'COMPLETED').length || 0;
      const cancelledCount = enrollments?.filter(e => e.status === 'CANCELLED').length || 0;

      const thisMonthEnrollments = enrollments?.filter(e => 
        new Date(e.enrollment_date) >= thisMonth
      ).length || 0;

      const lastMonthEnrollments = enrollments?.filter(e => {
        const enrollDate = new Date(e.enrollment_date);
        return enrollDate >= lastMonth && enrollDate < thisMonth;
      }).length || 0;

      const percentageChange = lastMonthEnrollments > 0 
        ? ((thisMonthEnrollments - lastMonthEnrollments) / lastMonthEnrollments) * 100 
        : 0;

      return {
        totalEnrollments,
        activeEnrollments,
        waitlistCount,
        completedCount,
        cancelledCount,
        enrollmentTrends: {
          thisMonth: thisMonthEnrollments,
          lastMonth: lastMonthEnrollments,
          percentageChange
        }
      };
    } catch (error) {
      console.error('Error fetching enrollment metrics:', error);
      throw error;
    }
  }

  static async getFilteredEnrollments(filters: EnrollmentFilters = {}) {
    try {
      let query = supabase
        .from('enrollments')
        .select(`
          *,
          profiles:user_id(display_name, email),
          course_offerings:course_offering_id(
            start_date,
            end_date,
            max_participants,
            courses:course_id(name),
            locations:location_id(name, city)
          )
        `)
        .order('enrollment_date', { ascending: false });

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.courseOfferingId) {
        query = query.eq('course_offering_id', filters.courseOfferingId);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.dateRange) {
        query = query
          .gte('enrollment_date', filters.dateRange.start.toISOString())
          .lte('enrollment_date', filters.dateRange.end.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching filtered enrollments:', error);
      throw error;
    }
  }

  static async approveEnrollment(enrollmentId: string, approvedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          status: 'ENROLLED',
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      // Create notification for the user
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('user_id, course_offerings:course_offering_id(courses:course_id(name))')
        .eq('id', enrollmentId)
        .single();

      if (enrollment) {
        await supabase.from('notifications').insert([{
          user_id: enrollment.user_id,
          title: 'Enrollment Approved',
          message: `Your enrollment has been approved for ${enrollment.course_offerings?.courses?.name}`,
          type: 'SUCCESS',
          category: 'COURSE',
          priority: 'HIGH'
        }]);
      }
    } catch (error) {
      console.error('Error approving enrollment:', error);
      throw error;
    }
  }

  static async rejectEnrollment(enrollmentId: string, reason: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('enrollments')
        .update({
          status: 'CANCELLED',
          attendance_notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      // Create notification for the user
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('user_id, course_offerings:course_offering_id(courses:course_id(name))')
        .eq('id', enrollmentId)
        .single();

      if (enrollment) {
        await supabase.from('notifications').insert([{
          user_id: enrollment.user_id,
          title: 'Enrollment Update',
          message: `Your enrollment for ${enrollment.course_offerings?.courses?.name} has been updated. Reason: ${reason}`,
          type: 'INFO',
          category: 'COURSE',
          priority: 'NORMAL'
        }]);
      }
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
      throw error;
    }
  }

  static async promoteFromWaitlist(courseOfferingId: string): Promise<void> {
    try {
      // Find the first waitlisted student
      const { data: waitlistedStudent, error: waitlistError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_offering_id', courseOfferingId)
        .eq('status', 'WAITLISTED')
        .order('waitlist_position', { ascending: true })
        .limit(1)
        .single();

      if (waitlistError || !waitlistedStudent) return;

      // Check if there's space available
      const { data: offering } = await supabase
        .from('course_offerings')
        .select('max_participants')
        .eq('id', courseOfferingId)
        .single();

      const { count: enrolledCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_offering_id', courseOfferingId)
        .eq('status', 'ENROLLED');

      if (enrolledCount && offering && enrolledCount < offering.max_participants) {
        await this.approveEnrollment(waitlistedStudent.id, 'system');
      }
    } catch (error) {
      console.error('Error promoting from waitlist:', error);
      throw error;
    }
  }

  static async exportEnrollmentData(filters: EnrollmentFilters = {}): Promise<Blob> {
    try {
      const enrollments = await this.getFilteredEnrollments(filters);
      
      const csvContent = [
        ['ID', 'Student Name', 'Email', 'Course', 'Status', 'Enrollment Date', 'Attendance'],
        ...enrollments.map(enrollment => [
          enrollment.id,
          enrollment.profiles?.display_name || 'Unknown',
          enrollment.profiles?.email || 'No email',
          enrollment.course_offerings?.courses?.name || 'Unknown Course',
          enrollment.status,
          new Date(enrollment.enrollment_date).toLocaleDateString(),
          enrollment.attendance || 'Not marked'
        ])
      ].map(row => row.join(',')).join('\n');

      return new Blob([csvContent], { type: 'text/csv' });
    } catch (error) {
      console.error('Error exporting enrollment data:', error);
      throw error;
    }
  }
}
