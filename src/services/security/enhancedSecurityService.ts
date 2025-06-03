
import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO';
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  event_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export class EnhancedSecurityService {
  static async logSecurityEvent(event: Partial<SecurityEvent>): Promise<void> {
    try {
      const eventToInsert = {
        event_type: event.event_type || '',
        severity: event.severity || 'INFO',
        user_id: event.user_id,
        resource_type: event.resource_type,
        resource_id: event.resource_id,
        event_data: event.event_data || {},
        ip_address: event.ip_address,
        user_agent: event.user_agent
      };

      const { error } = await supabase
        .from('security_events')
        .insert(eventToInsert);

      if (error) {
        console.error('Failed to log security event:', error);
      }
    } catch (error) {
      console.error('Security logging error:', error);
    }
  }

  static async logLoginAttempt(userId: string, success: boolean, ipAddress?: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'login_attempt',
      severity: success ? 'INFO' : 'MEDIUM',
      user_id: userId,
      event_data: { success, timestamp: new Date().toISOString() },
      ip_address: ipAddress
    });
  }

  static async logAdminAction(
    userId: string, 
    action: string,
    resourceType: string, 
    resourceId: string, 
    details: Record<string, any>
  ): Promise<void> {
    // Use the new admin logging function
    await supabase.rpc('log_admin_action', {
      action_type: action,
      entity_type: resourceType,
      entity_id: resourceId,
      admin_user_id: userId,
      details
    });

    // Also log as security event for high-impact actions
    const highImpactActions = ['delete', 'revoke', 'suspend', 'role_change'];
    if (highImpactActions.some(act => action.includes(act))) {
      await this.logSecurityEvent({
        event_type: 'admin_action',
        severity: 'HIGH',
        user_id: userId,
        resource_type: resourceType,
        resource_id: resourceId,
        event_data: { action, details }
      });
    }
  }

  static async getSecuritySummary(): Promise<any> {
    try {
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(500);

      const eventsBySeverity = (events || []).reduce((acc, event) => {
        const severity = event.severity || 'INFO';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        eventsBySeverity,
        totalEvents: events?.length || 0,
        recentEvents: events?.slice(0, 10) || []
      };
    } catch (error) {
      console.error('Failed to get security summary:', error);
      return { eventsBySeverity: {}, totalEvents: 0, recentEvents: [] };
    }
  }
}
