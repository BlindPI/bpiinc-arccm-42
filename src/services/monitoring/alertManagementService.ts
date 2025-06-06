import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types for alert management
export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'system' | 'security' | 'performance' | 'user' | 'business';
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  source: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne';
    threshold: number;
    duration?: number; // in seconds
  };
  severity: Alert['severity'];
  category: Alert['category'];
  enabled: boolean;
  notification_channels: string[];
  cooldown_period?: number; // in seconds
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  configuration: Record<string, any>;
  enabled: boolean;
  created_at: string;
}

export interface AlertSubscription {
  id: string;
  user_id: string;
  alert_categories: Alert['category'][];
  severity_levels: Alert['severity'][];
  notification_channels: string[];
  enabled: boolean;
  created_at: string;
}

class AlertManagementService {
  private static instance: AlertManagementService;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL = 30000; // 30 seconds

  public static getInstance(): AlertManagementService {
    if (!AlertManagementService.instance) {
      AlertManagementService.instance = new AlertManagementService();
    }
    return AlertManagementService.instance;
  }

  constructor() {
    this.loadAlertRules();
    this.startMonitoring();
  }

  /**
   * Create a new alert
   */
  async createAlert(alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<Alert> {
    try {
      const alert: Alert = {
        id: crypto.randomUUID(),
        ...alertData,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store alert in audit logs
      await supabase
        .from('audit_logs')
        .insert({
          action: 'alert_created',
          entity_type: 'alert',
          entity_id: alert.id,
          details: {
            alert_id: alert.id,
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
            category: alert.category,
            source: alert.source,
            metadata: alert.metadata
          }
        });

      this.activeAlerts.set(alert.id, alert);

      // Send notifications
      await this.sendAlertNotifications(alert);

      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new Error('Failed to create alert');
    }
  }

  /**
   * Get alerts with filtering and pagination
   */
  async getAlerts(
    filters?: {
      status?: Alert['status'];
      severity?: Alert['severity'];
      category?: Alert['category'];
      source?: string;
    },
    limit: number = 50,
    offset: number = 0
  ): Promise<Alert[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'alert_created')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }

      const alerts = (data || []).map(log => {
        const details = log.details as Record<string, any> || {};
        return {
          id: details.alert_id || log.id,
          title: details.title || 'Unknown Alert',
          message: details.message || '',
          severity: details.severity || 'medium',
          category: details.category || 'system',
          status: details.status || 'active',
          source: details.source || 'system',
          entity_type: log.entity_type,
          entity_id: log.entity_id,
          metadata: details.metadata || {},
          created_at: log.created_at || new Date().toISOString(),
          updated_at: log.created_at || new Date().toISOString()
        } as Alert;
      });

      // Apply filters
      let filteredAlerts = alerts;
      
      if (filters?.status) {
        filteredAlerts = filteredAlerts.filter(a => a.status === filters.status);
      }
      if (filters?.severity) {
        filteredAlerts = filteredAlerts.filter(a => a.severity === filters.severity);
      }
      if (filters?.category) {
        filteredAlerts = filteredAlerts.filter(a => a.category === filters.category);
      }
      if (filters?.source) {
        filteredAlerts = filteredAlerts.filter(a => a.source === filters.source);
      }

      return filteredAlerts;
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.status = 'acknowledged';
      alert.acknowledged_by = userId;
      alert.acknowledged_at = new Date().toISOString();
      alert.updated_at = new Date().toISOString();

      this.activeAlerts.set(alertId, alert);

      // Log the acknowledgment
      await supabase
        .from('audit_logs')
        .insert({
          action: 'alert_acknowledged',
          entity_type: 'alert',
          entity_id: alertId,
          user_id: userId,
          details: {
            alert_id: alertId,
            acknowledged_by: userId,
            acknowledged_at: alert.acknowledged_at
          }
        });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      throw new Error('Failed to acknowledge alert');
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, userId: string, resolution?: string): Promise<void> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        throw new Error('Alert not found');
      }

      alert.status = 'resolved';
      alert.resolved_by = userId;
      alert.resolved_at = new Date().toISOString();
      alert.updated_at = new Date().toISOString();

      this.activeAlerts.set(alertId, alert);

      // Log the resolution
      await supabase
        .from('audit_logs')
        .insert({
          action: 'alert_resolved',
          entity_type: 'alert',
          entity_id: alertId,
          user_id: userId,
          details: {
            alert_id: alertId,
            resolved_by: userId,
            resolved_at: alert.resolved_at,
            resolution: resolution
          }
        });
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw new Error('Failed to resolve alert');
    }
  }

  /**
   * Create an alert rule
   */
  async createAlertRule(ruleData: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>): Promise<AlertRule> {
    try {
      const rule: AlertRule = {
        id: crypto.randomUUID(),
        ...ruleData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in automation_rules table
      await supabase
        .from('automation_rules')
        .insert({
          id: rule.id,
          name: rule.name,
          rule_type: 'alert',
          trigger_conditions: {
            condition: rule.condition,
            severity: rule.severity,
            category: rule.category
          },
          actions: {
            create_alert: true,
            notification_channels: rule.notification_channels,
            cooldown_period: rule.cooldown_period
          },
          is_active: rule.enabled,
          created_by: rule.created_by,
          description: rule.description
        });

      this.alertRules.set(rule.id, rule);

      return rule;
    } catch (error) {
      console.error('Error creating alert rule:', error);
      throw new Error('Failed to create alert rule');
    }
  }

  /**
   * Get alert rules
   */
  async getAlertRules(userId?: string): Promise<AlertRule[]> {
    try {
      let query = supabase
        .from('automation_rules')
        .select('*')
        .eq('rule_type', 'alert')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching alert rules:', error);
        return [];
      }

      return (data || []).map(rule => {
        const triggerConditions = rule.trigger_conditions as Record<string, any> || {};
        const actions = rule.actions as Record<string, any> || {};
        
        return {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          condition: triggerConditions.condition || { metric: '', operator: 'gt', threshold: 0 },
          severity: triggerConditions.severity || 'medium',
          category: triggerConditions.category || 'system',
          enabled: rule.is_active || false,
          notification_channels: actions.notification_channels || [],
          cooldown_period: actions.cooldown_period,
          created_by: rule.created_by || '',
          created_at: rule.created_at || new Date().toISOString(),
          updated_at: rule.updated_at || new Date().toISOString()
        } as AlertRule;
      });
    } catch (error) {
      console.error('Error getting alert rules:', error);
      return [];
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(timeRange?: { start: string; end: string }): Promise<{
    total: number;
    by_severity: Record<Alert['severity'], number>;
    by_category: Record<Alert['category'], number>;
    by_status: Record<Alert['status'], number>;
    resolution_time_avg: number;
  }> {
    try {
      const alerts = await this.getAlerts(undefined, 1000);
      
      let filteredAlerts = alerts;
      if (timeRange) {
        filteredAlerts = alerts.filter(alert => {
          const alertTime = new Date(alert.created_at).getTime();
          const startTime = new Date(timeRange.start).getTime();
          const endTime = new Date(timeRange.end).getTime();
          return alertTime >= startTime && alertTime <= endTime;
        });
      }

      const stats = {
        total: filteredAlerts.length,
        by_severity: { low: 0, medium: 0, high: 0, critical: 0 },
        by_category: { system: 0, security: 0, performance: 0, user: 0, business: 0 },
        by_status: { active: 0, acknowledged: 0, resolved: 0, suppressed: 0 },
        resolution_time_avg: 0
      };

      let totalResolutionTime = 0;
      let resolvedCount = 0;

      for (const alert of filteredAlerts) {
        stats.by_severity[alert.severity]++;
        stats.by_category[alert.category]++;
        stats.by_status[alert.status]++;

        if (alert.status === 'resolved' && alert.resolved_at) {
          const resolutionTime = new Date(alert.resolved_at).getTime() - new Date(alert.created_at).getTime();
          totalResolutionTime += resolutionTime;
          resolvedCount++;
        }
      }

      if (resolvedCount > 0) {
        stats.resolution_time_avg = Math.round(totalResolutionTime / resolvedCount / 1000 / 60); // in minutes
      }

      return stats;
    } catch (error) {
      console.error('Error getting alert statistics:', error);
      return {
        total: 0,
        by_severity: { low: 0, medium: 0, high: 0, critical: 0 },
        by_category: { system: 0, security: 0, performance: 0, user: 0, business: 0 },
        by_status: { active: 0, acknowledged: 0, resolved: 0, suppressed: 0 },
        resolution_time_avg: 0
      };
    }
  }

  /**
   * Evaluate metric against alert rules
   */
  async evaluateMetric(metricName: string, value: number, metadata?: Record<string, any>): Promise<void> {
    try {
      const rules = Array.from(this.alertRules.values()).filter(rule => 
        rule.enabled && rule.condition.metric === metricName
      );

      for (const rule of rules) {
        const shouldTrigger = this.evaluateCondition(rule.condition, value);
        
        if (shouldTrigger) {
          // Check cooldown period
          if (await this.isInCooldown(rule.id)) {
            continue;
          }

          // Create alert
          await this.createAlert({
            title: `Alert: ${rule.name}`,
            message: `Metric ${metricName} (${value}) triggered alert rule: ${rule.name}`,
            severity: rule.severity,
            category: rule.category,
            source: 'alert_rule',
            entity_type: 'metric',
            entity_id: metricName,
            metadata: {
              rule_id: rule.id,
              metric_value: value,
              threshold: rule.condition.threshold,
              ...metadata
            }
          });

          // Record cooldown
          await this.recordCooldown(rule.id);
        }
      }
    } catch (error) {
      console.error('Error evaluating metric:', error);
    }
  }

  // Private helper methods
  private async loadAlertRules(): Promise<void> {
    try {
      const rules = await this.getAlertRules();
      for (const rule of rules) {
        this.alertRules.set(rule.id, rule);
      }
    } catch (error) {
      console.error('Error loading alert rules:', error);
    }
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      // In a real implementation, this would check metrics and evaluate rules
      // For now, we'll just log that monitoring is active
      console.log('Alert monitoring active...');
    }, this.MONITORING_INTERVAL);
  }

  private stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private evaluateCondition(condition: AlertRule['condition'], value: number): boolean {
    switch (condition.operator) {
      case 'gt':
        return value > condition.threshold;
      case 'lt':
        return value < condition.threshold;
      case 'eq':
        return value === condition.threshold;
      case 'gte':
        return value >= condition.threshold;
      case 'lte':
        return value <= condition.threshold;
      case 'ne':
        return value !== condition.threshold;
      default:
        return false;
    }
  }

  private async isInCooldown(ruleId: string): Promise<boolean> {
    try {
      const rule = this.alertRules.get(ruleId);
      if (!rule || !rule.cooldown_period) {
        return false;
      }

      const cooldownStart = new Date(Date.now() - rule.cooldown_period * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('action', 'alert_created')
        .gte('created_at', cooldownStart)
        .limit(1);

      return !error && data && data.length > 0;
    } catch (error) {
      console.error('Error checking cooldown:', error);
      return false;
    }
  }

  private async recordCooldown(ruleId: string): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          action: 'alert_cooldown',
          entity_type: 'alert_rule',
          entity_id: ruleId,
          details: {
            rule_id: ruleId,
            cooldown_started: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Error recording cooldown:', error);
    }
  }

  private async sendAlertNotifications(alert: Alert): Promise<void> {
    try {
      // In a real implementation, this would send notifications via configured channels
      console.log(`Alert notification: ${alert.title} - ${alert.message}`);
      
      // Log notification attempt
      await supabase
        .from('audit_logs')
        .insert({
          action: 'alert_notification_sent',
          entity_type: 'alert',
          entity_id: alert.id,
          details: {
            alert_id: alert.id,
            notification_sent: true,
            timestamp: new Date().toISOString()
          }
        });
    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  }
}

export const alertManagementService = AlertManagementService.getInstance();