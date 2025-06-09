
import { supabase } from '@/integrations/supabase/client';
import { RealCRMService } from './realCRMService';
import type { Lead, Opportunity, Contact, Account, Activity, CRMStats } from '@/types/crm';

export class CRMService {
  // Delegate lead operations to RealCRMService
  static async getLeads(): Promise<Lead[]> {
    return RealCRMService.getLeads();
  }

  static async createLead(leadData: Partial<Lead>): Promise<Lead> {
    return RealCRMService.createLead(leadData);
  }

  static async updateLead(leadId: string, leadData: Partial<Lead>): Promise<Lead> {
    return RealCRMService.updateLead(leadId, leadData);
  }

  static async deleteLead(leadId: string): Promise<void> {
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', leadId);

    if (error) throw error;
  }

  // Opportunity operations
  static async getOpportunities(): Promise<Opportunity[]> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createOpportunity(opportunityData: Partial<Opportunity>): Promise<Opportunity> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .insert([opportunityData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateOpportunity(opportunityId: string, opportunityData: Partial<Opportunity>): Promise<Opportunity> {
    const { data, error } = await supabase
      .from('crm_opportunities')
      .update(opportunityData)
      .eq('id', opportunityId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteOpportunity(opportunityId: string): Promise<void> {
    const { error } = await supabase
      .from('crm_opportunities')
      .delete()
      .eq('id', opportunityId);

    if (error) throw error;
  }

  // Contact operations
  static async getContacts(): Promise<Contact[]> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createContact(contactData: Partial<Contact>): Promise<Contact> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .insert([contactData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateContact(contactId: string, contactData: Partial<Contact>): Promise<Contact> {
    const { data, error } = await supabase
      .from('crm_contacts')
      .update(contactData)
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteContact(contactId: string): Promise<void> {
    const { error } = await supabase
      .from('crm_contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;
  }

  // Account operations
  static async getAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createAccount(accountData: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .insert([accountData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateAccount(accountId: string, accountData: Partial<Account>): Promise<Account> {
    const { data, error } = await supabase
      .from('crm_accounts')
      .update(accountData)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteAccount(accountId: string): Promise<void> {
    const { error } = await supabase
      .from('crm_accounts')
      .delete()
      .eq('id', accountId);

    if (error) throw error;
  }

  // Activity operations
  static async getActivities(): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .order('activity_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createActivity(activityData: Partial<Activity>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .insert([activityData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateActivity(activityId: string, activityData: Partial<Activity>): Promise<Activity> {
    const { data, error } = await supabase
      .from('crm_activities')
      .update(activityData)
      .eq('id', activityId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteActivity(activityId: string): Promise<void> {
    const { error } = await supabase
      .from('crm_activities')
      .delete()
      .eq('id', activityId);

    if (error) throw error;
  }

  // CRM Statistics
  static async getCRMStats(): Promise<CRMStats> {
    // Get realtime metrics if available
    await RealCRMService.updateRealtimeMetrics();
    
    const [leadsResult, opportunitiesResult, activitiesResult] = await Promise.all([
      supabase.from('crm_leads').select('*', { count: 'exact', head: true }),
      supabase.from('crm_opportunities').select('*'),
      supabase.from('crm_activities').select('*', { count: 'exact', head: true })
    ]);

    const opportunities = opportunitiesResult.data || [];
    const totalPipelineValue = opportunities
      .filter(opp => opp.opportunity_status === 'open')
      .reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);

    const closedWon = opportunities.filter(opp => opp.stage === 'closed_won').length;
    const closedTotal = opportunities.filter(opp => opp.opportunity_status === 'closed').length;
    
    const conversionRate = leadsResult.count > 0 
      ? (opportunities.filter(opp => opp.lead_id).length / leadsResult.count) * 100 
      : 0;

    const winRate = closedTotal > 0 ? (closedWon / closedTotal) * 100 : 0;
    
    const avgDealSize = closedWon > 0 
      ? opportunities
          .filter(opp => opp.stage === 'closed_won')
          .reduce((sum, opp) => sum + (opp.estimated_value || 0), 0) / closedWon
      : 0;

    return {
      total_leads: leadsResult.count || 0,
      total_opportunities: opportunities.length,
      total_pipeline_value: totalPipelineValue,
      total_activities: activitiesResult.count || 0,
      conversion_rate: Math.round(conversionRate * 10) / 10,
      win_rate: Math.round(winRate * 10) / 10,
      average_deal_size: Math.round(avgDealSize)
    };
  }

  // Pipeline Analytics
  static async getPipelineMetrics() {
    return RealCRMService.getPipelineMetrics();
  }

  // Revenue Analytics  
  static async getRevenueForecasts() {
    return RealCRMService.getRevenueForecasts();
  }

  static async getRevenueRecords() {
    return RealCRMService.getRevenueRecords();
  }

  // Lead Analytics
  static async getLeadActivities(leadId: string) {
    return RealCRMService.getLeadActivities(leadId);
  }

  static async getConversionAnalytics() {
    return RealCRMService.getConversionAnalytics();
  }

  // Campaign Management
  static async getEmailCampaigns() {
    return RealCRMService.getEmailCampaigns();
  }

  static async getCampaignPerformance() {
    return RealCRMService.getCampaignPerformance();
  }
}
