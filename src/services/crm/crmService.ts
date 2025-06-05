
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

// Type guard functions
const isValidLeadStatus = (status: string): status is Lead['status'] => {
  return ['new', 'contacted', 'qualified', 'converted', 'lost'].includes(status);
};

const isValidLeadSource = (source: string): source is Lead['source'] => {
  return ['website', 'referral', 'cold_call', 'email', 'social_media', 'trade_show', 'other'].includes(source);
};

const isValidOpportunityStage = (stage: string): stage is Opportunity['stage'] => {
  return ['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].includes(stage);
};

const isValidActivityType = (type: string): type is Activity['type'] => {
  return ['call', 'email', 'meeting', 'task', 'note'].includes(type);
};

export class CRMService {
  // Lead Management
  static async getLeads(filters?: {
    status?: string;
    source?: string;
    assigned_to?: string;
    location_id?: string;
  }): Promise<Lead[]> {
    try {
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
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(record => ({
        id: record.id,
        first_name: record.first_name || '',
        last_name: record.last_name || '',
        email: record.email,
        phone: record.phone,
        company: record.company_name,
        title: record.job_title,
        status: isValidLeadStatus(record.lead_status) ? record.lead_status : 'new',
        source: isValidLeadSource(record.lead_source) ? record.lead_source : 'website',
        score: record.lead_score,
        location_id: record.assigned_to,
        assigned_to: record.assigned_to,
        notes: record.qualification_notes,
        created_at: record.created_at,
        updated_at: record.updated_at
      }));
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    // Get current user for created_by field
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('crm_leads')
      .insert({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        company_name: lead.company,
        job_title: lead.title,
        lead_status: lead.status,
        lead_source: lead.source,
        lead_score: lead.score,
        assigned_to: lead.assigned_to,
        qualification_notes: lead.notes,
        lead_type: 'individual',
        created_by: user?.id || null
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email,
      phone: data.phone,
      company: data.company_name,
      title: data.job_title,
      status: isValidLeadStatus(data.lead_status) ? data.lead_status : 'new',
      source: isValidLeadSource(data.lead_source) ? data.lead_source : 'website',
      score: data.lead_score,
      location_id: data.assigned_to,
      assigned_to: data.assigned_to,
      notes: data.qualification_notes,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .update({
        ...(updates.first_name && { first_name: updates.first_name }),
        ...(updates.last_name && { last_name: updates.last_name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.phone && { phone: updates.phone }),
        ...(updates.company && { company_name: updates.company }),
        ...(updates.title && { job_title: updates.title }),
        ...(updates.status && { lead_status: updates.status }),
        ...(updates.source && { lead_source: updates.source }),
        ...(updates.score && { lead_score: updates.score }),
        ...(updates.assigned_to && { assigned_to: updates.assigned_to }),
        ...(updates.notes && { qualification_notes: updates.notes }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email,
      phone: data.phone,
      company: data.company_name,
      title: data.job_title,
      status: isValidLeadStatus(data.lead_status) ? data.lead_status : 'new',
      source: isValidLeadSource(data.lead_source) ? data.lead_source : 'website',
      score: data.lead_score,
      location_id: data.assigned_to,
      assigned_to: data.assigned_to,
      notes: data.qualification_notes,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  static async deleteLead(id: string): Promise<void> {
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
  }): Promise<Opportunity[]> {
    try {
      let query = supabase
        .from('crm_opportunities')
        .select('*')
        .order('expected_close_date', { ascending: true });

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(record => ({
        id: record.id,
        name: record.opportunity_name,
        description: record.next_steps,
        value: Number(record.estimated_value) || 0,
        stage: isValidOpportunityStage(record.stage) ? record.stage : 'prospect',
        probability: record.probability || 50,
        close_date: record.expected_close_date || '',
        lead_id: record.lead_id,
        account_name: record.opportunity_name,
        assigned_to: record.assigned_to,
        location_id: record.assigned_to,
        created_at: record.created_at,
        updated_at: record.updated_at
      }));
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  }

  static async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    // Get current user for created_by field
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('crm_opportunities')
      .insert({
        opportunity_name: opportunity.name,
        estimated_value: opportunity.value,
        stage: opportunity.stage,
        probability: opportunity.probability,
        expected_close_date: opportunity.close_date,
        lead_id: opportunity.lead_id,
        assigned_to: opportunity.assigned_to,
        next_steps: opportunity.description,
        opportunity_type: 'training_contract',
        created_by: user?.id || null
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.opportunity_name,
      description: data.next_steps,
      value: Number(data.estimated_value) || 0,
      stage: isValidOpportunityStage(data.stage) ? data.stage : 'prospect',
      probability: data.probability || 50,
      close_date: data.expected_close_date || '',
      lead_id: data.lead_id,
      account_name: data.opportunity_name,
      assigned_to: data.assigned_to,
      location_id: data.assigned_to,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  static async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .update({
        ...(updates.name && { opportunity_name: updates.name }),
        ...(updates.value !== undefined && { estimated_value: updates.value }),
        ...(updates.stage && { stage: updates.stage }),
        ...(updates.probability !== undefined && { probability: updates.probability }),
        ...(updates.close_date && { expected_close_date: updates.close_date }),
        ...(updates.lead_id && { lead_id: updates.lead_id }),
        ...(updates.assigned_to && { assigned_to: updates.assigned_to }),
        ...(updates.description && { next_steps: updates.description }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.opportunity_name,
      description: data.next_steps,
      value: Number(data.estimated_value) || 0,
      stage: isValidOpportunityStage(data.stage) ? data.stage : 'prospect',
      probability: data.probability || 50,
      close_date: data.expected_close_date || '',
      lead_id: data.lead_id,
      account_name: data.opportunity_name,
      assigned_to: data.assigned_to,
      location_id: data.assigned_to,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  // Activity Management
  static async getActivities(filters?: {
    type?: string;
    completed?: boolean;
    lead_id?: string;
    opportunity_id?: string;
    assigned_to?: string;
  }): Promise<Activity[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('activity_date', { ascending: true });

      if (filters?.type) {
        query = query.eq('activity_type', filters.type);
      }
      if (filters?.completed !== undefined) {
        query = query.eq('outcome', filters.completed ? 'completed' : 'pending');
      }
      if (filters?.lead_id) {
        query = query.eq('lead_id', filters.lead_id);
      }
      if (filters?.opportunity_id) {
        query = query.eq('opportunity_id', filters.opportunity_id);
      }
      if (filters?.assigned_to) {
        query = query.eq('created_by', filters.assigned_to);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(record => {
        const activityType = record.activity_type === 'phone' ? 'call' : record.activity_type;
        return {
          id: record.id,
          type: isValidActivityType(activityType) ? activityType : 'task',
          subject: record.subject,
          description: record.description,
          due_date: record.activity_date,
          completed: record.outcome === 'completed',
          lead_id: record.lead_id,
          opportunity_id: record.opportunity_id,
          assigned_to: record.created_by,
          created_by: record.created_by,
          created_at: record.created_at,
          updated_at: record.updated_at
        };
      });
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  static async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    // Get current user for created_by field if not provided
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('crm_activities')
      .insert({
        activity_type: activity.type === 'call' ? 'phone' : activity.type,
        subject: activity.subject,
        description: activity.description,
        activity_date: activity.due_date || new Date().toISOString(),
        lead_id: activity.lead_id,
        opportunity_id: activity.opportunity_id,
        created_by: activity.created_by || user?.id || null,
        outcome: activity.completed ? 'completed' : 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    const activityType = data.activity_type === 'phone' ? 'call' : data.activity_type;
    return {
      id: data.id,
      type: isValidActivityType(activityType) ? activityType : 'task',
      subject: data.subject,
      description: data.description,
      due_date: data.activity_date,
      completed: data.outcome === 'completed',
      lead_id: data.lead_id,
      opportunity_id: data.opportunity_id,
      assigned_to: data.created_by,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  static async updateActivity(id: string, updates: Partial<Activity>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .update({
        ...(updates.type && { activity_type: updates.type === 'call' ? 'phone' : updates.type }),
        ...(updates.subject && { subject: updates.subject }),
        ...(updates.description && { description: updates.description }),
        ...(updates.due_date && { activity_date: updates.due_date }),
        ...(updates.lead_id && { lead_id: updates.lead_id }),
        ...(updates.opportunity_id && { opportunity_id: updates.opportunity_id }),
        ...(updates.completed !== undefined && { outcome: updates.completed ? 'completed' : 'pending' }),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const activityType = data.activity_type === 'phone' ? 'call' : data.activity_type;
    return {
      id: data.id,
      type: isValidActivityType(activityType) ? activityType : 'task',
      subject: data.subject,
      description: data.description,
      due_date: data.activity_date,
      completed: data.outcome === 'completed',
      lead_id: data.lead_id,
      opportunity_id: data.opportunity_id,
      assigned_to: data.created_by,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  // Analytics and Reporting
  static async getCRMStats() {
    try {
      const [leadsResult, opportunitiesResult, activitiesResult] = await Promise.all([
        supabase.from('crm_leads').select('lead_status', { count: 'exact' }),
        supabase.from('crm_opportunities').select('stage, estimated_value', { count: 'exact' }),
        supabase.from('crm_activities').select('outcome', { count: 'exact' })
      ]);

      if (leadsResult.error) throw leadsResult.error;
      if (opportunitiesResult.error) throw opportunitiesResult.error;
      if (activitiesResult.error) throw activitiesResult.error;

      return {
        totalLeads: leadsResult.count || 0,
        totalOpportunities: opportunitiesResult.count || 0,
        totalActivities: activitiesResult.count || 0,
        pipelineValue: opportunitiesResult.data?.reduce((sum, opp) => sum + (Number(opp.estimated_value) || 0), 0) || 0
      };
    } catch (error) {
      console.error('Error fetching CRM stats:', error);
      return {
        totalLeads: 0,
        totalOpportunities: 0,
        totalActivities: 0,
        pipelineValue: 0
      };
    }
  }
}
