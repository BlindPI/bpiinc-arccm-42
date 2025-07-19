import React, { useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar,
  Clock, 
  Users, 
  MapPin,
  User,
  BookOpen,
  UserPlus,
  Edit3,
  ExternalLink,
  AlertTriangle,
  Info,
  ChevronRight,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaseHoverOverlay } from './BaseHoverOverlay';
import { CapacityMetricsDisplay } from './CapacityMetricsDisplay';
import { CapacityStatusBadge } from './CapacityStatusBadge';
import { ActionButtonGroup } from './InteractiveActions';
import { useRealTimeCapacityUpdates } from './useRealTimeCapacityUpdates';
import type {
  CapacityInfoOverlayProps,
  SessionData
} from './HoverOverlayTypes';
import type { DatabaseUserRole } from '@/types/database-roles';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatTime = (time: string): string => {
  try {
    // Handle different time formats
    if (time.includes(':')) {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const min = minutes.padStart(2, '0');
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${min} ${period}`;
    }
    return time;
  } catch {
    return time;
  }
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
};

const getSessionDuration = (startTime: string, endTime: string): string => {
  try {
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0 && diffMinutes > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      return `${diffMinutes}m`;
    }
  } catch {
    return 'Duration unknown';
  }
};

const hasPermissionToEnroll = (userRole?: DatabaseUserRole): boolean => {
  if (!userRole) return false;
  return ['SA', 'AD', 'IN'].includes(userRole);
};

const hasPermissionToEdit = (userRole?: DatabaseUserRole): boolean => {
  if (!userRole) return false;
  return ['SA', 'AD', 'IN'].includes(userRole);
};

// ============================================================================
// SESSION CARD COMPONENT
// ============================================================================

interface SessionCardProps {
  session: SessionData;
  isMain?: boolean;
  compact?: boolean;
  showActions?: boolean;
  userRole?: DatabaseUserRole;
  studentId?: string;
  onActionClick?: (action: string, sessionId: string) => void;
  onActionComplete?: (action: string, sessionId: string, result: any) => void;
  onActionError?: (action: string, sessionId: string, error: string) => void;
  /** REAL INSTRUCTOR SYSTEM INTEGRATION CALLBACKS */
  onViewDetails?: (sessionId: string, sessionDate: string) => void;
  onEditSession?: (session: SessionData) => void;
  onEnrollStudent?: (sessionId: string, studentId: string) => Promise<any>;
  onReloadData?: () => Promise<void>;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  isMain = false,
  compact = false,
  showActions = false,
  userRole,
  studentId,
  onActionClick,
  onActionComplete,
  onActionError,
  // REAL INSTRUCTOR SYSTEM INTEGRATION CALLBACKS
  onViewDetails,
  onEditSession,
  onEnrollStudent,
  onReloadData
}) => {
  const enrollmentCount = session.session_enrollments?.length || 0;
  const hasCapacityInfo = session.capacity_info && session.capacity_status;
  
  return (
    <div className={cn(
      'border rounded-lg p-3 space-y-2',
      isMain ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white',
      compact && 'p-2 space-y-1'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold truncate',
            compact ? 'text-sm' : 'text-base',
            isMain && 'text-primary'
          )}>
            {session.title}
          </h3>
          
          {/* Time and Duration */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>
              {formatTime(session.start_time)} - {formatTime(session.end_time)}
            </span>
            <span className="text-gray-400">•</span>
            <span>{getSessionDuration(session.start_time, session.end_time)}</span>
          </div>
          
          {/* Location */}
          {session.location_details && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {session.location_details.name}, {session.location_details.city}
              </span>
            </div>
          )}
        </div>
        
        {/* Status and Capacity */}
        <div className="flex flex-col items-end gap-1 ml-2">
          <Badge variant="outline" className="text-xs">
            {session.status.replace('_', ' ')}
          </Badge>
          
          {hasCapacityInfo && (
            <CapacityStatusBadge
              status={session.capacity_status}
              capacityInfo={session.capacity_info}
              showSpots={!compact}
              size="sm"
            />
          )}
        </div>
      </div>
      
      {/* Instructor */}
      {session.instructor_profiles && !compact && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{session.instructor_profiles.display_name}</span>
        </div>
      )}
      
      {/* Course */}
      {session.session_course && !compact && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <BookOpen className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{session.session_course.name}</span>
        </div>
      )}
      
      {/* Description */}
      {session.description && !compact && (
        <div className="text-xs text-muted-foreground line-clamp-2">
          {session.description}
        </div>
      )}
      
      {/* Capacity Metrics */}
      {hasCapacityInfo && !compact && (
        <div className="pt-2 border-t border-gray-100">
          <CapacityMetricsDisplay
            capacityInfo={session.capacity_info}
            capacityStatus={session.capacity_status}
            mode="compact"
            showPercentages={true}
            showProgressBars={true}
            showStatusIndicators={false}
            orientation="horizontal"
            className="text-xs"
          />
        </div>
      )}
      
      {/* Interactive Actions */}
      {showActions && !compact && (
        <div className="pt-2 border-t border-gray-100">
          <ActionButtonGroup
            session={session}
            userRole={userRole}
            studentId={studentId}
            actions={['enroll', 'view', 'edit']}
            compact={compact}
            onActionComplete={onActionComplete}
            onActionError={onActionError}
            // PASS THROUGH REAL INSTRUCTOR SYSTEM INTEGRATION CALLBACKS
            onViewDetails={onViewDetails}
            onEditSession={onEditSession}
            onEnrollStudent={onEnrollStudent}
            onReloadData={onReloadData}
          />
        </div>
      )}
      
      {/* Enrollment Count for Compact Mode */}
      {compact && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{enrollmentCount} enrolled</span>
          </div>
          {hasCapacityInfo && session.capacity_info.max_capacity && (
            <span>/ {session.capacity_info.max_capacity}</span>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

const LoadingState: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={cn('space-y-3', compact && 'space-y-2')}>
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    {!compact && (
      <>
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </>
    )}
  </div>
);

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

const ErrorState: React.FC<{ error: string; compact?: boolean }> = ({ error, compact = false }) => (
  <Alert variant="destructive" className={cn(compact && 'text-xs')}>
    <AlertTriangle className={cn('h-4 w-4', compact && 'h-3 w-3')} />
    <AlertDescription className={cn(compact && 'text-xs')}>
      <span className="font-medium">Unable to load session details</span>
      <br className={cn(compact && 'hidden')} />
      <span className={cn(compact && 'sr-only')}>{error}</span>
    </AlertDescription>
  </Alert>
);

// ============================================================================
// MAIN CAPACITY INFO OVERLAY COMPONENT
// ============================================================================

export const CapacityInfoOverlay: React.FC<CapacityInfoOverlayProps> = ({
  session,
  additionalSessions = [],
  showDetailedMetrics = true,
  showWaitlistInfo = true,
  showActions = true,
  compact = false,
  className,
  userRole,
  studentId,
  onActionClick,
  onActionComplete,
  onActionError,
  isLoading = false,
  error,
  // REAL INSTRUCTOR SYSTEM INTEGRATION CALLBACKS
  onViewDetails,
  onEditSession,
  onEnrollStudent,
  onReloadData
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(session.id);
  
  // Real-time capacity updates
  const allSessions = [session, ...additionalSessions];
  const realTimeUpdates = useRealTimeCapacityUpdates({
    sessions: allSessions,
    config: {
      enabled: !compact, // Disable for compact mode to reduce API calls
      updateInterval: compact ? 0 : 30000, // 30 seconds for full mode
      autoRefreshOnActions: true,
      showNotifications: !compact
    },
    onCapacityChange: useCallback((sessionId: string, newCapacityInfo: any) => {
      // Optional: Handle capacity change notifications
      console.log(`Capacity updated for session ${sessionId}:`, newCapacityInfo);
    }, []),
    onUpdateError: useCallback((error: string) => {
      console.error('Capacity update error:', error);
      onActionError?.('capacity_update', selectedSessionId, error);
    }, [onActionError, selectedSessionId])
  });

  // Enhanced action handlers with real-time updates
  const handleActionComplete = useCallback((action: string, sessionId: string, result: any) => {
    // Call real-time update handler
    realTimeUpdates.handleActionComplete(action, sessionId, result);
    
    // Call original handler
    onActionComplete?.(action, sessionId, result);
  }, [realTimeUpdates, onActionComplete]);

  const handleActionError = useCallback((action: string, sessionId: string, error: string) => {
    // Call real-time update handler
    realTimeUpdates.handleActionError(action, sessionId, error);
    
    // Call original handler
    onActionError?.(action, sessionId, error);
  }, [realTimeUpdates, onActionError]);
  
  // Get the currently selected session
  const selectedSession = useMemo(() => {
    if (selectedSessionId === session.id) return session;
    return additionalSessions.find(s => s.id === selectedSessionId) || session;
  }, [selectedSessionId, session, additionalSessions]);
  
  // Calculate total sessions for the day
  const totalSessions = 1 + additionalSessions.length;
  const hasMultipleSessions = totalSessions > 1;
  
  // Content to display
  const content = useMemo(() => {
    if (isLoading) {
      return <LoadingState compact={compact} />;
    }
    
    if (error) {
      return <ErrorState error={error} compact={compact} />;
    }
    
    return (
      <div className={cn('space-y-4', compact && 'space-y-3')}>
        {/* Date Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className={cn('h-4 w-4 text-primary', compact && 'h-3 w-3')} />
            <span className={cn('font-medium text-primary', compact && 'text-sm')}>
              {formatDate(selectedSession.booking_date)}
            </span>
          </div>
          
          {hasMultipleSessions && (
            <Badge variant="secondary" className={cn(compact && 'text-xs')}>
              {totalSessions} session{totalSessions === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
        
        {/* Session Selection Tabs */}
        {hasMultipleSessions && !compact && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedSessionId(session.id)}
              className={cn(
                'px-2 py-1 text-xs rounded border transition-colors',
                selectedSessionId === session.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              )}
            >
              {session.title}
            </button>
            
            {additionalSessions.map((additionalSession) => (
              <button
                key={additionalSession.id}
                onClick={() => setSelectedSessionId(additionalSession.id)}
                className={cn(
                  'px-2 py-1 text-xs rounded border transition-colors',
                  selectedSessionId === additionalSession.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                )}
              >
                {additionalSession.title}
              </button>
            ))}
          </div>
        )}
        
        {/* Main Session Card */}
        <SessionCard
          session={selectedSession}
          isMain={true}
          compact={compact}
          showActions={showActions}
          userRole={userRole}
          studentId={studentId}
          onActionClick={onActionClick}
          onActionComplete={handleActionComplete}
          onActionError={handleActionError}
          // PASS THROUGH REAL INSTRUCTOR SYSTEM INTEGRATION CALLBACKS
          onViewDetails={onViewDetails}
          onEditSession={onEditSession}
          onEnrollStudent={onEnrollStudent}
          onReloadData={onReloadData}
        />
        
        {/* Additional Sessions (Compact) */}
        {hasMultipleSessions && compact && (
          <div className="space-y-2">
            <Separator />
            <div className="text-xs font-medium text-muted-foreground">
              Other sessions today:
            </div>
            
            {[session, ...additionalSessions]
              .filter(s => s.id !== selectedSessionId)
              .slice(0, 2)
              .map((otherSession) => (
                <SessionCard
                  key={otherSession.id}
                  session={otherSession}
                  compact={true}
                  showActions={false}
                />
              ))}
            
            {totalSessions > 3 && (
              <div className="text-xs text-muted-foreground text-center">
                +{totalSessions - 3} more session{totalSessions - 3 === 1 ? '' : 's'}
              </div>
            )}
          </div>
        )}
        
        {/* Detailed Metrics */}
        {showDetailedMetrics && !compact && selectedSession.capacity_info && selectedSession.capacity_status && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Capacity Details
              </h4>
              <CapacityMetricsDisplay
                capacityInfo={selectedSession.capacity_info}
                capacityStatus={selectedSession.capacity_status}
                mode="full"
                showPercentages={true}
                showProgressBars={true}
                showStatusIndicators={true}
                showWaitlistMetrics={showWaitlistInfo}
                orientation="vertical"
              />
            </div>
          </>
        )}
        
        {/* Critical Alerts */}
        {selectedSession.capacity_status === 'OVER_CAPACITY' && (
          <Alert variant="destructive" className={cn(compact && 'text-xs')}>
            <AlertTriangle className={cn('h-4 w-4', compact && 'h-3 w-3')} />
            <AlertDescription className={cn(compact && 'text-xs')}>
              <span className="font-medium">Critical: Over Capacity</span>
              <br className={cn(compact && 'hidden')} />
              <span className={cn(compact && 'sr-only')}>
                This session requires immediate attention.
              </span>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Info Footer */}
        {!compact && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-gray-100">
            <Info className="h-3 w-3" />
            <span>Click session title to view details</span>
            {hasMultipleSessions && (
              <>
                <span>•</span>
                <span>Switch tabs to view other sessions</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  }, [
    isLoading,
    error,
    compact,
    selectedSession,
    hasMultipleSessions,
    totalSessions,
    session,
    additionalSessions,
    selectedSessionId,
    showDetailedMetrics,
    showWaitlistInfo,
    showActions,
    userRole,
    onActionClick
  ]);
  
  return (
    <div className={cn('min-w-0', className)} style={{ maxWidth: compact ? '300px' : '400px' }}>
      {content}
    </div>
  );
};

// ============================================================================
// CALENDAR INTEGRATED HOVER OVERLAY
// ============================================================================

export interface CalendarCapacityHoverProps {
  /** Trigger element (usually a calendar day cell) */
  trigger: React.ReactNode;
  /** Sessions for the day */
  sessions: SessionData[];
  /** Date string for the day */
  date: string;
  /** User role for permissions */
  userRole?: DatabaseUserRole;
  /** Student ID for enrollment actions */
  studentId?: string;
  /** Callback for action clicks */
  onActionClick?: (action: string, sessionId: string) => void;
  /** Callback when action is completed successfully */
  onActionComplete?: (action: string, sessionId: string, result: any) => void;
  /** Callback when action fails */
  onActionError?: (action: string, sessionId: string, error: string) => void;
  /** Custom styling */
  className?: string;
  /** Overlay positioning */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  /** Compact mode for mobile */
  compact?: boolean;
  /** Show delay */
  showDelay?: number;
  /** Hide delay */
  hideDelay?: number;
  /** Disabled state */
  disabled?: boolean;
  
  /** REAL INSTRUCTOR SYSTEM INTEGRATION CALLBACKS */
  /** Real view details function - sets selected day to show session details */
  onViewDetails?: (sessionId: string, sessionDate: string) => void;
  /** Real edit session function - opens session editor modal */
  onEditSession?: (session: SessionData) => void;
  /** Real enrollment function - connects to instructor system enrollment */
  onEnrollStudent?: (sessionId: string, studentId: string) => Promise<any>;
  /** Real reload function - refreshes instructor system data */
  onReloadData?: () => Promise<void>;
}

export const CalendarCapacityHover: React.FC<CalendarCapacityHoverProps> = ({
  trigger,
  sessions,
  date,
  userRole,
  studentId,
  onActionClick,
  onActionComplete,
  onActionError,
  className,
  position = 'auto',
  compact = false,
  showDelay = 500,
  hideDelay = 200,
  disabled = false,
  // REAL INSTRUCTOR SYSTEM INTEGRATION CALLBACKS
  onViewDetails,
  onEditSession,
  onEnrollStudent,
  onReloadData
}) => {
  // Don't show overlay if no sessions
  if (!sessions || sessions.length === 0 || disabled) {
    return <>{trigger}</>;
  }
  
  const mainSession = sessions[0];
  const additionalSessions = sessions.slice(1);
  
  return (
    <BaseHoverOverlay
      trigger={trigger}
      position={position}
      showDelay={showDelay}
      hideDelay={hideDelay}
      maxWidth={compact ? 320 : 420}
      className={className}
      ariaLabel={`Session details for ${date}: ${sessions.length} session${sessions.length === 1 ? '' : 's'}`}
      keepOpenOnHover={true}
      showOnFocus={true}
    >
      <CapacityInfoOverlay
        session={mainSession}
        additionalSessions={additionalSessions}
        showDetailedMetrics={!compact}
        showWaitlistInfo={!compact}
        showActions={!compact}
        compact={compact}
        userRole={userRole}
        studentId={studentId}
        onActionClick={onActionClick}
        onActionComplete={onActionComplete}
        onActionError={onActionError}
        // PASS THROUGH REAL INSTRUCTOR SYSTEM INTEGRATION CALLBACKS
        onViewDetails={onViewDetails}
        onEditSession={onEditSession}
        onEnrollStudent={onEnrollStudent}
        onReloadData={onReloadData}
      />
    </BaseHoverOverlay>
  );
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default CapacityInfoOverlay;