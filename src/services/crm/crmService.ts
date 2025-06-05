
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  source: 'website' | 'referral' | 'cold_call' | 'email' | 'social_media' | 'trade_show' | 'other';
  score?: number;
  location_id?: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  name: string;
  description?: string;
  value: number;
  stage: 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number;
  close_date: string;
  lead_id?: string;
  account_name?: string;
  assigned_to?: string;
  location_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note';
  subject: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  lead_id?: string;
  opportunity_id?: string;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export class CRMService {
  // Lead Management
  static async getLeads(filters?: {
    status?: string;
    source?: string;
    assigned_to?: string;
    location_id?: string;
  }) {
    let query = supabase
      .from('crm_leads')
      .select(`
        *,
        assigned_user:profiles!crm_leads_assigned_to_fkey(display_name),
        location:locations(name)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.source) {
      query = query.eq('source', filters.source);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Lead[];
  }

  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert(lead)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  }

  static async updateLead(id: string, updates: Partial<Lead>) {
    const { data, error } = await supabase
      .from('crm_leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  }

  static async deleteLead(id: string) {
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Opportunity Management
  static async getOpportunities(filters?: {
    stage?: string;
    assigned_to?: string;
    location_id?: string;
  }) {
    let query = supabase
      .from('crm_opportunities')
      .select(`
        *,
        assigned_user:profiles!crm_opportunities_assigned_to_fkey(display_name),
        location:locations(name),
        lead:crm_leads(first_name, last_name, email)
      `)
      .order('close_date', { ascending: true });

    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Opportunity[];
  }

  static async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .insert(opportunity)
      .select()
      .single();

    if (error) throw error;
    return data as Opportunity;
  }

  static async updateOpportunity(id: string, updates: Partial<Opportunity>) {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Opportunity;
  }

  // Activity Management
  static async getActivities(filters?: {
    type?: string;
    completed?: boolean;
    lead_id?: string;
    opportunity_id?: string;
    assigned_to?: string;
  }) {
    let query = supabase
      .from('crm_activities')
      .select(`
        *,
        assigned_user:profiles!crm_activities_assigned_to_fkey(display_name),
        created_user:profiles!crm_activities_created_by_fkey(display_name),
        lead:crm_leads(first_name, last_name),
        opportunity:crm_opportunities(name)
      `)
      .order('due_date', { ascending: true });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.completed !== undefined) {
      query = query.eq('completed', filters.completed);
    }
    if (filters?.lead_id) {
      query = query.eq('lead_id', filters.lead_id);
    }
    if (filters?.opportunity_id) {
      query = query.eq('opportunity_id', filters.opportunity_id);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Activity[];
  }

  static async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('crm_activities')
      .insert(activity)
      .select()
      .single();

    if (error) throw error;
    return data as Activity;
  }

  static async updateActivity(id: string, updates: Partial<Activity>) {
    const { data, error } = await supabase
      .from('crm_activities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Activity;
  }

  // Analytics and Reporting
  static async getCRMStats() {
    const [leadsResult, opportunitiesResult, activitiesResult] = await Promise.all([
      supabase.from('crm_leads').select('status', { count: 'exact' }),
      supabase.from('crm_opportunities').select('stage, value', { count: 'exact' }),
      supabase.from('crm_activities').select('completed', { count: 'exact' })
    ]);

    if (leadsResult.error) throw leadsResult.error;
    if (opportunitiesResult.error) throw opportunitiesResult.error;
    if (activitiesResult.error) throw activitiesResult.error;

    return {
      totalLeads: leadsResult.count || 0,
      totalOpportunities: opportunitiesResult.count || 0,
      totalActivities: activitiesResult.count || 0,
      pipelineValue: opportunitiesResult.data?.reduce((sum, opp) => sum + (opp.value || 0), 0) || 0
    };
  }
}
