import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Users, 
  Clock, 
  UserPlus,
  RefreshCw,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRosterCapacityValidation } from '@/hooks/useRosterCapacityValidation';
import { CapacityStatusBadge } from './CapacityStatusBadge';
// import { WaitlistOfferComponent } from './WaitlistOfferComponent'; // Available for future integration
import type { EnrollmentCapacityGuardProps } from './types';

// ============================================================================
// COMPONENT
// ============================================================================

export function EnrollmentCapacityGuard({
  rosterId,
  studentCount = 1,
  children,
  fallback,
  showCapacityInFallback = true,
  allowWaitlist = true,
  capacityExceededMessage,
  onCapacityExceeded,
  loadingComponent
}: EnrollmentCapacityGuardProps) {
  const {
    capacityInfo,
    capacityStatus,
    isLoading,
    isError,
    error,
    canEnroll,
    availableSpots,
    utilizationPercentage,
    capacityStatusType,
    isFull,
    isOverCapacity,
    refetch
  } = useRosterCapacityValidation({
    rosterId,
    additionalStudents: studentCount,
    includeWaitlist: allowWaitlist
  });

  // Effect to notify parent when capacity is exceeded
  React.useEffect(() => {
    if (capacityInfo && !canEnroll && onCapacityExceeded) {
      onCapacityExceeded(capacityInfo);
    }
  }, [capacityInfo, canEnroll, onCapacityExceeded]);

  // Loading state
  if (isLoading) {
    return loadingComponent || (
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  // Error state
  if (isError || !capacityInfo) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to check enrollment capacity: {error?.message}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Check if enrollment is possible
  const canEnrollRequested = canEnroll && (
    availableSpots === null || availableSpots >= studentCount
  );

  // If enrollment is allowed, render children
  if (canEnrollRequested) {
    return <>{children}</>;
  }

  // If enrollment is not allowed, render fallback or default capacity exceeded UI
  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <EnrollmentCapacityFallback
      rosterId={rosterId}
      studentCount={studentCount}
      capacityInfo={capacityInfo}
      capacityStatus={capacityStatus}
      showCapacityInfo={showCapacityInFallback}
      allowWaitlist={allowWaitlist}
      customMessage={capacityExceededMessage}
      capacityStatusType={capacityStatusType}
      isFull={isFull}
      isOverCapacity={isOverCapacity}
      utilizationPercentage={utilizationPercentage}
    />
  );
}

// ============================================================================
// FALLBACK COMPONENT
// ============================================================================

interface EnrollmentCapacityFallbackProps {
  rosterId: string;
  studentCount: number;
  capacityInfo: any;
  capacityStatus: any;
  showCapacityInfo: boolean;
  allowWaitlist: boolean;
  customMessage?: string;
  capacityStatusType: any;
  isFull: boolean;
  isOverCapacity: boolean;
  utilizationPercentage: number;
}

function EnrollmentCapacityFallback({
  rosterId,
  studentCount,
  capacityInfo,
  capacityStatus,
  showCapacityInfo,
  allowWaitlist,
  customMessage,
  capacityStatusType,
  isFull,
  isOverCapacity,
  utilizationPercentage
}: EnrollmentCapacityFallbackProps) {
  const {
    max_capacity,
    current_enrollment,
    available_spots,
    roster_name
  } = capacityInfo;

  // Determine the appropriate message and action
  const getCapacityMessage = () => {
    if (customMessage) return customMessage;

    if (isOverCapacity) {
      return `This roster is over capacity. Cannot enroll ${studentCount} student${studentCount === 1 ? '' : 's'}.`;
    }

    if (isFull) {
      return `This roster is at full capacity (${current_enrollment}/${max_capacity}). Cannot enroll ${studentCount} student${studentCount === 1 ? '' : 's'}.`;
    }

    if (available_spots !== null && available_spots < studentCount) {
      return `Only ${available_spots} spot${available_spots === 1 ? '' : 's'} available, but ${studentCount} student${studentCount === 1 ? '' : 's'} requested for enrollment.`;
    }

    return `Enrollment not available for ${studentCount} student${studentCount === 1 ? '' : 's'}.`;
  };

  const message = getCapacityMessage();
  const waitlistCount = capacityStatus?.waitlist?.total || 0;

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Capacity Status Header */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-amber-900">
                Enrollment Capacity Reached
              </h3>
              <p className="text-sm text-amber-800">
                {message}
              </p>
            </div>
            {showCapacityInfo && (
              <CapacityStatusBadge
                status={capacityStatusType}
                capacityInfo={capacityInfo}
                showSpots={true}
                size="sm"
              />
            )}
          </div>

          {/* Detailed Capacity Information */}
          {showCapacityInfo && max_capacity && (
            <div className="bg-white/50 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Enrolled:</span>
                    <span className="font-medium">{current_enrollment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{max_capacity}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Available:</span>
                    <span className="font-medium">
                      {available_spots === null ? 'Unlimited' : available_spots}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Utilization:</span>
                    <span className="font-medium">{utilizationPercentage}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Waitlist Option */}
          {allowWaitlist && !isOverCapacity && (
            <div className="border-t border-amber-200 pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-900">Waitlist Available</span>
              </div>
              
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {studentCount === 1 
                    ? 'This student can be added to the waitlist and will be automatically enrolled when space becomes available.'
                    : `${studentCount} students can be added to the waitlist and will be enrolled as space becomes available.`
                  }
                  {waitlistCount > 0 && (
                    <span className="block mt-1 text-sm">
                      Currently {waitlistCount} student{waitlistCount === 1 ? '' : 's'} on waitlist.
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {/* Waitlist enrollment component would be rendered here */}
              <div className="mt-3">
                <Button variant="outline" className="w-full" disabled>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add to Waitlist
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Requires WaitlistOfferComponent integration)
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Over Capacity Warning */}
          {isOverCapacity && (
            <Alert variant="destructive" className="border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Critical:</strong> This roster has exceeded its maximum capacity. 
                Immediate action is required to resolve this issue. Contact an administrator 
                or remove students to bring enrollment within capacity limits.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Suggestions */}
          {!isOverCapacity && (
            <div className="text-sm text-amber-700 space-y-1">
              <p className="font-medium">Suggested actions:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {allowWaitlist && (
                  <li>Add student{studentCount === 1 ? '' : 's'} to waitlist for automatic enrollment</li>
                )}
                <li>Check for available spots in other similar rosters</li>
                <li>Contact an administrator to increase roster capacity</li>
                {available_spots && available_spots > 0 && studentCount > available_spots && (
                  <li>Enroll {available_spots} student{available_spots === 1 ? '' : 's'} now and waitlist the remaining {studentCount - available_spots}</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

/**
 * Simple capacity guard that just shows/hides content
 */
export function SimpleCapacityGuard({ 
  rosterId, 
  studentCount = 1, 
  children 
}: {
  rosterId: string;
  studentCount?: number;
  children: React.ReactNode;
}) {
  return (
    <EnrollmentCapacityGuard
      rosterId={rosterId}
      studentCount={studentCount}
      fallback={null}
      showCapacityInFallback={false}
      allowWaitlist={false}
    >
      {children}
    </EnrollmentCapacityGuard>
  );
}

/**
 * Capacity guard with inline capacity status
 */
export function InlineCapacityGuard({ 
  rosterId, 
  studentCount = 1, 
  children,
  className 
}: {
  rosterId: string;
  studentCount?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const { canEnroll, isLoading, capacityStatusType, capacityInfo } = useRosterCapacityValidation({
    rosterId,
    additionalStudents: studentCount
  });

  if (isLoading) {
    return <Skeleton className={cn('h-8 w-full', className)} />;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <CapacityStatusBadge
          status={capacityStatusType}
          capacityInfo={capacityInfo}
          showSpots={true}
          size="sm"
        />
        {canEnroll && children}
      </div>
      {!canEnroll && (
        <Alert variant="default" className="text-sm">
          <Users className="h-4 w-4" />
          <AlertDescription>
            Enrollment not available. 
            {capacityInfo?.available_spots === 0 
              ? ' Roster is at capacity.' 
              : ' Insufficient space for requested enrollment.'
            }
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}