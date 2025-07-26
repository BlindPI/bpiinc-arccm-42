/**
 * Enrollment capacity management components
 *
 * These components integrate with the roster capacity management backend services
 * to provide real-time capacity validation and user feedback for enrollment processes.
 *
 * Phase 2: Core capacity management components
 * Phase 3: Enhanced hover overlay components for calendar integration
 */

// ============================================================================
// PHASE 2: CORE CAPACITY COMPONENTS
// ============================================================================

export { RosterCapacityDisplay, CapacityIndicator, CapacityProgressBar } from './RosterCapacityDisplay';
export { EnrollmentCapacityGuard, SimpleCapacityGuard, InlineCapacityGuard } from './EnrollmentCapacityGuard';
export { WaitlistOfferComponent, WaitlistButton, WaitlistOfferDialog } from './WaitlistOfferComponent';
export { CapacityStatusBadge, getCapacityStatus, getStatusVariant, getStatusConfig } from './CapacityStatusBadge';

// ============================================================================
// PHASE 3: ENHANCED HOVER OVERLAY COMPONENTS
// ============================================================================

// Base hover overlay components
export { BaseHoverOverlay, MobileHoverOverlay } from './BaseHoverOverlay';
export type { BaseHoverOverlayRef } from './BaseHoverOverlay';

// Capacity metrics display components
export {
  CapacityMetricsDisplay,
  WaitlistDisplay,
  CapacityTrends
} from './CapacityMetricsDisplay';

// Main capacity info overlay components
export {
  CapacityInfoOverlay,
  CalendarCapacityHover
} from './CapacityInfoOverlay';

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Phase 2 types
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

// Phase 3 hover overlay types
export type {
  // Base hover overlay types
  BaseHoverOverlayProps,
  HoverOverlayState,
  HoverOverlayConfig,
  OverlayA11yProps,
  OverlayTheme,
  ResponsiveOverlayProps,
  OverlayPositionConfig,
  
  // Session and capacity types
  SessionData,
  CapacityInfoOverlayProps,
  CapacityMetric,
  CapacityMetricsDisplayProps,
  WaitlistInfo,
  WaitlistDisplayProps,
  
  // Calendar integration types
  CalendarIntegrationProps,
  OverlayManagerState,
  
  // Event and utility types
  OverlayEvent,
  OverlayEventHandlers,
  OverlayPosition,
  OverlaySize,
  OverlayVariant,
  OverlayAnimation
} from './HoverOverlayTypes';

// ============================================================================
// CONVENIENCE RE-EXPORTS
// ============================================================================

// Main components most commonly used - using direct aliases
export { CapacityStatusBadge as CapacityBadge } from './CapacityStatusBadge';
export { EnrollmentCapacityGuard as CapacityGuard } from './EnrollmentCapacityGuard';
export { RosterCapacityDisplay as CapacityDisplay } from './RosterCapacityDisplay';
export { CalendarCapacityHover as CalendarHover } from './CapacityInfoOverlay';
export { CapacityInfoOverlay as InfoOverlay } from './CapacityInfoOverlay';
export { CapacityMetricsDisplay as MetricsDisplay } from './CapacityMetricsDisplay';