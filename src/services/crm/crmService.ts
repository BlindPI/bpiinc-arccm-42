
import { supabase } from '@/integrations/supabase/client';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  phone?: string;
  status: string;
  lead_score: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  name: string;
  account_name?: string;
  value: number;
  stage: string;
  probability: number;
  close_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  type: string;
  subject: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CRMStats {
  totalLeads: number;
  totalOpportunities: number;
  pipelineValue: number;
  totalActivities: number;
}

export class CRMService {
  static async getCRMStats(): Promise<CRMStats> {
    try {
      const [leadsResult, opportunitiesResult, activitiesResult] = await Promise.all([
        supabase.from('crm_leads').select('id', { count: 'exact' }),
        supabase.from('crm_opportunities').select('id, estimated_value'),
        supabase.from('crm_activities').select('id', { count: 'exact' })
      ]);

      const totalLeads = leadsResult.count || 0;
      const totalOpportunities = opportunitiesResult.data?.length || 0;
      const totalActivities = activitiesResult.count || 0;
      
      const pipelineValue = opportunitiesResult.data?.reduce(
        (sum, opp) => sum + (opp.estimated_value || 0), 
        0
      ) || 0;

      return {
        totalLeads,
        totalOpportunities,
        pipelineValue,
        totalActivities
      };
    } catch (error) {
      console.error('Error fetching CRM stats:', error);
      return {
        totalLeads: 0,
        totalOpportunities: 0,
        pipelineValue: 0,
        totalActivities: 0
      };
    }
  }

  static async getLeads(): Promise<Lead[]> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(lead => ({
        id: lead.id,
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        company: lead.company_name || '',
        phone: lead.phone || '',
        status: lead.lead_status || 'new',
        lead_score: lead.lead_score || 0,
        source: lead.lead_source || 'unknown',
        created_at: lead.created_at || '',
        updated_at: lead.updated_at || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  static async getOpportunities(): Promise<Opportunity[]> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(opp => ({
        id: opp.id,
        name: opp.opportunity_name || '',
        account_name: opp.account_name || '',
        value: opp.estimated_value || 0,
        stage: opp.opportunity_stage || '',
        probability: opp.probability || 0,
        close_date: opp.expected_close_date || '',
        created_at: opp.created_at || '',
        updated_at: opp.updated_at || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  }

  static async getActivities(filters?: { completed?: boolean }): Promise<Activity[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(activity => ({
        id: activity.id,
        type: activity.activity_type || 'task',
        subject: activity.subject || '',
        due_date: activity.due_date || '',
        completed: activity.completed || false,
        created_at: activity.created_at || '',
        updated_at: activity.updated_at || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  static async getContacts(): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(contact => ({
        id: contact.id,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        title: contact.title || '',
        account_id: contact.account_id || '',
        created_at: contact.created_at || '',
        updated_at: contact.updated_at || ''
      })) || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }
}
