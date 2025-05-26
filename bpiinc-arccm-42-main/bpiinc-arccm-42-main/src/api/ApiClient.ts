
import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse, TeachingData, ComplianceData, DocumentRequirement, DocumentSubmission } from '@/types/api';
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
        .update({ completion_status: status })
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
      // For now, create a dummy response until the view is created
      const mockComplianceData: ComplianceData = {
        id: "mock-compliance-id",
        user_id: userId,
        status: "PENDING",
        items: [
          {
            id: "item-1",
            name: "CPR Certification",
            status: "VALID",
            expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      };
      
      return { data: mockComplianceData };
    } catch (error: any) {
      return { error: { message: error.message, code: error.code } };
    }
  }

  // Send a notification
  async sendNotification(notificationData: {
    user_id: string;
    title: string;
    message: string;
    type?: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION';
    action_url?: string;
    send_email?: boolean;
  }): Promise<ApiResponse<{ id: string }>> {
    try {
      const { data, error } = await supabase.functions.invoke<{ id: string; message: string }>('send-notification', {
        body: { notification: notificationData }
      });

      if (error) throw error;
      if (!data) throw new Error('No response from notification service');
      
      return { data: { id: data.id } };
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
