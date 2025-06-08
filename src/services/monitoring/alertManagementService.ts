
import { supabase } from '@/integrations/supabase/client';

export interface SystemAlert {
  id: string;
  alert_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  source: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: string;
  updated_at: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  metadata?: Record<string, any>;
}

export class AlertManagementService {
  async getSystemAlerts(status?: string): Promise<SystemAlert[]> {
    try {
      // Since system_alerts table doesn't exist, return mock data or use audit_logs
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform audit logs to alert format with proper type conversion
      return (logs || []).map(log => ({
        id: log.id,
        alert_type: 'SYSTEM',
        severity: 'MEDIUM' as const,
        message: `${log.action} on ${log.entity_type}`,
        source: 'SYSTEM',
        status: 'OPEN' as const,
        created_at: log.created_at,
        updated_at: log.created_at,
        metadata: log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) as Record<string, any> : {}
      }));
    } catch (error) {
      console.error('Error fetching system alerts:', error);
      return [];
    }
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    // Since we're using audit_logs as mock alerts, just log the acknowledgment
    console.log(`Alert ${alertId} acknowledged by ${userId}`);
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    // Since we're using audit_logs as mock alerts, just log the resolution
    console.log(`Alert ${alertId} resolved by ${userId}`);
  }

  async createAlert(alert: Partial<SystemAlert>): Promise<SystemAlert> {
    // Create an entry in audit_logs to simulate an alert
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        action: 'ALERT_CREATED',
        entity_type: 'SYSTEM',
        entity_id: 'system',
        details: alert,
        user_id: null
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      alert_type: alert.alert_type || 'SYSTEM',
      severity: alert.severity || 'MEDIUM',
      message: alert.message || 'System alert',
      source: alert.source || 'SYSTEM',
      status: 'OPEN',
      created_at: data.created_at,
      updated_at: data.created_at,
      metadata: alert.metadata
    };
  }
}

export const alertManagementService = new AlertManagementService();
