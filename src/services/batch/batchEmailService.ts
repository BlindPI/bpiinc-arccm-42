
import { supabase } from '@/integrations/supabase/client';

export interface BatchEmailNotificationRequest {
  rosterId: string;
  locationId: string;
  submittedBy: string;
  rosterData: any[];
  batchName: string;
}

export interface BatchEmailResult {
  success: boolean;
  rosterId: string;
  emailsSent: number;
  emailsFailed: number;
  results: Array<{
    success: boolean;
    email: string;
    response?: any;
    error?: string;
  }>;
}

export class BatchEmailService {
  /**
   * Send batch notification emails to AP users automatically
   */
  static async sendBatchNotification(request: BatchEmailNotificationRequest): Promise<BatchEmailResult> {
    try {
      console.log('Sending batch notification via edge function:', request.rosterId);

      const { data, error } = await supabase.functions.invoke('batch-request-email-details', {
        body: request
      });

      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }

      return data as BatchEmailResult;
    } catch (error) {
      console.error('Failed to send batch notification:', error);
      throw new Error(`Batch notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get AP users for a specific location
   */
  static async getLocationAPUsers(locationId: string) {
    const { data, error } = await supabase
      .from('user_location_assignments')
      .select(`
        user_id,
        profiles:profiles(
          id,
          email,
          first_name,
          last_name,
          role
        )
      `)
      .eq('location_id', locationId)
      .eq('profiles.role', 'AP');

    if (error) {
      throw new Error(`Failed to fetch AP users: ${error.message}`);
    }

    return data?.map(assignment => assignment.profiles).filter(Boolean) || [];
  }

  /**
   * Validate that batch email notification is properly configured
   */
  static async validateEmailConfiguration(): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Test edge function connectivity
      const { error } = await supabase.functions.invoke('batch-request-email-details', {
        body: { test: true }
      });

      if (error) {
        issues.push(`Edge function not accessible: ${error.message}`);
      }
    } catch (error) {
      issues.push(`Edge function test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
