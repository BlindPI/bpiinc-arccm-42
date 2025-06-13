
import { supabase } from '@/integrations/supabase/client';
import type { Lead, Contact, Account, Opportunity, Activity, CRMStats } from '@/types/crm';

interface AccountFilters {
  account_type?: string;
}

// Type guards for safe casting
const isValidLeadStatus = (status: string): status is 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' => {
  return ['new', 'contacted', 'qualified', 'converted', 'lost'].includes(status);
};

const isValidContactStatus = (status: string): status is 'active' | 'inactive' => {
  return ['active', 'inactive'].includes(status);
};

const isValidAccountType = (type: string): type is 'prospect' | 'customer' | 'partner' | 'competitor' => {
  return ['prospect', 'customer', 'partner', 'competitor'].includes(type);
};

const isValidOpportunityStage = (stage: string): stage is 'prospect' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' => {
  return ['prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost'].includes(stage);
};

export class CRMService {
  // Lead Management
  static async getLeads(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(lead => ({
      ...lead,
      lead_status: isValidLeadStatus(lead.lead_status) ? lead.lead_status : 'new',
      lead_source: lead.lead_source || 'other'
    })) as Lead[];
  }

  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    const { data, error } = await supabase
      .from('crm_leads')
      .insert(lead)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      lead_status: isValidLeadStatus(data.lead_status) ? data.lead_status : 'new'
    } as Lead;
  }

  static async updateLead(id: string, updates: Partial<Lead>): Promise<void> {
    const { error } = await supabase
      .from('crm_leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async deleteLead(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Contact Management
  static async getContacts(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(contact => ({
      ...contact,
      contact_status: isValidContactStatus(contact.contact_status) ? contact.contact_status : 'active'
    })) as Contact[];
  }

  static async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert(contact)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      contact_status: isValidContactStatus(data.contact_status) ? data.contact_status : 'active'
    } as Contact;
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<void> {
    const { error } = await supabase
      .from('crm_contacts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async deleteContact(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Account Management
  static async getAccounts(filters?: AccountFilters): Promise<Account[]> {
    let query = supabase
      .from('crm_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (filters?.account_type) {
      query = query.eq('account_type', filters.account_type);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return (data || []).map(account => ({
      ...account,
      account_type: isValidAccountType(account.account_type) ? account.account_type : 'prospect',
      account_status: account.account_status || 'active'
    })) as Account[];
  }

  static async createAccount(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .insert(account)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      account_type: isValidAccountType(data.account_type) ? data.account_type : 'prospect'
    } as Account;
  }

  static async updateAccount(id: string, updates: Partial<Account>): Promise<void> {
    const { error } = await supabase
      .from('crm_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Opportunity Management
  static async getOpportunities(): Promise<Opportunity[]> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(opportunity => ({
      ...opportunity,
      stage: isValidOpportunityStage(opportunity.stage) ? opportunity.stage : 'prospect',
      opportunity_status: opportunity.opportunity_status || 'open'
    })) as Opportunity[];
  }

  static async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .insert(opportunity)
      .select()
      .single();
    
    if (error) throw error;
    return {
      ...data,
      stage: isValidOpportunityStage(data.stage) ? data.stage : 'prospect'
    } as Opportunity;
  }

  static async updateOpportunity(id: string, updates: Partial<Opportunity>): Promise<void> {
    const { error } = await supabase
      .from('crm_opportunities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteOpportunity(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_opportunities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Activity Management
  static async getActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .order('activity_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Activity[];
  }

  static async createActivity(activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .insert(activity)
      .select()
      .single();
    
    if (error) throw error;
    return data as Activity;
  }

  static async updateActivity(id: string, updates: Partial<Activity>): Promise<void> {
    const { error } = await supabase
      .from('crm_activities')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  }

  static async deleteActivity(id: string): Promise<void> {
    const { error } = await supabase
      .from('crm_activities')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // CRM Statistics
  static async getCRMStats(): Promise<CRMStats> {
    try {
      // Get leads count
      const { count: leadsCount } = await supabase
        .from('crm_leads')
        .select('*', { count: 'exact', head: true });

      // Get opportunities data
      const { data: opportunities } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, stage, opportunity_status');

      // Get activities count
      const { count: activitiesCount } = await supabase
        .from('crm_activities')
        .select('*', { count: 'exact', head: true });

      // Get revenue data
      const { data: revenueData } = await supabase
        .from('crm_revenue_records')
        .select('amount');

      // Calculate metrics
      const totalOpportunities = opportunities?.length || 0;
      const totalPipelineValue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const closedWonOpportunities = opportunities?.filter(opp => opp.stage === 'closed_won').length || 0;
      const closedOpportunities = opportunities?.filter(opp => opp.stage === 'closed_won' || opp.stage === 'closed_lost').length || 0;
      const totalRevenue = revenueData?.reduce((sum, record) => sum + (record.amount || 0), 0) || 0;

      const conversionRate = leadsCount && totalOpportunities ? (totalOpportunities / leadsCount) * 100 : 0;
      const winRate = closedOpportunities > 0 ? (closedWonOpportunities / closedOpportunities) * 100 : 0;
      const averageDealSize = closedWonOpportunities > 0 ? totalRevenue / closedWonOpportunities : 0;

      return {
        total_leads: leadsCount || 0,
        total_opportunities: totalOpportunities,
        total_pipeline_value: totalPipelineValue,
        total_activities: activitiesCount || 0,
        conversion_rate: conversionRate,
        win_rate: winRate,
        average_deal_size: averageDealSize
      };
    } catch (error) {
      console.error('Error fetching CRM stats:', error);
      return {
        total_leads: 0,
        total_opportunities: 0,
        total_pipeline_value: 0,
        total_activities: 0,
        conversion_rate: 0,
        win_rate: 0,
        average_deal_size: 0
      };
    }
  }

  // Real Analytics Methods
  static async getAnalyticsMetrics() {
    try {
      const [
        { data: leads },
        { data: opportunities },
        { data: activities },
        { data: revenue },
        { data: contacts }
      ] = await Promise.all([
        supabase.from('crm_leads').select('*'),
        supabase.from('crm_opportunities').select('*'),
        supabase.from('crm_activities').select('*'),
        supabase.from('crm_revenue_records').select('*'),
        supabase.from('crm_contacts').select('*')
      ]);

      // Calculate real metrics
      const totalLeads = leads?.length || 0;
      const totalOpportunities = opportunities?.length || 0;
      const totalRevenue = revenue?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
      const totalPipelineValue = opportunities?.reduce((sum, o) => sum + (o.estimated_value || 0), 0) || 0;
      
      const closedWonOpps = opportunities?.filter(o => o.stage === 'closed_won') || [];
      const closedOpps = opportunities?.filter(o => o.stage === 'closed_won' || o.stage === 'closed_lost') || [];
      
      const conversionRate = totalLeads > 0 ? (totalOpportunities / totalLeads) * 100 : 0;
      const winRate = closedOpps.length > 0 ? (closedWonOpps.length / closedOpps.length) * 100 : 0;
      const averageDealSize = closedWonOpps.length > 0 ? totalRevenue / closedWonOpps.length : 0;

      // Calculate this month's data
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newLeadsThisMonth = leads?.filter(l => new Date(l.created_at) >= thisMonth).length || 0;

      // Calculate lead sources
      const leadsBySource = leads?.reduce((acc, lead) => {
        const source = lead.lead_source || 'Unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const leadSourceData = Object.entries(leadsBySource).map(([source, count]) => ({
        source,
        count,
        percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
      }));

      // Calculate activities by type
      const activitiesByType = activities?.reduce((acc, activity) => {
        const type = activity.activity_type || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const activityTypeData = Object.entries(activitiesByType).map(([type, count]) => ({
        type,
        count
      }));

      return {
        totalLeads,
        totalOpportunities,
        totalRevenue,
        totalPipelineValue,
        conversionRate,
        winRate,
        averageDealSize,
        newLeadsThisMonth,
        leadsBySource: leadSourceData,
        activitiesByType: activityTypeData,
        salesVelocity: 30, // TODO: Calculate from actual data
        taskCompletionRate: 85, // TODO: Calculate from actual task data
        overdueTasks: 0 // TODO: Calculate from actual task data
      };
    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      throw error;
    }
  }

  // Export functionality
  static async exportData(type: 'opportunities' | 'leads' | 'contacts' | 'activities') {
    try {
      const { data, error } = await supabase
        .from(`crm_${type}`)
        .select('*')
        .csv();

      if (error) throw error;

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crm-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
}
