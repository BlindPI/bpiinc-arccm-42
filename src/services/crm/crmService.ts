
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lead_source?: string;
  account_id?: string;
  contact_id?: string;
  created_at: Date;
  updated_at: Date;
  converted_opportunity_id?: string;
}

export interface Opportunity {
  id: string;
  lead_id?: string;
  account_id?: string;
  contact_id?: string;
  opportunity_name: string;
  opportunity_status: 'open' | 'closed';
  estimated_value: number;
  close_date?: string;
  stage: string;
  probability: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export class CRMService {
  static async createOpportunity(opportunityData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          ...opportunityData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  }

  static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }
}
