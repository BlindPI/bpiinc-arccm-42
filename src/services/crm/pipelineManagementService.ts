
import { supabase } from '@/integrations/supabase/client';

export interface PipelineStage {
  id: string;
  stage_name: string;
  stage_description?: string;
  stage_order: number;
  stage_probability: number;
  stage_color?: string;
  is_active: boolean;
  required_fields?: string[];
  created_at: string;
  updated_at: string;
}

export class PipelineManagementService {
  static async getPipelineStages(): Promise<PipelineStage[]> {
    try {
      const { data, error } = await supabase
        .from('crm_pipeline_stages')
        .select('*')
        .order('stage_order');

      if (error) throw error;
      return data || [];
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
      return data;
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
      return data;
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      return null;
    }
  }

  static async deletePipelineStage(id: string): Promise<boolean> {
    try {
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
}
