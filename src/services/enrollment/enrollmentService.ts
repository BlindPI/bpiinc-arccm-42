
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

export interface EnrollmentWithDetails extends Enrollment {
  profiles?: {
    display_name: string;
    email: string | null;
  };
  course_offerings?: {
    start_date: string;
    end_date: string;
    courses: { name: string };
    locations: { name: string; address: string | null; city: string | null } | null;
  };
}

export class EnrollmentService {
  static async getEnrollmentMetrics(): Promise<EnrollmentMetrics> {
    try {
      // Get total enrollments from student_roster_members
      const { data: enrollments, error } = await supabase
        .from('student_roster_members')
        .select('enrollment_status, enrolled_at');

      if (error) throw error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const totalEnrollments = enrollments?.length || 0;
      const activeEnrollments = enrollments?.filter(e => e.enrollment_status === 'enrolled').length || 0;
      const waitlistCount = enrollments?.filter(e => e.enrollment_status === 'waitlisted').length || 0;
      const completedCount = enrollments?.filter(e => e.enrollment_status === 'completed').length || 0;
      const cancelledCount = enrollments?.filter(e => e.enrollment_status === 'cancelled').length || 0;

      const thisMonthEnrollments = enrollments?.filter(e => 
        new Date(e.enrolled_at) >= thisMonth
      ).length || 0;

      const lastMonthEnrollments = enrollments?.filter(e => {
        const enrollDate = new Date(e.enrolled_at);
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


  static async getFilteredEnrollments(filters: EnrollmentFilters = {}): Promise<EnrollmentWithDetails[]> {
    try {
      // Get enrollments from student_roster_members with student profiles and roster info
      let enrollmentQuery = supabase
        .from('student_roster_members')
        .select(`
          id,
          enrollment_status,
          enrolled_at,
          notes,
          student_enrollment_profiles!inner (
            id,
            display_name,
            email,
            first_name,
            last_name
          ),
          student_rosters!inner (
            id,
            roster_name,
            course_name,
            scheduled_start_date,
            scheduled_end_date
          )
        `)
        .order('enrolled_at', { ascending: false });

      if (filters.status) {
        // Map enrollment statuses
        const statusMap: { [key: string]: string } = {
          'ENROLLED': 'enrolled',
          'WAITLISTED': 'waitlisted', 
          'COMPLETED': 'completed',
          'CANCELLED': 'cancelled'
        };
        const mappedStatus = statusMap[filters.status] || filters.status.toLowerCase();
        enrollmentQuery = enrollmentQuery.eq('enrollment_status', mappedStatus);
      }

      if (filters.dateRange) {
        enrollmentQuery = enrollmentQuery
          .gte('enrolled_at', filters.dateRange.start.toISOString())
          .lte('enrolled_at', filters.dateRange.end.toISOString());
      }

      const { data: rosterMembers, error: enrollmentError } = await enrollmentQuery;
      
      if (enrollmentError) {
        console.error('Error fetching roster members:', enrollmentError);
        throw enrollmentError;
      }

      if (!rosterMembers || rosterMembers.length === 0) {
        return [];
      }

      // Transform roster members into enrollment format
      const enrichedEnrollments: EnrollmentWithDetails[] = rosterMembers.map(member => {
        const statusMap: { [key: string]: 'ENROLLED' | 'WAITLISTED' | 'COMPLETED' | 'CANCELLED' } = {
          'enrolled': 'ENROLLED',
          'waitlisted': 'WAITLISTED',
          'completed': 'COMPLETED',
          'cancelled': 'CANCELLED'
        };

        const typedEnrollment: Enrollment = {
          id: member.id,
          user_id: member.student_enrollment_profiles.id,
          course_offering_id: member.student_rosters.id, // Using roster ID as course offering for now
          status: statusMap[member.enrollment_status] || 'ENROLLED',
          enrollment_date: member.enrolled_at,
          attendance: null,
          attendance_notes: member.notes,
          waitlist_position: null,
          created_at: member.enrolled_at,
          updated_at: member.enrolled_at
        };

        return {
          ...typedEnrollment,
          profiles: {
            display_name: member.student_enrollment_profiles.display_name || 'Unknown',
            email: member.student_enrollment_profiles.email
          },
          course_offerings: {
            start_date: member.student_rosters.scheduled_start_date || '',
            end_date: member.student_rosters.scheduled_end_date || '',
            courses: { name: member.student_rosters.course_name || member.student_rosters.roster_name },
            locations: null
          }
        };
      });

      return enrichedEnrollments;
      
    } catch (error) {
      console.error('Error fetching filtered enrollments:', error);
      throw error;
    }
  }

  static async approveEnrollment(enrollmentId: string, approvedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('student_roster_members')
        .update({
          enrollment_status: 'enrolled',
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      // Get enrollment details for notification
      const { data: enrollment } = await supabase
        .from('student_roster_members')
        .select(`
          student_profile_id,
          student_rosters(
            course_name,
            roster_name
          )
        `)
        .eq('id', enrollmentId)
        .single();

      if (enrollment) {
        await supabase.from('notifications').insert([{
          user_id: enrollment.student_profile_id,
          title: 'Enrollment Approved',
          message: `Your enrollment has been approved for ${enrollment.student_rosters?.course_name || enrollment.student_rosters?.roster_name}`,
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
        .from('student_roster_members')
        .update({
          enrollment_status: 'cancelled',
          notes: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', enrollmentId);

      if (error) throw error;

      // Get enrollment details for notification
      const { data: enrollment } = await supabase
        .from('student_roster_members')
        .select(`
          student_profile_id,
          student_rosters(
            course_name,
            roster_name
          )
        `)
        .eq('id', enrollmentId)
        .single();

      if (enrollment) {
        await supabase.from('notifications').insert([{
          user_id: enrollment.student_profile_id,
          title: 'Enrollment Update',
          message: `Your enrollment for ${enrollment.student_rosters?.course_name || enrollment.student_rosters?.roster_name} has been updated. Reason: ${reason}`,
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

  static async promoteFromWaitlist(rosterId: string): Promise<void> {
    try {
      // Find the first waitlisted student in the roster
      const { data: waitlistedStudent, error: waitlistError } = await supabase
        .from('student_roster_members')
        .select('*')
        .eq('roster_id', rosterId)
        .eq('enrollment_status', 'waitlisted')
        .order('enrolled_at', { ascending: true })
        .limit(1)
        .single();

      if (waitlistError || !waitlistedStudent) return;

      // Check if there's space available in the roster
      const { data: roster } = await supabase
        .from('student_rosters')
        .select('max_capacity')
        .eq('id', rosterId)
        .single();

      const { count: enrolledCount } = await supabase
        .from('student_roster_members')
        .select('*', { count: 'exact', head: true })
        .eq('roster_id', rosterId)
        .eq('enrollment_status', 'enrolled');

      if (enrolledCount && roster && enrolledCount < roster.max_capacity) {
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
