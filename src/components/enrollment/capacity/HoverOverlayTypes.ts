/**
 * TypeScript type definitions for enhanced hover overlay components
 * Phase 3 Task 1: Enhanced Calendar Hover Overlays
 */

import type { ReactNode } from 'react';
import type {
  CapacityStatus,
  RosterCapacityInfo,
  CapacityValidationResult
} from '@/types/roster-enrollment';
import type { DatabaseUserRole } from '@/types/database-roles';

// ============================================================================
// BASE HOVER OVERLAY TYPES
// ============================================================================

export interface BaseHoverOverlayProps {
  /** Trigger element that activates the overlay */
  trigger: ReactNode;
  /** Content to display in the overlay */
  children: ReactNode;
  /** Overlay position relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Delay before showing overlay (ms) */
  showDelay?: number;
  /** Delay before hiding overlay (ms) */
  hideDelay?: number;
  /** Whether overlay is disabled */
  disabled?: boolean;
  /** Custom styling classes */
  className?: string;
  /** Overlay container styling */
  overlayClassName?: string;
  /** Custom z-index for overlay */
  zIndex?: number;
  /** Whether to show on focus (accessibility) */
  showOnFocus?: boolean;
  /** Whether to keep overlay open on hover */
  keepOpenOnHover?: boolean;
  /** Maximum width of overlay */
  maxWidth?: number;
  /** Unique identifier for accessibility */
  id?: string;
  /** Aria label for accessibility */
  ariaLabel?: string;
  /** Callback when overlay is shown */
  onShow?: () => void;
  /** Callback when overlay is hidden */
  onHide?: () => void;
}

// ============================================================================
// CAPACITY INFO OVERLAY TYPES
// ============================================================================

export interface SessionData {
  id: string;
  title: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  description?: string;
  max_capacity?: number;
  roster_id?: string;
  capacity_info?: RosterCapacityInfo;
  capacity_status?: CapacityStatus;
  instructor_profiles?: {
    id: string;
    display_name: string;
    email: string;
  };
  location_details?: {
    id: string;
    name: string;
    address?: string;
    city: string;
    state: string;
  };
  session_enrollments?: Array<{
    id: string;
    enrollment_status: string;
    attendance_status: string;
    completion_status: string;
    student_enrollment_profiles?: {
      id: string;
      display_name: string;
      email: string;
    };
  }>;
  session_course?: {
    id: string;
    name: string;
    description?: string;
  };
}

export interface CapacityInfoOverlayProps {
  /** Session data to display */
  session: SessionData;
  /** Additional sessions for the same day */
  additionalSessions?: SessionData[];
  /** Show detailed capacity metrics */
  showDetailedMetrics?: boolean;
  /** Show waitlist information */
  showWaitlistInfo?: boolean;
  /** Show enrollment actions */
  showActions?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Custom styling */
  className?: string;
  /** User role for permission checks */
  userRole?: DatabaseUserRole;
  /** Student ID for enrollment actions */
  studentId?: string;
  /** Callback when action is triggered */
  onActionClick?: (action: string, sessionId: string) => void;
  /** Callback when action is completed successfully */
  onActionComplete?: (action: string, sessionId: string, result: any) => void;
  /** Callback when action fails */
  onActionError?: (action: string, sessionId: string, error: string) => void;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string;
}

// ============================================================================
// CAPACITY METRICS DISPLAY TYPES
// ============================================================================

export interface CapacityMetric {
  label: string;
  value: string | number;
  status?: 'success' | 'warning' | 'error' | 'info';
  icon?: ReactNode;
  tooltip?: string;
}

export interface CapacityMetricsDisplayProps {
  /** Capacity information */
  capacityInfo: RosterCapacityInfo;
  /** Capacity status */
  capacityStatus: CapacityStatus;
  /** Display mode */
  mode?: 'full' | 'compact' | 'minimal';
  /** Show percentage indicators */
  showPercentages?: boolean;
  /** Show progress bars */
  showProgressBars?: boolean;
  /** Show status indicators */
  showStatusIndicators?: boolean;
  /** Show waitlist metrics */
  showWaitlistMetrics?: boolean;
  /** Custom metrics to display */
  customMetrics?: CapacityMetric[];
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Custom styling */
  className?: string;
  /** Animation enabled */
  animated?: boolean;
}

// ============================================================================
// WAITLIST INFO TYPES
// ============================================================================

export interface WaitlistInfo {
  total: number;
  position?: number;
  estimatedPromotion?: string;
  recentActivity?: Array<{
    id: string;
    action: 'added' | 'promoted' | 'removed';
    timestamp: string;
    studentName?: string;
  }>;
}

export interface WaitlistDisplayProps {
  /** Waitlist information */
  waitlistInfo: WaitlistInfo;
  /** Show position if available */
  showPosition?: boolean;
  /** Show recent activity */
  showActivity?: boolean;
  /** Show estimated promotion time */
  showEstimation?: boolean;
  /** Compact display */
  compact?: boolean;
  /** Custom styling */
  className?: string;
}

// ============================================================================
// HOVER OVERLAY STATE TYPES
// ============================================================================

export interface HoverOverlayState {
  isVisible: boolean;
  isLoading: boolean;
  error?: string;
  position: {
    x: number;
    y: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  triggerRect?: DOMRect;
}

export interface HoverOverlayConfig {
  /** Animation duration in ms */
  animationDuration: number;
  /** Show delay in ms */
  showDelay: number;
  /** Hide delay in ms */
  hideDelay: number;
  /** Maximum overlay width */
  maxWidth: number;
  /** Offset from trigger element */
  offset: number;
  /** Enable animations */
  enableAnimations: boolean;
  /** Enable accessibility features */
  enableA11y: boolean;
  /** Mobile breakpoint */
  mobileBreakpoint: number;
}

// ============================================================================
// ACCESSIBILITY TYPES
// ============================================================================

export interface OverlayA11yProps {
  /** ARIA role */
  role?: string;
  /** ARIA label */
  ariaLabel?: string;
  /** ARIA described by */
  ariaDescribedBy?: string;
  /** ARIA live region */
  ariaLive?: 'off' | 'polite' | 'assertive';
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Focus management */
  focusManagement?: boolean;
  /** Screen reader announcements */
  announcements?: boolean;
}

// ============================================================================
// THEME AND STYLING TYPES
// ============================================================================

export interface OverlayTheme {
  /** Background color */
  background: string;
  /** Border color */
  border: string;
  /** Text color */
  text: string;
  /** Shadow */
  shadow: string;
  /** Border radius */
  borderRadius: string;
  /** Z-index */
  zIndex: number;
}

export interface ResponsiveOverlayProps {
  /** Desktop configuration */
  desktop?: Partial<BaseHoverOverlayProps>;
  /** Tablet configuration */
  tablet?: Partial<BaseHoverOverlayProps>;
  /** Mobile configuration */
  mobile?: Partial<BaseHoverOverlayProps>;
  /** Current breakpoint */
  currentBreakpoint?: 'desktop' | 'tablet' | 'mobile';
}

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

export interface CalendarIntegrationProps {
  /** Calendar day date string */
  date: string;
  /** Sessions for the day */
  sessions: SessionData[];
  /** Calendar cell index */
  cellIndex: number;
  /** Calendar grid dimensions */
  gridDimensions: {
    rows: number;
    cols: number;
  };
  /** Calendar container ref */
  containerRef?: React.RefObject<HTMLElement>;
}

export interface OverlayManagerState {
  /** Currently active overlay */
  activeOverlay?: string;
  /** Overlay registry */
  overlays: Map<string, HoverOverlayState>;
  /** Global configuration */
  globalConfig: HoverOverlayConfig;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type OverlayEvent = 
  | { type: 'show'; overlayId: string }
  | { type: 'hide'; overlayId: string }
  | { type: 'toggle'; overlayId: string }
  | { type: 'position'; overlayId: string; position: { x: number; y: number } }
  | { type: 'resize'; overlayId: string; dimensions: { width: number; height: number } };

export interface OverlayEventHandlers {
  onShow?: (overlayId: string) => void;
  onHide?: (overlayId: string) => void;
  onPositionChange?: (overlayId: string, position: { x: number; y: number }) => void;
  onResize?: (overlayId: string, dimensions: { width: number; height: number }) => void;
  onError?: (overlayId: string, error: string) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type OverlayPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';
export type OverlaySize = 'sm' | 'md' | 'lg' | 'xl' | 'auto';
export type OverlayVariant = 'default' | 'card' | 'tooltip' | 'popover' | 'modal';
export type OverlayAnimation = 'fade' | 'slide' | 'scale' | 'none';

export interface OverlayPositionConfig {
  position: OverlayPosition;
  offset: number;
  alignment?: 'start' | 'center' | 'end';
  autoFlip?: boolean;
  boundary?: HTMLElement | null;
}