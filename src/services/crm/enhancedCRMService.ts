import { supabase } from '@/integrations/supabase/client';
import type { 
  Lead, Contact, Account, Opportunity, Activity, CRMStats,
  PipelineMetrics, RevenueMetrics, MonthlyRevenueData, 
  RevenueBySource, RevenueForecast, DateRange
} from '@/types/crm';

// Type helpers to cast database results to proper types
const castToLead = (data: any): Lead => ({
  ...data,
  lead_status: data.lead_status as Lead['lead_status'],
  lead_source: data.lead_source as Lead['lead_source'],
  lead_type: data.lead_type as Lead['lead_type'],
  training_urgency: data.training_urgency as Lead['training_urgency'],
  preferred_training_format: data.preferred_training_format as Lead['preferred_training_format']
});

const castToContact = (data: any): Contact => ({
  ...data,
  contact_status: data.contact_status as Contact['contact_status'],
  preferred_contact_method: data.preferred_contact_method as Contact['preferred_contact_method']
});

const castToAccount = (data: any): Account => ({
  ...data,
  account_type: data.account_type as Account['account_type'],
  account_status: data.account_status as Account['account_status']
});

const castToOpportunity = (data: any): Opportunity => ({
  ...data,
  stage: data.stage as Opportunity['stage'],
  opportunity_status: data.opportunity_status as Opportunity['opportunity_status']
});

const castToActivity = (data: any): Activity => ({
  ...data,
  activity_type: data.activity_type as Activity['activity_type']
});

export class EnhancedCRMService {
  // Core CRM Stats
  static async getCRMStats(): Promise<CRMStats> {
    try {
      const [leadsResult, opportunitiesResult, activitiesResult] = await Promise.all([
        supabase.from('crm_leads').select('id, lead_status', { count: 'exact' }),
        supabase.from('crm_opportunities').select('id, estimated_value, stage, opportunity_status'),
        supabase.from('crm_activities').select('id', { count: 'exact' })
      ]);

      const totalLeads = leadsResult.count || 0;
      const convertedLeads = leadsResult.data?.filter(l => l.lead_status === 'converted').length || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      const opportunities = opportunitiesResult.data || [];
      const totalOpportunities = opportunities.length;
      const wonOpportunities = opportunities.filter(o => o.stage === 'closed_won').length;
      const winRate = totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0;

      const totalRevenue = opportunities
        .filter(o => o.stage === 'closed_won')
        .reduce((sum, o) => sum + (o.estimated_value || 0), 0);
      
      const pipelineValue = opportunities
        .filter(o => o.opportunity_status === 'open')
        .reduce((sum, o) => sum + (o.estimated_value || 0), 0);

      const averageDealSize = wonOpportunities > 0 ? totalRevenue / wonOpportunities : 0;
      const totalActivities = activitiesResult.count || 0;

      return {
        totalLeads,
        totalOpportunities,
        pipelineValue,
        totalActivities,
        conversionRate,
        winRate,
        averageDealSize
      };
    } catch (error) {
      console.error('Error fetching CRM stats:', error);
      return {
        totalLeads: 0,
        totalOpportunities: 0,
        pipelineValue: 0,
        totalActivities: 0,
        conversionRate: 0,
        winRate: 0,
        averageDealSize: 0
      };
    }
  }

  // Leads Management
  static async getLeads(filters?: any): Promise<Lead[]> {
    try {
      let query = supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.lead_status) {
        query = query.eq('lead_status', filters.lead_status);
      }
      if (filters?.lead_source) {
        query = query.eq('lead_source', filters.lead_source);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(castToLead);
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  static async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;
      return castToLead(data);
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  static async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .update(leadData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return castToLead(data);
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  static async deleteLead(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  // Contacts Management
  static async getContacts(filters?: any): Promise<Contact[]> {
    try {
      let query = supabase
        .from('crm_contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.contact_status) {
        query = query.eq('contact_status', filters.contact_status);
      }
      if (filters?.account_id) {
        query = query.eq('account_id', filters.account_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(castToContact);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return [];
    }
  }

  static async createContact(contactData: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .insert(contactData)
        .select()
        .single();

      if (error) throw error;
      return castToContact(data);
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  static async updateContact(id: string, contactData: Partial<Contact>): Promise<Contact> {
    try {
      const { data, error } = await supabase
        .from('crm_contacts')
        .update(contactData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return castToContact(data);
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  static async deleteContact(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }

  // Accounts Management
  static async getAccounts(filters?: any): Promise<Account[]> {
    try {
      let query = supabase
        .from('crm_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.account_type) {
        query = query.eq('account_type', filters.account_type);
      }
      if (filters?.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(castToAccount);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  }

  static async createAccount(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .insert(accountData)
        .select()
        .single();

      if (error) throw error;
      return castToAccount(data);
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  static async updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
    try {
      const { data, error } = await supabase
        .from('crm_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return castToAccount(data);
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  static async deleteAccount(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  // Opportunities Management
  static async getOpportunities(filters?: any): Promise<Opportunity[]> {
    try {
      let query = supabase
        .from('crm_opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.opportunity_status) {
        query = query.eq('opportunity_status', filters.opportunity_status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(castToOpportunity);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      return [];
    }
  }

  static async createOpportunity(oppData: Omit<Opportunity, 'id' | 'created_at' | 'updated_at'>): Promise<Opportunity> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert(oppData)
        .select()
        .single();

      if (error) throw error;
      return castToOpportunity(data);
    } catch (error) {
      console.error('Error creating opportunity:', error);
      throw error;
    }
  }

  static async updateOpportunity(id: string, oppData: Partial<Opportunity>): Promise<Opportunity> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .update(oppData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return castToOpportunity(data);
    } catch (error) {
      console.error('Error updating opportunity:', error);
      throw error;
    }
  }

  static async deleteOpportunity(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_opportunities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      throw error;
    }
  }

  // Activities Management
  static async getActivities(filters?: { completed?: boolean; type?: string }): Promise<Activity[]> {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.completed !== undefined) {
        query = query.eq('completed', filters.completed);
      }

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('activity_type', filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(castToActivity);
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  static async createActivity(activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .insert(activityData)
        .select()
        .single();

      if (error) throw error;
      return castToActivity(data);
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  static async updateActivity(id: string, activityData: Partial<Activity>): Promise<Activity> {
    try {
      const { data, error } = await supabase
        .from('crm_activities')
        .update(activityData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return castToActivity(data);
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  }

  static async deleteActivity(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  }

  // Pipeline Analytics
  static async getPipelineMetrics(): Promise<PipelineMetrics> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('stage, estimated_value, probability, opportunity_status, created_at, expected_close_date')
        .eq('opportunity_status', 'open');

      if (error) throw error;

      const castOpportunities = (opportunities || []).map(castToOpportunity);

      const totalPipelineValue = castOpportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);
      const weightedPipelineValue = castOpportunities.reduce((sum, opp) => 
        sum + ((opp.estimated_value || 0) * (opp.probability || 0) / 100), 0);

      // Calculate average close time from historical data
      const { data: closedOpps } = await supabase
        .from('crm_opportunities')
        .select('created_at, close_date')
        .eq('opportunity_status', 'closed')
        .not('close_date', 'is', null);

      const avgCloseTime = closedOpps?.reduce((sum, opp) => {
        const created = new Date(opp.created_at);
        const closed = new Date(opp.close_date);
        return sum + (closed.getTime() - created.getTime());
      }, 0) / (closedOpps?.length || 1) / (1000 * 60 * 60 * 24) || 45; // Convert to days

      // Group by stage
      const stageGroups = castOpportunities.reduce((acc, opp) => {
        const stage = opp.stage || 'Unknown';
        if (!acc[stage]) {
          acc[stage] = { count: 0, value: 0, totalProbability: 0 };
        }
        acc[stage].count += 1;
        acc[stage].value += opp.estimated_value || 0;
        acc[stage].totalProbability += opp.probability || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number; totalProbability: number }>);

      const stageDistribution = Object.entries(stageGroups).map(([stage_name, data]) => ({
        stage_name,
        opportunity_count: data.count,
        total_value: data.value,
        avg_probability: data.count > 0 ? Math.round(data.totalProbability / data.count) : 0
      }));

      const conversionRate = 25.5; // This would be calculated from historical data

      return {
        totalPipelineValue,
        weightedPipelineValue,
        averageCloseTime: Math.round(avgCloseTime),
        conversionRate,
        stageDistribution
      };
    } catch (error) {
      console.error('Error fetching pipeline metrics:', error);
      return {
        totalPipelineValue: 0,
        weightedPipelineValue: 0,
        averageCloseTime: 0,
        conversionRate: 0,
        stageDistribution: []
      };
    }
  }

  // Revenue Analytics
  static async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, stage, close_date, created_at')
        .eq('stage', 'closed_won')
        .gte('close_date', dateRange.from.toISOString())
        .lte('close_date', dateRange.to.toISOString());

      if (error) throw error;

      const currentRevenue = opportunities?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      
      // Calculate previous period revenue for comparison
      const previousPeriodStart = new Date(dateRange.from);
      const previousPeriodEnd = new Date(dateRange.to);
      const periodLength = dateRange.to.getTime() - dateRange.from.getTime();
      previousPeriodStart.setTime(previousPeriodStart.getTime() - periodLength);
      previousPeriodEnd.setTime(previousPeriodEnd.getTime() - periodLength);

      const { data: previousOpps } = await supabase
        .from('crm_opportunities')
        .select('estimated_value')
        .eq('stage', 'closed_won')
        .gte('close_date', previousPeriodStart.toISOString())
        .lte('close_date', previousPeriodEnd.toISOString());

      const previousRevenue = previousOpps?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;
      const growthRate = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      const dealCount = opportunities?.length || 0;
      const averageDealSize = dealCount > 0 ? currentRevenue / dealCount : 0;

      // Get current pipeline value
      const { data: pipelineOpps } = await supabase
        .from('crm_opportunities')
        .select('estimated_value')
        .eq('opportunity_status', 'open');

      const pipelineValue = pipelineOpps?.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) || 0;

      return {
        currentRevenue,
        previousRevenue,
        growthRate,
        averageDealSize,
        pipelineValue,
        forecastValue: pipelineValue * 0.3 // Simple forecast calculation
      };
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      return {
        currentRevenue: 0,
        previousRevenue: 0,
        growthRate: 0,
        averageDealSize: 0,
        pipelineValue: 0,
        forecastValue: 0
      };
    }
  }
}

// Re-export as CRMService for backwards compatibility
export { EnhancedCRMService as CRMService };
