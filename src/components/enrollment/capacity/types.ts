/**
 * TypeScript type definitions for enrollment capacity components
 */

import type { ReactNode } from 'react';
import type {
  CapacityStatus,
  RosterCapacityInfo,
  CapacityValidationResult,
  EnrollmentStatus,
  RosterEnrollmentParams
} from '@/types/roster-enrollment';
import type { DatabaseUserRole } from '@/types/database-roles';

// ============================================================================
// CAPACITY DISPLAY COMPONENT
// ============================================================================

export interface RosterCapacityDisplayProps {
  /** Roster ID to display capacity for */
  rosterId: string;
  /** Show detailed capacity information */
  showDetails?: boolean;
  /** Show waitlist information */
  showWaitlist?: boolean;
  /** Show enrollment actions */
  showActions?: boolean;
  /** Custom styling classes */
  className?: string;
  /** Compact display mode */
  compact?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
  /** Callback when capacity status changes */
  onCapacityChange?: (capacity: RosterCapacityInfo) => void;
}

// ============================================================================
// ENROLLMENT CAPACITY GUARD COMPONENT
// ============================================================================

export interface EnrollmentCapacityGuardProps {
  /** Roster ID to check capacity for */
  rosterId: string;
  /** Number of students to enroll */
  studentCount?: number;
  /** Child component to render when enrollment is allowed */
  children: ReactNode;
  /** Component to render when enrollment is not allowed */
  fallback?: ReactNode;
  /** Show capacity information in fallback */
  showCapacityInFallback?: boolean;
  /** Allow waitlist enrollment when full */
  allowWaitlist?: boolean;
  /** Custom error message when capacity exceeded */
  capacityExceededMessage?: string;
  /** Callback when capacity check fails */
  onCapacityExceeded?: (capacity: RosterCapacityInfo) => void;
  /** Loading component */
  loadingComponent?: ReactNode;
}

// ============================================================================
// WAITLIST OFFER COMPONENT
// ============================================================================

export interface WaitlistOfferComponentProps {
  /** Roster ID for waitlist enrollment */
  rosterId: string;
  /** Student ID to enroll */
  studentId: string;
  /** User performing the action */
  enrolledBy: string;
  /** User role */
  userRole: DatabaseUserRole;
  /** Enrollment notes */
  notes?: string;
  /** Show estimated position */
  showEstimatedPosition?: boolean;
  /** Custom waitlist message */
  customMessage?: string;
  /** Callback on successful waitlist enrollment */
  onWaitlistSuccess?: (enrollmentId: string) => void;
  /** Callback on enrollment failure */
  onEnrollmentError?: (error: string) => void;
  /** Custom styling */
  className?: string;
  /** Variant styling */
  variant?: 'default' | 'card' | 'inline' | 'modal';
}

// ============================================================================
// CAPACITY STATUS BADGE COMPONENT
// ============================================================================

export interface CapacityStatusBadgeProps {
  /** Capacity status to display */
  status: CapacityStatus;
  /** Capacity information for additional context */
  capacityInfo?: RosterCapacityInfo;
  /** Show available spots count */
  showSpots?: boolean;
  /** Show utilization percentage */
  showPercentage?: boolean;
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Badge variant */
  variant?: 'default' | 'outline' | 'secondary';
  /** Custom styling */
  className?: string;
  /** Additional content to display */
  children?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Tooltip content */
  tooltip?: string;
}

// ============================================================================
// SHARED COMPONENT TYPES
// ============================================================================

export interface BaseCapacityComponentProps {
  rosterId: string;
  className?: string;
  onError?: (error: Error) => void;
}

export interface EnrollmentActionProps {
  rosterId: string;
  studentId: string;
  enrolledBy: string;
  userRole: DatabaseUserRole;
  enrollmentType?: 'standard' | 'priority' | 'transfer' | 'manual' | 'waitlist';
  notes?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export interface CapacityValidationProps {
  rosterId: string;
  additionalStudents?: number;
  includeWaitlist?: boolean;
  onValidation?: (result: CapacityValidationResult) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type CapacityDisplayMode = 'full' | 'compact' | 'minimal' | 'badge-only';

export type CapacityTheme = {
  unlimited: string;
  empty: string;
  available: string;
  nearlyFull: string;
  full: string;
  overCapacity: string;
};

export interface CapacityDisplayConfig {
  mode: CapacityDisplayMode;
  showPercentage: boolean;
  showSpots: boolean;
  showWaitlist: boolean;
  showActions: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type CapacityChangeEvent = {
  rosterId: string;
  previousCapacity: RosterCapacityInfo | null;
  currentCapacity: RosterCapacityInfo;
  changeType: 'enrollment' | 'withdrawal' | 'capacity_update' | 'waitlist_promotion';
};

export type EnrollmentAttemptEvent = {
  rosterId: string;
  studentId: string;
  requestedAction: 'enroll' | 'waitlist';
  result: 'success' | 'capacity_exceeded' | 'error';
  finalStatus?: EnrollmentStatus;
  error?: string;
};

// ============================================================================
// FORM INTEGRATION TYPES
// ============================================================================

export interface CapacityValidatedFormProps {
  rosterId: string;
  onSubmit: (data: any) => void;
  children: ReactNode;
  validateCapacity?: boolean;
  showCapacityWarnings?: boolean;
  blockSubmissionWhenFull?: boolean;
}

export interface EnrollmentFormFieldProps {
  rosterId: string;
  studentIds: string[];
  onChange: (validStudents: string[], invalidStudents: string[]) => void;
  showCapacityFeedback?: boolean;
}