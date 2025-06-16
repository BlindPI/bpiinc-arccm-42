import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Bell,
  Users,
  UserPlus,
  UserMinus,
  Settings,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamMemberWithProfile } from '@/types/team-management';

interface TeamUpdate {
  id: string;
  type: 'member_added' | 'member_removed' | 'member_role_changed' | 'team_updated' | 'performance_changed';
  teamId: string;
  teamName: string;
  userId?: string;
  userName?: string;
  details: Record<string, any>;
  timestamp: string;
  read: boolean;
}

interface RealTimeTeamUpdatesProps {
  teams: EnhancedTeam[];
  onTeamUpdate?: (teamId: string) => void;
  maxUpdates?: number;
  autoMarkAsRead?: boolean;
}

export function RealTimeTeamUpdates({
  teams,
  onTeamUpdate,
  maxUpdates = 10,
  autoMarkAsRead = true,
}: RealTimeTeamUpdatesProps) {
  const [updates, setUpdates] = useState<TeamUpdate[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const addUpdate = useCallback((update: Omit<TeamUpdate, 'id' | 'timestamp' | 'read'>) => {
    const newUpdate: TeamUpdate = {
      ...update,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    setUpdates(prev => {
      const filtered = prev.slice(0, maxUpdates - 1);
      return [newUpdate, ...filtered];
    });

    setUnreadCount(prev => prev + 1);

    // Auto-mark as read after 5 seconds if enabled
    if (autoMarkAsRead) {
      setTimeout(() => {
        markAsRead(newUpdate.id);
      }, 5000);
    }
  }, [maxUpdates, autoMarkAsRead]);

  const markAsRead = useCallback((updateId: string) => {
    setUpdates(prev => prev.map(update => 
      update.id === updateId ? { ...update, read: true } : update
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setUpdates(prev => prev.map(update => ({ ...update, read: true })));
    setUnreadCount(0);
  }, []);

  const clearUpdate = useCallback((updateId: string) => {
    setUpdates(prev => {
      const update = prev.find(u => u.id === updateId);
      if (update && !update.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(u => u.id !== updateId);
    });
  }, []);

  useEffect(() => {
    if (!teams.length) return;

    const teamIds = teams.map(team => team.id);
    
    // Subscribe to team changes
    const teamSubscription = supabase
      .channel('team_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `id=in.(${teamIds.join(',')})`,
        },
        (payload: any) => {
          const team = teams.find(t => t.id === (payload.new as any)?.id || (payload.old as any)?.id);
          if (!team) return;

          if (payload.eventType === 'UPDATE') {
            addUpdate({
              type: 'team_updated',
              teamId: team.id,
              teamName: team.name,
              details: {
                changes: payload.new,
                old: payload.old,
              },
            });

            // Check for performance changes
            if ((payload.old as any)?.performance_score !== (payload.new as any)?.performance_score) {
              const oldScore = (payload.old as any)?.performance_score || 0;
              const newScore = (payload.new as any)?.performance_score || 0;
              
              addUpdate({
                type: 'performance_changed',
                teamId: team.id,
                teamName: team.name,
                details: {
                  oldScore,
                  newScore,
                  change: newScore - oldScore,
                },
              });
            }

            onTeamUpdate?.(team.id);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to team member changes
    const memberSubscription = supabase
      .channel('team_member_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=in.(${teamIds.join(',')})`,
        },
        async (payload: any) => {
          const teamId = (payload.new as any)?.team_id || (payload.old as any)?.team_id;
          const team = teams.find(t => t.id === teamId);
          if (!team) return;

          // Get user details
          const userId = (payload.new as any)?.user_id || (payload.old as any)?.user_id;
          let userName = 'Unknown User';
          
          if (userId) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', userId)
              .single();
            
            userName = profile?.display_name || userName;
          }

          switch (payload.eventType) {
            case 'INSERT':
              addUpdate({
                type: 'member_added',
                teamId: team.id,
                teamName: team.name,
                userId,
                userName,
                details: {
                  role: (payload.new as any)?.role,
                  status: (payload.new as any)?.status,
                },
              });
              break;

            case 'DELETE':
              addUpdate({
                type: 'member_removed',
                teamId: team.id,
                teamName: team.name,
                userId,
                userName,
                details: {
                  role: (payload.old as any)?.role,
                },
              });
              break;

            case 'UPDATE':
              if ((payload.old as any)?.role !== (payload.new as any)?.role) {
                addUpdate({
                  type: 'member_role_changed',
                  teamId: team.id,
                  teamName: team.name,
                  userId,
                  userName,
                  details: {
                    oldRole: (payload.old as any)?.role,
                    newRole: (payload.new as any)?.role,
                  },
                });
              }
              break;
          }

          onTeamUpdate?.(team.id);
        }
      )
      .subscribe();

    return () => {
      teamSubscription.unsubscribe();
      memberSubscription.unsubscribe();
    };
  }, [teams, addUpdate, onTeamUpdate]);

  const getUpdateIcon = (type: TeamUpdate['type']) => {
    switch (type) {
      case 'member_added': return <UserPlus className="h-4 w-4 text-green-600" />;
      case 'member_removed': return <UserMinus className="h-4 w-4 text-red-600" />;
      case 'member_role_changed': return <Settings className="h-4 w-4 text-blue-600" />;
      case 'team_updated': return <Settings className="h-4 w-4 text-blue-600" />;
      case 'performance_changed': return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUpdateMessage = (update: TeamUpdate) => {
    switch (update.type) {
      case 'member_added':
        return (
          <span>
            <strong>{update.userName}</strong> joined team <strong>{update.teamName}</strong>
            {update.details.role && (
              <Badge variant="outline" className="ml-2 text-xs">
                {update.details.role}
              </Badge>
            )}
          </span>
        );
      
      case 'member_removed':
        return (
          <span>
            <strong>{update.userName}</strong> left team <strong>{update.teamName}</strong>
          </span>
        );
      
      case 'member_role_changed':
        return (
          <span>
            <strong>{update.userName}</strong> role changed from{' '}
            <Badge variant="outline" className="mx-1 text-xs">
              {update.details.oldRole}
            </Badge>
            to
            <Badge variant="outline" className="ml-1 text-xs">
              {update.details.newRole}
            </Badge>
            in <strong>{update.teamName}</strong>
          </span>
        );
      
      case 'team_updated':
        return (
          <span>
            Team <strong>{update.teamName}</strong> was updated
          </span>
        );
      
      case 'performance_changed':
        const change = update.details.change;
        const isImprovement = change > 0;
        return (
          <span>
            Team <strong>{update.teamName}</strong> performance{' '}
            {isImprovement ? (
              <span className="text-green-600 font-medium">
                improved by {change}%
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                decreased by {Math.abs(change)}%
              </span>
            )}
            {isImprovement ? (
              <TrendingUp className="inline h-3 w-3 ml-1 text-green-600" />
            ) : (
              <TrendingDown className="inline h-3 w-3 ml-1 text-red-600" />
            )}
          </span>
        );
      
      default:
        return <span>Team activity in <strong>{update.teamName}</strong></span>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span>Live Updates</span>
            <div className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-red-500"
            )} />
          </div>
          {unreadCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-6 px-2"
              >
                Mark all read
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {updates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No recent updates</p>
            <p className="text-xs text-gray-400">
              {isConnected ? 'Listening for changes...' : 'Connecting...'}
            </p>
          </div>
        ) : (
          updates.map((update) => (
            <div
              key={update.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                update.read 
                  ? "bg-gray-50 border-gray-200" 
                  : "bg-blue-50 border-blue-200 shadow-sm"
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getUpdateIcon(update.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  {getUpdateMessage(update)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(update.timestamp)}
                  </span>
                  {!update.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(update.id)}
                      className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearUpdate(update.id)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}