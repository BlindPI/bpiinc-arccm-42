
import { supabase } from '@/integrations/supabase/client';

export interface Alert {
  id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  source: string;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  updated_at: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  metadata?: Record<string, any>;
}

export interface AlertFilters {
  status?: 'active' | 'acknowledged' | 'resolved';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  alert_type?: string;
  source?: string;
  start_date?: string;
  end_date?: string;
}

export interface AlertRule {
  id: string;
  rule_name: string;
  rule_type: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class AlertManagementService {
  async getAlerts(filters?: AlertFilters, limit?: number): Promise<Alert[]> {
    try {
      // Use the existing system_alerts table from the monitoring migration
      let query = supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.alert_type) {
        query = query.eq('alert_type', filters.alert_type);
      }
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      if (filters?.start_date) {
        query = query.gte('created_at', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('created_at', filters.end_date);
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(alert => ({
        id: alert.id,
        alert_type: alert.alert_type,
        severity: alert.severity,
        message: alert.message,
        source: alert.source,
        status: alert.status,
        created_at: alert.created_at,
        updated_at: alert.updated_at,
        acknowledged_by: alert.acknowledged_by,
        acknowledged_at: alert.acknowledged_at,
        resolved_by: alert.resolved_by,
        resolved_at: alert.resolved_at,
        metadata: alert.metadata || {}
      }));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Return mock data for development
      return this.getMockAlerts(filters, limit);
    }
  }

  async createAlert(alert: Partial<Alert>): Promise<Alert> {
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .insert({
          alert_type: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          source: alert.source,
          status: 'active',
          metadata: alert.metadata || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        alert_type: data.alert_type,
        severity: data.severity,
        message: data.message,
        source: data.source,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        metadata: data.metadata || {}
      };
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: userId,
          acknowledged_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw error;
    }
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_alerts')
        .update({
          status: 'resolved',
          resolved_by: userId,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(rule => ({
        id: rule.id,
        rule_name: rule.rule_name,
        rule_type: rule.rule_type,
        conditions: rule.conditions || {},
        actions: rule.actions || {},
        is_active: rule.is_active,
        created_at: rule.created_at,
        updated_at: rule.updated_at
      }));
    } catch (error) {
      console.error('Error fetching alert rules:', error);
      return [];
    }
  }

  async createAlertRule(rule: Partial<AlertRule>): Promise<AlertRule> {
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .insert({
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          conditions: rule.conditions || {},
          actions: rule.actions || {},
          is_active: rule.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return {
        id: data.id,
        rule_name: data.rule_name,
        rule_type: data.rule_type,
        conditions: data.conditions || {},
        actions: data.actions || {},
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating alert rule:', error);
      throw error;
    }
  }

  async evaluateAlertRules(): Promise<void> {
    try {
      const rules = await this.getAlertRules();
      const activeRules = rules.filter(rule => rule.is_active);

      for (const rule of activeRules) {
        await this.evaluateRule(rule);
      }
    } catch (error) {
      console.error('Error evaluating alert rules:', error);
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<void> {
    // Rule evaluation logic would go here
    // This is a placeholder for actual rule evaluation
    console.log('Evaluating rule:', rule.rule_name);
  }

  private getMockAlerts(filters?: AlertFilters, limit?: number): Alert[] {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        alert_type: 'system_health',
        severity: 'high',
        message: 'High memory usage detected',
        source: 'system_monitor',
        status: 'active',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        metadata: { memory_usage: 85 }
      },
      {
        id: '2',
        alert_type: 'performance',
        severity: 'medium',
        message: 'Response time above threshold',
        source: 'api_monitor',
        status: 'acknowledged',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        acknowledged_by: 'system',
        acknowledged_at: new Date(Date.now() - 1800000).toISOString(),
        metadata: { response_time: 2500 }
      }
    ];

    let filtered = mockAlerts;
    
    if (filters?.status) {
      filtered = filtered.filter(alert => alert.status === filters.status);
    }
    if (filters?.severity) {
      filtered = filtered.filter(alert => alert.severity === filters.severity);
    }
    
    return limit ? filtered.slice(0, limit) : filtered;
  }
}

export const alertManagementService = new AlertManagementService();
