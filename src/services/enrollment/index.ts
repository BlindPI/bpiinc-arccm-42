/**
 * Enrollment Services - Unified exports for roster enrollment with capacity management
 * 
 * This module provides comprehensive enrollment services with capacity validation,
 * waitlist management, and transaction safety for roster-based training programs.
 */

// Core Services
export { EnrollmentService } from './enrollmentService';
export { RosterEnrollmentService } from './rosterEnrollmentService';
export { RosterEnrollmentIntegration } from './rosterEnrollmentIntegration';

// Type Exports
export type {
  // Core Enrollment Types
  RosterEnrollmentParams,
  RosterEnrollmentResult,
  BatchRosterEnrollmentParams,
  BatchRosterEnrollmentResult,
  
  // Capacity Management Types
  RosterCapacityInfo,
  RosterCapacityStatus,
  CapacityValidationParams,
  CapacityValidationResult,
  CapacityStatus,
  
  // Waitlist Management Types
  WaitlistPromotionParams,
  WaitlistPromotionResult,
  
  // Status and Configuration Types
  EnrollmentStatus,
  EnrollmentType,
  EnrollmentAuditLog,
  EnrollmentNotificationConfig,
  RosterEnrollmentServiceConfig,
  ServiceHealthCheck,
  
  // Error Types
  EnrollmentError,
  RosterEnrollmentError
} from '@/types/roster-enrollment';

// Legacy compatibility exports
export type {
  EnrollmentMetrics,
  EnrollmentFilters,
  EnrollmentWithDetails
} from './enrollmentService';

/**
 * Recommended usage patterns:
 * 
 * For new enrollment operations:
 * ```typescript
 * import { RosterEnrollmentIntegration } from '@/services/enrollment';
 * 
 * const result = await RosterEnrollmentIntegration.enrollStudentSafely({
 *   rosterId: 'roster-uuid',
 *   studentId: 'student-uuid', 
 *   enrolledBy: 'admin-uuid',
 *   userRole: 'AP',
 *   enrollmentType: 'standard'
 * });
 * ```
 * 
 * For capacity checking:
 * ```typescript
 * import { EnrollmentService } from '@/services/enrollment';
 * 
 * const capacity = await EnrollmentService.checkRosterCapacityStatus(rosterId, 5);
 * if (capacity.capacity.can_enroll) {
 *   // Proceed with enrollment
 * }
 * ```
 * 
 * For waitlist management:
 * ```typescript
 * import { RosterEnrollmentIntegration } from '@/services/enrollment';
 * 
 * const result = await RosterEnrollmentIntegration.manageWaitlistIntelligently(
 *   rosterId, 
 *   'auto-manage'
 * );
 * ```
 */

// Utility functions for common operations
export const EnrollmentUtils = {
  /**
   * Quick enrollment with automatic error handling
   */
  async quickEnroll(
    rosterId: string,
    studentId: string,
    enrolledBy: string,
    userRole: 'AP' | 'ADMIN' | 'INSTRUCTOR' = 'AP'
  ) {
    const { RosterEnrollmentIntegration } = await import('./rosterEnrollmentIntegration');
    return RosterEnrollmentIntegration.enrollStudentSafely({
      rosterId,
      studentId,
      enrolledBy,
      userRole,
      enrollmentType: 'standard',
      enableLegacyFallback: true
    });
  },

  /**
   * Quick capacity check
   */
  async checkCapacity(rosterId: string, additionalStudents: number = 1) {
    const { EnrollmentService } = await import('./enrollmentService');
    return EnrollmentService.canEnrollStudents(rosterId, additionalStudents);
  },

  /**
   * Quick waitlist promotion
   */
  async promoteWaitlist(rosterId: string, maxPromotions: number = 1) {
    const { RosterEnrollmentIntegration } = await import('./rosterEnrollmentIntegration');
    return RosterEnrollmentIntegration.manageWaitlistIntelligently(
      rosterId,
      'promote',
      { maxPromotions }
    );
  },

  /**
   * System health check
   */
  async checkHealth() {
    const { RosterEnrollmentIntegration } = await import('./rosterEnrollmentIntegration');
    return RosterEnrollmentIntegration.performSystemHealthCheck();
  }
};

/**
 * Default export provides the main enrollment interface
 * for backward compatibility with existing code
 */
export default {
  // Main services
  EnrollmentService,
  RosterEnrollmentService,
  RosterEnrollmentIntegration,
  
  // Utility functions
  Utils: EnrollmentUtils,
  
  // Quick access methods
  enrollStudent: EnrollmentUtils.quickEnroll,
  checkCapacity: EnrollmentUtils.checkCapacity,
  promoteWaitlist: EnrollmentUtils.promoteWaitlist,
  checkHealth: EnrollmentUtils.checkHealth
};