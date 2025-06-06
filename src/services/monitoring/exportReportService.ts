import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types for export and reporting
export interface ReportConfig {
  id: string;
  name: string;
  description?: string;
  report_type: 'analytics' | 'system_health' | 'user_activity' | 'performance' | 'custom';
  data_sources: string[];
  filters?: Record<string, any>;
  format: 'csv' | 'json' | 'pdf' | 'excel';
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExportJob {
  id: string;
  report_config_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  file_url?: string;
  file_size?: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  requested_by: string;
}

export interface ReportData {
  headers: string[];
  rows: any[][];
  metadata: {
    total_records: number;
    generated_at: string;
    filters_applied: Record<string, any>;
    data_sources: string[];
  };
}

class ExportReportService {
  private static instance: ExportReportService;
  private activeJobs: Map<string, ExportJob> = new Map();

  public static getInstance(): ExportReportService {
    if (!ExportReportService.instance) {
      ExportReportService.instance = new ExportReportService();
    }
    return ExportReportService.instance;
  }

  /**
   * Create a new report configuration
   */
  async createReportConfig(config: Omit<ReportConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ReportConfig> {
    try {
      const reportConfig: ReportConfig = {
        id: crypto.randomUUID(),
        ...config,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store in analytics_reports table
      await supabase
        .from('analytics_reports')
        .insert({
          id: reportConfig.id,
          name: reportConfig.name,
          report_type: reportConfig.report_type,
          configuration: {
            description: reportConfig.description,
            data_sources: reportConfig.data_sources,
            filters: reportConfig.filters,
            format: reportConfig.format,
            schedule: reportConfig.schedule
          },
          created_by: reportConfig.created_by,
          is_automated: reportConfig.schedule?.enabled || false,
          schedule_config: reportConfig.schedule || null
        });

      return reportConfig;
    } catch (error) {
      console.error('Error creating report config:', error);
      throw new Error('Failed to create report configuration');
    }
  }

  /**
   * Get all report configurations
   */
  async getReportConfigs(userId?: string): Promise<ReportConfig[]> {
    try {
      let query = supabase
        .from('analytics_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('created_by', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching report configs:', error);
        return [];
      }

      return (data || []).map(report => {
        const config = report.configuration as Record<string, any> || {};
        return {
          id: report.id,
          name: report.name,
          description: config.description,
          report_type: report.report_type as ReportConfig['report_type'],
          data_sources: config.data_sources || [],
          filters: config.filters,
          format: config.format || 'csv',
          schedule: config.schedule,
          created_by: report.created_by || '',
          created_at: report.created_at || new Date().toISOString(),
          updated_at: report.updated_at || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error getting report configs:', error);
      return [];
    }
  }

  /**
   * Generate a report
   */
  async generateReport(
    configId: string,
    requestedBy: string,
    customFilters?: Record<string, any>
  ): Promise<string> {
    try {
      // Get report configuration
      const configs = await this.getReportConfigs();
      const config = configs.find(c => c.id === configId);
      
      if (!config) {
        throw new Error('Report configuration not found');
      }

      // Create export job
      const job: ExportJob = {
        id: crypto.randomUUID(),
        report_config_id: configId,
        status: 'pending',
        progress: 0,
        started_at: new Date().toISOString(),
        requested_by: requestedBy
      };

      this.activeJobs.set(job.id, job);

      // Start report generation asynchronously
      this.processReportGeneration(job, config, customFilters).catch(error => {
        console.error('Report generation failed:', error);
      });

      return job.id;
    } catch (error) {
      console.error('Error starting report generation:', error);
      throw new Error('Failed to start report generation');
    }
  }

  /**
   * Get export job status
   */
  getJobStatus(jobId: string): ExportJob | null {
    return this.activeJobs.get(jobId) || null;
  }

  /**
   * Get all export jobs for a user
   */
  async getExportJobs(userId: string, limit: number = 50): Promise<ExportJob[]> {
    try {
      // In a real implementation, this would query a dedicated jobs table
      // For now, return active jobs for the user
      const userJobs = Array.from(this.activeJobs.values())
        .filter(job => job.requested_by === userId)
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
        .slice(0, limit);

      return userJobs;
    } catch (error) {
      console.error('Error getting export jobs:', error);
      return [];
    }
  }

  /**
   * Export data to CSV format
   */
  async exportToCSV(data: ReportData): Promise<string> {
    try {
      let csv = data.headers.join(',') + '\n';
      
      for (const row of data.rows) {
        const escapedRow = row.map(cell => {
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        });
        csv += escapedRow.join(',') + '\n';
      }

      return csv;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export data to CSV');
    }
  }

  /**
   * Export data to JSON format
   */
  async exportToJSON(data: ReportData): Promise<string> {
    try {
      const jsonData = {
        metadata: data.metadata,
        data: data.rows.map(row => {
          const obj: Record<string, any> = {};
          data.headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        })
      };

      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Failed to export data to JSON');
    }
  }

  /**
   * Get analytics data for reporting
   */
  async getAnalyticsData(
    dataSource: string,
    filters?: Record<string, any>,
    timeRange?: { start: string; end: string }
  ): Promise<ReportData> {
    try {
      let query = supabase.from(dataSource).select('*');

      // Apply time range filter
      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start)
          .lte('created_at', timeRange.end);
      }

      // Apply custom filters
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        }
      }

      const { data, error } = await query.limit(10000); // Limit for performance

      if (error) {
        console.error('Error fetching analytics data:', error);
        return {
          headers: [],
          rows: [],
          metadata: {
            total_records: 0,
            generated_at: new Date().toISOString(),
            filters_applied: filters || {},
            data_sources: [dataSource]
          }
        };
      }

      if (!data || data.length === 0) {
        return {
          headers: [],
          rows: [],
          metadata: {
            total_records: 0,
            generated_at: new Date().toISOString(),
            filters_applied: filters || {},
            data_sources: [dataSource]
          }
        };
      }

      // Extract headers from first record
      const headers = Object.keys(data[0]);
      
      // Convert data to rows
      const rows = data.map(record => 
        headers.map(header => {
          const value = record[header];
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
          }
          return value;
        })
      );

      return {
        headers,
        rows,
        metadata: {
          total_records: data.length,
          generated_at: new Date().toISOString(),
          filters_applied: filters || {},
          data_sources: [dataSource]
        }
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      throw new Error('Failed to retrieve analytics data');
    }
  }

  /**
   * Get system health data for reporting
   */
  async getSystemHealthData(timeRange?: { start: string; end: string }): Promise<ReportData> {
    try {
      // Get system health metrics from audit logs
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'performance_metric')
        .order('created_at', { ascending: false });

      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start)
          .lte('created_at', timeRange.end);
      }

      const { data, error } = await query.limit(5000);

      if (error || !data) {
        return {
          headers: ['timestamp', 'metric_name', 'metric_value', 'metric_unit'],
          rows: [],
          metadata: {
            total_records: 0,
            generated_at: new Date().toISOString(),
            filters_applied: {},
            data_sources: ['system_health']
          }
        };
      }

      const headers = ['timestamp', 'metric_name', 'metric_value', 'metric_unit', 'category'];
      const rows = data.map(log => {
        const details = log.details as Record<string, any> || {};
        return [
          log.created_at,
          details.metric_name || 'unknown',
          details.metric_value || 0,
          details.metric_unit || 'count',
          details.category || 'general'
        ];
      });

      return {
        headers,
        rows,
        metadata: {
          total_records: data.length,
          generated_at: new Date().toISOString(),
          filters_applied: timeRange || {},
          data_sources: ['system_health']
        }
      };
    } catch (error) {
      console.error('Error getting system health data:', error);
      throw new Error('Failed to retrieve system health data');
    }
  }

  /**
   * Get user activity data for reporting
   */
  async getUserActivityData(
    filters?: Record<string, any>,
    timeRange?: { start: string; end: string }
  ): Promise<ReportData> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start)
          .lte('created_at', timeRange.end);
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }

      const { data, error } = await query.limit(10000);

      if (error || !data) {
        return {
          headers: ['timestamp', 'user_id', 'action', 'entity_type', 'entity_id'],
          rows: [],
          metadata: {
            total_records: 0,
            generated_at: new Date().toISOString(),
            filters_applied: filters || {},
            data_sources: ['user_activity']
          }
        };
      }

      const headers = ['timestamp', 'user_id', 'action', 'entity_type', 'entity_id', 'ip_address'];
      const rows = data.map(log => [
        log.created_at,
        log.user_id || 'anonymous',
        log.action,
        log.entity_type,
        log.entity_id || '',
        log.ip_address || ''
      ]);

      return {
        headers,
        rows,
        metadata: {
          total_records: data.length,
          generated_at: new Date().toISOString(),
          filters_applied: filters || {},
          data_sources: ['user_activity']
        }
      };
    } catch (error) {
      console.error('Error getting user activity data:', error);
      throw new Error('Failed to retrieve user activity data');
    }
  }

  // Private helper methods
  private async processReportGeneration(
    job: ExportJob,
    config: ReportConfig,
    customFilters?: Record<string, any>
  ): Promise<void> {
    try {
      // Update job status
      job.status = 'processing';
      job.progress = 10;
      this.activeJobs.set(job.id, job);

      // Merge filters
      const filters = { ...config.filters, ...customFilters };

      // Get data based on report type
      let reportData: ReportData;
      
      switch (config.report_type) {
        case 'analytics':
          reportData = await this.getAnalyticsData(config.data_sources[0], filters);
          break;
        case 'system_health':
          reportData = await this.getSystemHealthData(filters.timeRange);
          break;
        case 'user_activity':
          reportData = await this.getUserActivityData(filters, filters.timeRange);
          break;
        default:
          throw new Error(`Unsupported report type: ${config.report_type}`);
      }

      job.progress = 50;
      this.activeJobs.set(job.id, job);

      // Export data in requested format
      let exportedData: string;
      
      switch (config.format) {
        case 'csv':
          exportedData = await this.exportToCSV(reportData);
          break;
        case 'json':
          exportedData = await this.exportToJSON(reportData);
          break;
        default:
          throw new Error(`Unsupported export format: ${config.format}`);
      }

      job.progress = 80;
      this.activeJobs.set(job.id, job);

      // In a real implementation, you would upload the file to storage
      // For now, we'll simulate a file URL
      job.file_url = `data:text/${config.format};base64,${btoa(exportedData)}`;
      job.file_size = exportedData.length;
      job.progress = 100;
      job.status = 'completed';
      job.completed_at = new Date().toISOString();

      this.activeJobs.set(job.id, job);

    } catch (error) {
      console.error('Error processing report generation:', error);
      job.status = 'failed';
      job.error_message = error instanceof Error ? error.message : 'Unknown error';
      job.completed_at = new Date().toISOString();
      this.activeJobs.set(job.id, job);
    }
  }
}

export const exportReportService = ExportReportService.getInstance();