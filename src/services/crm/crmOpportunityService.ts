import { supabase } from '@/integrations/supabase/client';
import { 
  CRMOpportunity, 
  CreateOpportunityData, 
  OpportunityFilters, 
  CRMServiceResponse, 
  PaginatedResponse,
  PipelineMetrics,
  RevenueMetrics
} from '@/types/crm';

export class CRMOpportunityService {
  /**
   * Create a new opportunity
   */
  async createOpportunity(opportunityData: CreateOpportunityData): Promise<CRMServiceResponse<CRMOpportunity>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User must be authenticated' };
      }

      // Get default probability for the stage
      const stageInfo = await this.getStageInfo(opportunityData.stage, opportunityData.opportunity_type);
      const defaultProbability = stageInfo?.probability_default || opportunityData.probability;

      const { data, error } = await supabase
        .from('crm_opportunities')
        .insert({
          ...opportunityData,
          probability: defaultProbability,
          created_by: user.id,
          assigned_to: opportunityData.assigned_to || user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating opportunity:', error);
        return { success: false, error: error.message };
      }

      // If created from a lead, update the lead's conversion status
      if (opportunityData.lead_id) {
        await this.updateLeadConversion(opportunityData.lead_id, data.id);
      }

      // Create initial activity record
      await this.createOpportunityActivity(data.id, 'Opportunity Created', 'New opportunity created in the pipeline');

      return { success: true, data };
    } catch (error) {
      console.error('Error in createOpportunity:', error);
      return { success: false, error: 'Failed to create opportunity' };
    }
  }

  /**
   * Get opportunities with filtering and pagination
   */
  async getOpportunities(
    filters: OpportunityFilters = {}, 
    page: number = 1, 
    limit: number = 50
  ): Promise<CRMServiceResponse<PaginatedResponse<CRMOpportunity>>> {
    try {
      let query = supabase
        .from('crm_opportunities')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.opportunity_type) {
        query = query.eq('opportunity_type', filters.opportunity_type);
      }
      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.min_value !== undefined) {
        query = query.gte('estimated_value', filters.min_value);
      }
      if (filters.max_value !== undefined) {
        query = query.lte('estimated_value', filters.max_value);
      }
      if (filters.min_probability !== undefined) {
        query = query.gte('probability', filters.min_probability);
      }
      if (filters.max_probability !== undefined) {
        query = query.lte('probability', filters.max_probability);
      }
      if (filters.expected_close_after) {
        query = query.gte('expected_close_date', filters.expected_close_after);
      }
      if (filters.expected_close_before) {
        query = query.lte('expected_close_date', filters.expected_close_before);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query
        .order('estimated_value', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching opportunities:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          has_more: (count || 0) > offset + limit
        }
      };
    } catch (error) {
      console.error('Error in getOpportunities:', error);
      return { success: false, error: 'Failed to fetch opportunities' };
    }
  }

  /**
   * Get a single opportunity by ID
   */
  async getOpportunity(opportunityId: string): Promise<CRMServiceResponse<CRMOpportunity>> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single();

      if (error) {
        console.error('Error fetching opportunity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in getOpportunity:', error);
      return { success: false, error: 'Failed to fetch opportunity' };
    }
  }

  /**
   * Update an opportunity
   */
  async updateOpportunity(opportunityId: string, updates: Partial<CRMOpportunity>): Promise<CRMServiceResponse<CRMOpportunity>> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId)
        .select()
        .single();

      if (error) {
        console.error('Error updating opportunity:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateOpportunity:', error);
      return { success: false, error: 'Failed to update opportunity' };
    }
  }

  /**
   * Move opportunity to a new stage
   */
  async updateStage(opportunityId: string, newStage: string, notes?: string): Promise<CRMServiceResponse<CRMOpportunity>> {
    try {
      // Get current opportunity
      const currentOpp = await this.getOpportunity(opportunityId);
      if (!currentOpp.success || !currentOpp.data) {
        return { success: false, error: 'Opportunity not found' };
      }

      // Get stage information for probability update
      const stageInfo = await this.getStageInfo(newStage, currentOpp.data.opportunity_type);
      
      const updates: Partial<CRMOpportunity> = {
        stage: newStage
      };

      // Update probability if stage has default probability
      if (stageInfo?.probability_default !== undefined) {
        updates.probability = stageInfo.probability_default;
      }

      // Handle closed stages
      if (stageInfo?.is_closed_won) {
        updates.status = 'closed_won';
        updates.actual_close_date = new Date().toISOString().split('T')[0];
        updates.probability = 100;
      } else if (stageInfo?.is_closed_lost) {
        updates.status = 'closed_lost';
        updates.actual_close_date = new Date().toISOString().split('T')[0];
        updates.probability = 0;
      }

      const result = await this.updateOpportunity(opportunityId, updates);

      if (result.success) {
        // Log stage change activity
        await this.createOpportunityActivity(
          opportunityId, 
          `Stage Changed to ${newStage}`, 
          notes || `Opportunity moved from ${currentOpp.data.stage} to ${newStage}`
        );

        // Trigger stage-specific automation
        await this.triggerStageAutomation(opportunityId, newStage, currentOpp.data.stage);
      }

      return result;
    } catch (error) {
      console.error('Error in updateStage:', error);
      return { success: false, error: 'Failed to update stage' };
    }
  }

  /**
   * Close opportunity as won or lost
   */
  async closeOpportunity(opportunityId: string, outcome: 'won' | 'lost', notes?: string): Promise<CRMServiceResponse<CRMOpportunity>> {
    try {
      const currentOpp = await this.getOpportunity(opportunityId);
      if (!currentOpp.success || !currentOpp.data) {
        return { success: false, error: 'Opportunity not found' };
      }

      // Determine the appropriate closed stage
      const closedStage = outcome === 'won' ? 
        await this.getClosedWonStage(currentOpp.data.opportunity_type) :
        await this.getClosedLostStage(currentOpp.data.opportunity_type);

      if (!closedStage) {
        return { success: false, error: 'No closed stage found for opportunity type' };
      }

      const updates: Partial<CRMOpportunity> = {
        stage: closedStage,
        status: outcome === 'won' ? 'closed_won' : 'closed_lost',
        actual_close_date: new Date().toISOString().split('T')[0],
        probability: outcome === 'won' ? 100 : 0
      };

      const result = await this.updateOpportunity(opportunityId, updates);

      if (result.success) {
        // Log closure activity
        await this.createOpportunityActivity(
          opportunityId, 
          `Opportunity ${outcome === 'won' ? 'Won' : 'Lost'}`, 
          notes || `Opportunity closed as ${outcome}`
        );

        // If won, create revenue record
        if (outcome === 'won' && currentOpp.data.estimated_value > 0) {
          await this.createRevenueRecord(opportunityId, currentOpp.data);
        }

        // Trigger closure automation
        await this.triggerClosureAutomation(opportunityId, outcome);
      }

      return result;
    } catch (error) {
      console.error('Error in closeOpportunity:', error);
      return { success: false, error: 'Failed to close opportunity' };
    }
  }

  /**
   * Get pipeline metrics
   */
  async getPipelineMetrics(pipelineType?: string): Promise<CRMServiceResponse<PipelineMetrics[]>> {
    try {
      const { data, error } = await supabase.rpc('get_pipeline_metrics', {
        pipeline_type_param: pipelineType || null
      });

      if (error) {
        console.error('Error fetching pipeline metrics:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getPipelineMetrics:', error);
      return { success: false, error: 'Failed to fetch pipeline metrics' };
    }
  }

  /**
   * Calculate pipeline value and forecast
   */
  async calculatePipelineValue(): Promise<CRMServiceResponse<{
    total_pipeline_value: number;
    weighted_pipeline_value: number;
    opportunities_count: number;
    avg_deal_size: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, probability')
        .eq('status', 'open');

      if (error) {
        console.error('Error calculating pipeline value:', error);
        return { success: false, error: error.message };
      }

      const opportunities = data || [];
      const total_pipeline_value = opportunities.reduce((sum, opp) => sum + (opp.estimated_value || 0), 0);
      const weighted_pipeline_value = opportunities.reduce((sum, opp) => 
        sum + ((opp.estimated_value || 0) * (opp.probability || 0) / 100), 0
      );
      const opportunities_count = opportunities.length;
      const avg_deal_size = opportunities_count > 0 ? total_pipeline_value / opportunities_count : 0;

      return {
        success: true,
        data: {
          total_pipeline_value,
          weighted_pipeline_value,
          opportunities_count,
          avg_deal_size
        }
      };
    } catch (error) {
      console.error('Error in calculatePipelineValue:', error);
      return { success: false, error: 'Failed to calculate pipeline value' };
    }
  }

  /**
   * Get sales forecast for a period
   */
  async getForecast(period: 'month' | 'quarter' | 'year' = 'month'): Promise<CRMServiceResponse<{
    forecasted_revenue: number;
    opportunities_closing: number;
    confidence_level: number;
  }>> {
    try {
      const endDate = new Date();
      const startDate = new Date();

      switch (period) {
        case 'month':
          endDate.setMonth(endDate.getMonth() + 1);
          break;
        case 'quarter':
          endDate.setMonth(endDate.getMonth() + 3);
          break;
        case 'year':
          endDate.setFullYear(endDate.getFullYear() + 1);
          break;
      }

      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('estimated_value, probability')
        .eq('status', 'open')
        .gte('expected_close_date', startDate.toISOString().split('T')[0])
        .lte('expected_close_date', endDate.toISOString().split('T')[0]);

      if (error) {
        console.error('Error calculating forecast:', error);
        return { success: false, error: error.message };
      }

      const opportunities = data || [];
      const forecasted_revenue = opportunities.reduce((sum, opp) => 
        sum + ((opp.estimated_value || 0) * (opp.probability || 0) / 100), 0
      );
      const opportunities_closing = opportunities.length;
      
      // Simple confidence calculation based on number of opportunities and average probability
      const avg_probability = opportunities.length > 0 ? 
        opportunities.reduce((sum, opp) => sum + (opp.probability || 0), 0) / opportunities.length : 0;
      const confidence_level = Math.min(90, Math.max(10, avg_probability * 0.8));

      return {
        success: true,
        data: {
          forecasted_revenue,
          opportunities_closing,
          confidence_level
        }
      };
    } catch (error) {
      console.error('Error in getForecast:', error);
      return { success: false, error: 'Failed to calculate forecast' };
    }
  }

  /**
   * Get conversion rates by stage
   */
  async getConversionRates(): Promise<CRMServiceResponse<{
    stage: string;
    conversion_rate: number;
    opportunities_entered: number;
    opportunities_progressed: number;
  }[]>> {
    try {
      // This would require more complex analytics
      // For now, return a simplified version
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('stage, status')
        .neq('stage', 'Closed Won')
        .neq('stage', 'Closed Lost');

      if (error) {
        console.error('Error calculating conversion rates:', error);
        return { success: false, error: error.message };
      }

      // Group by stage and calculate basic metrics
      const stageGroups = (data || []).reduce((acc, opp) => {
        if (!acc[opp.stage]) {
          acc[opp.stage] = { total: 0, progressed: 0 };
        }
        acc[opp.stage].total++;
        if (opp.status === 'open') {
          acc[opp.stage].progressed++;
        }
        return acc;
      }, {} as Record<string, { total: number; progressed: number }>);

      const conversionRates = Object.entries(stageGroups).map(([stage, metrics]) => ({
        stage,
        conversion_rate: metrics.total > 0 ? (metrics.progressed / metrics.total) * 100 : 0,
        opportunities_entered: metrics.total,
        opportunities_progressed: metrics.progressed
      }));

      return { success: true, data: conversionRates };
    } catch (error) {
      console.error('Error in getConversionRates:', error);
      return { success: false, error: 'Failed to calculate conversion rates' };
    }
  }

  /**
   * Get opportunities by AP location
   */
  async getOpportunitiesByAP(apId: string): Promise<CRMServiceResponse<CRMOpportunity[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_opportunities')
        .select('*')
        .eq('preferred_ap_id', parseInt(apId))
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching opportunities by AP:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getOpportunitiesByAP:', error);
      return { success: false, error: 'Failed to fetch opportunities by AP' };
    }
  }

  // Private helper methods

  private async getStageInfo(stageName: string, pipelineType: string): Promise<{
    probability_default?: number;
    is_closed_won?: boolean;
    is_closed_lost?: boolean;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('probability_default, is_closed_won, is_closed_lost')
        .eq('stage_name', stageName)
        .eq('pipeline_type', pipelineType)
        .single();

      if (error) return null;
      return data;
    } catch (error) {
      return null;
    }
  }

  private async getClosedWonStage(pipelineType: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('stage_name')
        .eq('pipeline_type', pipelineType)
        .eq('is_closed_won', true)
        .single();

      if (error) return null;
      return data.stage_name;
    } catch (error) {
      return null;
    }
  }

  private async getClosedLostStage(pipelineType: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('stage_name')
        .eq('pipeline_type', pipelineType)
        .eq('is_closed_lost', true)
        .single();

      if (error) return null;
      return data.stage_name;
    } catch (error) {
      return null;
    }
  }

  private async updateLeadConversion(leadId: string, opportunityId: string): Promise<void> {
    try {
      await supabase
        .from('crm_leads')
        .update({
          converted_to_opportunity_id: opportunityId,
          converted_date: new Date().toISOString(),
          lead_status: 'converted'
        })
        .eq('id', leadId);
    } catch (error) {
      console.error('Error updating lead conversion:', error);
    }
  }

  private async createOpportunityActivity(opportunityId: string, subject: string, description: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('crm_activities').insert({
        opportunity_id: opportunityId,
        activity_type: 'follow_up',
        subject,
        description,
        activity_date: new Date().toISOString(),
        outcome: 'positive',
        created_by: user?.id
      });
    } catch (error) {
      console.error('Error creating opportunity activity:', error);
    }
  }

  private async createRevenueRecord(opportunityId: string, opportunity: CRMOpportunity): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let revenueType: 'certificate_sale' | 'corporate_contract' | 'ap_setup_fee' = 'certificate_sale';
      if (opportunity.opportunity_type === 'corporate_contract') {
        revenueType = 'corporate_contract';
      } else if (opportunity.opportunity_type === 'ap_partnership') {
        revenueType = 'ap_setup_fee';
      }

      await supabase.from('crm_revenue_records').insert({
        opportunity_id: opportunityId,
        revenue_type: revenueType,
        amount: opportunity.estimated_value,
        currency: 'CAD',
        revenue_date: new Date().toISOString().split('T')[0],
        ap_location_id: opportunity.preferred_ap_id,
        participant_count: opportunity.participant_count,
        sales_rep_id: opportunity.assigned_to || user?.id
      });
    } catch (error) {
      console.error('Error creating revenue record:', error);
    }
  }

  private async triggerStageAutomation(opportunityId: string, newStage: string, oldStage: string): Promise<void> {
    try {
      // Implement stage-specific automation logic here
      // For example, create tasks, send emails, update fields, etc.
      console.log(`Stage automation triggered: ${oldStage} -> ${newStage} for opportunity ${opportunityId}`);
    } catch (error) {
      console.error('Error triggering stage automation:', error);
    }
  }

  private async triggerClosureAutomation(opportunityId: string, outcome: 'won' | 'lost'): Promise<void> {
    try {
      // Implement closure-specific automation logic here
      console.log(`Closure automation triggered: ${outcome} for opportunity ${opportunityId}`);
    } catch (error) {
      console.error('Error triggering closure automation:', error);
    }
  }
}

export const crmOpportunityService = new CRMOpportunityService();