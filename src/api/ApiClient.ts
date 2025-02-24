import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/api';
import type { UserRole } from '@/lib/roles';

class ApiClient {
  private static instance: ApiClient;

  private constructor() {
    console.log('Initializing ApiClient');
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  async getTeachingAssignments(userId: string): Promise<ApiResponse<any>> {
    console.log('Fetching teaching assignments for user:', userId);
    try {
      const { data, error } = await supabase
        .from('teaching_sessions')
        .select('*')
        .eq('instructor_id', userId);

      if (error) throw error;
      return { data };
    } catch (error: any) {
      console.error('Error in getTeachingAssignments:', error);
      return { error: { message: error.message, code: error.code } };
    }
  }

  async getDocumentRequirements({ fromRole, toRole }: { fromRole: UserRole, toRole: UserRole }): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('document_requirements')
        .select('*')
        .eq('from_role', fromRole)
        .eq('to_role', toRole);

      if (error) throw error;
      return { data };
    } catch (error: any) {
      return { error: { message: error.message, code: error.code } };
    }
  }

  async getComplianceStatus(userId: string): Promise<ApiResponse<any>> {
    console.log('Getting compliance status for user:', userId);
    try {
      const { data, error } = await supabase.functions.invoke('compliance-management', {
        body: { userId },
      });

      if (error) {
        console.error('Error from compliance-management function:', error);
        throw error;
      }

      return { data };
    } catch (error: any) {
      console.error('API Client Error in getComplianceStatus:', error);
      return { 
        error: { 
          message: error.message || 'Failed to fetch compliance status',
          code: error.code 
        } 
      };
    }
  }

  async updateComplianceCheck(checkData: any): Promise<ApiResponse<void>> {
    try {
      const { data, error } = await supabase
        .from('compliance_check_history')
        .insert(checkData);

      if (error) throw error;
      return { data: undefined };
    } catch (error: any) {
      return { error: { message: error.message, code: error.code } };
    }
  }

  async submitDocument(documentData: any): Promise<ApiResponse<void>> {
    try {
      const { data, error } = await supabase
        .from('document_submissions')
        .insert(documentData);

      if (error) throw error;
      return { data: undefined };
    } catch (error: any) {
      return { error: { message: error.message, code: error.code } };
    }
  }

  async updateTeachingStatus(sessionId: string, status: string): Promise<ApiResponse<void>> {
    try {
      const { data, error } = await supabase
        .from('teaching_sessions')
        .update({ status })
        .eq('id', sessionId);

      if (error) throw error;
      return { data: undefined };
    } catch (error: any) {
      return { error: { message: error.message, code: error.code } };
    }
  }
}

export const apiClient = ApiClient.getInstance();
