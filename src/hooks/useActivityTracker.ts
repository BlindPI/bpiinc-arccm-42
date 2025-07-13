import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserActivityService } from '@/services/team/userActivityService';
import { RealTimeDataService, RealTimeSubscription } from '@/services/realtime/realTimeDataService';

interface ActivityTrackerOptions {
  trackPageViews?: boolean;
  trackTeamActions?: boolean;
  enableRealTime?: boolean;
}

export const useActivityTracker = (options: ActivityTrackerOptions = {}) => {
  const { user } = useAuth();
  const {
    trackPageViews = true,
    trackTeamActions = true,
    enableRealTime = true
  } = options;

  // Track page views automatically
  useEffect(() => {
    if (!user || !trackPageViews) return;

    const trackCurrentPage = () => {
      const path = window.location.pathname;
      UserActivityService.trackPageView(user.id, path, {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      });
    };

    // Track initial page load
    trackCurrentPage();

    // Track page changes for SPA navigation
    const handlePopState = () => trackCurrentPage();
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [user, trackPageViews]);

  // Set up real-time activity subscription
  useEffect(() => {
    if (!user || !enableRealTime) return;

    let subscription: RealTimeSubscription | null = null;

    const setupRealTime = async () => {
      try {
        subscription = await RealTimeDataService.subscribeToUserActivityUpdates(
          user.id,
          (payload) => {
            console.log('Real-time activity update:', payload);
            // Emit custom event for components to listen to
            window.dispatchEvent(new CustomEvent('userActivityUpdate', { 
              detail: payload 
            }));
          }
        );
      } catch (error) {
        console.error('Failed to set up real-time activity tracking:', error);
      }
    };

    setupRealTime();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user, enableRealTime]);

  // Manual activity tracking functions
  const trackTeamAction = useCallback(
    (action: string, teamId: string, metadata?: Record<string, any>) => {
      if (!user || !trackTeamActions) return;
      
      UserActivityService.trackTeamAction(user.id, action, teamId, metadata);
    },
    [user, trackTeamActions]
  );

  const trackCustomActivity = useCallback(
    (activityType: string, category: string, metadata?: Record<string, any>) => {
      if (!user) return;
      
      UserActivityService.logActivity(user.id, activityType, category, metadata);
    },
    [user]
  );

  return {
    trackTeamAction,
    trackCustomActivity,
    isTracking: !!user
  };
};