import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Circle, Clock, Calendar } from 'lucide-react';
import { useActivityTracker } from '@/hooks/useActivityTracker';

interface ActivityIndicatorProps {
  userId: string;
  lastActivity?: string;
  showLabel?: boolean;
  variant?: 'dot' | 'badge' | 'full';
}

export function ActivityIndicator({ 
  userId, 
  lastActivity, 
  showLabel = true, 
  variant = 'badge' 
}: ActivityIndicatorProps) {
  const [isOnline, setIsOnline] = useState(false);
  const [activityStatus, setActivityStatus] = useState<'online' | 'recent' | 'away' | 'offline'>('offline');
  const { isTracking } = useActivityTracker();

  useEffect(() => {
    // Listen for real-time activity updates
    const handleActivityUpdate = (event: CustomEvent) => {
      const { payload } = event.detail;
      
      if (payload.table === 'team_members' && payload.new?.user_id === userId) {
        // Team member activity updated
        setIsOnline(true);
        setActivityStatus('online');
        
        // Reset to recent after 5 minutes
        setTimeout(() => {
          setIsOnline(false);
          setActivityStatus('recent');
        }, 5 * 60 * 1000);
      }
      
      if (payload.table === 'user_activity_logs' && payload.new?.user_id === userId) {
        // User activity logged
        setIsOnline(true);
        setActivityStatus('online');
        
        // Reset to recent after 2 minutes
        setTimeout(() => {
          setIsOnline(false);
          setActivityStatus('recent');
        }, 2 * 60 * 1000);
      }
    };

    window.addEventListener('userActivityUpdate', handleActivityUpdate as EventListener);

    // Calculate initial status based on last activity
    if (lastActivity) {
      const lastActiveTime = new Date(lastActivity);
      const now = new Date();
      const minutesAgo = (now.getTime() - lastActiveTime.getTime()) / (1000 * 60);

      if (minutesAgo < 5) {
        setActivityStatus('online');
        setIsOnline(true);
      } else if (minutesAgo < 30) {
        setActivityStatus('recent');
      } else if (minutesAgo < 1440) { // 24 hours
        setActivityStatus('away');
      } else {
        setActivityStatus('offline');
      }
    }

    return () => {
      window.removeEventListener('userActivityUpdate', handleActivityUpdate as EventListener);
    };
  }, [userId, lastActivity]);

  const getStatusConfig = () => {
    switch (activityStatus) {
      case 'online':
        return {
          color: 'bg-green-500',
          text: 'Online',
          icon: Circle,
          variant: 'default' as const
        };
      case 'recent':
        return {
          color: 'bg-yellow-500',
          text: 'Recently Active',
          icon: Clock,
          variant: 'secondary' as const
        };
      case 'away':
        return {
          color: 'bg-orange-500',
          text: 'Away',
          icon: Clock,
          variant: 'outline' as const
        };
      case 'offline':
        return {
          color: 'bg-gray-400',
          text: 'Offline',
          icon: Calendar,
          variant: 'outline' as const
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (variant === 'dot') {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color} ${isOnline ? 'animate-pulse' : ''}`} />
        {showLabel && (
          <span className="text-xs text-muted-foreground">{config.text}</span>
        )}
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color} ${isOnline ? 'animate-pulse' : ''}`} />
        {showLabel && config.text}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${isOnline ? 'animate-pulse' : ''}`} />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{config.text}</span>
        {lastActivity && (
          <span className="text-xs text-muted-foreground">
            Last seen: {new Date(lastActivity).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}