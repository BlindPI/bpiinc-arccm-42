import { supabase } from '@/integrations/supabase/client';

export interface ComplianceMetric {
  id: string;
  name: string;
  description: string;
  category: string;
  required_for_roles: string[];
  measurement_type: 'boolean' | 'percentage' | 'date' | 'numeric';
  target_value: any;
  weight: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserComplianceRecord {
  id: string;
  user_id: string;
  metric_id: string;
  current_value: any;
  compliance_status: 'compliant' | 'non_compliant' | 'warning' | 'pending';
  last_checked_at: string;
  next_check_due: string;
  notes: string;
  verified_by: string;
  verified_at: string;
  created_at: string;
  updated_at: string;
  compliance_metrics?: ComplianceMetric;
}

export interface ComplianceAction {
  id: string;
  user_id: string;
  metric_id: string;
  action_type: string;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'completed' | 'dismissed';
  assigned_by: string;
  completed_by: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
  compliance_metrics?: ComplianceMetric;
}

export interface ComplianceSummary {
  user_id: string;
  overall_score: number;
  total_metrics: number;
  compliant_count: number;
  warning_count: number;
  non_compliant_count: number;
  pending_count: number;
  overdue_actions: number;
}

export class ComplianceService {
  // Get all compliance metrics
  static async getComplianceMetrics(): Promise<ComplianceMetric[]> {
    const { data, error } = await supabase
      .from('compliance_metrics')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get compliance metrics for a specific role
  static async getComplianceMetricsForRole(role: string): Promise<ComplianceMetric[]> {
    const { data, error } = await supabase
      .from('compliance_metrics')
      .select('*')
      .eq('is_active', true)
      .or(`required_for_roles.cs.{${role}},required_for_roles.eq.{}`)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Create or update compliance metric (SA/AD only)
  static async upsertComplianceMetric(metric: Partial<ComplianceMetric>): Promise<ComplianceMetric> {
    const { data, error } = await supabase
      .from('compliance_metrics')
      .upsert({
        ...metric,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Delete compliance metric (SA/AD only)
  static async deleteComplianceMetric(metricId: string): Promise<void> {
    const { error } = await supabase
      .from('compliance_metrics')
      .update({ is_active: false })
      .eq('id', metricId);

    if (error) throw error;
  }

  // Get user compliance records
  static async getUserComplianceRecords(userId: string): Promise<UserComplianceRecord[]> {
    const { data, error } = await supabase
      .from('user_compliance_records')
      .select(`
        *,
        compliance_metrics (
          id,
          name,
          description,
          category,
          measurement_type,
          target_value,
          weight
        )
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get compliance records for all users (SA/AD only)
  static async getAllComplianceRecords(): Promise<UserComplianceRecord[]> {
    const { data, error } = await supabase
      .from('user_compliance_records')
      .select(`
        *,
        compliance_metrics (
          id,
          name,
          description,
          category,
          measurement_type,
          target_value,
          weight
        ),
        profiles!user_compliance_records_user_id_fkey (
          id,
          display_name,
          email,
          role
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Update compliance record
  static async updateComplianceRecord(
    userId: string,
    metricId: string,
    currentValue: any,
    complianceStatus: 'compliant' | 'non_compliant' | 'warning' | 'pending',
    notes?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('update_compliance_record', {
      p_user_id: userId,
      p_metric_id: metricId,
      p_current_value: currentValue,
      p_compliance_status: complianceStatus,
      p_notes: notes || null
    });

    if (error) throw error;
    return data;
  }

  // Get user compliance summary
  static async getUserComplianceSummary(userId: string): Promise<ComplianceSummary> {
    const { data, error } = await supabase.rpc('get_user_compliance_summary', {
      p_user_id: userId
    });

    if (error) throw error;
    return data?.[0] || {
      user_id: userId,
      overall_score: 0,
      total_metrics: 0,
      compliant_count: 0,
      warning_count: 0,
      non_compliant_count: 0,
      pending_count: 0,
      overdue_actions: 0
    };
  }

  // Get compliance actions for user
  static async getUserComplianceActions(userId: string): Promise<ComplianceAction[]> {
    const { data, error } = await supabase
      .from('compliance_actions')
      .select(`
        *,
        compliance_metrics (
          id,
          name,
          category
        )
      `)
      .eq('user_id', userId)
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Create compliance action
  static async createComplianceAction(action: Partial<ComplianceAction>): Promise<ComplianceAction> {
    const { data, error } = await supabase
      .from('compliance_actions')
      .insert({
        ...action,
        assigned_by: (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Update compliance action status
  static async updateComplianceActionStatus(
    actionId: string,
    status: 'open' | 'in_progress' | 'completed' | 'dismissed'
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_by = (await supabase.auth.getUser()).data.user?.id;
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('compliance_actions')
      .update(updateData)
      .eq('id', actionId);

    if (error) throw error;
  }

  // Get compliance audit log
  static async getComplianceAuditLog(userId?: string): Promise<any[]> {
    let query = supabase
      .from('compliance_audit_log')
      .select(`
        *,
        compliance_metrics (
          name,
          category
        ),
        profiles!compliance_audit_log_performed_by_fkey (
          display_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Calculate overall compliance score for provider
  static async getProviderComplianceScore(providerId: string): Promise<number> {
    // Get all users associated with this provider
    const { data: providerUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', providerId); // For now, just the provider user

    if (usersError) throw usersError;

    if (!providerUsers || providerUsers.length === 0) {
      return 0;
    }

    // Calculate average compliance score
    let totalScore = 0;
    let userCount = 0;

    for (const user of providerUsers) {
      const summary = await this.getUserComplianceSummary(user.id);
      totalScore += summary.overall_score;
      userCount++;
    }

    return userCount > 0 ? Math.round(totalScore / userCount) : 0;
  }

  // Get compliance requirements breakdown for provider
  static async getProviderComplianceBreakdown(providerId: string): Promise<{
    requirements: Array<{
      name: string;
      category: string;
      status: 'compliant' | 'non_compliant' | 'warning' | 'pending';
      score: number;
    }>;
    actions: ComplianceAction[];
  }> {
    // Get user compliance records for provider
    const records = await this.getUserComplianceRecords(providerId);
    const actions = await this.getUserComplianceActions(providerId);

    const requirements = records.map(record => ({
      name: record.compliance_metrics?.name || 'Unknown',
      category: record.compliance_metrics?.category || 'general',
      status: record.compliance_status,
      score: this.calculateMetricScore(record)
    }));

    return { requirements, actions };
  }

  // Helper function to calculate metric score
  private static calculateMetricScore(record: UserComplianceRecord): number {
    switch (record.compliance_status) {
      case 'compliant':
        return 100;
      case 'warning':
        return 75;
      case 'non_compliant':
        return 0;
      case 'pending':
      default:
        return 50;
    }
  }
}
