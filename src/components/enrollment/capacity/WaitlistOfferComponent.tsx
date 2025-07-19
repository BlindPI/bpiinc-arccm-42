import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  UserPlus, 
  AlertCircle, 
  Info,
  CheckCircle,
  Users,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRosterCapacityValidation } from '@/hooks/useRosterCapacityValidation';
import { CapacityStatusBadge } from './CapacityStatusBadge';
import type { WaitlistOfferComponentProps } from './types';

// ============================================================================
// COMPONENT
// ============================================================================

export function WaitlistOfferComponent({
  rosterId,
  studentId,
  enrolledBy,
  userRole,
  notes: initialNotes = '',
  showEstimatedPosition = true,
  customMessage,
  onWaitlistSuccess,
  onEnrollmentError,
  className,
  variant = 'default'
}: WaitlistOfferComponentProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollmentAttempted, setEnrollmentAttempted] = useState(false);

  const {
    capacityInfo,
    capacityStatus,
    isLoading,
    isError,
    error,
    canEnroll,
    availableSpots,
    capacityStatusType,
    isFull,
    enrollStudent
  } = useRosterCapacityValidation({
    rosterId,
    includeWaitlist: true
  });

  // Get waitlist information
  const waitlistInfo = capacityStatus?.waitlist;
  const waitlistCount = waitlistInfo?.total || 0;
  const estimatedPosition = waitlistCount + 1; // New student would be at end of waitlist

  // Handle enrollment attempt
  const handleEnrollment = async () => {
    if (!studentId || !enrolledBy) {
      onEnrollmentError?.('Missing required enrollment information');
      return;
    }

    setIsSubmitting(true);
    setEnrollmentAttempted(true);

    try {
      await enrollStudent({
        studentId,
        enrolledBy,
        userRole,
        enrollmentType: canEnroll ? 'standard' : 'waitlist',
        notes: notes.trim() || undefined
      });

      onWaitlistSuccess?.(studentId); // We'll use studentId as enrollment ID for now
    } catch (err: any) {
      onEnrollmentError?.(err.message || 'Enrollment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError || !capacityInfo) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load enrollment information: {error?.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Success state after enrollment
  if (enrollmentAttempted && !isSubmitting && !error) {
    const enrollmentType = canEnroll ? 'enrolled' : 'waitlisted';
    
    return (
      <Alert variant="default" className={cn('border-green-200 bg-green-50', className)}>
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Success!</strong> Student has been {enrollmentType} successfully.
          {enrollmentType === 'waitlisted' && (
            <span className="block mt-1">
              Position {estimatedPosition} on the waitlist. They will be notified when a spot becomes available.
            </span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Determine enrollment strategy
  const willBeWaitlisted = !canEnroll || (availableSpots !== null && availableSpots <= 0);
  const enrollmentMessage = customMessage || (
    willBeWaitlisted 
      ? 'This student will be added to the waitlist and automatically enrolled when space becomes available.'
      : 'This student will be enrolled immediately.'
  );

  // Render based on variant
  if (variant === 'inline') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">
            {willBeWaitlisted ? 'Waitlist Enrollment' : 'Direct Enrollment'}
          </span>
          <CapacityStatusBadge
            status={capacityStatusType}
            capacityInfo={capacityInfo}
            showSpots={true}
            size="sm"
          />
        </div>
        
        <p className="text-sm text-muted-foreground">{enrollmentMessage}</p>
        
        <Button 
          onClick={handleEnrollment}
          disabled={isSubmitting}
          size="sm"
          className="w-full"
        >
          {isSubmitting ? (
            <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
          ) : willBeWaitlisted ? (
            <Clock className="h-3 w-3 mr-2" />
          ) : (
            <UserPlus className="h-3 w-3 mr-2" />
          )}
          {willBeWaitlisted ? 'Add to Waitlist' : 'Enroll Student'}
        </Button>
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="text-center space-y-2">
          <div className="p-3 bg-amber-100 rounded-full w-fit mx-auto">
            {willBeWaitlisted ? (
              <Clock className="h-6 w-6 text-amber-600" />
            ) : (
              <UserPlus className="h-6 w-6 text-green-600" />
            )}
          </div>
          <h3 className="text-lg font-semibold">
            {willBeWaitlisted ? 'Waitlist Enrollment' : 'Confirm Enrollment'}
          </h3>
          <p className="text-sm text-muted-foreground">{enrollmentMessage}</p>
        </div>

        {showEstimatedPosition && willBeWaitlisted && waitlistCount > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Estimated waitlist position: <strong>#{estimatedPosition}</strong>
              <br />
              Currently {waitlistCount} student{waitlistCount === 1 ? '' : 's'} waiting.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="enrollment-notes">Notes (Optional)</Label>
            <Textarea
              id="enrollment-notes"
              placeholder="Add any additional notes about this enrollment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleEnrollment}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : willBeWaitlisted ? (
              <Clock className="h-4 w-4 mr-2" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            {willBeWaitlisted ? 'Add to Waitlist' : 'Confirm Enrollment'}
          </Button>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {willBeWaitlisted ? (
            <Clock className="h-5 w-5 text-amber-500" />
          ) : (
            <UserPlus className="h-5 w-5 text-green-500" />
          )}
          {willBeWaitlisted ? 'Waitlist Enrollment' : 'Student Enrollment'}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Capacity Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Roster Status:</span>
          <CapacityStatusBadge
            status={capacityStatusType}
            capacityInfo={capacityInfo}
            showSpots={true}
            size="sm"
          />
        </div>

        <Separator />

        {/* Enrollment Information */}
        <div className="space-y-3">
          <Alert variant={willBeWaitlisted ? 'default' : 'default'} 
                 className={willBeWaitlisted ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}>
            <Info className="h-4 w-4" />
            <AlertDescription className={willBeWaitlisted ? 'text-amber-800' : 'text-green-800'}>
              {enrollmentMessage}
            </AlertDescription>
          </Alert>

          {/* Waitlist Position Information */}
          {showEstimatedPosition && willBeWaitlisted && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Waitlist:</span>
                <span className="font-medium">{waitlistCount} student{waitlistCount === 1 ? '' : 's'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated Position:</span>
                <span className="font-medium">#{estimatedPosition}</span>
              </div>
            </div>
          )}

          {/* Capacity Details */}
          {capacityInfo.max_capacity && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Enrolled:</span>
                  <span className="font-medium">{capacityInfo.current_enrollment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium">{capacityInfo.max_capacity}</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available:</span>
                  <span className="font-medium">
                    {availableSpots === null ? 'Unlimited' : availableSpots}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waitlisted:</span>
                  <span className="font-medium">{waitlistCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Notes Input */}
        <div className="space-y-2">
          <Label htmlFor="enrollment-notes">Notes (Optional)</Label>
          <Textarea
            id="enrollment-notes"
            placeholder="Add any additional notes about this enrollment..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Action Button */}
        <Button 
          onClick={handleEnrollment}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : willBeWaitlisted ? (
            <Clock className="h-4 w-4 mr-2" />
          ) : (
            <UserPlus className="h-4 w-4 mr-2" />
          )}
          {willBeWaitlisted ? 'Add to Waitlist' : 'Enroll Student'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Simple waitlist button component
 */
export function WaitlistButton({ 
  rosterId, 
  studentId, 
  enrolledBy, 
  userRole,
  onSuccess,
  onError,
  className 
}: {
  rosterId: string;
  studentId: string;
  enrolledBy: string;
  userRole: any;
  onSuccess?: (enrollmentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}) {
  return (
    <WaitlistOfferComponent
      rosterId={rosterId}
      studentId={studentId}
      enrolledBy={enrolledBy}
      userRole={userRole}
      variant="inline"
      showEstimatedPosition={false}
      onWaitlistSuccess={onSuccess}
      onEnrollmentError={onError}
      className={className}
    />
  );
}

/**
 * Waitlist offer dialog content
 */
export function WaitlistOfferDialog({ 
  rosterId, 
  studentId, 
  enrolledBy, 
  userRole,
  onSuccess,
  onError 
}: {
  rosterId: string;
  studentId: string;
  enrolledBy: string;
  userRole: any;
  onSuccess?: (enrollmentId: string) => void;
  onError?: (error: string) => void;
}) {
  return (
    <WaitlistOfferComponent
      rosterId={rosterId}
      studentId={studentId}
      enrolledBy={enrolledBy}
      userRole={userRole}
      variant="modal"
      showEstimatedPosition={true}
      onWaitlistSuccess={onSuccess}
      onEnrollmentError={onError}
    />
  );
}