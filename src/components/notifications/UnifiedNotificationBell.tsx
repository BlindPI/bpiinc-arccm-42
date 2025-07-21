import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from './NotificationCenter';
import { useNotificationCount } from '@/hooks/useNotifications';
import {
  useCertificateNotificationCount,
  useCertificateNotificationSubscription
} from '@/hooks/useCertificateNotifications';
import { cn } from '@/lib/utils';

export interface UnifiedNotificationBellProps {
  /** Optional category filter - if provided, only shows notifications for that category */
  categoryFilter?: 'CERTIFICATE' | 'COURSE' | 'ACCOUNT' | 'GENERAL' | 'SYSTEM' | 'ROLE_MANAGEMENT' | 'SUPERVISION' | 'INSTRUCTOR' | 'PROVIDER';
  /** Whether to show all categories in the notification center */
  showAllCategories?: boolean;
  /** Compact mode for smaller displays */
  compactMode?: boolean;
  /** Custom className */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Variant for the button */
  variant?: 'ghost' | 'outline' | 'default';
  /** Default tab to open in notification center */
  defaultTab?: string;
}

export function UnifiedNotificationBell({
  categoryFilter,
  showAllCategories = true,
  compactMode = false,
  className,
  size = 'default',
  variant = 'ghost',
  defaultTab
}: UnifiedNotificationBellProps) {
  const [open, setOpen] = useState(false);
  
  // Use the appropriate count hook based on whether we're filtering
  const { data: allCounts = { total: 0, unread: 0 } } = useNotificationCount();
  const { data: certificateCounts = 0 } = useCertificateNotificationCount();
  
  // Determine which counts to use
  const counts = categoryFilter === 'CERTIFICATE' 
    ? { total: certificateCounts, unread: certificateCounts } 
    : allCounts;
  
  // Enable appropriate real-time subscriptions
  if (categoryFilter === 'CERTIFICATE') {
    useCertificateNotificationSubscription();
  }
  
  // Request browser notification permission
  useEffect(() => {
    if (window.Notification && window.Notification.permission !== 'denied') {
      window.Notification.requestPermission();
    }
  }, []);
  
  // Determine button size based on prop
  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'icon';
  
  // Calculate initial tab for notification center
  const initialTab = defaultTab || categoryFilter || 'all';
  
  return (
    <>
      <Button 
        variant={variant}
        size={buttonSize}
        className={cn('relative', className)} 
        onClick={() => setOpen(true)}
        aria-label={`Notifications (${counts.unread} unread)`}
      >
        <Bell className={cn(
          size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
        )} />
        {counts.unread > 0 && (
          <Badge 
            variant="destructive" 
            className={cn(
              'absolute flex items-center justify-center text-white font-bold',
              size === 'sm' 
                ? '-top-1 -right-1 h-4 w-4 text-[9px] px-1' 
                : '-top-1 -right-1 h-5 w-5 text-[10px] px-1'
            )}
          >
            {counts.unread > 99 ? '99+' : counts.unread}
          </Badge>
        )}
      </Button>
      
      <NotificationCenter
        open={open}
        onOpenChange={setOpen}
        initialCategory={initialTab}
        categoryFilter={showAllCategories ? undefined : categoryFilter}
      />
    </>
  );
}

// Convenience components for specific use cases
export function CertificateNotificationBell(props: Omit<UnifiedNotificationBellProps, 'categoryFilter'>) {
  return (
    <UnifiedNotificationBell 
      {...props}
      categoryFilter="CERTIFICATE"
      defaultTab="CERTIFICATE"
    />
  );
}

export function GeneralNotificationBell(props: UnifiedNotificationBellProps) {
  return (
    <UnifiedNotificationBell 
      {...props}
      showAllCategories={true}
    />
  );
}