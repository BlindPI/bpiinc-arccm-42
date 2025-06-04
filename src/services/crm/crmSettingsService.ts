import { supabase } from '@/integrations/supabase/client';
import { 
  CRMServiceResponse, 
  PipelineStage,
  LeadScoringRule,
  AssignmentRule
} from '@/types/crm';

export class CRMSettingsService {
  /**
   * Pipeline Configuration Methods
   */
  
  async getPipelineStages(): Promise<CRMServiceResponse<PipelineStage[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('*')
        .order('stage_order', { ascending: true });

      if (error) {
        console.error('Error fetching pipeline stages:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getPipelineStages:', error);
      return { success: false, error: 'Failed to fetch pipeline stages' };
    }
  }

  async createPipelineStage(stageData: {
    stage_name: string;
    stage_description?: string;
    stage_order: number;
    probability_percentage: number;
    is_active: boolean;
    stage_color?: string;
  }): Promise<CRMServiceResponse<PipelineStage>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User must be authenticated' };
      }

      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .insert({
          ...stageData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating pipeline stage:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createPipelineStage:', error);
      return { success: false, error: 'Failed to create pipeline stage' };
    }
  }

  async updatePipelineStage(
    stageId: string, 
    updates: Partial<PipelineStage>
  ): Promise<CRMServiceResponse<PipelineStage>> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId)
        .select()
        .single();

      if (error) {
        console.error('Error updating pipeline stage:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updatePipelineStage:', error);
      return { success: false, error: 'Failed to update pipeline stage' };
    }
  }

  async deletePipelineStage(stageId: string): Promise<CRMServiceResponse<void>> {
    try {
      // Check if stage is in use
      const { data: opportunities, error: checkError } = await supabase
        .from('crm_opportunities')
        .select('id')
        .eq('stage', stageId)
        .limit(1);

      if (checkError) {
        return { success: false, error: checkError.message };
      }

      if (opportunities && opportunities.length > 0) {
        return { success: false, error: 'Cannot delete stage that is currently in use by opportunities' };
      }

      const { error } = await supabase
        .from('crm_pipeline_stages')
        .delete()
        .eq('id', stageId);

      if (error) {
        console.error('Error deleting pipeline stage:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deletePipelineStage:', error);
      return { success: false, error: 'Failed to delete pipeline stage' };
    }
  }

  /**
   * Lead Scoring Rules Methods
   */
  
  async getLeadScoringRules(): Promise<CRMServiceResponse<LeadScoringRule[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) {
        console.error('Error fetching lead scoring rules:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getLeadScoringRules:', error);
      return { success: false, error: 'Failed to fetch lead scoring rules' };
    }
  }

  async createLeadScoringRule(ruleData: {
    rule_name: string;
    rule_description?: string;
    field_name: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
    field_value: string;
    score_points: number;
    priority: number;
    is_active: boolean;
  }): Promise<CRMServiceResponse<LeadScoringRule>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User must be authenticated' };
      }

      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .insert({
          ...ruleData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lead scoring rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createLeadScoringRule:', error);
      return { success: false, error: 'Failed to create lead scoring rule' };
    }
  }

  async updateLeadScoringRule(
    ruleId: string, 
    updates: Partial<LeadScoringRule>
  ): Promise<CRMServiceResponse<LeadScoringRule>> {
    try {
      const { data, error } = await supabase
        .from('crm_lead_scoring_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead scoring rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateLeadScoringRule:', error);
      return { success: false, error: 'Failed to update lead scoring rule' };
    }
  }

  async deleteLeadScoringRule(ruleId: string): Promise<CRMServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('crm_lead_scoring_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        console.error('Error deleting lead scoring rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteLeadScoringRule:', error);
      return { success: false, error: 'Failed to delete lead scoring rule' };
    }
  }

  /**
   * Assignment Rules Methods
   */
  
  async getAssignmentRules(): Promise<CRMServiceResponse<AssignmentRule[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .select('*')
        .order('priority', { ascending: true });

      if (error) {
        console.error('Error fetching assignment rules:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error in getAssignmentRules:', error);
      return { success: false, error: 'Failed to fetch assignment rules' };
    }
  }

  async createAssignmentRule(ruleData: {
    rule_name: string;
    rule_description?: string;
    criteria: Record<string, any>;
    assignment_type: 'round_robin' | 'territory_based' | 'skill_based' | 'workload_based';
    assigned_users: string[];
    priority: number;
    is_active: boolean;
  }): Promise<CRMServiceResponse<AssignmentRule>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User must be authenticated' };
      }

      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .insert({
          ...ruleData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating assignment rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createAssignmentRule:', error);
      return { success: false, error: 'Failed to create assignment rule' };
    }
  }

  async updateAssignmentRule(
    ruleId: string, 
    updates: Partial<AssignmentRule>
  ): Promise<CRMServiceResponse<AssignmentRule>> {
    try {
      const { data, error } = await supabase
        .from('crm_assignment_rules')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)
        .select()
        .single();

      if (error) {
        console.error('Error updating assignment rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateAssignmentRule:', error);
      return { success: false, error: 'Failed to update assignment rule' };
    }
  }

  async deleteAssignmentRule(ruleId: string): Promise<CRMServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('crm_assignment_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        console.error('Error deleting assignment rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteAssignmentRule:', error);
      return { success: false, error: 'Failed to delete assignment rule' };
    }
  }

  /**
   * Test and Apply Rules
   */
  
  async testLeadScoring(leadData: Record<string, any>): Promise<CRMServiceResponse<{
    total_score: number;
    applied_rules: Array<{
      rule_name: string;
      points: number;
      reason: string;
    }>;
  }>> {
    try {
      const rulesResult = await this.getLeadScoringRules();
      if (!rulesResult.success) {
        return { success: false, error: rulesResult.error };
      }

      const rules = rulesResult.data?.filter(rule => rule.is_active) || [];
      const appliedRules: Array<{ rule_name: string; points: number; reason: string; }> = [];
      let totalScore = 0;

      for (const rule of rules) {
        const fieldValue = leadData[rule.field_name];
        let ruleMatches = false;
        let reason = '';

        switch (rule.operator) {
          case 'equals':
            ruleMatches = fieldValue === rule.field_value;
            reason = `${rule.field_name} equals "${rule.field_value}"`;
            break;
          case 'contains':
            ruleMatches = String(fieldValue).toLowerCase().includes(String(rule.field_value).toLowerCase());
            reason = `${rule.field_name} contains "${rule.field_value}"`;
            break;
          case 'greater_than':
            ruleMatches = Number(fieldValue) > Number(rule.field_value);
            reason = `${rule.field_name} (${fieldValue}) > ${rule.field_value}`;
            break;
          case 'less_than':
            ruleMatches = Number(fieldValue) < Number(rule.field_value);
            reason = `${rule.field_name} (${fieldValue}) < ${rule.field_value}`;
            break;
          case 'in_range':
            const [min, max] = rule.field_value.split(',').map(Number);
            ruleMatches = Number(fieldValue) >= min && Number(fieldValue) <= max;
            reason = `${rule.field_name} (${fieldValue}) in range ${min}-${max}`;
            break;
        }

        if (ruleMatches) {
          appliedRules.push({
            rule_name: rule.rule_name,
            points: rule.score_points,
            reason
          });
          totalScore += rule.score_points;
        }
      }

      return {
        success: true,
        data: {
          total_score: totalScore,
          applied_rules: appliedRules
        }
      };
    } catch (error) {
      console.error('Error in testLeadScoring:', error);
      return { success: false, error: 'Failed to test lead scoring' };
    }
  }

  async testAssignmentRules(leadData: Record<string, any>): Promise<CRMServiceResponse<{
    assigned_user: string | null;
    matched_rule: string | null;
    reason: string;
  }>> {
    try {
      const rulesResult = await this.getAssignmentRules();
      if (!rulesResult.success) {
        return { success: false, error: rulesResult.error };
      }

      const rules = rulesResult.data?.filter(rule => rule.is_active) || [];

      for (const rule of rules) {
        let ruleMatches = true;

        // Check if lead data matches rule criteria
        for (const [field, expectedValue] of Object.entries(rule.criteria)) {
          if (leadData[field] !== expectedValue) {
            ruleMatches = false;
            break;
          }
        }

        if (ruleMatches && rule.assigned_users.length > 0) {
          // Simple round-robin assignment (in real implementation, this would be more sophisticated)
          const assignedUser = rule.assigned_users[0];
          
          return {
            success: true,
            data: {
              assigned_user: assignedUser,
              matched_rule: rule.rule_name,
              reason: `Matched rule "${rule.rule_name}" - ${rule.assignment_type} assignment`
            }
          };
        }
      }

      return {
        success: true,
        data: {
          assigned_user: null,
          matched_rule: null,
          reason: 'No assignment rules matched'
        }
      };
    } catch (error) {
      console.error('Error in testAssignmentRules:', error);
      return { success: false, error: 'Failed to test assignment rules' };
    }
  }
}

export const crmSettingsService = new CRMSettingsService();