import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type DataExportRequest = Database['public']['Tables']['data_export_requests']['Row'];
type DataExportRequestInsert = Database['public']['Tables']['data_export_requests']['Insert'];

export interface ExportRequestData {
  dataCategories: string[];
  dateRange: {
    from?: Date;
    to?: Date;
  };
  justification: string;
  customJustification?: string;
}

export class DataExportService {
  static async submitExportRequest(
    userId: string,
    providerId: string | null,
    requestData: ExportRequestData
  ): Promise<DataExportRequest> {
    const insertData: DataExportRequestInsert = {
      user_id: userId,
      provider_id: providerId,
      request_type: 'provider_data',
      data_categories: requestData.dataCategories,
      date_range_start: requestData.dateRange.from?.toISOString(),
      date_range_end: requestData.dateRange.to?.toISOString(),
      justification: requestData.customJustification || requestData.justification,
      status: 'pending',
    };

    const { data, error } = await supabase
      .from('data_export_requests')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error submitting export request:', error);
      throw error;
    }

    return data;
  }

  static async getUserExportRequests(userId: string): Promise<DataExportRequest[]> {
    const { data, error } = await supabase
      .from('data_export_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching export requests:', error);
      throw error;
    }

    return data || [];
  }

  static async getEstimatedRecordCount(
    userId: string,
    categories: string[],
    dateRange?: { from?: Date; to?: Date }
  ): Promise<Record<string, number>> {
    // This would typically query actual tables to get counts
    // For now, returning mock estimates
    const estimates: Record<string, number> = {};
    
    if (categories.includes('certificate_data')) {
      estimates.certificate_data = 1200;
    }
    if (categories.includes('batch_processing')) {
      estimates.batch_processing = 85;
    }
    if (categories.includes('assessment_data')) {
      estimates.assessment_data = 950;
    }
    if (categories.includes('personal_data')) {
      estimates.personal_data = 800;
    }
    if (categories.includes('communication_records')) {
      estimates.communication_records = 2400;
    }
    if (categories.includes('audit_trail')) {
      estimates.audit_trail = 340;
    }

    return estimates;
  }
}