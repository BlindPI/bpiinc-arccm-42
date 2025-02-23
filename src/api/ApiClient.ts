
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = `${supabase.functions.url}`;
  }

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
  async getTeachingAssignments(instructorId: string) {
    return this.callFunction('teaching-management', 'GET', { instructorId });
  }

  async updateTeachingStatus(sessionId: string, status: string) {
    return this.callFunction('teaching-management', 'PUT', { sessionId, status });
  }

  // Document Management API
  async getDocumentRequirements(roleTransition: { fromRole: string; toRole: string }) {
    return this.callFunction('document-management', 'GET', roleTransition);
  }

  async submitDocument(documentData: any) {
    return this.callFunction('document-management', 'POST', documentData);
  }

  // Compliance Management API
  async getComplianceStatus(userId: string) {
    return this.callFunction('compliance-management', 'GET', { userId });
  }

  async updateComplianceCheck(checkData: any) {
    return this.callFunction('compliance-management', 'POST', checkData);
  }
}

export const apiClient = ApiClient.getInstance();
