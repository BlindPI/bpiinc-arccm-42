import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  Clock,
  Infinity,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CapacityStatusBadgeProps } from './types';
import type { CapacityStatus } from '@/types/roster-enrollment';

// ============================================================================
// CAPACITY STATUS CONFIGURATION
// ============================================================================

interface StatusConfig {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
  label: string;
  description: string;
}

const STATUS_CONFIG: Record<CapacityStatus, StatusConfig> = {
  UNLIMITED: {
    variant: 'outline',
    icon: Infinity,
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    textColor: 'text-blue-700',
    label: 'Unlimited',
    description: 'No capacity limit set for this roster'
  },
  EMPTY: {
    variant: 'secondary',
    icon: Users,
    bgColor: 'bg-gray-50 hover:bg-gray-100',
    textColor: 'text-gray-600',
    label: 'Empty',
    description: 'No students currently enrolled'
  },
  AVAILABLE: {
    variant: 'default',
    icon: UserCheck,
    bgColor: 'bg-green-50 hover:bg-green-100',
    textColor: 'text-green-700',
    label: 'Available',
    description: 'Space available for enrollment'
  },
  NEARLY_FULL: {
    variant: 'default',
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    textColor: 'text-yellow-700',
    label: 'Nearly Full',
    description: '80% or more of capacity is filled'
  },
  FULL: {
    variant: 'secondary',
    icon: UserX,
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    textColor: 'text-orange-700',
    label: 'Full',
    description: 'At maximum capacity'
  },
  OVER_CAPACITY: {
    variant: 'destructive',
    icon: TrendingUp,
    bgColor: 'bg-red-50 hover:bg-red-100',
    textColor: 'text-red-700',
    label: 'Over Capacity',
    description: 'Exceeds maximum capacity'
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CapacityStatusBadge({
  status,
  capacityInfo,
  showSpots = false,
  showPercentage = false,
  size = 'md',
  variant,
  className,
  children,
  onClick,
  tooltip
}: CapacityStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  // Calculate additional display information
  const availableSpots = capacityInfo?.available_spots;
  const maxCapacity = capacityInfo?.max_capacity;
  const currentEnrollment = capacityInfo?.current_enrollment || 0;
  
  const utilizationPercentage = maxCapacity && maxCapacity > 0 
    ? Math.round((currentEnrollment / maxCapacity) * 100)
    : 0;

  // Determine badge content
  const getBadgeContent = () => {
    const elements: React.ReactNode[] = [];

    // Icon
    elements.push(
      <Icon 
        key="icon" 
        className={cn(
          size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
        )} 
      />
    );

    // Status label
    elements.push(
      <span key="label" className="ml-1">
        {config.label}
      </span>
    );

    // Available spots
    if (showSpots && availableSpots !== null && status !== 'UNLIMITED') {
      elements.push(
        <span key="spots" className="ml-1 font-medium">
          ({availableSpots} left)
        </span>
      );
    }

    // Utilization percentage
    if (showPercentage && maxCapacity && status !== 'UNLIMITED') {
      elements.push(
        <span key="percentage" className="ml-1 font-medium">
          ({utilizationPercentage}%)
        </span>
      );
    }

    // Children content
    if (children) {
      elements.push(
        <span key="children" className="ml-1">
          {children}
        </span>
      );
    }

    return elements;
  };

  // Create tooltip content
  const getTooltipContent = () => {
    if (tooltip) return tooltip;

    const parts: string[] = [config.description];

    if (capacityInfo && status !== 'UNLIMITED') {
      if (maxCapacity) {
        parts.push(`${currentEnrollment} of ${maxCapacity} enrolled`);
      } else {
        parts.push(`${currentEnrollment} students enrolled`);
      }

      if (availableSpots !== null && availableSpots >= 0) {
        parts.push(`${availableSpots} spots remaining`);
      }

      if (maxCapacity && utilizationPercentage > 0) {
        parts.push(`${utilizationPercentage}% capacity utilized`);
      }
    }

    return parts.join(' • ');
  };

  // Badge size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const badge = (
    <Badge
      variant={variant || config.variant}
      className={cn(
        sizeClasses[size],
        config.bgColor,
        config.textColor,
        'inline-flex items-center gap-1 font-medium border-0',
        onClick && 'cursor-pointer transition-colors',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      aria-label={`Capacity status: ${config.label}${capacityInfo ? ` - ${getTooltipContent()}` : ''}`}
    >
      {getBadgeContent()}
    </Badge>
  );

  // Wrap with tooltip if needed
  if (tooltip !== null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

// ============================================================================
// UTILITY HOOKS AND FUNCTIONS
// ============================================================================

/**
 * Get capacity status from roster capacity info
 */
export function getCapacityStatus(capacityInfo: {
  max_capacity: number | null;
  current_enrollment: number;
  available_spots: number | null;
}): CapacityStatus {
  const { max_capacity, current_enrollment, available_spots } = capacityInfo;

  if (!max_capacity) return 'UNLIMITED';
  if (current_enrollment === 0) return 'EMPTY';
  if (current_enrollment > max_capacity) return 'OVER_CAPACITY';
  if (available_spots === 0) return 'FULL';
  
  const utilizationPercentage = (current_enrollment / max_capacity) * 100;
  if (utilizationPercentage >= 80) return 'NEARLY_FULL';
  
  return 'AVAILABLE';
}

/**
 * Get appropriate variant based on capacity status
 */
export function getStatusVariant(status: CapacityStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  return STATUS_CONFIG[status].variant;
}

/**
 * Get status configuration
 */
export function getStatusConfig(status: CapacityStatus): StatusConfig {
  return STATUS_CONFIG[status];
}