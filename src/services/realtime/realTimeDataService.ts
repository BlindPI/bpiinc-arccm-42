
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface RealTimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

export class RealTimeDataService {
  private static activeChannels: Map<string, RealtimeChannel> = new Map();

  static async subscribeToTeamUpdates(
    teamId: string, 
    callback: (payload: any) => void
  ): Promise<RealTimeSubscription> {
    const channelName = `team_updates_${teamId}`;
    
    // Remove existing channel if it exists
    if (this.activeChannels.has(channelName)) {
      await supabase.removeChannel(this.activeChannels.get(channelName)!);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `team_id=eq.${teamId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
          filter: `id=eq.${teamId}`
        },
        callback
      )
      .subscribe();

    this.activeChannels.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.activeChannels.delete(channelName);
      }
    };
  }

  static async subscribeToAnalyticsUpdates(
    callback: (payload: any) => void
  ): Promise<RealTimeSubscription> {
    const channelName = 'analytics_updates';
    
    if (this.activeChannels.has(channelName)) {
      await supabase.removeChannel(this.activeChannels.get(channelName)!);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'certificates'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'course_offerings'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_performance_metrics'
        },
        callback
      )
      .subscribe();

    this.activeChannels.set(channelName, channel);

    return {
      channel,
      unsubscribe: () => {
        supabase.removeChannel(channel);
        this.activeChannels.delete(channelName);
      }
    };
  }

  static async getWorkflowStatistics(): Promise<any> {
    const { data, error } = await supabase.rpc('get_workflow_statistics');
    if (error) throw error;
    return data;
  }

  static async getComplianceReport(teamId: string): Promise<any> {
    const { data, error } = await supabase.rpc('get_team_compliance_report', {
      p_team_id: teamId
    });
    if (error) throw error;
    return data;
  }

  static async calculateComplianceRisk(entityType: string, entityId: string): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_compliance_risk_score', {
      p_entity_type: entityType,
      p_entity_id: entityId
    });
    if (error) throw error;
    return data || 0;
  }

  static cleanup(): void {
    this.activeChannels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.activeChannels.clear();
  }
}
