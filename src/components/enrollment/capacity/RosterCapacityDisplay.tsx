import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  UserPlus, 
  Clock, 
  RefreshCw, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRosterCapacityValidation } from '@/hooks/useRosterCapacityValidation';
import { CapacityStatusBadge, getCapacityStatus } from './CapacityStatusBadge';
import type { RosterCapacityDisplayProps } from './types';

// ============================================================================
// COMPONENT
// ============================================================================

export function RosterCapacityDisplay({
  rosterId,
  showDetails = true,
  showWaitlist = true,
  showActions = false,
  className,
  compact = false,
  refreshInterval,
  onCapacityChange
}: RosterCapacityDisplayProps) {
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
    isNearlyFull,
    isFull,
    isOverCapacity,
    refetch,
    promoteFromWaitlist,
    isPromoting
  } = useRosterCapacityValidation({
    rosterId,
    includeWaitlist: showWaitlist,
    autoRefresh: !!refreshInterval,
    refetchInterval: refreshInterval
  });

  // Effect to notify parent of capacity changes
  React.useEffect(() => {
    if (capacityInfo && onCapacityChange) {
      onCapacityChange(capacityInfo);
    }
  }, [capacityInfo, onCapacityChange]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className={compact ? 'pb-2' : undefined}>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
          {showDetails && (
            <>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError || !capacityInfo) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error?.message || 'Failed to load capacity information'}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const {
    max_capacity,
    current_enrollment,
    available_spots,
    can_enroll,
    roster_name
  } = capacityInfo;

  // Waitlist information
  const waitlistInfo = showWaitlist ? capacityStatus?.waitlist : null;
  const waitlistCount = waitlistInfo?.total || 0;

  // Get capacity warning level
  const getWarningLevel = () => {
    if (isOverCapacity) return 'error';
    if (isFull) return 'warning';
    if (isNearlyFull) return 'info';
    return 'success';
  };

  const warningLevel = getWarningLevel();

  // Compact display
  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <CapacityStatusBadge
          status={capacityStatusType}
          capacityInfo={capacityInfo}
          showSpots={true}
          size="sm"
        />
        {max_capacity && (
          <div className="flex-1 min-w-0">
            <Progress 
              value={utilizationPercentage} 
              className="h-2"
              aria-label={`Capacity utilization: ${utilizationPercentage}%`}
            />
          </div>
        )}
        {showActions && canEnroll && (
          <Button size="sm" variant="outline">
            <UserPlus className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Capacity Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <CapacityStatusBadge
              status={capacityStatusType}
              capacityInfo={capacityInfo}
              showSpots={!showDetails}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Capacity Progress */}
        {max_capacity ? (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Enrollment Progress</span>
              <span className="text-muted-foreground">
                {current_enrollment} / {max_capacity}
              </span>
            </div>
            <Progress 
              value={utilizationPercentage} 
              className="h-3"
              aria-label={`${current_enrollment} of ${max_capacity} spots filled`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{utilizationPercentage}% utilized</span>
              {available_spots !== null && (
                <span>
                  {available_spots} spot{available_spots === 1 ? '' : 's'} remaining
                </span>
              )}
            </div>
          </div>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No capacity limit set for this roster. Unlimited enrollment allowed.
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Information */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Enrollment:</span>
                <span className="font-medium">{current_enrollment}</span>
              </div>
              {max_capacity && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maximum Capacity:</span>
                  <span className="font-medium">{max_capacity}</span>
                </div>
              )}
              {available_spots !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Spots:</span>
                  <span className="font-medium">{available_spots}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Can Enroll:</span>
                <span className="font-medium">
                  {can_enroll ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Yes
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      No
                    </span>
                  )}
                </span>
              </div>
              {max_capacity && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Utilization:</span>
                  <span className="font-medium">{utilizationPercentage}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Waitlist Information */}
        {showWaitlist && waitlistCount > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="font-medium">Waitlist</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {waitlistCount} student{waitlistCount === 1 ? '' : 's'} waiting
              </span>
            </div>
            
            {showActions && available_spots && available_spots > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() => promoteFromWaitlist({
                  promotedBy: 'current-user', // This should come from auth context
                  userRole: 'AD', // This should come from auth context
                  maxPromotions: Math.min(available_spots, waitlistCount)
                })}
                disabled={isPromoting}
              >
                {isPromoting ? (
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="h-3 w-3 mr-2" />
                )}
                Promote from Waitlist
              </Button>
            )}
          </div>
        )}

        {/* Capacity Warnings */}
        {(isNearlyFull || isFull || isOverCapacity) && (
          <Alert variant={warningLevel === 'error' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isOverCapacity && 'This roster is over capacity. Review enrollments immediately.'}
              {isFull && !isOverCapacity && 'This roster is at full capacity. New students will be waitlisted.'}
              {isNearlyFull && !isFull && 'This roster is nearly full. Consider monitoring enrollment closely.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        {capacityStatus?.recommendations && capacityStatus.recommendations.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Recommendations</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {capacityStatus.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// LIGHTWEIGHT VARIANTS
// ============================================================================

/**
 * Simple capacity indicator for use in lists or tables
 */
export function CapacityIndicator({ 
  rosterId, 
  className 
}: { 
  rosterId: string; 
  className?: string; 
}) {
  return (
    <RosterCapacityDisplay
      rosterId={rosterId}
      compact={true}
      showDetails={false}
      showWaitlist={false}
      showActions={false}
      className={className}
    />
  );
}

/**
 * Capacity progress bar only
 */
export function CapacityProgressBar({ 
  rosterId, 
  className 
}: { 
  rosterId: string; 
  className?: string; 
}) {
  const { capacityInfo, utilizationPercentage, isLoading } = useRosterCapacityValidation({
    rosterId,
    includeWaitlist: false
  });

  if (isLoading || !capacityInfo?.max_capacity) {
    return <Skeleton className={cn('h-2 w-full', className)} />;
  }

  return (
    <div className={cn('space-y-1', className)}>
      <Progress 
        value={utilizationPercentage} 
        className="h-2"
        aria-label={`Capacity: ${capacityInfo.current_enrollment}/${capacityInfo.max_capacity}`}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{capacityInfo.current_enrollment}/{capacityInfo.max_capacity}</span>
        <span>{utilizationPercentage}%</span>
      </div>
    </div>
  );
}