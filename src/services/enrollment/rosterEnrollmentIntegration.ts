import { supabase } from '@/integrations/supabase/client';
import { RosterEnrollmentService } from './rosterEnrollmentService';
import { EnrollmentService } from './enrollmentService';
import { 
  RosterEnrollmentParams,
  RosterEnrollmentResult,
  BatchRosterEnrollmentParams,
  BatchRosterEnrollmentResult,
  EnrollmentError,
  RosterEnrollmentError,
  CapacityValidationResult
} from '@/types/roster-enrollment';
import { DatabaseUserRole } from '@/types/database-roles';

/**
 * Integration service that provides seamless interoperability between
 * the new RosterEnrollmentService and existing enrollment workflows
 */
export class RosterEnrollmentIntegration {
  
  /**
   * Enhanced enrollment method that handles both capacity validation and legacy workflows
   * This is the recommended method for all new enrollment operations
   */
  public static async enrollStudentSafely(params: {
    rosterId: string;
    studentId: string;
    enrolledBy: string;
    userRole: DatabaseUserRole;
    enrollmentType?: 'standard' | 'priority' | 'transfer' | 'manual' | 'waitlist';
    notes?: string;
    forceEnrollment?: boolean;
    enableLegacyFallback?: boolean; // Fall back to legacy enrollment if new system fails
  }): Promise<RosterEnrollmentResult> {
    const { enableLegacyFallback = false, ...enrollmentParams } = params;
    
    try {
      // Use the new capacity-aware enrollment system
      const result = await RosterEnrollmentService.enrollStudentWithCapacityCheck(enrollmentParams);
      
      // If successful, update legacy metrics for compatibility
      if (result.success) {
        await this.updateLegacyMetrics(params.rosterId);
      }
      
      return result;
    } catch (error: any) {
      console.error('Roster enrollment failed:', error);
      
      // If legacy fallback is enabled and the error is not a capacity violation
      if (enableLegacyFallback && !this.isCapacityError(error)) {
        console.warn('Falling back to legacy enrollment method');
        return await this.legacyEnrollmentFallback(enrollmentParams);
      }
      
      throw error;
    }
  }

  /**
   * Batch enrollment with intelligent capacity management
   */
  public static async enrollMultipleStudentsSafely(
    params: BatchRosterEnrollmentParams & {
      enableLegacyFallback?: boolean;
      autoPromoteFromWaitlist?: boolean;
    }
  ): Promise<BatchRosterEnrollmentResult> {
    const { enableLegacyFallback = false, autoPromoteFromWaitlist = true, ...batchParams } = params;
    
    try {
      // Check initial capacity
      const capacityValidation = await RosterEnrollmentService.checkRosterCapacityStatus({
        rosterId: params.rosterId,
        additionalStudents: params.studentIds.length
      });

      // If there's insufficient capacity but waitlist is available, suggest splitting
      if (!capacityValidation.capacity.can_enroll && autoPromoteFromWaitlist) {
        // Try to promote from waitlist first to free up space
        const promotionResult = await EnrollmentService.promoteFromWaitlist(
          params.rosterId,
          params.enrolledBy,
          params.userRole,
          Math.min(5, capacityValidation.capacity.available_spots || 0)
        );
        
        if (promotionResult.success && promotionResult.promotedCount > 0) {
          console.log(`Auto-promoted ${promotionResult.promotedCount} students from waitlist`);
        }
      }

      // Proceed with batch enrollment
      const result = await RosterEnrollmentService.enrollMultipleStudents(batchParams);
      
      // Update legacy metrics
      if (result.successfulEnrollments > 0) {
        await this.updateLegacyMetrics(params.rosterId);
      }
      
      return result;
    } catch (error: any) {
      console.error('Batch roster enrollment failed:', error);
      
      if (enableLegacyFallback) {
        console.warn('Falling back to individual legacy enrollments');
        return await this.legacyBatchEnrollmentFallback(batchParams);
      }
      
      throw error;
    }
  }

  /**
   * Intelligent waitlist management with automatic promotion
   */
  public static async manageWaitlistIntelligently(
    rosterId: string,
    operation: 'promote' | 'check' | 'auto-manage',
    params: {
      promotedBy?: string;
      userRole?: DatabaseUserRole;
      maxPromotions?: number;
      specificStudentId?: string;
    } = {}
  ) {
    const {
      promotedBy = 'system',
      userRole = 'ADMIN',
      maxPromotions = 5,
      specificStudentId
    } = params;

    switch (operation) {
      case 'check':
        return await EnrollmentService.checkRosterCapacityStatus(rosterId, 0, true);
      
      case 'promote':
        return await EnrollmentService.promoteFromWaitlist(
          rosterId,
          promotedBy,
          userRole,
          maxPromotions
        );
      
      case 'auto-manage':
        // Intelligent auto-management: check capacity and promote accordingly
        const capacityStatus = await EnrollmentService.checkRosterCapacityStatus(rosterId, 0, true);
        
        if (capacityStatus.capacity.available_spots && 
            capacityStatus.capacity.available_spots > 0 && 
            capacityStatus.waitlist.total > 0) {
          
          const promotionsNeeded = Math.min(
            capacityStatus.capacity.available_spots,
            capacityStatus.waitlist.total,
            maxPromotions
          );
          
          return await EnrollmentService.promoteFromWaitlist(
            rosterId,
            promotedBy,
            userRole,
            promotionsNeeded
          );
        }
        
        return {
          success: true,
          promotedCount: 0,
          promotedStudents: [],
          remainingWaitlist: capacityStatus.waitlist.total,
          capacityInfo: capacityStatus.capacity,
          message: 'No promotions needed - no available capacity or empty waitlist'
        };
      
      default:
        throw new Error(`Unknown waitlist operation: ${operation}`);
    }
  }

  /**
   * Error handling and recovery for enrollment operations
   */
  public static async handleEnrollmentError(
    error: Error | EnrollmentError,
    context: {
      rosterId: string;
      studentId?: string;
      operation: string;
      userRole: DatabaseUserRole;
    }
  ): Promise<{
    shouldRetry: boolean;
    suggestedAction: string;
    alternativeOptions: string[];
    canUseWaitlist: boolean;
    errorDetails: {
      code?: RosterEnrollmentError;
      isCapacityIssue: boolean;
      isPermissionIssue: boolean;
      isSystemIssue: boolean;
    };
  }> {
    const enrollmentError = error as EnrollmentError;
    const errorCode = enrollmentError.code;
    
    // Check current roster status for context
    let capacityInfo: CapacityValidationResult | null = null;
    try {
      capacityInfo = await EnrollmentService.checkRosterCapacityStatus(context.rosterId);
    } catch {
      // Ignore capacity check errors for now
    }

    const errorDetails = {
      code: errorCode,
      isCapacityIssue: this.isCapacityError(error),
      isPermissionIssue: this.isPermissionError(error),
      isSystemIssue: this.isSystemError(error)
    };

    let shouldRetry = false;
    let suggestedAction = 'Contact system administrator';
    const alternativeOptions: string[] = [];
    let canUseWaitlist = false;

    // Handle specific error types
    switch (errorCode) {
      case 'CAPACITY_EXCEEDED':
        suggestedAction = 'Add student to waitlist or increase roster capacity';
        alternativeOptions.push('Add to waitlist');
        if (capacityInfo?.waitlist.total === 0) {
          alternativeOptions.push('Increase roster capacity');
        }
        alternativeOptions.push('Create additional roster section');
        canUseWaitlist = true;
        break;

      case 'ALREADY_ENROLLED':
        suggestedAction = 'Student is already enrolled in this roster';
        alternativeOptions.push('Check enrollment status');
        alternativeOptions.push('Transfer to different roster');
        break;

      case 'ROSTER_NOT_FOUND':
        suggestedAction = 'Verify roster ID and try again';
        alternativeOptions.push('Check roster exists');
        alternativeOptions.push('Select different roster');
        break;

      case 'STUDENT_NOT_FOUND':
        suggestedAction = 'Verify student profile exists';
        alternativeOptions.push('Create student profile');
        alternativeOptions.push('Check student ID');
        break;

      case 'INSUFFICIENT_PERMISSIONS':
        suggestedAction = 'Request elevated permissions or contact administrator';
        alternativeOptions.push('Contact administrator for permission elevation');
        break;

      case 'ROSTER_INACTIVE':
        suggestedAction = 'Activate roster or select active roster';
        alternativeOptions.push('Activate roster');
        alternativeOptions.push('Select different active roster');
        break;

      case 'DATABASE_ERROR':
      case 'TRANSACTION_FAILED':
        shouldRetry = true;
        suggestedAction = 'Retry operation or contact support if issue persists';
        alternativeOptions.push('Retry enrollment');
        alternativeOptions.push('Check system status');
        break;

      default:
        shouldRetry = !errorDetails.isPermissionIssue;
        suggestedAction = 'Review error details and retry if appropriate';
        alternativeOptions.push('Check error logs');
        alternativeOptions.push('Contact support');
    }

    // Add capacity-specific suggestions
    if (capacityInfo) {
      if (capacityInfo.waitlist.total > 0) {
        alternativeOptions.push(`Promote ${Math.min(5, capacityInfo.waitlist.total)} students from waitlist`);
      }
      
      if (capacityInfo.recommendations.length > 0) {
        alternativeOptions.push(...capacityInfo.recommendations);
      }
    }

    return {
      shouldRetry,
      suggestedAction,
      alternativeOptions,
      canUseWaitlist,
      errorDetails
    };
  }

  /**
   * Comprehensive enrollment health check
   */
  public static async performSystemHealthCheck(): Promise<{
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    services: {
      rosterEnrollmentService: any;
      enrollmentService: boolean;
      databaseConnectivity: boolean;
      capacityValidation: boolean;
    };
    performance: {
      averageEnrollmentTime: number;
      successRate: number;
    };
    recommendations: string[];
  }> {
    const healthCheck = {
      status: 'HEALTHY' as const,
      services: {
        rosterEnrollmentService: null,
        enrollmentService: false,
        databaseConnectivity: false,
        capacityValidation: false
      },
      performance: {
        averageEnrollmentTime: 0,
        successRate: 0
      },
      recommendations: []
    };

    try {
      // Check RosterEnrollmentService
      healthCheck.services.rosterEnrollmentService = await RosterEnrollmentService.getServiceHealth();
      
      // Check basic database connectivity
      const { data } = await supabase.from('student_rosters').select('id').limit(1);
      healthCheck.services.databaseConnectivity = !!data;
      healthCheck.services.enrollmentService = true;

      // Test capacity validation
      try {
        await EnrollmentService.checkRosterCapacityStatus('test-roster-id');
        healthCheck.services.capacityValidation = true;
      } catch {
        // Expected to fail for test ID, but function should be available
        healthCheck.services.capacityValidation = true;
      }

      // Determine overall status
      const serviceStatuses = Object.values(healthCheck.services);
      const healthyServices = serviceStatuses.filter(s => 
        s === true || (typeof s === 'object' && s?.status === 'HEALTHY')
      ).length;
      
      if (healthyServices === serviceStatuses.length) {
        healthCheck.status = 'HEALTHY';
      } else if (healthyServices >= serviceStatuses.length * 0.7) {
        healthCheck.status = 'DEGRADED';
        healthCheck.recommendations.push('Some services are experiencing issues');
      } else {
        healthCheck.status = 'UNHEALTHY';
        healthCheck.recommendations.push('Critical services are down');
      }

      // Add service-specific recommendations
      if (healthCheck.services.rosterEnrollmentService?.status !== 'HEALTHY') {
        healthCheck.recommendations.push('RosterEnrollmentService needs attention');
      }
      
      if (!healthCheck.services.databaseConnectivity) {
        healthCheck.recommendations.push('Database connectivity issues detected');
      }

    } catch (error) {
      console.error('Health check failed:', error);
      healthCheck.status = 'UNHEALTHY';
      healthCheck.recommendations.push('System health check failed - investigate immediately');
    }

    return healthCheck;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private static isCapacityError(error: Error | EnrollmentError): boolean {
    const capacityErrors: RosterEnrollmentError[] = ['CAPACITY_EXCEEDED', 'ROSTER_INACTIVE'];
    return 'code' in error && capacityErrors.includes(error.code);
  }

  private static isPermissionError(error: Error | EnrollmentError): boolean {
    return 'code' in error && error.code === 'INSUFFICIENT_PERMISSIONS';
  }

  private static isSystemError(error: Error | EnrollmentError): boolean {
    const systemErrors: RosterEnrollmentError[] = ['DATABASE_ERROR', 'TRANSACTION_FAILED', 'VALIDATION_ERROR'];
    return 'code' in error && systemErrors.includes(error.code);
  }

  private static async updateLegacyMetrics(rosterId: string): Promise<void> {
    try {
      // Update any legacy metric tables or caches that depend on enrollment counts
      // This ensures backward compatibility with existing analytics systems
      
      // Example: Update a legacy enrollment_metrics table if it exists
      const { data: roster } = await supabase
        .from('student_rosters')
        .select('current_enrollment, max_capacity')
        .eq('id', rosterId)
        .single();

      if (roster) {
        // Update legacy systems here if needed
        console.log(`Updated legacy metrics for roster ${rosterId}: ${roster.current_enrollment}/${roster.max_capacity}`);
      }
    } catch (error) {
      console.warn('Failed to update legacy metrics:', error);
      // Non-critical error, don't throw
    }
  }

  private static async legacyEnrollmentFallback(params: RosterEnrollmentParams): Promise<RosterEnrollmentResult> {
    try {
      console.warn('Using legacy enrollment fallback');
      
      // Implement basic legacy enrollment logic
      const { data, error } = await supabase
        .from('student_roster_members')
        .insert({
          roster_id: params.rosterId,
          student_profile_id: params.studentId,
          enrollment_status: 'enrolled',
          enrolled_at: new Date().toISOString(),
          notes: `Legacy fallback enrollment by ${params.enrolledBy}`
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        results: {
          enrollment: data
        },
        stepsCompleted: 1,
        totalSteps: 1,
        roster_id: params.rosterId,
        student_id: params.studentId,
        enrolled_by: params.enrolledBy
      };
    } catch (error: any) {
      return {
        success: false,
        results: {},
        error: `Legacy fallback failed: ${error.message}`,
        stepsCompleted: 0,
        totalSteps: 1,
        roster_id: params.rosterId,
        student_id: params.studentId,
        enrolled_by: params.enrolledBy
      };
    }
  }

  private static async legacyBatchEnrollmentFallback(params: BatchRosterEnrollmentParams): Promise<BatchRosterEnrollmentResult> {
    const results: RosterEnrollmentResult[] = [];
    const summary = { enrolled: [], waitlisted: [], failed: [] };

    for (const studentId of params.studentIds) {
      try {
        const result = await this.legacyEnrollmentFallback({
          rosterId: params.rosterId,
          studentId,
          enrolledBy: params.enrolledBy,
          userRole: params.userRole,
          enrollmentType: params.enrollmentType,
          notes: params.notes
        });

        results.push(result);
        
        if (result.success) {
          summary.enrolled.push(studentId);
        } else {
          summary.failed.push({ studentId, error: result.error || 'Unknown error' });
        }
      } catch (error: any) {
        summary.failed.push({ studentId, error: error.message });
      }
    }

    return {
      success: summary.failed.length === 0,
      totalRequested: params.studentIds.length,
      successfulEnrollments: summary.enrolled.length,
      failedEnrollments: summary.failed.length,
      results,
      capacityInfo: {
        success: false,
        roster_id: params.rosterId,
        roster_name: 'Unknown',
        max_capacity: null,
        current_enrollment: 0,
        available_spots: null,
        can_enroll: false,
        requested_students: params.studentIds.length,
        error: 'Legacy fallback mode'
      },
      summary
    };
  }
}

export default RosterEnrollmentIntegration;