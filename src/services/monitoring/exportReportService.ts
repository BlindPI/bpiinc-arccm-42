
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { ReportConfig, ExportJob } from '@/types/api';

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  includeHeaders: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
}

interface ExportResult {
  success: boolean;
  fileName?: string;
  recordCount?: number;
  error?: string;
}

// Define available table names as a union type for better type safety
type ExportableTable = 
  | 'profiles'
  | 'certificates' 
  | 'certificate_requests'
  | 'courses'
  | 'locations'
  | 'rosters'
  | 'crm_leads'
  | 'crm_contacts'
  | 'crm_accounts'
  | 'crm_opportunities'
  | 'crm_activities';

export class ExportReportService {
  // Report Configuration Methods
  static async getReportConfigs(): Promise<ReportConfig[]> {
    try {
      // For now, return mock data since we don't have a reports table
      // In a real implementation, this would fetch from a reports configuration table
      return [
        {
          id: '1',
          name: 'User Analytics Report',
          type: 'analytics',
          enabled: true,
          format: 'xlsx',
          description: 'Comprehensive user analytics report',
          data_sources: ['profiles', 'certificates'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Certificate Status Report',
          type: 'certificates',
          enabled: true,
          format: 'csv',
          description: 'Certificate issuance and status report',
          data_sources: ['certificates', 'certificate_requests'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    } catch (error) {
      console.error('Error fetching report configs:', error);
      return [];
    }
  }

  static async createReportConfig(config: Partial<ReportConfig>): Promise<ReportConfig> {
    try {
      // For now, return a mock created config
      // In a real implementation, this would insert into a reports configuration table
      const newConfig: ReportConfig = {
        id: Date.now().toString(),
        name: config.name || 'New Report',
        type: config.type || 'custom',
        enabled: config.enabled ?? true,
        format: config.format || 'xlsx',
        description: config.description || '',
        data_sources: config.data_sources || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return newConfig;
    } catch (error) {
      console.error('Error creating report config:', error);
      throw error;
    }
  }

  // Export Job Methods - Updated to accept optional filters
  static async getExportJobs(filters?: { status?: string; userId?: string }): Promise<ExportJob[]> {
    try {
      // For now, return mock data since we don't have an export jobs table
      // In a real implementation, this would fetch from an export_jobs table
      let jobs = [
        {
          id: '1',
          status: 'completed' as const,
          progress: 100,
          result: 'Success',
          started_at: new Date(Date.now() - 60000).toISOString(),
          completed_at: new Date().toISOString(),
          file_size: 1024000,
          requested_by: 'current-user',
          file_url: '#'
        },
        {
          id: '2',
          status: 'running' as const,
          progress: 45,
          started_at: new Date(Date.now() - 30000).toISOString(),
          requested_by: 'current-user'
        }
      ];

      // Apply filters if provided
      if (filters?.status) {
        jobs = jobs.filter(job => job.status === filters.status);
      }

      return jobs;
    } catch (error) {
      console.error('Error fetching export jobs:', error);
      return [];
    }
  }

  static async generateReport(reportId: string, options?: { format?: string; filters?: Record<string, any> }): Promise<ExportJob> {
    try {
      console.log('Generating report:', reportId, 'with options:', options);
      
      // Create a new export job
      const job: ExportJob = {
        id: Date.now().toString(),
        status: 'running',
        progress: 0,
        started_at: new Date().toISOString(),
        requested_by: 'current-user'
      };

      // Simulate report generation process
      setTimeout(() => {
        job.status = 'completed';
        job.progress = 100;
        job.completed_at = new Date().toISOString();
        job.result = 'Report generated successfully';
        job.file_size = Math.floor(Math.random() * 1000000) + 100000;
        job.file_url = '#download-link';
      }, 2000);

      return job;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // Existing table export methods
  static async exportTableData(
    tableName: ExportableTable,
    options: ExportOptions = {
      format: 'xlsx',
      includeHeaders: true
    }
  ): Promise<ExportResult> {
    try {
      console.log(`Exporting data from ${tableName}...`);

      // Build query based on table name
      let query = supabase.from(tableName as any).select('*');

      // Apply date range filter if provided
      if (options.dateRange) {
        query = query
          .gte('created_at', options.dateRange.start)
          .lte('created_at', options.dateRange.end);
      }

      // Apply additional filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;

      if (error) {
        console.error('Export query error:', error);
        return {
          success: false,
          error: `Failed to fetch data: ${error.message}`
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          error: 'No data found for export'
        };
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `${tableName}_export_${timestamp}`;

      // Export based on format
      switch (options.format) {
        case 'csv':
          await this.exportToCSV(data, fileName, options.includeHeaders);
          break;
        case 'xlsx':
          await this.exportToXLSX(data, fileName, options.includeHeaders);
          break;
        case 'json':
          await this.exportToJSON(data, fileName);
          break;
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }

      return {
        success: true,
        fileName: `${fileName}.${options.format}`,
        recordCount: data.length
      };

    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  // ... keep existing code (private export methods and utility methods)
  private static async exportToCSV(
    data: any[],
    fileName: string,
    includeHeaders: boolean
  ): Promise<void> {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    let csvContent = '';

    // Add headers if requested
    if (includeHeaders) {
      csvContent += headers.join(',') + '\n';
    }

    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      });
      csvContent += values.join(',') + '\n';
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  }

  private static async exportToXLSX(
    data: any[],
    fileName: string,
    includeHeaders: boolean
  ): Promise<void> {
    const worksheet = XLSX.utils.json_to_sheet(data, { 
      header: includeHeaders ? undefined : [] 
    });
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
    
    // Generate buffer and create blob
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, `${fileName}.xlsx`);
  }

  private static async exportToJSON(
    data: any[],
    fileName: string
  ): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    saveAs(blob, `${fileName}.json`);
  }

  // Specialized export methods for common use cases
  static async exportCertificates(options?: Partial<ExportOptions>): Promise<ExportResult> {
    return this.exportTableData('certificates', {
      format: 'xlsx',
      includeHeaders: true,
      ...options
    });
  }

  static async exportUsers(options?: Partial<ExportOptions>): Promise<ExportResult> {
    return this.exportTableData('profiles', {
      format: 'xlsx',
      includeHeaders: true,
      ...options
    });
  }

  static async exportCRMLeads(options?: Partial<ExportOptions>): Promise<ExportResult> {
    return this.exportTableData('crm_leads', {
      format: 'xlsx',
      includeHeaders: true,
      ...options
    });
  }

  // Batch export multiple tables
  static async exportMultipleTables(
    tables: ExportableTable[],
    options: ExportOptions = {
      format: 'xlsx',
      includeHeaders: true
    }
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (const table of tables) {
      const result = await this.exportTableData(table, options);
      results.push(result);
      
      // Add small delay between exports to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  // Get available tables for export
  static getAvailableTables(): { value: ExportableTable; label: string }[] {
    return [
      { value: 'profiles', label: 'User Profiles' },
      { value: 'certificates', label: 'Certificates' },
      { value: 'certificate_requests', label: 'Certificate Requests' },
      { value: 'courses', label: 'Courses' },
      { value: 'locations', label: 'Locations' },
      { value: 'rosters', label: 'Rosters' },
      { value: 'crm_leads', label: 'CRM Leads' },
      { value: 'crm_contacts', label: 'CRM Contacts' },
      { value: 'crm_accounts', label: 'CRM Accounts' },
      { value: 'crm_opportunities', label: 'CRM Opportunities' },
      { value: 'crm_activities', label: 'CRM Activities' }
    ];
  }
}
