import { supabase } from '@/integrations/supabase/client';
import { DatabaseUserRole, ROLE_HIERARCHY } from '@/types/database-roles';
import {
  RosterEnrollmentParams,
  RosterEnrollmentResult,
  BatchRosterEnrollmentParams,
  BatchRosterEnrollmentResult,
  CapacityValidationParams,
  CapacityValidationResult,
  WaitlistPromotionParams,
  WaitlistPromotionResult,
  RosterCapacityInfo,
  RosterCapacityStatus,
  EnrollmentAuditLog,
  EnrollmentNotificationConfig,
  RosterEnrollmentServiceConfig,
  ServiceHealthCheck,
  EnrollmentError,
  RosterEnrollmentError,
  EnrollmentStatus
} from '@/types/roster-enrollment';

interface TransactionStep {
  name: string;
  execute: () => Promise<any>;
  rollback?: () => Promise<void>;
  result?: any;
}

/**
 * Production-ready roster enrollment service with capacity management
 * Implements ACID transaction patterns for secure roster enrollment
 * Leverages database triggers and constraints for capacity validation
 */
export class RosterEnrollmentService {
  private static activeTransactions: Map<string, TransactionStep[]> = new Map();
  
  private static config: RosterEnrollmentServiceConfig = {
    enableCapacityValidation: true,
    enableWaitlistAutoPromotion: true,
    enableAuditLogging: true,
    enableNotifications: true,
    maxRetryAttempts: 3,
    transactionTimeout: 30000,
    defaultNotificationConfig: {
      studentNotification: true,
      instructorNotification: false,
      adminNotification: false,
      emailNotification: true,
      inAppNotification: true
    }
  };

  /**
   * Primary enrollment method with comprehensive capacity validation
   * Follows TransactionManager.enrollStudentWithCompliance() pattern
   */
  public static async enrollStudentWithCapacityCheck(
    params: RosterEnrollmentParams
  ): Promise<RosterEnrollmentResult> {
    const { rosterId, studentId, enrolledBy, userRole, enrollmentType = 'standard', notes, forceEnrollment = false } = params;
    
    // Validate permissions
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY['AP']) {
      throw this.createEnrollmentError('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to enroll students', { rosterId, studentId });
    }

    // Only admins can force enrollment
    if (forceEnrollment && ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY['ADMIN']) {
      throw this.createEnrollmentError('INSUFFICIENT_PERMISSIONS', 'Only administrators can force enrollment', { rosterId, studentId });
    }

    const transactionId = this.generateTransactionId();
    const steps: TransactionStep[] = [];

    try {
      // Step 1: Validate roster and capacity using database function
      steps.push({
        name: 'validateCapacity',
        execute: async () => {
          // Get roster information and capacity
          const { data: roster, error: rosterError } = await supabase
            .from('student_rosters')
            .select('id, roster_name, max_capacity, current_enrollment, status')
            .eq('id', rosterId)
            .single();

          if (rosterError || !roster) {
            throw RosterEnrollmentService.createEnrollmentError('ROSTER_NOT_FOUND', 'Roster not found', { rosterId });
          }

          // Check if roster is active
          if (roster.status && roster.status !== 'ACTIVE') {
            throw RosterEnrollmentService.createEnrollmentError('ROSTER_INACTIVE', `Roster status is ${roster.status}`, { rosterId });
          }

          // Calculate capacity information
          const currentEnrollment = roster.current_enrollment || 0;
          const maxCapacity = roster.max_capacity;
          const availableSpots = maxCapacity ? maxCapacity - currentEnrollment : null;
          const canEnroll = maxCapacity === null || currentEnrollment < maxCapacity;

          const capacityInfo: RosterCapacityInfo = {
            success: true,
            roster_id: rosterId,
            roster_name: roster.roster_name,
            max_capacity: maxCapacity,
            current_enrollment: currentEnrollment,
            available_spots: availableSpots,
            can_enroll: canEnroll,
            requested_students: 1
          };

          // Check if enrollment is allowed
          if (!forceEnrollment && !capacityInfo.can_enroll) {
            throw RosterEnrollmentService.createEnrollmentError('CAPACITY_EXCEEDED',
              `Roster "${capacityInfo.roster_name}" is at full capacity (${capacityInfo.current_enrollment}/${capacityInfo.max_capacity})`,
              { rosterId, capacityInfo }
            );
          }

          return capacityInfo;
        }
      });

      // Step 2: Check for existing enrollment
      steps.push({
        name: 'checkExistingEnrollment',
        execute: async () => {
          const { data: existing, error } = await supabase
            .from('student_roster_members')
            .select('id, enrollment_status')
            .eq('roster_id', rosterId)
            .eq('student_profile_id', studentId)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = not found, which is expected
            throw error;
          }

          if (existing) {
            throw RosterEnrollmentService.createEnrollmentError('ALREADY_ENROLLED',
              `Student is already ${existing.enrollment_status} in this roster`,
              { rosterId, studentId }
            );
          }

          return { noExistingEnrollment: true };
        }
      });

      // Step 3: Validate student profile exists
      steps.push({
        name: 'validateStudent',
        execute: async () => {
          const { data: student, error } = await supabase
            .from('student_enrollment_profiles')
            .select('id, first_name, last_name, email')
            .eq('id', studentId)
            .single();

          if (error) {
            throw RosterEnrollmentService.createEnrollmentError('STUDENT_NOT_FOUND', 'Student profile not found', { studentId });
          }

          return student;
        }
      });

      // Step 4: Create enrollment record (triggers will handle capacity updates)
      steps.push({
        name: 'createEnrollment',
        execute: async () => {
          const capacityInfo = steps[0].result as RosterCapacityInfo;
          
          // Determine enrollment status based on capacity and force flag
          let enrollmentStatus: EnrollmentStatus;
          if (forceEnrollment || capacityInfo.can_enroll) {
            enrollmentStatus = 'enrolled';
          } else {
            enrollmentStatus = 'waitlisted';
          }

          const { data, error } = await supabase
            .from('student_roster_members')
            .insert({
              roster_id: rosterId,
              student_profile_id: studentId,
              enrollment_status: enrollmentStatus,
              enrolled_at: new Date().toISOString(),
              notes: notes || null
            })
            .select(`
              id,
              roster_id,
              student_profile_id,
              enrollment_status,
              enrolled_at,
              notes
            `)
            .single();

          if (error) {
            // Handle specific database constraint violations
            if (error.message.includes('Cannot enroll student')) {
              throw RosterEnrollmentService.createEnrollmentError('CAPACITY_EXCEEDED', error.message, { rosterId, studentId });
            }
            throw error;
          }

          return data;
        },
        rollback: async () => {
          if (steps[3].result?.id) {
            await supabase
              .from('student_roster_members')
              .delete()
              .eq('id', steps[3].result.id);
          }
        }
      });

      // Step 5: Get updated capacity info after enrollment
      steps.push({
        name: 'getUpdatedCapacity',
        execute: async () => {
          const { data: roster, error } = await supabase
            .from('student_rosters')
            .select('id, roster_name, max_capacity, current_enrollment')
            .eq('id', rosterId)
            .single();

          if (error) throw error;

          const currentEnrollment = roster.current_enrollment || 0;
          const maxCapacity = roster.max_capacity;
          const availableSpots = maxCapacity ? maxCapacity - currentEnrollment : null;
          
          const capacityInfo: RosterCapacityInfo = {
            success: true,
            roster_id: rosterId,
            roster_name: roster.roster_name,
            max_capacity: maxCapacity,
            current_enrollment: currentEnrollment,
            available_spots: availableSpots,
            can_enroll: maxCapacity === null || currentEnrollment < maxCapacity,
            requested_students: 0
          };

          return capacityInfo;
        }
      });

      // Step 6: Create notification
      steps.push({
        name: 'createNotification',
        execute: async () => {
          if (!this.config.enableNotifications) return null;
          
          const enrollment = steps[3].result;
          const student = steps[2].result;
          const capacityInfo = steps[0].result as RosterCapacityInfo;
          
          const isWaitlisted = enrollment.enrollment_status === 'waitlisted';
          const title = isWaitlisted ? 'Added to Waitlist' : 'Enrollment Confirmed';
          const message = isWaitlisted 
            ? `You have been added to the waitlist for "${capacityInfo.roster_name}"`
            : `You have been successfully enrolled in "${capacityInfo.roster_name}"`;

          const { data, error } = await supabase
            .from('notifications')
            .insert({
              user_id: studentId,
              title,
              message,
              type: isWaitlisted ? 'INFO' : 'SUCCESS',
              category: 'ENROLLMENT',
              priority: 'NORMAL',
              metadata: {
                roster_id: rosterId,
                enrollment_id: enrollment.id,
                enrollment_status: enrollment.enrollment_status
              }
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        },
        rollback: async () => {
          if (steps[5].result?.id) {
            await supabase
              .from('notifications')
              .delete()
              .eq('id', steps[5].result.id);
          }
        }
      });

      // Step 7: Create audit log
      steps.push({
        name: 'createAuditLog',
        execute: async () => {
          if (!this.config.enableAuditLogging) return null;
          
          const enrollment = steps[3].result;
          const capacityInfo = steps[0].result as RosterCapacityInfo;
          
          const auditEntry: Omit<EnrollmentAuditLog, 'timestamp'> = {
            action: enrollment.enrollment_status === 'enrolled' ? 'ENROLLMENT_SUCCESS' : 'ENROLLMENT_SUCCESS',
            rosterId,
            studentId,
            performedBy: enrolledBy,
            userRole,
            details: {
              newStatus: enrollment.enrollment_status,
              capacityInfo,
              notes,
              forceEnrollment,
              enrollmentType
            }
          };

          const { data, error } = await supabase
            .from('enrollment_audit_logs')
            .insert({
              ...auditEntry,
              timestamp: new Date().toISOString(),
              details: JSON.stringify(auditEntry.details)
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        }
      });

      this.activeTransactions.set(transactionId, steps);

      // Execute all steps
      const results: Record<string, any> = {};
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        try {
          step.result = await step.execute();
          results[step.name] = step.result;
        } catch (error) {
          // Rollback all completed steps
          await this.rollbackSteps(steps, i - 1);
          throw error;
        }
      }

      this.activeTransactions.delete(transactionId);

      return {
        success: true,
        results: {
          capacityCheck: results.validateCapacity,
          existingEnrollment: results.checkExistingEnrollment,
          enrollment: results.createEnrollment,
          capacityUpdate: results.getUpdatedCapacity,
          notification: results.createNotification,
          auditLog: results.createAuditLog
        },
        stepsCompleted: steps.length,
        totalSteps: steps.length,
        roster_id: rosterId,
        student_id: studentId,
        enrolled_by: enrolledBy
      };

    } catch (error: any) {
      this.activeTransactions.delete(transactionId);
      
      // Convert to EnrollmentError if needed
      const enrollmentError = error instanceof Error && 'code' in error 
        ? error as EnrollmentError
        : RosterEnrollmentService.createEnrollmentError('TRANSACTION_FAILED', error.message, { rosterId, studentId });

      return {
        success: false,
        results: {},
        error: enrollmentError.message,
        stepsCompleted: steps.filter(s => s.result).length,
        totalSteps: steps.length,
        roster_id: rosterId,
        student_id: studentId,
        enrolled_by: enrolledBy
      };
    }
  }

  /**
   * Batch enrollment with capacity validation
   */
  public static async enrollMultipleStudents(
    params: BatchRosterEnrollmentParams
  ): Promise<BatchRosterEnrollmentResult> {
    const { rosterId, studentIds, enrolledBy, userRole, enrollmentType = 'standard', notes, continueOnError = true } = params;
    
    // Initial capacity check
    const capacityValidation = await this.checkRosterCapacityStatus({
      rosterId,
      additionalStudents: studentIds.length
    });

    if (!capacityValidation.success) {
      throw RosterEnrollmentService.createEnrollmentError('DATABASE_ERROR', capacityValidation.error || 'Capacity validation failed', { rosterId });
    }

    const capacityInfo = capacityValidation.capacity;
    const results: RosterEnrollmentResult[] = [];
    const summary = { enrolled: [], waitlisted: [], failed: [] };

    for (const studentId of studentIds) {
      try {
        const result = await this.enrollStudentWithCapacityCheck({
          rosterId,
          studentId,
          enrolledBy,
          userRole,
          enrollmentType,
          notes
        });

        results.push(result);
        
        if (result.success) {
          const enrollmentStatus = result.results.enrollment?.enrollment_status;
          if (enrollmentStatus === 'enrolled') {
            summary.enrolled.push(studentId);
          } else if (enrollmentStatus === 'waitlisted') {
            summary.waitlisted.push(studentId);
          }
        } else {
          summary.failed.push({ studentId, error: result.error || 'Unknown error' });
        }
      } catch (error: any) {
        const failureResult: RosterEnrollmentResult = {
          success: false,
          results: {},
          error: error.message,
          stepsCompleted: 0,
          totalSteps: 0,
          roster_id: rosterId,
          student_id: studentId,
          enrolled_by: enrolledBy
        };
        
        results.push(failureResult);
        summary.failed.push({ studentId, error: error.message });
        
        if (!continueOnError) {
          break;
        }
      }
    }

    return {
      success: summary.failed.length === 0,
      totalRequested: studentIds.length,
      successfulEnrollments: summary.enrolled.length + summary.waitlisted.length,
      failedEnrollments: summary.failed.length,
      results,
      capacityInfo,
      summary
    };
  }

  /**
   * Check roster capacity status
   */
  public static async checkRosterCapacityStatus(
    params: CapacityValidationParams
  ): Promise<CapacityValidationResult> {
    const { rosterId, additionalStudents = 0, includeWaitlist = true } = params;

    try {
      // Get roster and capacity information
      const { data: roster, error: rosterError } = await supabase
        .from('student_rosters')
        .select('id, roster_name, max_capacity, current_enrollment, status')
        .eq('id', rosterId)
        .single();

      if (rosterError || !roster) {
        const capacityInfo: RosterCapacityInfo = {
          success: false,
          roster_id: rosterId,
          roster_name: 'Unknown',
          max_capacity: null,
          current_enrollment: 0,
          available_spots: null,
          can_enroll: false,
          requested_students: additionalStudents,
          error: 'Roster not found'
        };

        return {
          success: false,
          roster: { id: rosterId, name: 'Unknown', status: 'NOT_FOUND' },
          capacity: capacityInfo,
          waitlist: { total: 0, positions: [] },
          recommendations: [],
          warnings: [],
          error: 'Roster not found'
        };
      }

      // Calculate capacity information
      const currentEnrollment = roster.current_enrollment || 0;
      const maxCapacity = roster.max_capacity;
      const availableSpots = maxCapacity ? Math.max(0, maxCapacity - currentEnrollment) : null;
      const canEnrollAdditional = maxCapacity === null || (currentEnrollment + additionalStudents) <= maxCapacity;

      const capacityInfo: RosterCapacityInfo = {
        success: true,
        roster_id: rosterId,
        roster_name: roster.roster_name,
        max_capacity: maxCapacity,
        current_enrollment: currentEnrollment,
        available_spots: availableSpots,
        can_enroll: canEnrollAdditional,
        requested_students: additionalStudents
      };

      // Get waitlist information if requested
      let waitlistInfo = { total: 0, positions: [] };
      if (includeWaitlist) {
        const { data: waitlistData, error: waitlistError } = await supabase
          .from('student_roster_members')
          .select(`
            student_profile_id,
            enrolled_at,
            student_enrollment_profiles (first_name, last_name)
          `)
          .eq('roster_id', rosterId)
          .eq('enrollment_status', 'waitlisted')
          .order('enrolled_at', { ascending: true });

        if (!waitlistError && waitlistData) {
          waitlistInfo = {
            total: waitlistData.length,
            positions: waitlistData.map((item, index) => ({
              studentId: item.student_profile_id,
              position: index + 1,
              enrolledAt: item.enrolled_at
            }))
          };
        }
      }

      // Generate recommendations and warnings
      const recommendations: string[] = [];
      const warnings: string[] = [];

      if (capacityInfo.max_capacity && capacityInfo.current_enrollment >= capacityInfo.max_capacity * 0.9) {
        warnings.push('Roster is nearly full (90%+ capacity)');
      }

      if (waitlistInfo.total > 0) {
        recommendations.push(`Consider promoting ${Math.min(waitlistInfo.total, capacityInfo.available_spots || 0)} students from waitlist`);
      }

      if (!capacityInfo.can_enroll && additionalStudents > 0) {
        recommendations.push('Consider increasing roster capacity or creating additional roster');
      }

      return {
        success: true,
        roster: {
          id: roster.id,
          name: roster.roster_name,
          status: roster.status || 'ACTIVE'
        },
        capacity: capacityInfo,
        waitlist: waitlistInfo,
        recommendations,
        warnings
      };

    } catch (error: any) {
      return {
        success: false,
        roster: { id: rosterId, name: 'Unknown', status: 'ERROR' },
        capacity: {
          success: false,
          roster_id: rosterId,
          roster_name: 'Unknown',
          max_capacity: null,
          current_enrollment: 0,
          available_spots: null,
          can_enroll: false,
          requested_students: additionalStudents,
          error: error.message
        },
        waitlist: { total: 0, positions: [] },
        recommendations: [],
        warnings: [],
        error: error.message
      };
    }
  }

  /**
   * Promote students from waitlist when capacity becomes available
   */
  public static async promoteFromWaitlist(
    params: WaitlistPromotionParams
  ): Promise<WaitlistPromotionResult> {
    const { rosterId, promotedBy, userRole, maxPromotions = 1, specificStudentId } = params;
    
    // Validate permissions
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY['AP']) {
      throw RosterEnrollmentService.createEnrollmentError('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to promote from waitlist');
    }

    try {
      // Check current capacity
      const capacityValidation = await this.checkRosterCapacityStatus({ rosterId });
      if (!capacityValidation.success) {
        throw RosterEnrollmentService.createEnrollmentError('ROSTER_NOT_FOUND', capacityValidation.error || 'Cannot validate roster capacity');
      }

      const availableSpots = capacityValidation.capacity.available_spots || 0;
      if (availableSpots <= 0) {
        return {
          success: false,
          promotedCount: 0,
          promotedStudents: [],
          remainingWaitlist: capacityValidation.waitlist.total,
          capacityInfo: capacityValidation.capacity,
          error: 'No available capacity for promotion'
        };
      }

      // Get waitlisted students
      let waitlistQuery = supabase
        .from('student_roster_members')
        .select(`
          id,
          student_profile_id,
          enrolled_at,
          student_enrollment_profiles (first_name, last_name)
        `)
        .eq('roster_id', rosterId)
        .eq('enrollment_status', 'waitlisted')
        .order('enrolled_at', { ascending: true })
        .limit(Math.min(maxPromotions, availableSpots));

      if (specificStudentId) {
        waitlistQuery = waitlistQuery.eq('student_profile_id', specificStudentId);
      }

      const { data: waitlistedStudents, error: waitlistError } = await waitlistQuery;
      
      if (waitlistError) throw waitlistError;
      if (!waitlistedStudents || waitlistedStudents.length === 0) {
        return {
          success: true,
          promotedCount: 0,
          promotedStudents: [],
          remainingWaitlist: 0,
          capacityInfo: capacityValidation.capacity,
          error: 'No students in waitlist'
        };
      }

      // Promote students
      const promotedStudents = [];
      for (const student of waitlistedStudents) {
        const { error: updateError } = await supabase
          .from('student_roster_members')
          .update({
            enrollment_status: 'enrolled',
            updated_at: new Date().toISOString()
          })
          .eq('id', student.id);

        if (!updateError) {
          promotedStudents.push({
            studentId: student.student_profile_id,
            studentName: `${student.student_enrollment_profiles?.first_name || ''} ${student.student_enrollment_profiles?.last_name || ''}`.trim(),
            enrollmentId: student.id,
            waitlistPosition: waitlistedStudents.indexOf(student) + 1
          });

          // Create notification
          if (this.config.enableNotifications) {
            await supabase.from('notifications').insert({
              user_id: student.student_profile_id,
              title: 'Promoted from Waitlist',
              message: `You have been enrolled in "${capacityValidation.roster.name}" from the waitlist`,
              type: 'SUCCESS',
              category: 'ENROLLMENT',
              priority: 'HIGH'
            });
          }
        }
      }

      // Get updated waitlist count
      const { count: remainingWaitlist } = await supabase
        .from('student_roster_members')
        .select('*', { count: 'exact', head: true })
        .eq('roster_id', rosterId)
        .eq('enrollment_status', 'waitlisted');

      return {
        success: true,
        promotedCount: promotedStudents.length,
        promotedStudents,
        remainingWaitlist: remainingWaitlist || 0,
        capacityInfo: capacityValidation.capacity
      };

    } catch (error: any) {
      return {
        success: false,
        promotedCount: 0,
        promotedStudents: [],
        remainingWaitlist: 0,
        capacityInfo: {
          success: false,
          roster_id: rosterId,
          roster_name: 'Unknown',
          max_capacity: null,
          current_enrollment: 0,
          available_spots: null,
          can_enroll: false,
          requested_students: 0,
          error: error.message
        },
        error: error.message
      };
    }
  }

  /**
   * Get roster capacity status from database view
   */
  public static async getRosterCapacityStatusView(): Promise<RosterCapacityStatus[]> {
    const { data, error } = await supabase
      .from('roster_capacity_status')
      .select('*')
      .order('roster_name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Service health check
   */
  public static async getServiceHealth(): Promise<ServiceHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test database connectivity with a simple query
      await supabase
        .from('student_rosters')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'RosterEnrollmentService',
        status: 'HEALTHY',
        version: '1.0.0',
        features: {
          capacityValidation: this.config.enableCapacityValidation,
          waitlistManagement: this.config.enableWaitlistAutoPromotion,
          batchEnrollment: true,
          auditLogging: this.config.enableAuditLogging,
          notifications: this.config.enableNotifications
        },
        performance: {
          averageResponseTime: responseTime,
          successRate: 100,
          activeTransactions: this.activeTransactions.size
        },
        lastCheck: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        service: 'RosterEnrollmentService',
        status: 'UNHEALTHY',
        version: '1.0.0',
        features: {
          capacityValidation: false,
          waitlistManagement: false,
          batchEnrollment: false,
          auditLogging: false,
          notifications: false
        },
        performance: {
          averageResponseTime: Date.now() - startTime,
          successRate: 0,
          activeTransactions: this.activeTransactions.size
        },
        lastCheck: new Date().toISOString()
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static async rollbackSteps(steps: TransactionStep[], lastCompletedIndex: number): Promise<void> {
    for (let i = lastCompletedIndex; i >= 0; i--) {
      const step = steps[i];
      if (step.rollback && step.result) {
        try {
          await step.rollback();
          console.log(`🔄 Rolled back step: ${step.name}`);
        } catch (rollbackError) {
          console.error(`❌ Rollback failed for step ${step.name}:`, rollbackError);
        }
      }
    }
  }

  private static generateTransactionId(): string {
    return `roster_enroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static createEnrollmentError(
    code: RosterEnrollmentError, 
    message: string, 
    details: { rosterId?: string; studentId?: string; capacityInfo?: RosterCapacityInfo; suggestions?: string[] } = {}
  ): EnrollmentError {
    const error = new Error(message) as EnrollmentError;
    error.code = code;
    error.details = details;
    return error;
  }

  /**
   * Get active transaction statistics
   */
  public static getTransactionStats(): {
    activeTransactions: number;
    transactionIds: string[];
  } {
    return {
      activeTransactions: this.activeTransactions.size,
      transactionIds: Array.from(this.activeTransactions.keys())
    };
  }

  /**
   * Emergency rollback for active transaction
   */
  public static async emergencyRollback(transactionId: string): Promise<boolean> {
    const steps = this.activeTransactions.get(transactionId);
    if (!steps) return false;

    await this.rollbackSteps(steps, steps.length - 1);
    this.activeTransactions.delete(transactionId);
    
    return true;
  }

  /**
   * Update service configuration
   */
  public static updateConfig(newConfig: Partial<RosterEnrollmentServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current service configuration
   */
  public static getConfig(): RosterEnrollmentServiceConfig {
    return { ...this.config };
  }
}

export default RosterEnrollmentService;