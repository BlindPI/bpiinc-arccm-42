import { supabase } from '@/integrations/supabase/client';

export interface PipelineStage {
  id: string;
  stage_name: string;
  stage_order: number;
  probability_percentage: number;
  is_active: boolean;
  stage_color?: string;
  stage_description?: string;
  required_fields?: string[];
  automation_rules?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PipelineMetrics {
  stage_id: string;
  stage_name: string;
  opportunity_count: number;
  total_value: number;
  average_value: number;
  conversion_rate: number;
  average_time_in_stage: number;
  win_rate: number;
}

export interface StageTransition {
  id: string;
  opportunity_id: string;
  from_stage_id: string;
  to_stage_id: string;
  transition_date: string;
  transition_reason?: string;
  user_id?: string;
  notes?: string;
}

export class PipelineStageService {
  // Get all pipeline stages
  static async getPipelineStages(activeOnly: boolean = false): Promise<PipelineStage[]> {
    try {
      let query = supabase
        .from('crm_pipeline_stages')
        .select('*')
        .order('stage_order', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(stage => ({
        id: stage.id,
        stage_name: stage.stage_name,
        stage_order: stage.stage_order,
        probability_percentage: stage.probability_percentage,
        is_active: stage.is_active,
        stage_color: stage.stage_color,
        stage_description: stage.stage_description,
        required_fields: stage.required_fields,
        automation_rules: stage.automation_rules,
        created_at: stage.created_at,
        updated_at: stage.updated_at
      }));
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      return [];
    }
  }

  // Create pipeline stage
  static async createPipelineStage(stage: Omit<PipelineStage, 'id' | 'created_at' | 'updated_at'>): Promise<PipelineStage | null> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .insert({
          stage_name: stage.stage_name,
          stage_order: stage.stage_order,
          probability_percentage: stage.probability_percentage,
          is_active: stage.is_active,
          stage_color: stage.stage_color,
          stage_description: stage.stage_description,
          required_fields: stage.required_fields,
          automation_rules: stage.automation_rules
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        stage_name: data.stage_name,
        stage_order: data.stage_order,
        probability_percentage: data.probability_percentage,
        is_active: data.is_active,
        stage_color: data.stage_color,
        stage_description: data.stage_description,
        required_fields: data.required_fields,
        automation_rules: data.automation_rules,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating pipeline stage:', error);
      return null;
    }
  }

  // Update pipeline stage
  static async updatePipelineStage(id: string, updates: Partial<PipelineStage>): Promise<PipelineStage | null> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .update({
          ...(updates.stage_name && { stage_name: updates.stage_name }),
          ...(updates.stage_order !== undefined && { stage_order: updates.stage_order }),
          ...(updates.probability_percentage !== undefined && { probability_percentage: updates.probability_percentage }),
          ...(updates.is_active !== undefined && { is_active: updates.is_active }),
          ...(updates.stage_color && { stage_color: updates.stage_color }),
          ...(updates.stage_description && { stage_description: updates.stage_description }),
          ...(updates.required_fields && { required_fields: updates.required_fields }),
          ...(updates.automation_rules && { automation_rules: updates.automation_rules }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        stage_name: data.stage_name,
        stage_order: data.stage_order,
        probability_percentage: data.probability_percentage,
        is_active: data.is_active,
        stage_color: data.stage_color,
        stage_description: data.stage_description,
        required_fields: data.required_fields,
        automation_rules: data.automation_rules,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      return null;
    }
  }

  // Delete pipeline stage
  static async deletePipelineStage(id: string): Promise<boolean> {
    try {
      // First check if there are opportunities in this stage
      const { data: opportunities, error: checkError } = await supabase
        .from('crm_opportunities')
        .select('id')
        .eq('pipeline_stage_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (opportunities && opportunities.length > 0) {
        throw new Error('Cannot delete stage with existing opportunities. Move opportunities to another stage first.');
      }

      const { error } = await supabase
        .from('crm_pipeline_stages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting pipeline stage:', error);
      return false;
    }
  }

  // Reorder pipeline stages
  static async reorderPipelineStages(stageOrders: Array<{ id: string; stage_order: number }>): Promise<boolean> {
    try {
      const updates = stageOrders.map(({ id, stage_order }) =>
        supabase
          .from('crm_pipeline_stages')
          .update({ stage_order, updated_at: new Date().toISOString() })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      
      // Check if any updates failed
      const hasError = results.some(result => result.error);
      if (hasError) {
        throw new Error('Failed to reorder some stages');
      }

      return true;
    } catch (error) {
      console.error('Error reordering pipeline stages:', error);
      return false;
    }
  }

  // Get pipeline metrics using database function
  static async getPipelineMetrics(): Promise<PipelineMetrics[]> {
    try {
      const { data, error } = await supabase.rpc('get_pipeline_metrics');
      if (error) throw error;

      return (data || []).map((metric: any) => ({
        stage_id: metric.stage_id,
        stage_name: metric.stage_name,
        opportunity_count: metric.opportunity_count || 0,
        total_value: metric.total_value || 0,
        average_value: metric.average_value || 0,
        conversion_rate: metric.conversion_rate || 0,
        average_time_in_stage: metric.average_time_in_stage || 0,
        win_rate: metric.win_rate || 0
      }));
    } catch (error) {
      console.error('Error fetching pipeline metrics:', error);
      return [];
    }
  }

  // Get stage transitions for analysis
  static async getStageTransitions(filters?: {
    opportunity_id?: string;
    from_stage_id?: string;
    to_stage_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<StageTransition[]> {
    try {
      let query = supabase
        .from('crm_stage_transitions')
        .select('*')
        .order('transition_date', { ascending: false });

      if (filters?.opportunity_id) {
        query = query.eq('opportunity_id', filters.opportunity_id);
      }
      if (filters?.from_stage_id) {
        query = query.eq('from_stage_id', filters.from_stage_id);
      }
      if (filters?.to_stage_id) {
        query = query.eq('to_stage_id', filters.to_stage_id);
      }
      if (filters?.date_from) {
        query = query.gte('transition_date', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('transition_date', filters.date_to);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(transition => ({
        id: transition.id,
        opportunity_id: transition.opportunity_id,
        from_stage_id: transition.from_stage_id,
        to_stage_id: transition.to_stage_id,
        transition_date: transition.transition_date,
        transition_reason: transition.transition_reason,
        user_id: transition.user_id,
        notes: transition.notes
      }));
    } catch (error) {
      console.error('Error fetching stage transitions:', error);
      return [];
    }
  }

  // Move opportunity to different stage
  static async moveOpportunityToStage(
    opportunityId: string,
    fromStageId: string,
    toStageId: string,
    reason?: string,
    notes?: string,
    userId?: string
  ): Promise<boolean> {
    try {
      // Start a transaction-like operation
      // 1. Update the opportunity stage
      const { error: updateError } = await supabase
        .from('crm_opportunities')
        .update({
          pipeline_stage_id: toStageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunityId);

      if (updateError) throw updateError;

      // 2. Record the stage transition
      const { error: transitionError } = await supabase
        .from('crm_stage_transitions')
        .insert({
          opportunity_id: opportunityId,
          from_stage_id: fromStageId,
          to_stage_id: toStageId,
          transition_date: new Date().toISOString(),
          transition_reason: reason,
          notes: notes,
          user_id: userId
        });

      if (transitionError) throw transitionError;

      return true;
    } catch (error) {
      console.error('Error moving opportunity to stage:', error);
      return false;
    }
  }

  // Get stage conversion funnel data
  static async getStageConversionFunnel(): Promise<Array<{
    stage_name: string;
    stage_order: number;
    opportunity_count: number;
    total_value: number;
    conversion_rate: number;
  }>> {
    try {
      const stages = await this.getPipelineStages(true);
      const metrics = await this.getPipelineMetrics();

      return stages.map(stage => {
        const metric = metrics.find(m => m.stage_id === stage.id);
        return {
          stage_name: stage.stage_name,
          stage_order: stage.stage_order,
          opportunity_count: metric?.opportunity_count || 0,
          total_value: metric?.total_value || 0,
          conversion_rate: metric?.conversion_rate || 0
        };
      }).sort((a, b) => a.stage_order - b.stage_order);
    } catch (error) {
      console.error('Error getting stage conversion funnel:', error);
      return [];
    }
  }

  // Get stage performance summary
  static async getStagePerformanceSummary() {
    try {
      const metrics = await this.getPipelineMetrics();
      
      const summary = {
        total_opportunities: 0,
        total_pipeline_value: 0,
        average_deal_size: 0,
        overall_conversion_rate: 0,
        fastest_stage: null as { stage_name: string; avg_time: number } | null,
        slowest_stage: null as { stage_name: string; avg_time: number } | null,
        highest_value_stage: null as { stage_name: string; total_value: number } | null,
        bottleneck_stage: null as { stage_name: string; opportunity_count: number } | null
      };

      if (metrics.length === 0) return summary;

      // Calculate totals
      summary.total_opportunities = metrics.reduce((sum, m) => sum + m.opportunity_count, 0);
      summary.total_pipeline_value = metrics.reduce((sum, m) => sum + m.total_value, 0);
      summary.average_deal_size = summary.total_opportunities > 0 
        ? summary.total_pipeline_value / summary.total_opportunities 
        : 0;

      // Calculate overall conversion rate (weighted average)
      const totalWeightedConversion = metrics.reduce((sum, m) => 
        sum + (m.conversion_rate * m.opportunity_count), 0);
      summary.overall_conversion_rate = summary.total_opportunities > 0 
        ? totalWeightedConversion / summary.total_opportunities 
        : 0;

      // Find fastest and slowest stages
      const stagesWithTime = metrics.filter(m => m.average_time_in_stage > 0);
      if (stagesWithTime.length > 0) {
        const fastest = stagesWithTime.reduce((min, m) => 
          m.average_time_in_stage < min.average_time_in_stage ? m : min);
        const slowest = stagesWithTime.reduce((max, m) => 
          m.average_time_in_stage > max.average_time_in_stage ? m : max);

        summary.fastest_stage = {
          stage_name: fastest.stage_name,
          avg_time: fastest.average_time_in_stage
        };
        summary.slowest_stage = {
          stage_name: slowest.stage_name,
          avg_time: slowest.average_time_in_stage
        };
      }

      // Find highest value stage
      const highestValue = metrics.reduce((max, m) => 
        m.total_value > max.total_value ? m : max);
      summary.highest_value_stage = {
        stage_name: highestValue.stage_name,
        total_value: highestValue.total_value
      };

      // Find bottleneck stage (highest opportunity count with low conversion)
      const bottleneck = metrics
        .filter(m => m.opportunity_count > 0)
        .sort((a, b) => {
          // Sort by opportunity count desc, then conversion rate asc
          if (b.opportunity_count !== a.opportunity_count) {
            return b.opportunity_count - a.opportunity_count;
          }
          return a.conversion_rate - b.conversion_rate;
        })[0];

      if (bottleneck) {
        summary.bottleneck_stage = {
          stage_name: bottleneck.stage_name,
          opportunity_count: bottleneck.opportunity_count
        };
      }

      return summary;
    } catch (error) {
      console.error('Error getting stage performance summary:', error);
      return {
        total_opportunities: 0,
        total_pipeline_value: 0,
        average_deal_size: 0,
        overall_conversion_rate: 0,
        fastest_stage: null,
        slowest_stage: null,
        highest_value_stage: null,
        bottleneck_stage: null
      };
    }
  }

  // Get default pipeline stages for new setups
  static getDefaultPipelineStages(): Omit<PipelineStage, 'id' | 'created_at' | 'updated_at'>[] {
    return [
      {
        stage_name: 'Lead',
        stage_order: 1,
        probability_percentage: 10,
        is_active: true,
        stage_color: '#94a3b8',
        stage_description: 'Initial contact made, qualifying opportunity',
        required_fields: ['contact_name', 'company_name', 'email'],
        automation_rules: {
          auto_assign: true,
          send_welcome_email: true
        }
      },
      {
        stage_name: 'Qualified',
        stage_order: 2,
        probability_percentage: 25,
        is_active: true,
        stage_color: '#3b82f6',
        stage_description: 'Lead has been qualified and shows genuine interest',
        required_fields: ['budget_range', 'timeline', 'decision_maker'],
        automation_rules: {
          create_follow_up_task: true
        }
      },
      {
        stage_name: 'Proposal',
        stage_order: 3,
        probability_percentage: 50,
        is_active: true,
        stage_color: '#f59e0b',
        stage_description: 'Proposal has been sent to the prospect',
        required_fields: ['proposal_sent_date', 'proposal_value'],
        automation_rules: {
          schedule_follow_up: true,
          notify_manager: true
        }
      },
      {
        stage_name: 'Negotiation',
        stage_order: 4,
        probability_percentage: 75,
        is_active: true,
        stage_color: '#ef4444',
        stage_description: 'In active negotiation with the prospect',
        required_fields: ['negotiation_notes', 'expected_close_date'],
        automation_rules: {
          escalate_to_manager: true
        }
      },
      {
        stage_name: 'Closed Won',
        stage_order: 5,
        probability_percentage: 100,
        is_active: true,
        stage_color: '#10b981',
        stage_description: 'Deal has been successfully closed',
        required_fields: ['contract_signed_date', 'final_value'],
        automation_rules: {
          create_onboarding_tasks: true,
          send_welcome_package: true,
          update_revenue_records: true
        }
      },
      {
        stage_name: 'Closed Lost',
        stage_order: 6,
        probability_percentage: 0,
        is_active: true,
        stage_color: '#6b7280',
        stage_description: 'Deal was not successful',
        required_fields: ['loss_reason', 'competitor'],
        automation_rules: {
          schedule_follow_up_in_future: true,
          add_to_nurture_campaign: true
        }
      }
    ];
  }
}