
import { supabase } from '@/integrations/supabase/client';

export interface EdgeFunctionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class EdgeFunctionService {
  static async invokeFunction(functionName: string, payload?: any): Promise<EdgeFunctionResult> {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        console.error(`Edge function ${functionName} error:`, error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error(`Edge function ${functionName} failed:`, error);
      return { success: false, error: error.message };
    }
  }

  static async processNotificationQueue(): Promise<EdgeFunctionResult> {
    return this.invokeFunction('process-notifications', { processQueue: true });
  }

  static async sendCertificateEmail(certificateId: string): Promise<EdgeFunctionResult> {
    return this.invokeFunction('send-certificate-email', { certificateId });
  }

  static async generateCertificate(requestId: string): Promise<EdgeFunctionResult> {
    return this.invokeFunction('generate-certificate', { requestId });
  }

  static async sendBatchEmails(batchId: string): Promise<EdgeFunctionResult> {
    return this.invokeFunction('send-batch-certificate-emails', { batchId });
  }

  static async createUser(userData: any): Promise<EdgeFunctionResult> {
    return this.invokeFunction('create-user', userData);
  }

  static async sendInvitation(invitationData: any): Promise<EdgeFunctionResult> {
    return this.invokeFunction('send-invitation', invitationData);
  }
}
