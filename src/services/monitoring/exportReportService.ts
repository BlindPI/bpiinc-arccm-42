import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
