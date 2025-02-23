
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ComplianceData, TeachingData, DocumentRequirement } from '@/types/api';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private async callFunction<T>(
    functionName: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    body?: any
  ): Promise<ApiResponse<T>> {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      const { data, error } = await supabase.functions.invoke(functionName, {
        method,
        headers: {
          'x-user-id': sessionData.session?.user?.id || '',
        },
        body,
      });

      if (error) throw error;
      return { data };
    } catch (error: any) {
      console.error(`API Error (${functionName}):`, error);
      toast.error(error.message || 'An error occurred');
      return { error: { message: error.message } };
    }
  }

  // Teaching Management API
  async getTeachingAssignments(instructorId: string): Promise<ApiResponse<TeachingData>> {
    return this.callFunction('teaching-management', 'GET', { instructorId });
  }

  async updateTeachingStatus(sessionId: string, status: string): Promise<ApiResponse<void>> {
    return this.callFunction('teaching-management', 'PUT', { sessionId, status });
  }

  // Document Management API
  async getDocumentRequirements(roleTransition: { fromRole: string; toRole: string }): Promise<ApiResponse<DocumentRequirement[]>> {
    return this.callFunction('document-management', 'GET', roleTransition);
  }

  async submitDocument(documentData: any): Promise<ApiResponse<void>> {
    return this.callFunction('document-management', 'POST', documentData);
  }

  // Compliance Management API
  async getComplianceStatus(userId: string): Promise<ApiResponse<ComplianceData>> {
    return this.callFunction('compliance-management', 'GET', { userId });
  }

  async updateComplianceCheck(checkData: any): Promise<ApiResponse<void>> {
    return this.callFunction('compliance-management', 'POST', checkData);
  }
}

export const apiClient = ApiClient.getInstance();
