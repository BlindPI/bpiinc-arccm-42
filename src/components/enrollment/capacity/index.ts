/**
 * Enrollment capacity management components
 *
 * These components integrate with the roster capacity management backend services
 * to provide real-time capacity validation and user feedback for enrollment processes.
 */

export { RosterCapacityDisplay, CapacityIndicator, CapacityProgressBar } from './RosterCapacityDisplay';
export { EnrollmentCapacityGuard, SimpleCapacityGuard, InlineCapacityGuard } from './EnrollmentCapacityGuard';
export { WaitlistOfferComponent, WaitlistButton, WaitlistOfferDialog } from './WaitlistOfferComponent';
export { CapacityStatusBadge, getCapacityStatus, getStatusVariant, getStatusConfig } from './CapacityStatusBadge';

// Re-export types for convenience
export type {
  RosterCapacityDisplayProps,
  EnrollmentCapacityGuardProps,
  WaitlistOfferComponentProps,
  CapacityStatusBadgeProps,
  BaseCapacityComponentProps,
  EnrollmentActionProps,
  CapacityValidationProps,
  CapacityDisplayMode,
  CapacityTheme,
  CapacityDisplayConfig,
  CapacityChangeEvent,
  EnrollmentAttemptEvent,
  CapacityValidatedFormProps,
  EnrollmentFormFieldProps
} from './types';