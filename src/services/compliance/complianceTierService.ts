// File: src/services/compliance/complianceTierService.ts

import { supabase } from '@/lib/supabase';

export interface UIComplianceTierInfo {
  user_id: string;
  role: 'AP' | 'IC' | 'IP' | 'IT';
  tier: 'basic' | 'robust';
  template_name: string;
  description: string;
  requirements_count: number;
  completed_requirements: number;
  completion_percentage: number;
  ui_config: {
    theme_color: string;
    icon: string;
    dashboard_layout: 'grid' | 'list' | 'kanban' | 'timeline';
    welcome_message?: string;
    progress_visualization?: string;
    quick_actions?: string[];
  };
  next_requirement: {
    id: string;
    name: string;
    due_date: string;
    type: string;
  } | null;
  can_advance_tier: boolean;
  advancement_blocked_reason?: string;
}

export interface TierSwitchResult {
  success: boolean;
  message?: string;
  requirements_affected?: number;
  old_tier?: string;
  new_tier?: string;
}

export class ComplianceTierService {
  // UI-specific method for dashboard display (From Currentplan1.5.md)
  static async getUIComplianceTierInfo(userId: string): Promise<UIComplianceTierInfo> {
    try {
      const basicInfo = await this.getUserTierInfo(userId);
      
      // Fetch additional UI-specific data
      const { data: template } = await supabase
        .from('compliance_templates')
        .select('ui_config, icon_name, color_scheme')
        .eq('role', basicInfo.role)
        .eq('tier', basicInfo.tier)
        .single();
      
      // Get next due requirement
      const { data: nextReq } = await supabase
        .from('user_compliance_records')
        .select(`
          requirement_id,
          compliance_requirements!inner(
            id,
            name,
            requirement_type,
            due_days_from_assignment
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at')
        .limit(1)
        .single();
      
      return {
        ...basicInfo,
        ui_config: template?.ui_config || this.getDefaultUIConfig(),
        next_requirement: nextReq ? {
          id: nextReq.requirement_id,
          name: nextReq.compliance_requirements.name,
          due_date: this.calculateDueDate(nextReq),
          type: nextReq.compliance_requirements.requirement_type
        } : null,
        can_advance_tier: basicInfo.tier === 'basic' && basicInfo.completion_percentage >= 80,
        advancement_blocked_reason: this.getAdvancementBlockedReason(basicInfo)
      };
    } catch (error) {
      console.error('Error getting UI tier info:', error);
      throw error;
    }
  }
  
  // Core tier info method
  static async getUserTierInfo(userId: string): Promise<UIComplianceTierInfo> {
    try {
      // Get user profile with tier info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, compliance_tier, display_name')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      if (!profile) throw new Error('User profile not found');
      
      // Get template info
      const { data: template, error: templateError } = await supabase
        .from('compliance_templates')
        .select('*')
        .eq('role', profile.role)
        .eq('tier', profile.compliance_tier)
        .single();
      
      if (templateError) throw templateError;
      if (!template) throw new Error('Template not found');
      
      // Get user's compliance records with requirement details
      const { data: records, error: recordsError } = await supabase
        .from('user_compliance_records')
        .select(`
          id,
          status,
          created_at,
          compliance_requirements!inner(
            id,
            name,
            requirement_type,
            due_days_from_assignment,
            points_value
          )
        `)
        .eq('user_id', userId);
      
      if (recordsError) throw recordsError;
      
      // Calculate completion metrics
      const totalRequirements = records?.length || 0;
      const completedRequirements = records?.filter(r => r.status === 'approved').length || 0;
      const completionPercentage = totalRequirements > 0 
        ? Math.round((completedRequirements / totalRequirements) * 100) 
        : 0;
      
      return {
        user_id: userId,
        role: profile.role,
        tier: profile.compliance_tier,
        template_name: template.template_name,
        description: template.description,
        requirements_count: totalRequirements,
        completed_requirements: completedRequirements,
        completion_percentage: completionPercentage,
        ui_config: template.ui_config || this.getDefaultUIConfig(),
        next_requirement: null, // Will be populated by getUIComplianceTierInfo
        can_advance_tier: false, // Will be calculated by getUIComplianceTierInfo
      };
    } catch (error) {
      console.error('Error getting user tier info:', error);
      throw error;
    }
  }
  
  // Switch user's compliance tier (From Currentplan1.5.md)
  static async switchUserTier(
    userId: string,
    newTier: 'basic' | 'robust',
    changedBy: string,
    reason: string = 'User requested tier change'
  ): Promise<TierSwitchResult> {
    try {
      // Get current user info
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, compliance_tier')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;
      if (!currentProfile) throw new Error('User not found');
      
      const oldTier = currentProfile.compliance_tier;
      
      // Validate tier switch
      if (oldTier === newTier) {
        return {
          success: false,
          message: 'User is already in the requested tier'
        };
      }
      
      // Check role-specific restrictions
      if (currentProfile.role === 'IC' && newTier === 'basic') {
        return {
          success: false,
          message: 'Certified instructors must maintain comprehensive tier'
        };
      }
      
      // Begin transaction-like operations
      
      // 1. Update user's tier
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          compliance_tier: newTier,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (updateError) throw updateError;
      
      // 2. Create history record
      const { error: historyError } = await supabase
        .from('compliance_tier_history')
        .insert({
          user_id: userId,
          old_tier: oldTier,
          new_tier: newTier,
          changed_by: changedBy,
          change_reason: reason,
          requirements_affected: 0, // Will be updated after requirement assignment
          created_at: new Date().toISOString()
        });
      
      if (historyError) throw historyError;
      
      // 3. Assign new tier requirements
      const requirementsAffected = await this.assignTierRequirements(
        userId,
        currentProfile.role,
        newTier
      );
      
      // 4. Update history with requirements affected count
      const { error: updateHistoryError } = await supabase
        .from('compliance_tier_history')
        .update({ requirements_affected: requirementsAffected })
        .eq('user_id', userId)
        .eq('new_tier', newTier)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (updateHistoryError) {
        console.warn('Failed to update history with requirements count:', updateHistoryError);
      }
      
      // 5. Log activity
      await this.logComplianceActivity(userId, {
        action: 'tier_switched',
        metadata: {
          oldTier,
          newTier,
          changedBy,
          reason,
          requirementsAffected
        }
      });
      
      return {
        success: true,
        message: `Successfully switched from ${oldTier} to ${newTier} tier`,
        requirements_affected: requirementsAffected,
        old_tier: oldTier,
        new_tier: newTier
      };
    } catch (error) {
      console.error('Error switching user tier:', error);
      return {
        success: false,
        message: `Failed to switch tier: ${error.message}`
      };
    }
  }
  
  // Assign requirements based on role and tier
  static async assignTierRequirements(
    userId: string,
    role: string,
    tier: string
  ): Promise<number> {
    try {
      // Get requirements for the role/tier combination
      const { data: requirements, error: reqError } = await supabase
        .from('compliance_requirements')
        .select(`
          id,
          name,
          requirement_type,
          is_mandatory,
          due_days_from_assignment,
          compliance_templates!inner(role, tier)
        `)
        .eq('compliance_templates.role', role)
        .eq('compliance_templates.tier', tier);
      
      if (reqError) throw reqError;
      
      if (!requirements || requirements.length === 0) {
        console.warn(`No requirements found for role ${role}, tier ${tier}`);
        return 0;
      }
      
      // Remove existing requirements for this user (clean slate)
      const { error: deleteError } = await supabase
        .from('user_compliance_records')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      
      // Create new compliance records
      const newRecords = requirements.map(req => ({
        user_id: userId,
        requirement_id: req.id,
        status: 'pending',
        submission_data: {},
        ui_state: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: insertError } = await supabase
        .from('user_compliance_records')
        .insert(newRecords);
      
      if (insertError) throw insertError;
      
      return requirements.length;
    } catch (error) {
      console.error('Error assigning tier requirements:', error);
      throw error;
    }
  }
  
  // Real-time subscription for tier changes (From Currentplan1.5.md)
  static subscribeToTierChanges(
    userId: string,
    callback: (update: UIComplianceTierInfo) => void
  ): any {
    return supabase
      .channel(`tier_changes_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${userId}`
      }, async () => {
        try {
          const updated = await this.getUIComplianceTierInfo(userId);
          callback(updated);
        } catch (error) {
          console.error('Error fetching updated tier info:', error);
        }
      })
      .subscribe();
  }
  
  // Helper methods
  private static calculateDueDate(record: any): string {
    const dueDays = record.compliance_requirements?.due_days_from_assignment || 30;
    const createdDate = new Date(record.created_at || new Date());
    const dueDate = new Date(createdDate.getTime() + (dueDays * 24 * 60 * 60 * 1000));
    return dueDate.toISOString();
  }
  
  private static getDefaultUIConfig() {
    return {
      theme_color: '#3B82F6',
      icon: 'Award',
      dashboard_layout: 'grid' as const,
      welcome_message: 'Welcome to your compliance dashboard',
      progress_visualization: 'circular',
      quick_actions: ['view_requirements', 'upload_document', 'contact_support']
    };
  }
  
  private static getAdvancementBlockedReason(basicInfo: any): string | undefined {
    if (basicInfo.role === 'IC') {
      return 'Certified instructors must maintain comprehensive tier';
    }
    
    if (basicInfo.tier === 'basic' && basicInfo.completion_percentage < 80) {
      return `Complete ${80 - basicInfo.completion_percentage}% more requirements to advance`;
    }
    
    return undefined;
  }
  
  private static async logComplianceActivity(userId: string, activity: any): Promise<void> {
    try {
      await supabase
        .from('compliance_activity_log')
        .insert({
          user_id: userId,
          action: activity.action,
          requirement_id: activity.requirementId || null,
          metadata: activity.metadata || {},
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.warn('Failed to log compliance activity:', error);
      // Don't throw - activity logging failure shouldn't break main functionality
    }
  }
}