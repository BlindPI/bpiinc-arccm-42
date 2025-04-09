
import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse, TeachingData, ComplianceData } from '@/types/api';
import type { DocumentRequirement, DocumentSubmission } from '@/types/api';
import type { UserRole } from '@/types/supabase-schema';

class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  async getTeachingAssignments(userId: string): Promise<ApiResponse<TeachingData[]>> {
    try {
      // Type conversion is used to match our schema with the actual database tables
      const { data, error } = await supabase
        .from('teaching_sessions')
        .select('*')
        .eq('instructor_id', userId);

      if (error) throw error;
      return { data: data as unknown as TeachingData[] };
    } catch (error: any) {
      return { error: { message: error.message, code: error.code } };
    }
  }

  async getDocumentRequirements({ fromRole, toRole }: { fromRole: UserRole, toRole: UserRole }): Promise<ApiResponse<DocumentRequirement[]>> {
    try {
      // Type conversion is used to match our schema with the actual database tables
      const { data, error } = await supabase
        .from('document_requirements')
        .select('*')
        .eq('from_role', fromRole)
        .eq('to_role', toRole);

      if (error) throw error;
      return { data: data as unknown as DocumentRequirement[] };
    } catch (error: any) {
      return { error: { message: error.message, code: error.code } };
    }
  }

  async submitDocument(documentData: any): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
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
      const { error } = await supabase
        .from('teaching_sessions')
        .update({ status })
        .eq('id', sessionId);

      if (error) throw error;
      return { data: undefined };
    } catch (error: any) {
      return { error: { message: error.message, code: error.code } };
    }
  }

  // Get compliance status for a user
  async getComplianceStatus(userId: string): Promise<ApiResponse<ComplianceData>> {
    try {
      // The compliance_checks view doesn't exist yet, so we'll create a dummy response
      // In a real scenario, we would query the actual view
      const mockComplianceData: ComplianceData = {
        id: "mock-id",
        user_id: userId,
        status: "PENDING",
        items: []
      };
      
      return { data: mockComplianceData };
    } catch (error: any) {
      return { error: { message: error.message, code: error.code } };
    }
  }

  // Update compliance check data
  async updateComplianceCheck(checkData: any): Promise<ApiResponse<void>> {
    try {
      // We would implement the actual update logic here
      // For now, return success since we're mocking it
      return { data: undefined };
    } catch (error: any) {
      return { error: { message: error.message, code: error.code } };
    }
  }
}

export const apiClient = ApiClient.getInstance();
