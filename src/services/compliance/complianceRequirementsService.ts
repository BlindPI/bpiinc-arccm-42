
import { supabase } from '@/integrations/supabase/client';
import { DatabaseAdapters } from '@/utils/database-adapters';

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: 'basic' | 'robust';
  requirement_type: string;
  validation_rules: any;
  due_date?: string;
  status: string;
  ui_component?: string;
  external_url?: string;
  external_system?: string;
  metadata?: any;
}

export class ComplianceRequirementsService {
  // Get requirement by ID with proper database field mapping
  static async getRequirementById(requirementId: string): Promise<ComplianceRequirement | null> {
    try {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('*')
        .eq('id', requirementId)
        .single();

      if (error || !data) {
        console.error('Error fetching requirement:', error);
        return null;
      }

      return DatabaseAdapters.adaptComplianceRequirement(data);
    } catch (error) {
      console.error('Service error:', error);
      return null;
    }
  }

  // Get requirements by user ID with role filtering
  static async getRequirementsByUserId(userId: string, role?: string): Promise<ComplianceRequirement[]> {
    try {
      let query = supabase
        .from('compliance_requirements')
        .select(`
          *,
          compliance_templates!inner(role, tier)
        `);

      if (role) {
        query = query.eq('compliance_templates.role', role);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching requirements:', error);
        return [];
      }

      return (data || []).map(req => DatabaseAdapters.adaptComplianceRequirement(req));
    } catch (error) {
      console.error('Service error:', error);
      return [];
    }
  }

  // Update requirement status
  static async updateRequirementStatus(requirementId: string, status: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_compliance_records')
        .update({ 
          current_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('requirement_id', requirementId)
        .eq('user_id', userId);

      return !error;
    } catch (error) {
      console.error('Error updating requirement status:', error);
      return false;
    }
  }

  // Create requirement for user (fixed method name)
  static async assignRequirementToUser(userId: string, requirementId: string, dueDate?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_compliance_records')
        .insert({
          user_id: userId,
          requirement_id: requirementId,
          current_status: 'assigned',
          due_date: dueDate,
          created_at: new Date().toISOString()
        });

      return !error;
    } catch (error) {
      console.error('Error assigning requirement:', error);
      return false;
    }
  }
}
