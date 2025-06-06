
import { supabase } from '@/integrations/supabase/client';

export interface ConversionFunnelData {
  stage: string;
  count: number;
  conversionRate: number;
}

export interface LeadSourcePerformance {
  source: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  averageValue: number;
  revenue: number;
}

export interface SalesRepPerformance {
  repId: string;
  repName: string;
  totalLeads: number;
  convertedLeads: number;
  totalRevenue: number;
  averageDealSize: number;
  conversionRate: number;
}

export class AdvancedAnalyticsService {
  static async getConversionFunnelData(): Promise<ConversionFunnelData[]> {
    try {
      const { data: leads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('lead_status');

      if (leadsError) throw leadsError;

      const { data: opportunities, error: oppsError } = await supabase
        .from('crm_opportunities')
        .select('stage, estimated_value');

      if (oppsError) throw oppsError;

      // Calculate funnel data
      const totalLeads = leads?.length || 0;
      const qualifiedLeads = leads?.filter(l => l.lead_status === 'qualified').length || 0;
      const proposalStage = opportunities?.filter(o => o.stage === 'proposal').length || 0;
      const negotiationStage = opportunities?.filter(o => o.stage === 'negotiation').length || 0;
      const closedWon = opportunities?.filter(o => o.stage === 'closed_won').length || 0;

      return [
        {
          stage: 'Total Leads',
          count: totalLeads,
          conversionRate: 100
        },
        {
          stage: 'Qualified',
          count: qualifiedLeads,
          conversionRate: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0
        },
        {
          stage: 'Proposal',
          count: proposalStage,
          conversionRate: totalLeads > 0 ? (proposalStage / totalLeads) * 100 : 0
        },
        {
          stage: 'Negotiation',
          count: negotiationStage,
          conversionRate: totalLeads > 0 ? (negotiationStage / totalLeads) * 100 : 0
        },
        {
          stage: 'Closed Won',
          count: closedWon,
          conversionRate: totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0
        }
      ];
    } catch (error) {
      console.error('Error getting conversion funnel data:', error);
      return [];
    }
  }

  static async getLeadSourcePerformance(): Promise<LeadSourcePerformance[]> {
    try {
      const { data: leads, error: leadsError } = await supabase
        .from('crm_leads')
        .select('lead_source, lead_status, converted_opportunity_id');

      if (leadsError) throw leadsError;

      const { data: opportunities, error: oppsError } = await supabase
        .from('crm_opportunities')
        .select('id, estimated_value');

      if (oppsError) throw oppsError;

      // Group by source and calculate metrics
      const sourceMap = new Map<string, {
        totalLeads: number;
        convertedLeads: number;
        totalValue: number;
      }>();

      leads?.forEach(lead => {
        const source = lead.lead_source || 'unknown';
        const existing = sourceMap.get(source) || { totalLeads: 0, convertedLeads: 0, totalValue: 0 };
        
        existing.totalLeads++;
        if (lead.lead_status === 'converted') {
          existing.convertedLeads++;
          
          // Find associated opportunity value
          const opp = opportunities?.find(o => o.id === lead.converted_opportunity_id);
          if (opp) {
            existing.totalValue += opp.estimated_value || 0;
          }
        }
        
        sourceMap.set(source, existing);
      });

      return Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        totalLeads: data.totalLeads,
        convertedLeads: data.convertedLeads,
        conversionRate: data.totalLeads > 0 ? (data.convertedLeads / data.totalLeads) * 100 : 0,
        averageValue: data.convertedLeads > 0 ? data.totalValue / data.convertedLeads : 0,
        revenue: data.totalValue
      }));
    } catch (error) {
      console.error('Error getting lead source performance:', error);
      return [];
    }
  }

  static async getSalesRepPerformance(): Promise<SalesRepPerformance[]> {
    try {
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select(`
          assigned_to,
          estimated_value,
          opportunity_status
        `);

      if (error) throw error;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name');

      // Group by rep and calculate metrics
      const repMap = new Map<string, {
        totalLeads: number;
        convertedLeads: number;
        totalRevenue: number;
      }>();

      opportunities?.forEach(opp => {
        if (!opp.assigned_to) return;
        
        const existing = repMap.get(opp.assigned_to) || { totalLeads: 0, convertedLeads: 0, totalRevenue: 0 };
        existing.totalLeads++;
        
        if (opp.opportunity_status === 'closed_won') {
          existing.convertedLeads++;
          existing.totalRevenue += opp.estimated_value || 0;
        }
        
        repMap.set(opp.assigned_to, existing);
      });

      return Array.from(repMap.entries()).map(([repId, data]) => {
        const profile = profiles?.find(p => p.id === repId);
        return {
          repId,
          repName: profile?.display_name || 'Unknown',
          totalLeads: data.totalLeads,
          convertedLeads: data.convertedLeads,
          totalRevenue: data.totalRevenue,
          averageDealSize: data.convertedLeads > 0 ? data.totalRevenue / data.convertedLeads : 0,
          conversionRate: data.totalLeads > 0 ? (data.convertedLeads / data.totalLeads) * 100 : 0
        };
      });
    } catch (error) {
      console.error('Error getting sales rep performance:', error);
      return [];
    }
  }
}
