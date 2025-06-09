
import { supabase } from '@/integrations/supabase/client';

export interface CRMStats {
  totalLeads: number;
  totalOpportunities: number;
  totalRevenue: number;
  conversionRate: number;
}

export class CRMService {
  static async getCRMStats(): Promise<CRMStats> {
    // Mock implementation - replace with actual database calls
    return {
      totalLeads: 150,
      totalOpportunities: 45,
      totalRevenue: 125000,
      conversionRate: 25.5
    };
  }

  static async getLeads() {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
}
