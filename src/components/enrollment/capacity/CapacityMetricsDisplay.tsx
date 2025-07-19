import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserCheck, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Info,
  CheckCircle,
  XCircle,
  Infinity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CapacityStatusBadge, getCapacityStatus } from './CapacityStatusBadge';
import type { 
  CapacityMetricsDisplayProps, 
  CapacityMetric,
  WaitlistDisplayProps,
  WaitlistInfo
} from './HoverOverlayTypes';
import type { RosterCapacityInfo, CapacityStatus } from '@/types/roster-enrollment';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatPercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

const getStatusIcon = (status: CapacityStatus, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  
  switch (status) {
    case 'UNLIMITED':
      return <Infinity className={cn(sizeClass, 'text-blue-600')} />;
    case 'EMPTY':
      return <Users className={cn(sizeClass, 'text-gray-500')} />;
    case 'AVAILABLE':
      return <UserCheck className={cn(sizeClass, 'text-green-600')} />;
    case 'NEARLY_FULL':
      return <AlertTriangle className={cn(sizeClass, 'text-yellow-600')} />;
    case 'FULL':
      return <XCircle className={cn(sizeClass, 'text-orange-600')} />;
    case 'OVER_CAPACITY':
      return <TrendingUp className={cn(sizeClass, 'text-red-600')} />;
    default:
      return <Info className={cn(sizeClass, 'text-gray-500')} />;
  }
};

const getUtilizationColor = (percentage: number): string => {
  if (percentage >= 100) return 'text-red-600';
  if (percentage >= 90) return 'text-orange-600';
  if (percentage >= 80) return 'text-yellow-600';
  if (percentage >= 50) return 'text-blue-600';
  return 'text-green-600';
};

const getProgressBarColor = (percentage: number): string => {
  if (percentage >= 100) return 'bg-red-500';
  if (percentage >= 90) return 'bg-orange-500';
  if (percentage >= 80) return 'bg-yellow-500';
  if (percentage >= 50) return 'bg-blue-500';
  return 'bg-green-500';
};

// ============================================================================
// WAITLIST DISPLAY COMPONENT
// ============================================================================

export const WaitlistDisplay: React.FC<WaitlistDisplayProps> = ({
  waitlistInfo,
  showPosition = true,
  showActivity = true,
  showEstimation = true,
  compact = false,
  className
}) => {
  if (waitlistInfo.total === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">
          Waitlist ({waitlistInfo.total})
        </span>
      </div>
      
      {!compact && (
        <div className="space-y-1 text-xs text-muted-foreground">
          {showPosition && waitlistInfo.position && (
            <div>Your position: #{waitlistInfo.position}</div>
          )}
          
          {showEstimation && waitlistInfo.estimatedPromotion && (
            <div>Estimated promotion: {waitlistInfo.estimatedPromotion}</div>
          )}
          
          {showActivity && waitlistInfo.recentActivity && waitlistInfo.recentActivity.length > 0 && (
            <div className="mt-2">
              <div className="font-medium text-gray-700 mb-1">Recent Activity:</div>
              <div className="space-y-1">
                {waitlistInfo.recentActivity.slice(0, 3).map((activity) => (
                  <div key={activity.id} className="flex items-center gap-1 text-xs">
                    {activity.action === 'promoted' && <TrendingUp className="h-3 w-3 text-green-500" />}
                    {activity.action === 'added' && <Users className="h-3 w-3 text-blue-500" />}
                    {activity.action === 'removed' && <TrendingDown className="h-3 w-3 text-gray-500" />}
                    <span>{activity.studentName || 'Student'} {activity.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CAPACITY METRICS DISPLAY COMPONENT
// ============================================================================

export const CapacityMetricsDisplay: React.FC<CapacityMetricsDisplayProps> = ({
  capacityInfo,
  capacityStatus,
  mode = 'full',
  showPercentages = true,
  showProgressBars = true,
  showStatusIndicators = true,
  showWaitlistMetrics = true,
  customMetrics = [],
  orientation = 'vertical',
  className,
  animated = true
}) => {
  // Calculate derived metrics
  const enrollmentCount = capacityInfo.current_enrollment || 0;
  const maxCapacity = capacityInfo.max_capacity;
  const availableSpots = capacityInfo.available_spots;
  const utilizationPercentage = maxCapacity ? formatPercentage(enrollmentCount, maxCapacity) : 0;
  const isUnlimited = maxCapacity === null || maxCapacity === 0;
  
  // Build core metrics
  const coreMetrics: CapacityMetric[] = [
    {
      label: 'Enrolled',
      value: enrollmentCount,
      status: enrollmentCount > 0 ? 'success' : 'info',
      icon: <Users className="h-4 w-4" />,
      tooltip: `${enrollmentCount} students currently enrolled`
    },
    {
      label: 'Capacity',
      value: isUnlimited ? 'Unlimited' : maxCapacity || 0,
      status: 'info',
      icon: getStatusIcon(capacityStatus),
      tooltip: isUnlimited ? 'No capacity limit set' : `Maximum ${maxCapacity} students allowed`
    },
    {
      label: 'Available',
      value: isUnlimited ? 'Unlimited' : (availableSpots ?? 0),
      status: isUnlimited ? 'info' : (availableSpots ?? 0) > 0 ? 'success' : 'warning',
      icon: <UserCheck className="h-4 w-4" />,
      tooltip: isUnlimited ? 'Unlimited spots available' : `${availableSpots ?? 0} spots remaining`
    }
  ];

  // Add utilization metric if not unlimited
  if (!isUnlimited && showPercentages) {
    coreMetrics.push({
      label: 'Utilization',
      value: `${utilizationPercentage}%`,
      status: utilizationPercentage >= 90 ? 'error' : utilizationPercentage >= 80 ? 'warning' : 'success',
      icon: <TrendingUp className="h-4 w-4" />,
      tooltip: `${utilizationPercentage}% of capacity is filled`
    });
  }

  // Combine with custom metrics
  const allMetrics = [...coreMetrics, ...customMetrics];

  // Determine layout classes
  const containerClasses = cn(
    'space-y-3',
    orientation === 'horizontal' && 'flex flex-wrap gap-4 space-y-0',
    className
  );

  const metricClasses = cn(
    'flex items-center gap-2',
    orientation === 'horizontal' && 'flex-col items-start',
    mode === 'compact' && 'text-sm',
    (mode as string) === 'minimal' && 'text-xs'
  );

  return (
    <div className={containerClasses}>
      {/* Status Badge */}
      {showStatusIndicators && (
        <div className="flex items-center justify-between">
          <CapacityStatusBadge
            status={capacityStatus}
            capacityInfo={capacityInfo}
            showSpots={mode !== 'minimal'}
            showPercentage={showPercentages && mode === 'full'}
            size={mode === 'minimal' ? 'sm' : 'md'}
          />
        </div>
      )}

      {/* Progress Bar */}
      {showProgressBars && !isUnlimited && mode !== 'minimal' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Capacity Usage</span>
            {showPercentages && (
              <span className={getUtilizationColor(utilizationPercentage)}>
                {utilizationPercentage}%
              </span>
            )}
          </div>
          <Progress 
            value={Math.min(utilizationPercentage, 100)} 
            className={cn(
              'h-2',
              animated && 'transition-all duration-500 ease-out'
            )}
            // Custom color based on utilization
            style={{
              '--progress-background': getProgressBarColor(utilizationPercentage)
            } as React.CSSProperties}
          />
          {utilizationPercentage > 100 && (
            <div className="text-xs text-red-600 font-medium">
              Over capacity by {utilizationPercentage - 100}%
            </div>
          )}
        </div>
      )}

      {/* Core Metrics */}
      {mode !== 'minimal' && (
        <div className={cn(
          'grid gap-2',
          orientation === 'vertical' && 'grid-cols-1',
          orientation === 'horizontal' && 'grid-cols-2 md:grid-cols-4'
        )}>
          {allMetrics.map((metric, index) => (
            <div key={index} className={metricClasses} title={metric.tooltip}>
              {metric.icon && (
                <div className={cn(
                  'flex-shrink-0',
                  metric.status === 'success' && 'text-green-600',
                  metric.status === 'warning' && 'text-yellow-600',
                  metric.status === 'error' && 'text-red-600',
                  metric.status === 'info' && 'text-blue-600'
                )}>
                  {metric.icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground truncate">
                  {metric.label}
                </div>
                <div className={cn(
                  'font-semibold truncate',
                  mode === 'compact' && 'text-sm',
                  mode === 'minimal' && 'text-xs',
                  metric.status === 'success' && 'text-green-700',
                  metric.status === 'warning' && 'text-yellow-700',
                  metric.status === 'error' && 'text-red-700',
                  metric.status === 'info' && 'text-gray-700'
                )}>
                  {metric.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Minimal Mode - Just Key Stats */}
      {mode === 'minimal' && (
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span>{enrollmentCount}</span>
          </div>
          {!isUnlimited && (
            <>
              <span className="text-muted-foreground">/</span>
              <span>{maxCapacity}</span>
              {showPercentages && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className={getUtilizationColor(utilizationPercentage)}>
                    {utilizationPercentage}%
                  </span>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Waitlist Metrics */}
      {showWaitlistMetrics && capacityStatus === 'FULL' && mode !== 'minimal' && (
        <>
          <Separator className="my-2" />
          <WaitlistDisplay
            waitlistInfo={{
              total: 0, // This would come from actual waitlist data
              position: undefined,
              estimatedPromotion: undefined,
              recentActivity: []
            }}
            compact={mode === 'compact'}
            showPosition={mode === 'full'}
            showActivity={mode === 'full'}
            showEstimation={mode === 'full'}
          />
        </>
      )}

      {/* Critical Alerts */}
      {capacityStatus === 'OVER_CAPACITY' && (
        <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-800">
            <div className="font-medium">Over Capacity</div>
            <div>This session has exceeded its maximum capacity and requires immediate attention.</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// ENHANCED METRICS WITH TRENDS
// ============================================================================

export interface TrendData {
  current: number;
  previous: number;
  timeframe: string;
}

export interface CapacityTrendsProps {
  enrollmentTrend?: TrendData;
  capacityTrend?: TrendData;
  waitlistTrend?: TrendData;
  className?: string;
}

export const CapacityTrends: React.FC<CapacityTrendsProps> = ({
  enrollmentTrend,
  capacityTrend,
  waitlistTrend,
  className
}) => {
  const renderTrend = (trend: TrendData, label: string) => {
    const change = trend.current - trend.previous;
    const isIncrease = change > 0;
    const isDecrease = change < 0;
    
    return (
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          {isIncrease && <TrendingUp className="h-3 w-3 text-green-600" />}
          {isDecrease && <TrendingDown className="h-3 w-3 text-red-600" />}
          {!isIncrease && !isDecrease && <span className="w-3" />}
          <span className={cn(
            'font-medium',
            isIncrease && 'text-green-600',
            isDecrease && 'text-red-600',
            !isIncrease && !isDecrease && 'text-gray-600'
          )}>
            {change > 0 ? '+' : ''}{change}
          </span>
          <span className="text-muted-foreground">({trend.timeframe})</span>
        </div>
      </div>
    );
  };

  const hasTrends = enrollmentTrend || capacityTrend || waitlistTrend;
  
  if (!hasTrends) return null;

  return (
    <div className={cn('space-y-2 pt-2 border-t', className)}>
      <div className="text-xs font-medium text-muted-foreground">Recent Trends</div>
      <div className="space-y-1">
        {enrollmentTrend && renderTrend(enrollmentTrend, 'Enrollment')}
        {capacityTrend && renderTrend(capacityTrend, 'Capacity')}
        {waitlistTrend && renderTrend(waitlistTrend, 'Waitlist')}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================

export default CapacityMetricsDisplay;