import { Badge } from '@/components/ui/badge';
import { CertificateCalculatedStatus } from '@/types/supabase-schema';

interface ScoreStatusBadgeProps {
  status: CertificateCalculatedStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
}

// Simple icons using Unicode symbols to avoid external dependencies
const StatusIcon = ({ status, size }: { status: CertificateCalculatedStatus; size: number }) => {
  const iconMap = {
    passed: '✓',
    failed: '✗',
    pending: '○',
    incomplete: '△',
    under_review: '◐'
  };

  return (
    <span 
      className="shrink-0 font-bold leading-none"
      style={{ fontSize: `${size}px` }}
    >
      {iconMap[status]}
    </span>
  );
};

const statusConfig = {
  passed: {
    variant: 'success' as const,
    className: 'bg-green-100 text-green-800 border-green-300',
    text: 'Passed',
    description: 'All requirements met'
  },
  failed: {
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-300',
    text: 'Failed',
    description: 'Score below threshold'
  },
  pending: {
    variant: 'warning' as const,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    text: 'Pending',
    description: 'Awaiting completion'
  },
  incomplete: {
    variant: 'outline' as const,
    className: 'bg-gray-50 text-gray-700 border-gray-300',
    text: 'Incomplete',
    description: 'Missing required data'
  },
  under_review: {
    variant: 'secondary' as const,
    className: 'bg-blue-100 text-blue-800 border-blue-300',
    text: 'Under Review',
    description: 'Manual review required'
  }
};

const sizeConfig = {
  sm: {
    badgeClass: 'h-6 px-2 text-xs',
    iconSize: 10,
    gap: 'gap-1'
  },
  md: {
    badgeClass: 'h-7 px-3 text-sm',
    iconSize: 12,
    gap: 'gap-1.5'
  },
  lg: {
    badgeClass: 'h-8 px-4 text-base',
    iconSize: 14,
    gap: 'gap-2'
  }
};

export function ScoreStatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true, 
  showText = true 
}: ScoreStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${sizeStyles.badgeClass} flex items-center ${sizeStyles.gap} font-medium`}
      title={config.description}
    >
      {showIcon && (
        <StatusIcon 
          status={status}
          size={sizeStyles.iconSize}
        />
      )}
      {showText && (
        <span className="truncate">{config.text}</span>
      )}
    </Badge>
  );
}

// Compact version for tables and lists
export function CompactStatusIndicator({ status }: { status: CertificateCalculatedStatus }) {
  return (
    <ScoreStatusBadge 
      status={status} 
      size="sm" 
      showIcon={true} 
      showText={false} 
    />
  );
}

// Full status display with description
export function DetailedStatusBadge({ status }: { status: CertificateCalculatedStatus }) {
  const config = statusConfig[status];
  
  return (
    <div className="flex items-center gap-2">
      <ScoreStatusBadge status={status} size="md" />
      <span className="text-sm text-gray-600">{config.description}</span>
    </div>
  );
}