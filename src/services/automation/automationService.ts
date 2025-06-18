
import { supabase } from '@/integrations/supabase/client';
import { AutomationRule, AutomationExecution } from '@/types/analytics';

export class AutomationService {
  static async createRule(rule: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'last_executed'>): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('automation_rules')
      .insert({
        ...rule,
        execution_count: 0,
        // Use NULL for system-created rules if no user specified
        created_by: rule.created_by || null
      })
      .select()
      .single();

    if (error) throw error;
    return data as AutomationRule;
  }

  static async getRules(): Promise<AutomationRule[]> {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as AutomationRule[];
  }

  static async updateRule(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const { data, error } = await supabase
      .from('automation_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AutomationRule;
  }

  static async deleteRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async executeRule(ruleId: string): Promise<any> {
    const { data, error } = await supabase.rpc('execute_automation_rule', {
      p_rule_id: ruleId
    });

    if (error) throw error;
    return data;
  }

  static async getExecutions(ruleId?: string): Promise<AutomationExecution[]> {
    let query = supabase
      .from('automation_executions')
      .select('*')
      .order('started_at', { ascending: false });

    if (ruleId) {
      query = query.eq('rule_id', ruleId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      execution_data: item.execution_data as Record<string, any>,
      result: item.result as Record<string, any> | undefined
    })) as AutomationExecution[];
  }

  static async getExecutionStats(): Promise<any> {
    const { data, error } = await supabase
      .from('automation_executions')
      .select('status, rule_id')
      .order('started_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const stats = data?.reduce((acc, execution) => {
      const status = execution.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return stats;
  }

  static async createProgressionRule(
    fromRole: string,
    toRole: string,
    conditions: Record<string, any>
  ): Promise<AutomationRule> {
    const rule = {
      name: `Auto Progression: ${fromRole} to ${toRole}`,
      description: `Automatically evaluate progression from ${fromRole} to ${toRole}`,
      rule_type: 'progression',
      trigger_conditions: {
        from_role: fromRole,
        to_role: toRole,
        ...conditions
      },
      actions: {
        type: 'evaluate_progression',
        notify_user: true,
        create_transition_request: true
      },
      is_active: true,
      created_by: ''
    };

    return this.createRule(rule);
  }

  static async createNotificationRule(
    eventType: string,
    notificationTemplate: Record<string, any>
  ): Promise<AutomationRule> {
    const rule = {
      name: `Auto Notification: ${eventType}`,
      description: `Automatically send notifications for ${eventType} events`,
      rule_type: 'notification',
      trigger_conditions: {
        event_type: eventType
      },
      actions: {
        type: 'send_notification',
        template: notificationTemplate
      },
      is_active: true,
      created_by: ''
    };

    return this.createRule(rule);
  }

  static async createComplianceRule(
    checkType: string,
    conditions: Record<string, any>
  ): Promise<AutomationRule> {
    const rule = {
      name: `Auto Compliance: ${checkType}`,
      description: `Automatically check compliance for ${checkType}`,
      rule_type: 'compliance',
      trigger_conditions: {
        check_type: checkType,
        ...conditions
      },
      actions: {
        type: 'compliance_check',
        notify_on_failure: true,
        create_issue: true
      },
      is_active: true,
      created_by: ''
    };

    return this.createRule(rule);
  }
}
