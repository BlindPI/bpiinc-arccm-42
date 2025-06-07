
import { supabase } from '@/integrations/supabase/client';
import type { PipelineStage } from '@/types/crm';

export class PipelineStageService {
  static async getPipelineStages(): Promise<PipelineStage[]> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('*')
        .order('stage_order', { ascending: true });

      if (error) throw error;

      return (data || []).map(stage => ({
        id: stage.id,
        stage_name: stage.stage_name,
        stage_description: stage.stage_description,
        stage_order: stage.stage_order,
        stage_probability: stage.stage_probability,
        probability_percentage: stage.probability_percentage || stage.stage_probability,
        is_closed: stage.is_closed,
        is_active: stage.is_active,
        stage_color: stage.stage_color,
        pipeline_type: stage.pipeline_type,
        required_fields: stage.required_fields,
        automation_rules: stage.automation_rules || {},
        created_at: stage.created_at,
        updated_at: stage.updated_at
      }));
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      return [];
    }
  }

  static async createPipelineStage(stage: Omit<PipelineStage, 'id' | 'created_at' | 'updated_at'>): Promise<PipelineStage | null> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .insert(stage)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        stage_name: data.stage_name,
        stage_description: data.stage_description,
        stage_order: data.stage_order,
        stage_probability: data.stage_probability,
        probability_percentage: data.probability_percentage || data.stage_probability,
        is_closed: data.is_closed,
        is_active: data.is_active,
        stage_color: data.stage_color,
        pipeline_type: data.pipeline_type,
        required_fields: data.required_fields,
        automation_rules: data.automation_rules || {},
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error creating pipeline stage:', error);
      return null;
    }
  }

  static async updatePipelineStage(id: string, updates: Partial<PipelineStage>): Promise<PipelineStage | null> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        stage_name: data.stage_name,
        stage_description: data.stage_description,
        stage_order: data.stage_order,
        stage_probability: data.stage_probability,
        probability_percentage: data.probability_percentage || data.stage_probability,
        is_closed: data.is_closed,
        is_active: data.is_active,
        stage_color: data.stage_color,
        pipeline_type: data.pipeline_type,
        required_fields: data.required_fields,
        automation_rules: data.automation_rules || {},
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      return null;
    }
  }
}
