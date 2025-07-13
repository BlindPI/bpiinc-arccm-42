import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealTimeDataService } from '@/services/realtime/realTimeDataService';
import { 
  Activity, 
  Users, 
  UserPlus, 
  UserMinus, 
  Settings,
  Eye,
  Clock,
  Building2,
  Search,
  Calendar
} from 'lucide-react';

interface ActivityFeedProps {
  teamId?: string;
  limit?: number;
  showTeamFilter?: boolean;
}

interface ActivityItem {
  id: string;
  user_id: string;
  activity_type: string;
  activity_category: string;
  metadata: any;
  created_at: string;
  user_name?: string;
  team_name?: string;
}

export function LiveActivityFeed({ teamId, limit = 20, showTeamFilter = false }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);

  // Fetch initial activity data
  const { data: initialActivities = [], isLoading } = useQuery({
    queryKey: ['activity-feed', teamId, limit],
    queryFn: async () => {
      let query = supabase
        .from('user_activity_logs')
        .select(`
          id,
          user_id,
          activity_type,
          activity_category,
          metadata,
          created_at,
          profiles:user_id (
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter by team if teamId is provided
      if (teamId) {
        query = query.eq('metadata->>team_id', teamId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        user_name: item.profiles?.display_name || 'Unknown User',
        team_name: (item.metadata as any)?.team_name || 'Unknown Team'
      } as ActivityItem));
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    let subscription: any = null;

    const setupRealTime = async () => {
      try {
        if (teamId) {
          subscription = await RealTimeDataService.subscribeToTeamActivityUpdates(
            teamId,
            (payload) => {
              console.log('Activity update received:', payload);
              
              if (payload.eventType === 'INSERT' && payload.new) {
                const newActivity: ActivityItem = {
                  id: payload.new.id || crypto.randomUUID(),
                  user_id: payload.new.user_id || '',
                  activity_type: payload.new.activity_type || '',
                  activity_category: payload.new.activity_category || '',
                  metadata: payload.new.metadata || {},
                  created_at: payload.new.created_at || new Date().toISOString(),
                  user_name: 'Live User',
                  team_name: 'Current Team'
                };
                
                setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
              }
            }
          );
        } else {
          // Subscribe to all user activity if no team filter
          const channel = supabase
            .channel('global_activity_feed')
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'user_activity_logs'
              },
              (payload) => {
                const newActivity: ActivityItem = {
                  id: payload.new.id || crypto.randomUUID(),
                  user_id: payload.new.user_id || '',
                  activity_type: payload.new.activity_type || '',
                  activity_category: payload.new.activity_category || '',
                  metadata: payload.new.metadata || {},
                  created_at: payload.new.created_at || new Date().toISOString(),
                  user_name: 'Live User',
                  team_name: 'Team'
                };
                
                setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
              }
            )
            .subscribe();

          subscription = { unsubscribe: () => supabase.removeChannel(channel) };
        }
        
        setIsRealTimeConnected(true);
      } catch (error) {
        console.error('Failed to set up real-time activity feed:', error);
        setIsRealTimeConnected(false);
      }
    };

    setupRealTime();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [teamId, limit]);

  // Update activities when initial data loads
  useEffect(() => {
    setActivities(initialActivities);
  }, [initialActivities]);

  const getActivityIcon = (activityType: string, category: string) => {
    switch (category) {
      case 'team_management':
        switch (activityType) {
          case 'team_created': return Building2;
          case 'member_added': return UserPlus;
          case 'member_removed': return UserMinus;
          case 'member_role_updated': return Settings;
          case 'member_status_updated': return Settings;
          default: return Users;
        }
      case 'navigation':
        switch (activityType) {
          case 'page_view': return Eye;
          case 'team_search': return Search;
          default: return Activity;
        }
      default:
        return Activity;
    }
  };

  const getActivityDescription = (activity: ActivityItem) => {
    const { activity_type, activity_category, metadata } = activity;
    
    switch (activity_category) {
      case 'team_management':
        switch (activity_type) {
          case 'team_created':
            return `created team "${metadata.team_name || 'New Team'}"`;
          case 'member_added':
            return `added ${metadata.member_name || 'a member'} to the team`;
          case 'member_removed':
            return `removed ${metadata.member_name || 'a member'} from the team`;
          case 'member_role_updated':
            return `updated ${metadata.member_name || 'a member'}'s role to ${metadata.new_role}`;
          case 'member_status_updated':
            return `changed ${metadata.member_name || 'a member'}'s status to ${metadata.new_status}`;
          default:
            return `performed ${activity_type} action`;
        }
      case 'navigation':
        switch (activity_type) {
          case 'page_view':
            return `viewed ${metadata.page_path || 'a page'}`;
          case 'team_search':
            return `searched for "${metadata.search_term}" (${metadata.results_count || 0} results)`;
          default:
            return `navigated to ${activity_type}`;
        }
      default:
        return `performed ${activity_type} activity`;
    }
  };

  const getActivityColor = (category: string) => {
    switch (category) {
      case 'team_management': return 'bg-blue-500';
      case 'navigation': return 'bg-green-500';
      case 'authentication': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Activity Feed
            {isRealTimeConnected && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {activities.length} activities
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = getActivityIcon(activity.activity_type, activity.activity_category);
                
                return (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded-full ${getActivityColor(activity.activity_category)} bg-opacity-10`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {activity.user_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {activity.activity_category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getActivityDescription(activity)}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}