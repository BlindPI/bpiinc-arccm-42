import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  UserPlus,
  UserCheck,
  UserX,
  Users,
  Edit3,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRosterCapacityValidation } from '@/hooks/useRosterCapacityValidation';
import RosterEnrollmentService from '@/services/enrollment/rosterEnrollmentService';
import type {
  SessionData
} from './HoverOverlayTypes';
import type { DatabaseUserRole } from '@/types/database-roles';
import type { CapacityStatus } from '@/types/roster-enrollment';

// ============================================================================
// TYPES
// ============================================================================

export interface ActionButtonProps {
  /** Action type */
  action: 'enroll' | 'waitlist' | 'view' | 'edit' | 'promote';
  /** Session data */
  session: SessionData;
  /** User role for permissions */
  userRole?: DatabaseUserRole;
  /** Student ID (for enrollment actions) */
  studentId?: string;
  /** Custom button text */
  buttonText?: string;
  /** Button size */
  size?: 'sm' | 'lg' | 'default' | 'xl' | 'icon';
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Compact display */
  compact?: boolean;
  /** Callback for completion */
  onComplete?: (result: any) => void;
  /** Callback for error */
  onError?: (error: string) => void;
  /** Custom styling */
  className?: string;
}

export interface EnrollmentConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'enroll' | 'waitlist' | 'view' | 'edit' | 'promote';
  session: SessionData;
  studentInfo?: {
    id: string;
    name: string;
    email: string;
  };
  onConfirm: () => void;
  isLoading: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const hasPermissionToEnroll = (userRole?: DatabaseUserRole): boolean => {
  if (!userRole) return false;
  return ['SA', 'AD', 'AP'].includes(userRole);
};

const hasPermissionToEdit = (userRole?: DatabaseUserRole): boolean => {
  if (!userRole) return false;
  return ['SA', 'AD', 'AP'].includes(userRole);
};

const canEnrollInSession = (session: SessionData): boolean => {
  if (!session.capacity_info) return true; // Assume enrollable if no capacity info
  return session.capacity_info.can_enroll || false;
};

const getActionIcon = (action: string, isLoading: boolean = false) => {
  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin" />;
  
  switch (action) {
    case 'enroll': return <UserPlus className="h-3 w-3" />;
    case 'waitlist': return <Clock className="h-3 w-3" />;
    case 'view': return <ExternalLink className="h-3 w-3" />;
    case 'edit': return <Edit3 className="h-3 w-3" />;
    case 'promote': return <UserCheck className="h-3 w-3" />;
    default: return <Info className="h-3 w-3" />;
  }
};

const getActionText = (action: string, session: SessionData): string => {
  switch (action) {
    case 'enroll':
      return canEnrollInSession(session) ? 'Quick Enroll' : 'Join Waitlist';
    case 'waitlist':
      return 'Join Waitlist';
    case 'view':
      return 'View Details';
    case 'edit':
      return 'Edit Session';
    case 'promote':
      return 'Promote from Waitlist';
    default:
      return 'Action';
  }
};

// ============================================================================
// CONFIRMATION DIALOG COMPONENT
// ============================================================================

const EnrollmentConfirmationDialog: React.FC<EnrollmentConfirmationDialogProps> = ({
  open,
  onOpenChange,
  action,
  session,
  studentInfo,
  onConfirm,
  isLoading
}) => {
  const isWaitlist = action === 'waitlist' || !canEnrollInSession(session);
  const actionText = isWaitlist ? 'join the waitlist for' : 'enroll in';
  const title = isWaitlist ? 'Join Waitlist' : 'Confirm Enrollment';
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {getActionIcon(action, isLoading)}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to {actionText} <strong>{session.title}</strong>?
            </p>
            
            {/* Session Details */}
            <div className="text-sm bg-gray-50 p-3 rounded-lg space-y-2">
              <div><strong>Date:</strong> {new Date(session.booking_date).toLocaleDateString()}</div>
              <div><strong>Time:</strong> {session.start_time} - {session.end_time}</div>
              {session.location_details && (
                <div><strong>Location:</strong> {session.location_details.name}</div>
              )}
              {session.capacity_info && (
                <div className="flex items-center gap-2">
                  <strong>Capacity:</strong>
                  <Badge variant={isWaitlist ? 'destructive' : 'default'} className="text-xs">
                    {session.capacity_info.current_enrollment} / {session.capacity_info.max_capacity || '∞'}
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Student Info */}
            {studentInfo && (
              <div className="text-sm bg-blue-50 p-3 rounded-lg">
                <div><strong>Student:</strong> {studentInfo.name}</div>
                <div className="text-gray-600">{studentInfo.email}</div>
              </div>
            )}
            
            {/* Waitlist Warning */}
            {isWaitlist && (
              <Alert variant="default" className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  This session is at capacity. The student will be added to the waitlist 
                  and notified if a spot becomes available.
                </AlertDescription>
              </Alert>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'min-w-[100px]',
              isWaitlist && 'bg-orange-600 hover:bg-orange-700'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {getActionIcon(action)}
                <span className="ml-2">
                  {isWaitlist ? 'Join Waitlist' : 'Confirm Enrollment'}
                </span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// ============================================================================
// MAIN ACTION BUTTON COMPONENT
// ============================================================================

export const InteractiveActionButton: React.FC<ActionButtonProps> = ({
  action,
  session,
  userRole,
  studentId,
  buttonText,
  size = 'sm',
  variant = 'outline',
  disabled = false,
  loading = false,
  compact = false,
  onComplete,
  onError,
  className
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use capacity validation hook if we have a roster_id
  const capacityValidation = useRosterCapacityValidation({
    rosterId: session.roster_id || '',
    autoRefresh: true
  });

  // Check permissions
  const canPerformAction = useCallback(() => {
    switch (action) {
      case 'enroll':
      case 'waitlist':
        return hasPermissionToEnroll(userRole) && studentId;
      case 'edit':
        return hasPermissionToEdit(userRole);
      case 'view':
        return true; // Anyone can view details
      case 'promote':
        return hasPermissionToEdit(userRole);
      default:
        return false;
    }
  }, [action, userRole, studentId]);

  // Handle action execution
  const handleAction = useCallback(async () => {
    if (!canPerformAction() || !studentId) {
      onError?.('Insufficient permissions or missing student information');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let result;
      
      switch (action) {
        case 'enroll':
        case 'waitlist':
          if (!session.roster_id) {
            throw new Error('Session roster ID not found');
          }
          
          if (!userRole) {
            throw new Error('User role is required for enrollment');
          }
          
          result = await RosterEnrollmentService.enrollStudentWithCapacityCheck({
            rosterId: session.roster_id,
            studentId,
            enrolledBy: userRole,
            userRole: userRole,
            enrollmentType: 'standard',
            notes: `Enrolled via hover overlay on ${new Date().toISOString()}`
          });
          
          if (!result.success) {
            throw new Error(result.error || 'Enrollment failed');
          }
          
          // Show success toast
          const enrollmentStatus = result.results.enrollment?.enrollment_status;
          const message = enrollmentStatus === 'waitlisted' 
            ? 'Student added to waitlist successfully'
            : 'Student enrolled successfully';
          
          toast.success(message, {
            description: `${session.title} - ${new Date(session.booking_date).toLocaleDateString()}`
          });
          
          // Refresh capacity data
          capacityValidation.refetch();
          
          break;
          
        case 'promote':
          if (!session.roster_id) {
            throw new Error('Session roster ID not found');
          }
          
          if (!userRole) {
            throw new Error('User role is required for waitlist promotion');
          }
          
          result = await capacityValidation.promoteFromWaitlist({
            promotedBy: userRole,
            userRole: userRole,
            maxPromotions: 1,
            specificStudentId: studentId
          });
          
          break;
          
        case 'view':
          // Open session details (this would typically navigate or open a modal)
          window.open(`/sessions/${session.id}`, '_blank');
          result = { success: true, message: 'Opening session details' };
          break;
          
        case 'edit':
          // Open session edit dialog/page
          window.open(`/sessions/${session.id}/edit`, '_blank');
          result = { success: true, message: 'Opening session editor' };
          break;
          
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      
      onComplete?.(result);
      
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setShowConfirmation(false);
    }
  }, [action, session, studentId, userRole, canPerformAction, onComplete, onError, capacityValidation]);

  // Handle button click
  const handleClick = useCallback(() => {
    if (action === 'enroll' || action === 'waitlist' || action === 'promote') {
      setShowConfirmation(true);
    } else {
      handleAction();
    }
  }, [action, handleAction]);

  // Don't render if user doesn't have permission
  if (!canPerformAction()) {
    return null;
  }

  const finalText = buttonText || getActionText(action, session);
  const isLoading = loading || isProcessing || capacityValidation.isEnrolling;
  
  // Determine if this should be a waitlist action
  const shouldBeWaitlist = action === 'enroll' && !canEnrollInSession(session);
  const finalAction = shouldBeWaitlist ? 'waitlist' : action;
  
  return (
    <>
      <Button
        size={size}
        variant={variant}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={cn(
          'text-xs h-7 transition-all duration-200',
          compact && 'h-6 px-2 text-xs',
          finalAction === 'waitlist' && 'border-orange-300 text-orange-700 hover:bg-orange-50',
          finalAction === 'enroll' && 'border-green-300 text-green-700 hover:bg-green-50',
          className
        )}
      >
        {getActionIcon(finalAction, isLoading)}
        <span className="ml-1">{finalText}</span>
      </Button>

      {/* Confirmation Dialog */}
      <EnrollmentConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        action={finalAction}
        session={session}
        studentInfo={undefined}
        onConfirm={handleAction}
        isLoading={isProcessing}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mt-2">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </>
  );
};

// ============================================================================
// ACTION BUTTON GROUP COMPONENT
// ============================================================================

export interface ActionButtonGroupProps {
  session: SessionData;
  userRole?: DatabaseUserRole;
  studentId?: string;
  actions?: Array<'enroll' | 'waitlist' | 'view' | 'edit' | 'promote'>;
  compact?: boolean;
  orientation?: 'horizontal' | 'vertical';
  onActionComplete?: (action: string, sessionId: string, result: any) => void;
  onActionError?: (action: string, sessionId: string, error: string) => void;
  className?: string;
}

export const ActionButtonGroup: React.FC<ActionButtonGroupProps> = ({
  session,
  userRole,
  studentId,
  actions = ['enroll', 'view', 'edit'],
  compact = false,
  orientation = 'horizontal',
  onActionComplete,
  onActionError,
  className
}) => {
  const handleComplete = useCallback((action: string) => (result: any) => {
    onActionComplete?.(action, session.id, result);
  }, [onActionComplete, session.id]);

  const handleError = useCallback((action: string) => (error: string) => {
    onActionError?.(action, session.id, error);
  }, [onActionError, session.id]);

  const filteredActions = actions.filter(action => {
    // Filter out actions based on permissions and session state
    switch (action) {
      case 'enroll':
      case 'waitlist':
        return hasPermissionToEnroll(userRole) && studentId;
      case 'edit':
        return hasPermissionToEdit(userRole);
      case 'promote':
        return hasPermissionToEdit(userRole) && session.capacity_status === 'FULL';
      case 'view':
        return true;
      default:
        return false;
    }
  });

  if (filteredActions.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'flex gap-2',
      orientation === 'vertical' && 'flex-col',
      className
    )}>
      {filteredActions.map((action) => (
        <InteractiveActionButton
          key={action}
          action={action}
          session={session}
          userRole={userRole}
          studentId={studentId}
          compact={compact}
          onComplete={handleComplete(action)}
          onError={handleError(action)}
        />
      ))}
    </div>
  );
};

export default InteractiveActionButton;