import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Clock, User, Shield, UserCheck } from 'lucide-react';

interface MemberActivityTimelineProps {
  teamId: string;
}

interface ActivityItem {
  id: string;
  event_type: string;
  event_data: any;
  performed_by: string;
  affected_user_id?: string;
  created_at: string;
  performer_name?: string;
  affected_user_name?: string;
}

export function MemberActivityTimeline({ teamId }: MemberActivityTimelineProps) {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['team-activity', teamId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_lifecycle_events')
        .select(`
          *,
          performer:profiles!team_lifecycle_events_performed_by_fkey(display_name),
          affected_user:profiles!team_lifecycle_events_affected_user_id_fkey(display_name)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        event_type: item.event_type,
        event_data: item.event_data,
        performed_by: item.performed_by || '',
        affected_user_id: item.affected_user_id,
        created_at: item.created_at || new Date().toISOString(),
        performer_name: item.performer?.display_name || 'System',
        affected_user_name: item.affected_user?.display_name || 'Unknown User'
      })) as ActivityItem[];
    },
    refetchInterval: 60000
  });

  const getActivityIcon = (eventType: string) => {
    switch (eventType) {
      case 'member_added':
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'member_removed':
        return <User className="h-4 w-4 text-red-600" />;
      case 'role_changed':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'status_changed':
        return <Activity className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityBadgeVariant = (eventType: string) => {
    switch (eventType) {
      case 'member_added':
        return 'default';
      case 'member_removed':
        return 'destructive';
      case 'role_changed':
        return 'secondary';
      case 'status_changed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatActivityDescription = (activity: ActivityItem) => {
    const eventData = activity.event_data || {};
    const performerName = activity.performer_name;
    const affectedName = activity.affected_user_name;

    switch (activity.event_type) {
      case 'member_added':
        return `${performerName} added ${affectedName} to the team`;
      case 'member_removed':
        return `${performerName} removed ${affectedName} from the team`;
      case 'role_changed':
        return `${performerName} changed ${affectedName}'s role from ${eventData.old_role} to ${eventData.new_role}`;
      case 'status_changed':
        return `${performerName} changed ${affectedName}'s status from ${eventData.old_status} to ${eventData.new_status}`;
      default:
        return `${performerName} performed ${activity.event_type}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Team Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No team activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.event_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      {formatActivityDescription(activity)}
                    </p>
                    <Badge variant={getActivityBadgeVariant(activity.event_type)}>
                      {activity.event_type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.created_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {activity.event_data && Object.keys(activity.event_data).length > 0 && (
                    <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
                      <pre className="text-muted-foreground">
                        {JSON.stringify(activity.event_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
