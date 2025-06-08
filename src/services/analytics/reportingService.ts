
import { supabase } from '@/integrations/supabase/client';
import type { AnalyticsReport, ReportExecution } from '@/types/analytics';

export class ReportingService {
  static async getReports(): Promise<AnalyticsReport[]> {
    const { data, error } = await supabase
      .from('analytics_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getReportExecutions(reportId: string): Promise<ReportExecution[]> {
    const { data, error } = await supabase
      .from('report_executions')
      .select('*')
      .eq('report_id', reportId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createReport(report: Omit<AnalyticsReport, 'id' | 'created_at' | 'updated_at'>): Promise<AnalyticsReport> {
    const { data, error } = await supabase
      .from('analytics_reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async executeReport(reportId: string): Promise<ReportExecution> {
    const { data, error } = await supabase
      .from('report_executions')
      .insert({
        report_id: reportId,
        execution_status: 'pending',
        started_at: new Date().toISOString(),
        executed_by: (await supabase.auth.getUser()).data.user?.id || ''
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async exportReport(executionId: string, format: string): Promise<Blob> {
    // Mock implementation for now
    const mockData = 'Report data';
    return new Blob([mockData], { type: 'text/csv' });
  }
}
