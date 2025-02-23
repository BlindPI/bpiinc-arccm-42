
import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/api';

class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  async getComplianceStatus(userId: string): Promise<ApiResponse<any>> {
    try {
      console.log('Calling compliance-management function for user:', userId);
      
      const { data, error } = await supabase.functions.invoke('compliance-management', {
        body: { userId },
      });

      if (error) {
        console.error('Error from compliance-management function:', error);
        throw error;
      }

      return { data };
    } catch (error: any) {
      console.error('API Client Error:', error);
      return { 
        error: { 
          message: error.message || 'Failed to fetch compliance status',
          code: error.code 
        } 
      };
    }
  }
}

export const apiClient = ApiClient.getInstance();
