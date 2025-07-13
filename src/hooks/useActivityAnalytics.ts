import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';

interface ActivityAnalyticsOptions {
  teamId?: string;
  timeRange?: '1d' | '7d' | '30d' | '90d';
  enableRealTime?: boolean;
  cacheTime?: number;
}

interface ActivitySummary {
  totalActivities: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  mostActiveHour: number;
  engagementScore: number;
  trends: {
    activitiesChange: number;
    usersChange: number;
    engagementChange: number;
  };
}

interface ActivityHeatmap {
  dayOfWeek: number;
  hour: number;
  activityCount: number;
  intensity: 'low' | 'medium' | 'high' | 'very_high';
}

interface UserEngagementMetrics {
  userId: string;
  userName: string;
  totalActivities: number;
  lastActive: string;
  activityTypes: string[];
  engagementScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export const useActivityAnalytics = (options: ActivityAnalyticsOptions = {}) => {
  const {
    teamId,
    timeRange = '7d',
    enableRealTime = true,
    cacheTime = 5 * 60 * 1000 // 5 minutes
  } = options;

  // Calculate date range
  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case '1d':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
    }
    
    return { startDate: start, endDate: end };
  }, [timeRange]);

  // Fetch activity summary
  const activitySummaryQuery = useQuery({
    queryKey: ['activity-summary', teamId, timeRange],
    queryFn: async (): Promise<ActivitySummary> => {
      let query = supabase
        .from('user_activity_logs')
        .select('user_id, activity_type, created_at, duration_seconds, metadata')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (teamId) {
        query = query.eq('metadata->>team_id', teamId);
      }

      const { data: currentPeriod = [], error } = await query;
      if (error) throw error;

      // Get previous period for trend calculation
      const prevStart = new Date(startDate);
      const prevEnd = new Date(endDate);
      const periodDiff = endDate.getTime() - startDate.getTime();
      prevStart.setTime(prevStart.getTime() - periodDiff);
      prevEnd.setTime(prevEnd.getTime() - periodDiff);

      let prevQuery = supabase
        .from('user_activity_logs')
        .select('user_id, activity_type, created_at, duration_seconds')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      if (teamId) {
        prevQuery = prevQuery.eq('metadata->>team_id', teamId);
      }

      const { data: previousPeriod = [] } = await prevQuery;

      // Calculate metrics
      const totalActivities = currentPeriod.length;
      const uniqueUsers = new Set(currentPeriod.map(a => a.user_id)).size;
      const avgDuration = currentPeriod.reduce((acc, a) => acc + (a.duration_seconds || 0), 0) / totalActivities || 0;

      // Calculate most active hour
      const hourCounts = currentPeriod.reduce((acc, a) => {
        const hour = new Date(a.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const mostActiveHour = Object.entries(hourCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 0;

      // Calculate engagement score (activities per user)
      const engagementScore = uniqueUsers > 0 ? totalActivities / uniqueUsers : 0;

      // Calculate trends
      const prevTotalActivities = previousPeriod.length;
      const prevUniqueUsers = new Set(previousPeriod.map(a => a.user_id)).size;
      const prevEngagementScore = prevUniqueUsers > 0 ? prevTotalActivities / prevUniqueUsers : 0;

      const activitiesChange = prevTotalActivities > 0 
        ? ((totalActivities - prevTotalActivities) / prevTotalActivities) * 100 
        : 0;
      const usersChange = prevUniqueUsers > 0 
        ? ((uniqueUsers - prevUniqueUsers) / prevUniqueUsers) * 100 
        : 0;
      const engagementChange = prevEngagementScore > 0 
        ? ((engagementScore - prevEngagementScore) / prevEngagementScore) * 100 
        : 0;

      return {
        totalActivities,
        uniqueUsers,
        averageSessionDuration: Math.round(avgDuration / 60), // Convert to minutes
        mostActiveHour: parseInt(mostActiveHour.toString()),
        engagementScore: Math.round(engagementScore * 100) / 100,
        trends: {
          activitiesChange: Math.round(activitiesChange * 100) / 100,
          usersChange: Math.round(usersChange * 100) / 100,
          engagementChange: Math.round(engagementChange * 100) / 100,
        }
      };
    },
    staleTime: cacheTime,
    refetchInterval: enableRealTime ? 60000 : false,
  });

  // Fetch activity heatmap
  const activityHeatmapQuery = useQuery({
    queryKey: ['activity-heatmap', teamId, timeRange],
    queryFn: async (): Promise<ActivityHeatmap[]> => {
      let query = supabase
        .from('user_activity_logs')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (teamId) {
        query = query.eq('metadata->>team_id', teamId);
      }

      const { data = [], error } = await query;
      if (error) throw error;

      // Create heatmap data
      const heatmapData: Record<string, number> = {};
      
      data.forEach(activity => {
        const date = new Date(activity.created_at);
        const dayOfWeek = date.getDay();
        const hour = date.getHours();
        const key = `${dayOfWeek}-${hour}`;
        heatmapData[key] = (heatmapData[key] || 0) + 1;
      });

      // Get max count for intensity calculation
      const maxCount = Math.max(...Object.values(heatmapData), 1);

      // Generate complete heatmap
      const heatmap: ActivityHeatmap[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const key = `${day}-${hour}`;
          const count = heatmapData[key] || 0;
          const intensity = count === 0 ? 'low' 
            : count <= maxCount * 0.25 ? 'low'
            : count <= maxCount * 0.5 ? 'medium'
            : count <= maxCount * 0.75 ? 'high'
            : 'very_high';

          heatmap.push({
            dayOfWeek: day,
            hour,
            activityCount: count,
            intensity
          });
        }
      }

      return heatmap;
    },
    staleTime: cacheTime,
    refetchInterval: enableRealTime ? 300000 : false, // 5 minutes
  });

  // Fetch user engagement metrics
  const userEngagementQuery = useQuery({
    queryKey: ['user-engagement', teamId, timeRange],
    queryFn: async (): Promise<UserEngagementMetrics[]> => {
      let query = supabase
        .from('user_activity_logs')
        .select(`
          user_id,
          activity_type,
          created_at,
          profiles:user_id (display_name)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (teamId) {
        query = query.eq('metadata->>team_id', teamId);
      }

      const { data = [], error } = await query;
      if (error) throw error;

      // Group by user
      const userMetrics: Record<string, {
        name: string;
        activities: any[];
        activityTypes: Set<string>;
      }> = {};

      data.forEach(activity => {
        if (!userMetrics[activity.user_id]) {
          userMetrics[activity.user_id] = {
            name: (activity.profiles as any)?.display_name || 'Unknown User',
            activities: [],
            activityTypes: new Set()
          };
        }
        userMetrics[activity.user_id].activities.push(activity);
        userMetrics[activity.user_id].activityTypes.add(activity.activity_type);
      });

      // Calculate metrics for each user
      return Object.entries(userMetrics).map(([userId, data]) => {
        const totalActivities = data.activities.length;
        const lastActive = data.activities.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]?.created_at || '';

        // Simple engagement score based on activity count and variety
        const varietyScore = data.activityTypes.size;
        const engagementScore = Math.round((totalActivities * varietyScore) / 10 * 100) / 100;

        // Simple trend calculation (could be enhanced with historical data)
        const recentActivities = data.activities.filter(a => 
          new Date(a.created_at).getTime() > Date.now() - (24 * 60 * 60 * 1000)
        ).length;
        const trend = recentActivities > totalActivities * 0.3 ? 'increasing' 
          : recentActivities < totalActivities * 0.1 ? 'decreasing' 
          : 'stable';

        return {
          userId,
          userName: data.name,
          totalActivities,
          lastActive,
          activityTypes: Array.from(data.activityTypes),
          engagementScore,
          trend: trend as 'increasing' | 'stable' | 'decreasing'
        };
      }).sort((a, b) => b.engagementScore - a.engagementScore);
    },
    staleTime: cacheTime,
    refetchInterval: enableRealTime ? 120000 : false, // 2 minutes
  });

  // Utility functions
  const refreshAllData = useCallback(() => {
    activitySummaryQuery.refetch();
    activityHeatmapQuery.refetch();
    userEngagementQuery.refetch();
  }, [activitySummaryQuery, activityHeatmapQuery, userEngagementQuery]);

  const exportAnalytics = useCallback(() => {
    const data = {
      summary: activitySummaryQuery.data,
      heatmap: activityHeatmapQuery.data,
      userEngagement: userEngagementQuery.data,
      metadata: {
        teamId,
        timeRange,
        generatedAt: new Date().toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-analytics-${timeRange}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activitySummaryQuery.data, activityHeatmapQuery.data, userEngagementQuery.data, teamId, timeRange, startDate, endDate]);

  return {
    // Data
    summary: activitySummaryQuery.data,
    heatmap: activityHeatmapQuery.data,
    userEngagement: userEngagementQuery.data,
    
    // Loading states
    isLoadingSummary: activitySummaryQuery.isLoading,
    isLoadingHeatmap: activityHeatmapQuery.isLoading,
    isLoadingUserEngagement: userEngagementQuery.isLoading,
    isLoading: activitySummaryQuery.isLoading || activityHeatmapQuery.isLoading || userEngagementQuery.isLoading,
    
    // Error states
    summaryError: activitySummaryQuery.error,
    heatmapError: activityHeatmapQuery.error,
    userEngagementError: userEngagementQuery.error,
    hasError: !!activitySummaryQuery.error || !!activityHeatmapQuery.error || !!userEngagementQuery.error,
    
    // Utility functions
    refresh: refreshAllData,
    exportData: exportAnalytics,
    
    // Options
    options: { teamId, timeRange, enableRealTime, cacheTime }
  };
};