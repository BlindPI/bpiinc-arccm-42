
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { NotificationCenter } from './NotificationCenter';
import { useNotificationCount } from '@/hooks/useNotifications';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: counts = { total: 0, unread: 0 } } = useNotificationCount();
  
  // Enable real-time notifications
  useRealtimeNotifications();
  
  // Request browser notification permission
  useEffect(() => {
    if (window.Notification && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative" 
        onClick={() => setOpen(true)}
        aria-label={`Notifications (${counts.unread} unread)`}
      >
        <Bell className="h-5 w-5" />
        {counts.unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white animate-pulse">
            {counts.unread > 99 ? '99+' : counts.unread}
          </span>
        )}
      </Button>
      
      <NotificationCenter open={open} onOpenChange={setOpen} />
    </>
  );
}
