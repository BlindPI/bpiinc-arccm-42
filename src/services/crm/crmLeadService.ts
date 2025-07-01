
import { supabase } from '@/integrations/supabase/client';

export interface CRMLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  lead_source: string;
  lead_score: number;
  created_at: string;
  updated_at: string;
}

export interface LeadFilters {
  status?: string;
  source?: string;
  score_range?: { min: number; max: number };
}

export class CRMLeadService {
  static async getLeads(filters?: LeadFilters): Promise<CRMLead[]> {
    let query = supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('lead_status', filters.status);
    }

    if (filters?.source) {
      query = query.eq('lead_source', filters.source);
    }

    if (filters?.score_range) {
      query = query
        .gte('lead_score', filters.score_range.min)
        .lte('lead_score', filters.score_range.max);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []) as CRMLead[];
  }

  static async createLead(lead: Omit<CRMLead, 'id' | 'created_at' | 'updated_at'>): Promise<CRMLead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert({
        ...lead,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as CRMLead;
  }

  static async updateLead(id: string, updates: Partial<CRMLead>): Promise<CRMLead> {
    // Ensure required fields are present for the update
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    // Remove undefined fields to avoid Supabase issues
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    const { data, error } = await supabase
      .from('crm_leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CRMLead;
  }

  static async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getLeadsByScore(minScore: number): Promise<CRMLead[]> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .gte('lead_score', minScore)
      .order('lead_score', { ascending: false });

    if (error) throw error;
    return (data || []) as CRMLead[];
  }

  static async convertLead(leadId: string): Promise<void> {
    const { error } = await supabase
      .from('crm_leads')
      .update({
        lead_status: 'converted',
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (error) throw error;
  }

  static async getLeadAnalytics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    conversionRate: number;
  }> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('lead_status, lead_source');

    if (error) throw error;

    const total = data?.length || 0;
    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    data?.forEach(lead => {
      byStatus[lead.lead_status] = (byStatus[lead.lead_status] || 0) + 1;
      bySource[lead.lead_source] = (bySource[lead.lead_source] || 0) + 1;
    });

    const converted = byStatus['converted'] || 0;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    return {
      total,
      byStatus,
      bySource,
      conversionRate
    };
  }
}
