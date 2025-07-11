import { Badge } from '@/components/ui/badge';

interface CompletionDateDisplayProps {
  completionDate?: string | null;
  onlineCompletionDate?: string | null;
  practicalCompletionDate?: string | null;
  issueDate?: string;
  expiryDate?: string;
  variant?: 'default' | 'compact' | 'detailed';
  showStatus?: boolean;
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return 'Not completed';
  try {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
}

function getCompletionStatus(
  onlineDate?: string | null,
  practicalDate?: string | null,
  requiresBoth: boolean = true
): 'complete' | 'partial' | 'incomplete' {
  const hasOnline = !!onlineDate;
  const hasPractical = !!practicalDate;
  
  if (requiresBoth) {
    return hasOnline && hasPractical ? 'complete' : 
           hasOnline || hasPractical ? 'partial' : 'incomplete';
  }
  
  return hasOnline || hasPractical ? 'complete' : 'incomplete';
}

function CompletionStatusBadge({ status }: { status: 'complete' | 'partial' | 'incomplete' }) {
  const statusConfig = {
    complete: {
      variant: 'success' as const,
      text: 'Complete',
      className: 'bg-green-100 text-green-800'
    },
    partial: {
      variant: 'warning' as const,
      text: 'Partial',
      className: 'bg-yellow-100 text-yellow-800'
    },
    incomplete: {
      variant: 'outline' as const,
      text: 'Incomplete',
      className: 'bg-gray-100 text-gray-600'
    }
  };

  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant} className={`${config.className} text-xs`}>
      {config.text}
    </Badge>
  );
}

export function CompletionDateDisplay({
  completionDate,
  onlineCompletionDate,
  practicalCompletionDate,
  issueDate,
  expiryDate,
  variant = 'default',
  showStatus = true
}: CompletionDateDisplayProps) {
  const completionStatus = getCompletionStatus(onlineCompletionDate, practicalCompletionDate);
  
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {showStatus && <CompletionStatusBadge status={completionStatus} />}
        <span className="text-sm text-gray-600">
          {completionDate ? formatDate(completionDate) : 'Pending'}
        </span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold text-gray-800">Completion Tracking</h4>
          {showStatus && <CompletionStatusBadge status={completionStatus} />}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Online Assessment:</span>
              <span className={onlineCompletionDate ? 'text-green-700 font-medium' : 'text-gray-400'}>
                {formatDate(onlineCompletionDate)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Practical Assessment:</span>
              <span className={practicalCompletionDate ? 'text-green-700 font-medium' : 'text-gray-400'}>
                {formatDate(practicalCompletionDate)}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Certificate Issue:</span>
              <span className={issueDate ? 'text-blue-700 font-medium' : 'text-gray-400'}>
                {formatDate(issueDate)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Certificate Expiry:</span>
              <span className={expiryDate ? 'text-orange-700 font-medium' : 'text-gray-400'}>
                {formatDate(expiryDate)}
              </span>
            </div>
          </div>
        </div>
        
        {completionDate && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Overall Completion:</span>
              <span className="text-sm font-semibold text-green-700">
                {formatDate(completionDate)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Completion Status</span>
        {showStatus && <CompletionStatusBadge status={completionStatus} />}
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Online:</span>
          <span className={onlineCompletionDate ? 'text-green-700' : 'text-gray-400'}>
            {formatDate(onlineCompletionDate)}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Practical:</span>
          <span className={practicalCompletionDate ? 'text-green-700' : 'text-gray-400'}>
            {formatDate(practicalCompletionDate)}
          </span>
        </div>
        
        {completionDate && (
          <div className="flex justify-between pt-1 border-t">
            <span className="font-medium text-gray-700">Complete:</span>
            <span className="font-semibold text-green-700">
              {formatDate(completionDate)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Quick completion indicator for table rows
export function CompletionIndicator({
  onlineDate,
  practicalDate,
  showTooltip = false
}: {
  onlineDate?: string | null;
  practicalDate?: string | null;
  showTooltip?: boolean;
}) {
  const status = getCompletionStatus(onlineDate, practicalDate);
  
  const statusConfig = {
    complete: { color: 'bg-green-500', text: '✓' },
    partial: { color: 'bg-yellow-500', text: '◐' },
    incomplete: { color: 'bg-gray-300', text: '○' }
  };

  const config = statusConfig[status];
  const tooltipText = showTooltip ? 
    `Online: ${formatDate(onlineDate)}, Practical: ${formatDate(practicalDate)}` : 
    undefined;

  return (
    <div 
      className={`w-6 h-6 rounded-full ${config.color} flex items-center justify-center text-white text-xs font-bold`}
      title={tooltipText}
    >
      {config.text}
    </div>
  );
}

// Timeline view for detailed completion tracking
export function CompletionTimeline({
  onlineDate,
  practicalDate,
  issueDate,
  expiryDate
}: {
  onlineDate?: string | null;
  practicalDate?: string | null;
  issueDate?: string;
  expiryDate?: string;
}) {
  const events = [
    { 
      label: 'Online Assessment', 
      date: onlineDate, 
      completed: !!onlineDate,
      type: 'assessment' as const
    },
    { 
      label: 'Practical Assessment', 
      date: practicalDate, 
      completed: !!practicalDate,
      type: 'assessment' as const
    },
    { 
      label: 'Certificate Issued', 
      date: issueDate, 
      completed: !!issueDate,
      type: 'certificate' as const
    },
    { 
      label: 'Certificate Expires', 
      date: expiryDate, 
      completed: false,
      type: 'expiry' as const
    }
  ];

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div key={event.label} className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            event.completed ? 'bg-green-500' : 
            event.type === 'expiry' ? 'bg-orange-400' : 'bg-gray-300'
          }`} />
          
          <div className="flex-1 flex justify-between items-center">
            <span className={`text-sm ${event.completed ? 'text-gray-900' : 'text-gray-500'}`}>
              {event.label}
            </span>
            <span className={`text-sm ${event.completed ? 'font-medium text-green-700' : 'text-gray-400'}`}>
              {formatDate(event.date)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}