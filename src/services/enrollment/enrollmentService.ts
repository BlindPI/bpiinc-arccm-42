
import { supabase } from '@/integrations/supabase/client';
import type { Enrollment, EnrollmentInsert } from '@/types/enrollment';
import { RosterEnrollmentService } from './rosterEnrollmentService';
import {
  RosterCapacityInfo,
  CapacityValidationResult,
  WaitlistPromotionResult
} from '@/types/roster-enrollment';
import { DatabaseUserRole } from '@/types/database-roles';

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

  static async promoteFromWaitlist(
    rosterId: string,
    promotedBy: string = 'system',
    userRole: DatabaseUserRole = 'ADMIN',
    maxPromotions: number = 1
  ): Promise<WaitlistPromotionResult> {
    try {
      // Use the new RosterEnrollmentService for capacity-aware waitlist promotion
      return await RosterEnrollmentService.promoteFromWaitlist({
        rosterId,
        promotedBy,
        userRole,
        maxPromotions
      });
    } catch (error) {
      console.error('Error promoting from waitlist:', error);
      throw error;
    }
  }

  /**
   * Enhanced waitlist promotion with detailed results
   * @deprecated Use promoteFromWaitlist instead
   */
  static async promoteFromWaitlistLegacy(rosterId: string): Promise<void> {
    try {
      const result = await this.promoteFromWaitlist(rosterId, 'system', 'ADMIN', 1);
      if (!result.success && result.error) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error promoting from waitlist (legacy):', error);
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
  /**
   * Check roster capacity status using the new capacity validation system
   */
  static async checkRosterCapacityStatus(
    rosterId: string,
    additionalStudents: number = 0,
    includeWaitlist: boolean = true
  ): Promise<CapacityValidationResult> {
    try {
      return await RosterEnrollmentService.checkRosterCapacityStatus({
        rosterId,
        additionalStudents,
        includeWaitlist
      });
    } catch (error) {
      console.error('Error checking roster capacity:', error);
      throw error;
    }
  }

  /**
   * Get basic capacity information for a roster
   */
  static async getRosterCapacityInfo(rosterId: string): Promise<RosterCapacityInfo> {
    try {
      const result = await this.checkRosterCapacityStatus(rosterId, 0, false);
      return result.capacity;
    } catch (error) {
      console.error('Error getting roster capacity info:', error);
      throw error;
    }
  }

  /**
   * Check if a roster can accommodate additional students
   */
  static async canEnrollStudents(rosterId: string, studentCount: number = 1): Promise<boolean> {
    try {
      const capacityInfo = await this.getRosterCapacityInfo(rosterId);
      return capacityInfo.can_enroll && (
        capacityInfo.available_spots === null ||
        capacityInfo.available_spots >= studentCount
      );
    } catch (error) {
      console.error('Error checking enrollment capacity:', error);
      return false;
    }
  }

  /**
   * Get detailed roster capacity metrics for analytics
   */
  static async getRosterCapacityMetrics(rosterId?: string): Promise<{
    totalRosters: number;
    rostersWithCapacity: number;
    averageUtilization: number;
    fullRosters: number;
    nearlyFullRosters: number;
    rosterDetails?: CapacityValidationResult;
  }> {
    try {
      if (rosterId) {
        // Get specific roster details
        const rosterDetails = await this.checkRosterCapacityStatus(rosterId, 0, true);
        
        return {
          totalRosters: 1,
          rostersWithCapacity: rosterDetails.capacity.max_capacity ? 1 : 0,
          averageUtilization: rosterDetails.capacity.max_capacity
            ? (rosterDetails.capacity.current_enrollment / rosterDetails.capacity.max_capacity) * 100
            : 0,
          fullRosters: rosterDetails.capacity.available_spots === 0 ? 1 : 0,
          nearlyFullRosters: rosterDetails.warnings.some(w => w.includes('nearly full')) ? 1 : 0,
          rosterDetails
        };
      }

      // Get capacity status for all rosters using the database view
      const capacityStatuses = await RosterEnrollmentService.getRosterCapacityStatusView();
      
      const totalRosters = capacityStatuses.length;
      const rostersWithCapacity = capacityStatuses.filter(r => r.max_capacity !== null).length;
      const fullRosters = capacityStatuses.filter(r => r.capacity_status === 'FULL').length;
      const nearlyFullRosters = capacityStatuses.filter(r => r.capacity_status === 'NEARLY_FULL').length;
      
      const utilizationSum = capacityStatuses
        .filter(r => r.utilization_percentage !== null)
        .reduce((sum, r) => sum + (r.utilization_percentage || 0), 0);
      
      const averageUtilization = rostersWithCapacity > 0
        ? utilizationSum / rostersWithCapacity
        : 0;

      return {
        totalRosters,
        rostersWithCapacity,
        averageUtilization,
        fullRosters,
        nearlyFullRosters
      };
    } catch (error) {
      console.error('Error getting roster capacity metrics:', error);
      throw error;
    }
  }

  /**
   * Auto-promote eligible students from waitlists across all rosters
   */
  static async autoPromoteFromWaitlists(
    promotedBy: string = 'system',
    userRole: DatabaseUserRole = 'ADMIN',
    maxPromotionsPerRoster: number = 5
  ): Promise<{
    success: boolean;
    totalPromoted: number;
    rosterResults: Array<{
      rosterId: string;
      rosterName: string;
      promoted: number;
      error?: string;
    }>;
  }> {
    try {
      // Get all rosters with available capacity and waitlisted students
      const { data: rostersWithWaitlist, error } = await supabase
        .from('student_rosters')
        .select(`
          id,
          roster_name,
          max_capacity,
          current_enrollment
        `)
        .not('max_capacity', 'is', null)
        .gt('max_capacity', supabase.sql`current_enrollment`);

      if (error) throw error;

      const results = [];
      let totalPromoted = 0;

      for (const roster of rostersWithWaitlist || []) {
        try {
          const availableSpots = (roster.max_capacity || 0) - (roster.current_enrollment || 0);
          const maxToPromote = Math.min(maxPromotionsPerRoster, availableSpots);

          if (maxToPromote > 0) {
            const promotionResult = await this.promoteFromWaitlist(
              roster.id,
              promotedBy,
              userRole,
              maxToPromote
            );

            results.push({
              rosterId: roster.id,
              rosterName: roster.roster_name,
              promoted: promotionResult.promotedCount,
              error: promotionResult.success ? undefined : promotionResult.error
            });

            totalPromoted += promotionResult.promotedCount;
          } else {
            results.push({
              rosterId: roster.id,
              rosterName: roster.roster_name,
              promoted: 0
            });
          }
        } catch (rosterError: any) {
          results.push({
            rosterId: roster.id,
            rosterName: roster.roster_name,
            promoted: 0,
            error: rosterError.message
          });
        }
      }

      return {
        success: true,
        totalPromoted,
        rosterResults: results
      };
    } catch (error: any) {
      console.error('Error in auto-promote from waitlists:', error);
      return {
        success: false,
        totalPromoted: 0,
        rosterResults: [],
      };
    }
  }
}
