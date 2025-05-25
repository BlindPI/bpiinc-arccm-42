import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { NotificationCenter } from './NotificationCenter';
import { useNotificationCount, useNotificationSubscription } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { data: counts = { total: 0, unread: 0 } } = useNotificationCount();
  
  // Enable real-time notification subscription
  useNotificationSubscription();
  
  // Request browser notification permission
  useEffect(() => {
    if (window.Notification && window.Notification.permission !== 'denied') {
      window.Notification.requestPermission();
    }
  }, []);
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn("relative", className)} 
        onClick={() => setOpen(true)}
        aria-label={`Notifications (${counts.unread} unread)`}
      >
        <Bell className="h-5 w-5" />
        {counts.unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {counts.unread > 99 ? '99+' : counts.unread}
          </span>
        )}
      </Button>
      
      <NotificationCenter open={open} onOpenChange={setOpen} />
    </>
  );
}