/**
 * TypeScript interfaces and types for roster enrollment capacity management
 * Follows the patterns established in TransactionManager and EnrollmentService
 */

import { DatabaseUserRole } from './database-roles';

// ============================================================================
// CORE CAPACITY INTERFACES
// ============================================================================

/**
 * Roster capacity status returned by database check_roster_capacity() function
 */
export interface RosterCapacityInfo {
  success: boolean;
  roster_id: string;
  roster_name: string;
  max_capacity: number | null;
  current_enrollment: number;
  available_spots: number | null;
  can_enroll: boolean;
  requested_students: number;
  error?: string;
}

/**
 * Capacity status types for roster monitoring
 */
export type CapacityStatus = 
  | 'UNLIMITED'   // No capacity limit set
  | 'EMPTY'       // No students enrolled
  | 'AVAILABLE'   // Space available for enrollment
  | 'NEARLY_FULL' // 80% or more of capacity used
  | 'FULL'        // At maximum capacity
  | 'OVER_CAPACITY'; // Exceeds maximum capacity (error state)

/**
 * Enhanced capacity status with utilization metrics
 */
export interface RosterCapacityStatus {
  id: string;
  roster_name: string;
  max_capacity: number | null;
  current_enrollment: number;
  available_spots: number | null;
  capacity_status: CapacityStatus;
  utilization_percentage: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ENROLLMENT TRANSACTION INTERFACES
// ============================================================================

/**
 * Result of roster enrollment transaction
 * Follows TransactionResult pattern from TransactionManager
 */
export interface RosterEnrollmentResult {
  success: boolean;
  results: {
    capacityCheck?: RosterCapacityInfo;
    existingEnrollment?: { noExistingEnrollment: boolean };
    enrollment?: {
      id: string;
      roster_id: string;
      student_profile_id: string;
      enrollment_status: EnrollmentStatus;
      enrolled_at: string;
    };
    capacityUpdate?: {
      current_enrollment: number;
    };
    notification?: {
      id: string;
      user_id: string;
      title: string;
      message: string;
    };
    auditLog?: {
      id: string;
      action: string;
      details: Record<string, any>;
    };
  };
  error?: string;
  stepsCompleted: number;
  totalSteps: number;
  roster_id: string;
  student_id: string;
  enrolled_by: string;
}

/**
 * Input parameters for roster enrollment
 */
export interface RosterEnrollmentParams {
  rosterId: string;
  studentId: string;
  enrolledBy: string;
  userRole: DatabaseUserRole;
  enrollmentType?: EnrollmentType;
  notes?: string;
  forceEnrollment?: boolean; // Override capacity checks (admin only)
}

/**
 * Input parameters for batch enrollment
 */
export interface BatchRosterEnrollmentParams {
  rosterId: string;
  studentIds: string[];
  enrolledBy: string;
  userRole: DatabaseUserRole;
  enrollmentType?: EnrollmentType;
  notes?: string;
  continueOnError?: boolean; // Continue with other students if one fails
}

/**
 * Result of batch enrollment operation
 */
export interface BatchRosterEnrollmentResult {
  success: boolean;
  totalRequested: number;
  successfulEnrollments: number;
  failedEnrollments: number;
  results: RosterEnrollmentResult[];
  capacityInfo: RosterCapacityInfo;
  summary: {
    enrolled: string[];
    waitlisted: string[];
    failed: Array<{
      studentId: string;
      error: string;
    }>;
  };
}

// ============================================================================
// ENROLLMENT STATUS AND TYPE ENUMS
// ============================================================================

/**
 * Enrollment status for roster members
 * Matches database enum values
 */
export type EnrollmentStatus = 
  | 'enrolled'
  | 'waitlisted' 
  | 'completed'
  | 'cancelled'
  | 'pending_approval';

/**
 * Type of enrollment action
 */
export type EnrollmentType = 
  | 'standard'      // Normal enrollment
  | 'priority'      // Priority enrollment (bypass waitlist)
  | 'transfer'      // Transfer from another roster
  | 'manual'        // Manual enrollment by admin
  | 'waitlist';     // Direct waitlist enrollment

// ============================================================================
// WAITLIST MANAGEMENT INTERFACES
// ============================================================================

/**
 * Waitlist promotion parameters
 */
export interface WaitlistPromotionParams {
  rosterId: string;
  promotedBy: string;
  userRole: DatabaseUserRole;
  maxPromotions?: number; // Maximum number to promote at once
  specificStudentId?: string; // Promote specific student instead of first in line
}

/**
 * Result of waitlist promotion operation
 */
export interface WaitlistPromotionResult {
  success: boolean;
  promotedCount: number;
  promotedStudents: Array<{
    studentId: string;
    studentName: string;
    enrollmentId: string;
    waitlistPosition?: number;
  }>;
  remainingWaitlist: number;
  capacityInfo: RosterCapacityInfo;
  error?: string;
}

// ============================================================================
// CAPACITY VALIDATION INTERFACES
// ============================================================================

/**
 * Parameters for capacity validation
 */
export interface CapacityValidationParams {
  rosterId: string;
  additionalStudents?: number; // Number of students to check capacity for
  includeWaitlist?: boolean;   // Include waitlist information
}

/**
 * Detailed capacity validation result
 */
export interface CapacityValidationResult {
  success: boolean;
  roster: {
    id: string;
    name: string;
    status: string;
  };
  capacity: RosterCapacityInfo;
  waitlist: {
    total: number;
    positions: Array<{
      studentId: string;
      position: number;
      enrolledAt: string;
    }>;
  };
  recommendations: string[];
  warnings: string[];
  error?: string;
}

// ============================================================================
// AUDIT AND NOTIFICATION INTERFACES
// ============================================================================

/**
 * Audit log entry for enrollment actions
 */
export interface EnrollmentAuditLog {
  action: 'ENROLLMENT_ATTEMPT' | 'ENROLLMENT_SUCCESS' | 'ENROLLMENT_FAILED' | 
          'WAITLIST_PROMOTION' | 'ENROLLMENT_CANCELLED' | 'CAPACITY_OVERRIDE';
  rosterId: string;
  studentId: string;
  performedBy: string;
  userRole: DatabaseUserRole;
  details: {
    originalStatus?: EnrollmentStatus;
    newStatus?: EnrollmentStatus;
    capacityInfo?: RosterCapacityInfo;
    error?: string;
    notes?: string;
    forceEnrollment?: boolean;
  };
  timestamp: string;
}

/**
 * Notification configuration for enrollment events
 */
export interface EnrollmentNotificationConfig {
  studentNotification: boolean;
  instructorNotification: boolean;
  adminNotification: boolean;
  emailNotification: boolean;
  inAppNotification: boolean;
  customMessage?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Specific error types for roster enrollment
 */
export type RosterEnrollmentError = 
  | 'ROSTER_NOT_FOUND'
  | 'STUDENT_NOT_FOUND'
  | 'ALREADY_ENROLLED'
  | 'CAPACITY_EXCEEDED'
  | 'ROSTER_INACTIVE'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'ENROLLMENT_CLOSED'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'TRANSACTION_FAILED';

/**
 * Enhanced error information
 */
export interface EnrollmentError extends Error {
  code: RosterEnrollmentError;
  details: {
    rosterId?: string;
    studentId?: string;
    capacityInfo?: RosterCapacityInfo;
    suggestions?: string[];
  };
}

// ============================================================================
// SERVICE CONFIGURATION INTERFACES
// ============================================================================

/**
 * Configuration for RosterEnrollmentService
 */
export interface RosterEnrollmentServiceConfig {
  enableCapacityValidation: boolean;
  enableWaitlistAutoPromotion: boolean;
  enableAuditLogging: boolean;
  enableNotifications: boolean;
  maxRetryAttempts: number;
  transactionTimeout: number; // milliseconds
  defaultNotificationConfig: EnrollmentNotificationConfig;
}

/**
 * Service health check result
 */
export interface ServiceHealthCheck {
  service: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  version: string;
  features: {
    capacityValidation: boolean;
    waitlistManagement: boolean;
    batchEnrollment: boolean;
    auditLogging: boolean;
    notifications: boolean;
  };
  performance: {
    averageResponseTime: number;
    successRate: number;
    activeTransactions: number;
  };
  lastCheck: string;
}