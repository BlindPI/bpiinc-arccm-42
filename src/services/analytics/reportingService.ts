
import { supabase } from '@/integrations/supabase/client';
import type { AnalyticsReport, ReportExecution } from '@/types/analytics';

export class ReportingService {
  static async getReports(): Promise<AnalyticsReport[]> {
    const { data, error } = await supabase
      .from('analytics_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Type cast the database response to match our interface
    return (data || []).map(item => ({
      ...item,
      report_type: item.report_type as AnalyticsReport['report_type'],
      configuration: item.configuration as Record<string, any>,
      schedule_config: item.schedule_config as Record<string, any> | undefined
    }));
  }

  static async getReportExecutions(reportId: string): Promise<ReportExecution[]> {
    const { data, error } = await supabase
      .from('report_executions')
      .select('*')
      .eq('report_id', reportId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    
    // Type cast the database response to match our interface
    return (data || []).map(item => ({
      ...item,
      execution_status: item.execution_status as ReportExecution['execution_status'],
      result_data: item.result_data as Record<string, any> | undefined
    }));
  }

  static async createReport(report: Omit<AnalyticsReport, 'id' | 'created_at' | 'updated_at'>): Promise<AnalyticsReport> {
    const { data, error } = await supabase
      .from('analytics_reports')
      .insert(report)
      .select()
      .single();

    if (error) throw error;
    
    // Type cast the response
    return {
      ...data,
      report_type: data.report_type as AnalyticsReport['report_type'],
      configuration: data.configuration as Record<string, any>,
      schedule_config: data.schedule_config as Record<string, any> | undefined
    };
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
    
    // Type cast the response
    return {
      ...data,
      execution_status: data.execution_status as ReportExecution['execution_status'],
      result_data: data.result_data as Record<string, any> | undefined
    };
  }

  static async exportReport(executionId: string, format: string): Promise<Blob> {
    // Mock implementation for now
    const mockData = 'Report data';
    return new Blob([mockData], { type: 'text/csv' });
  }
}
