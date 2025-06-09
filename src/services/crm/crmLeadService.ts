import { supabase } from '@/integrations/supabase/client';

export interface CRMLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'LOST' | 'WON';
  source?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export class CRMLeadService {
  static transformLead(lead: any): CRMLead {
    return {
      id: lead.id,
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone || '',
      company: lead.company || '',
      title: lead.title || '',
      status: lead.status,
      source: lead.source || '',
      owner_id: lead.owner_id || '',
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      notes: lead.notes || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      zip: lead.zip || ''
    };
  }

  static async getLeads(): Promise<CRMLead[]> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.transformLead);
  }

  static async getLeadById(leadId: string): Promise<CRMLead | null> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) throw error;
    return data ? this.transformLead(data) : null;
  }

  static async createLead(leadData: Omit<CRMLead, 'id' | 'created_at' | 'updated_at'>): Promise<CRMLead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert([leadData])
      .select()
      .single();

    if (error) throw error;
    return this.transformLead(data);
  }

  static async updateLead(leadId: string, leadData: Partial<CRMLead>): Promise<CRMLead> {
    // Ensure email is provided for updates if required by database schema
    const updateData: any = { ...leadData };
    
    // Only include non-undefined values in the update
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('crm_leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single();

    if (error) throw error;
    return this.transformLead(data);
  }

  static async deleteLead(leadId: string): Promise<void> {
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', leadId);

    if (error) throw error;
  }
}
