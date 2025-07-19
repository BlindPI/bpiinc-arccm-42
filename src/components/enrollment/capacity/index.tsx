/**
 * Enhanced Interactive Hover Overlays for Enrollment Capacity Management
 * Phase 3 Task 2: Interactive Capacity Elements in Hover Overlays
 * 
 * This module provides comprehensive hover overlay components with full interactive functionality
 * including enrollment actions, real-time updates, and accessibility features.
 */

// ============================================================================
// MAIN COMPONENTS
// ============================================================================

export { BaseHoverOverlay, MobileHoverOverlay } from './BaseHoverOverlay';
export type { BaseHoverOverlayRef } from './BaseHoverOverlay';

export { CapacityInfoOverlay, CalendarCapacityHover } from './CapacityInfoOverlay';
export type { CalendarCapacityHoverProps } from './CapacityInfoOverlay';

export { CapacityMetricsDisplay } from './CapacityMetricsDisplay';
export { CapacityStatusBadge } from './CapacityStatusBadge';

// ============================================================================
// INTERACTIVE COMPONENTS
// ============================================================================

export { 
  InteractiveActionButton as ActionButton,
  ActionButtonGroup,
  default as InteractiveActionButton
} from './InteractiveActions';

export type {
  ActionButtonProps,
  ActionButtonGroupProps,
  EnrollmentConfirmationDialogProps
} from './InteractiveActions';

// ============================================================================
// HOOKS AND UTILITIES
// ============================================================================

export {
  useRealTimeCapacityUpdates,
  useBasicCapacityUpdates,
  useHighFrequencyCapacityUpdates
} from './useRealTimeCapacityUpdates';

export type {
  RealTimeUpdateConfig,
  UseRealTimeCapacityUpdatesOptions,
  UseRealTimeCapacityUpdatesReturn
} from './useRealTimeCapacityUpdates';

// ============================================================================
// TYPES
// ============================================================================

export type {
  BaseHoverOverlayProps,
  CapacityInfoOverlayProps,
  SessionData,
  CapacityMetric,
  CapacityMetricsDisplayProps,
  WaitlistInfo,
  WaitlistDisplayProps,
  HoverOverlayState,
  HoverOverlayConfig,
  OverlayA11yProps,
  OverlayTheme,
  ResponsiveOverlayProps,
  CalendarIntegrationProps,
  OverlayManagerState,
  OverlayEvent,
  OverlayEventHandlers,
  OverlayPosition,
  OverlaySize,
  OverlayVariant,
  OverlayAnimation,
  OverlayPositionConfig
} from './HoverOverlayTypes';

// ============================================================================
// CONVENIENCE ALIASES
// ============================================================================

// Main calendar hover component for easy imports
export { CalendarCapacityHover as CalendarHover } from './CapacityInfoOverlay';

// Simplified component aliases
export { CapacityInfoOverlay as InfoOverlay } from './CapacityInfoOverlay';
export { CapacityMetricsDisplay as MetricsDisplay } from './CapacityMetricsDisplay';
export { CapacityStatusBadge as StatusBadge } from './CapacityStatusBadge';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Default configuration for real-time updates
 */
export const DEFAULT_REALTIME_CONFIG = {
  enabled: true,
  updateInterval: 30000, // 30 seconds
  autoRefreshOnActions: true,
  showNotifications: true
} as const;

/**
 * Mobile-optimized configuration
 */
export const MOBILE_REALTIME_CONFIG = {
  enabled: true,
  updateInterval: 60000, // 1 minute (less frequent for mobile)
  autoRefreshOnActions: true,
  showNotifications: false // Reduce notification noise on mobile
} as const;

/**
 * High-frequency configuration for admin dashboards
 */
export const ADMIN_REALTIME_CONFIG = {
  enabled: true,
  updateInterval: 15000, // 15 seconds
  autoRefreshOnActions: true,
  showNotifications: true
} as const;

// ============================================================================
// VERSION INFORMATION
// ============================================================================

export const COMPONENT_VERSION = '3.2.0';
export const LAST_UPDATED = '2025-01-19';

/**
 * Feature flags for the interactive hover overlay system
 */
export const FEATURES = {
  realTimeUpdates: true,
  keyboardNavigation: true,
  screenReaderSupport: true,
  mobileOptimization: true,
  confirmationDialogs: true,
  loadingStates: true,
  errorHandling: true,
  capacityValidation: true,
  waitlistManagement: true,
  batchOperations: false, // Future feature
  analytics: false,       // Future feature
  customThemes: false     // Future feature
} as const;

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

/**
 * ARIA live region priorities for announcements
 */
export const ARIA_LIVE_PRIORITIES = {
  POLITE: 'polite' as const,
  ASSERTIVE: 'assertive' as const,
  OFF: 'off' as const
};

/**
 * Standard ARIA roles for overlay elements
 */
export const ARIA_ROLES = {
  TOOLTIP: 'tooltip' as const,
  DIALOG: 'dialog' as const,
  MENU: 'menu' as const,
  MENUITEM: 'menuitem' as const,
  BUTTON: 'button' as const,
  REGION: 'region' as const
};

/**
 * Keyboard navigation key codes
 */
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
} as const;

// ============================================================================
// PERFORMANCE OPTIMIZATIONS
// ============================================================================

/**
 * Debounce configuration for various operations
 */
export const DEBOUNCE_CONFIG = {
  HOVER_DELAY: 500,        // ms before showing overlay
  HIDE_DELAY: 200,         // ms before hiding overlay
  SEARCH_DELAY: 300,       // ms for search input debouncing
  CAPACITY_UPDATE: 1000,   // ms for capacity update debouncing
  RESIZE_DELAY: 100        // ms for resize event debouncing
} as const;

/**
 * Default overlay positioning configuration
 */
export const DEFAULT_POSITION_CONFIG = {
  position: 'auto' as const,
  offset: 8,
  alignment: 'center' as const,
  autoFlip: true,
  boundary: null
};

// ============================================================================
// ERROR CODES
// ============================================================================

/**
 * Standardized error codes for the overlay system
 */
export const ERROR_CODES = {
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  STUDENT_NOT_FOUND: 'STUDENT_NOT_FOUND',
  ROSTER_NOT_FOUND: 'ROSTER_NOT_FOUND',
  ENROLLMENT_FAILED: 'ENROLLMENT_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example usage patterns for the interactive hover overlay system.
 * These are provided as reference implementations.
 */
export const USAGE_EXAMPLES = {
  basicCalendarHover: `
    <CalendarCapacityHover
      trigger={<div>January 15</div>}
      sessions={sessionsForDay}
      date="2025-01-15"
      userRole="INSTRUCTOR"
      studentId="student-123"
      onActionComplete={(action, sessionId, result) => {
        console.log('Action completed:', action, sessionId, result);
      }}
    />
  `,
  
  customActions: `
    <ActionButtonGroup
      session={session}
      userRole="ADMIN"
      studentId="student-123"
      actions={['enroll', 'edit', 'promote']}
      onActionComplete={(action, sessionId, result) => {
        handleActionComplete(action, sessionId, result);
      }}
    />
  `,
  
  realTimeUpdates: `
    const realTimeUpdates = useRealTimeCapacityUpdates({
      sessions: allSessions,
      config: ADMIN_REALTIME_CONFIG,
      onCapacityChange: handleCapacityChange
    });
  `
};

// Re-import for default export
import { CalendarCapacityHover } from './CapacityInfoOverlay';
import { CapacityInfoOverlay } from './CapacityInfoOverlay';
import { ActionButtonGroup } from './InteractiveActions';
import { useRealTimeCapacityUpdates } from './useRealTimeCapacityUpdates';

export default {
  CalendarCapacityHover,
  CapacityInfoOverlay,
  ActionButtonGroup,
  useRealTimeCapacityUpdates,
  FEATURES,
  DEFAULT_REALTIME_CONFIG
};