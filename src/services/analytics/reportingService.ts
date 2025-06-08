
import { supabase } from '@/integrations/supabase/client';
import type { 
  AnalyticsReport, 
  ReportExecution, 
  ReportSubscription 
} from '@/types/analytics';

export class ReportingService {
  static async getReports(): Promise<AnalyticsReport[]> {
    try {
      const { data, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }

  static async createReport(report: Omit<AnalyticsReport, 'id' | 'created_at' | 'updated_at'>): Promise<AnalyticsReport | null> {
    try {
      const { data, error } = await supabase
        .from('analytics_reports')
        .insert(report)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating report:', error);
      return null;
    }
  }

  static async updateReport(id: string, updates: Partial<AnalyticsReport>): Promise<AnalyticsReport | null> {
    try {
      const { data, error } = await supabase
        .from('analytics_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating report:', error);
      return null;
    }
  }

  static async deleteReport(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('analytics_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      return false;
    }
  }

  static async executeReport(reportId: string, userId: string): Promise<ReportExecution | null> {
    try {
      // Create execution record
      const { data: execution, error } = await supabase
        .from('report_executions')
        .insert({
          report_id: reportId,
          execution_status: 'pending',
          executed_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Update to running status
      await supabase
        .from('report_executions')
        .update({ execution_status: 'running' })
        .eq('id', execution.id);

      // Get report configuration
      const { data: report } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (!report) throw new Error('Report not found');

      // Generate report data based on type
      const reportData = await this.generateReportData(report);

      // Update execution with results
      const { data: completedExecution, error: updateError } = await supabase
        .from('report_executions')
        .update({
          execution_status: 'completed',
          completed_at: new Date().toISOString(),
          result_data: reportData
        })
        .eq('id', execution.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return completedExecution;
    } catch (error) {
      console.error('Error executing report:', error);
      return null;
    }
  }

  static async getReportExecutions(reportId: string): Promise<ReportExecution[]> {
    try {
      const { data, error } = await supabase
        .from('report_executions')
        .select('*')
        .eq('report_id', reportId)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching report executions:', error);
      return [];
    }
  }

  static async createSubscription(subscription: Omit<ReportSubscription, 'id' | 'created_at' | 'updated_at'>): Promise<ReportSubscription | null> {
    try {
      const { data, error } = await supabase
        .from('report_subscriptions')
        .insert(subscription)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating subscription:', error);
      return null;
    }
  }

  static async getSubscriptions(userId?: string): Promise<ReportSubscription[]> {
    try {
      let query = supabase
        .from('report_subscriptions')
        .select(`
          *,
          analytics_reports(name, report_type)
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }
  }

  static async exportReport(executionId: string, format: 'pdf' | 'excel' | 'csv'): Promise<string | null> {
    try {
      const { data: execution } = await supabase
        .from('report_executions')
        .select('result_data')
        .eq('id', executionId)
        .single();

      if (!execution?.result_data) {
        throw new Error('No report data found');
      }

      // Generate export based on format
      const exportData = this.formatExportData(execution.result_data, format);
      
      // In a real implementation, you would save this to storage and return the URL
      // For now, we'll return a mock URL
      const fileName = `report_${executionId}.${format}`;
      
      return `/exports/${fileName}`;
    } catch (error) {
      console.error('Error exporting report:', error);
      return null;
    }
  }

  private static async generateReportData(report: AnalyticsReport): Promise<any> {
    switch (report.report_type) {
      case 'team_performance':
        return await this.generateTeamPerformanceReport(report.configuration);
      case 'compliance_overview':
        return await this.generateComplianceReport(report.configuration);
      case 'location_heatmap':
        return await this.generateLocationHeatmapReport(report.configuration);
      case 'cross_team_comparison':
        return await this.generateCrossTeamReport(report.configuration);
      default:
        return { data: [], summary: 'Custom report generated' };
    }
  }

  private static async generateTeamPerformanceReport(config: any): Promise<any> {
    const { data: metrics } = await supabase
      .from('team_performance_metrics')
      .select(`
        *,
        teams(name, location_id)
      `)
      .order('compliance_score', { ascending: false });

    return {
      data: metrics || [],
      summary: {
        total_teams: metrics?.length || 0,
        avg_compliance: metrics?.reduce((sum, m) => sum + m.compliance_score, 0) / (metrics?.length || 1),
        top_performer: metrics?.[0]?.teams
      }
    };
  }

  private static async generateComplianceReport(config: any): Promise<any> {
    const { data: risks } = await supabase
      .from('compliance_risk_scores')
      .select('*')
      .order('risk_score', { ascending: false });

    return {
      data: risks || [],
      summary: {
        total_assessments: risks?.length || 0,
        critical_risks: risks?.filter(r => r.risk_level === 'critical').length || 0,
        avg_risk_score: risks?.reduce((sum, r) => sum + r.risk_score, 0) / (risks?.length || 1)
      }
    };
  }

  private static async generateLocationHeatmapReport(config: any): Promise<any> {
    const { data: heatmap } = await supabase
      .from('location_performance_heatmaps')
      .select(`
        *,
        locations(name, city, state)
      `)
      .order('performance_score', { ascending: false });

    return {
      data: heatmap || [],
      summary: {
        total_locations: heatmap?.length || 0,
        avg_performance: heatmap?.reduce((sum, h) => sum + h.performance_score, 0) / (heatmap?.length || 1),
        top_location: heatmap?.[0]?.locations
      }
    };
  }

  private static async generateCrossTeamReport(config: any): Promise<any> {
    const { data: analytics } = await supabase
      .from('cross_team_analytics')
      .select('*')
      .order('analysis_date', { ascending: false })
      .limit(1);

    return {
      data: analytics || [],
      summary: {
        latest_analysis: analytics?.[0]?.analysis_date,
        recommendations_count: analytics?.[0]?.improvement_recommendations?.length || 0
      }
    };
  }

  private static formatExportData(data: any, format: string): string {
    switch (format) {
      case 'csv':
        return this.convertToCSV(data);
      case 'excel':
        return this.convertToExcel(data);
      case 'pdf':
        return this.convertToPDF(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private static convertToCSV(data: any): string {
    if (!data.data || !Array.isArray(data.data)) return '';
    
    const headers = Object.keys(data.data[0] || {});
    const rows = data.data.map((row: any) => 
      headers.map(header => row[header] || '').join(',')
    );
    
    return [headers.join(','), ...rows].join('\n');
  }

  private static convertToExcel(data: any): string {
    // Mock Excel conversion - in real implementation, use a library like xlsx
    return JSON.stringify(data, null, 2);
  }

  private static convertToPDF(data: any): string {
    // Mock PDF conversion - in real implementation, use a library like jsPDF
    return JSON.stringify(data, null, 2);
  }
}

export const reportingService = new ReportingService();
