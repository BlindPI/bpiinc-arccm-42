// File: src/services/compliance/complianceTierService.ts

import { supabase } from '@/integrations/supabase/client';

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
      
      // Fetch additional UI-specific data - using type assertion for new schema
      const { data: template, error: templateError } = await (supabase as any)
        .from('compliance_templates')
        .select('ui_config, icon_name, color_scheme')
        .eq('role', basicInfo.role)
        .eq('tier', basicInfo.tier)
        .single();
      
      if (templateError) {
        console.warn('Template not found, using defaults:', templateError);
      }
      
      // Get next due requirement - using type assertion for new schema
      const { data: nextReq, error: nextReqError } = await (supabase as any)
        .from('user_compliance_records')
        .select(`
          requirement_id,
          due_date,
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
        .maybeSingle();
      
      if (nextReqError) {
        console.warn('Could not fetch next requirement:', nextReqError);
      }
      
      return {
        ...basicInfo,
        ui_config: template?.ui_config || this.getDefaultUIConfig(),
        next_requirement: nextReq ? {
          id: nextReq.requirement_id,
          name: nextReq.compliance_requirements.name,
          due_date: nextReq.due_date || this.calculateDueDate(nextReq),
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
      console.log('🔧 DEBUG: getUserTierInfo called for user:', userId);
      
      // Get user profile with tier info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, compliance_tier, display_name')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('🔥 ERROR: Profile fetch failed:', profileError);
        throw profileError;
      }
      if (!profile) throw new Error('User profile not found');
      
      console.log('🔧 DEBUG: Profile found:', { role: profile.role, tier: profile.compliance_tier });
      
      // Ensure tier has a fallback value
      const userTier = profile.compliance_tier || 'basic';
      
      // Get template info - using type assertion for new schema
      const { data: template, error: templateError } = await (supabase as any)
        .from('compliance_templates')
        .select('*')
        .eq('role', profile.role)
        .eq('tier', userTier)
        .maybeSingle();
      
      if (templateError) {
        console.error('🔥 ERROR: Template fetch failed:', templateError);
        // Continue with fallback instead of throwing
      }
      
      // Use template data if available, otherwise fallback
      const templateData = template || {
        template_name: `${profile.role} - ${userTier}`,
        description: `Default ${userTier} tier for ${profile.role}`,
        ui_config: this.getDefaultUIConfig()
      };
      
      console.log('🔧 DEBUG: Template data:', templateData);
      
      // Get user's compliance records with requirement details - using type assertion
      const { data: records, error: recordsError } = await (supabase as any)
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
      
      if (recordsError) {
        console.error('🔥 ERROR: Records fetch failed:', recordsError);
        // Continue with empty records instead of throwing
      }
      
      // Calculate completion metrics with safe fallbacks
      const safeRecords = records || [];
      const totalRequirements = safeRecords.length;
      const completedRequirements = safeRecords.filter((r: any) => r.status === 'approved').length;
      const completionPercentage = totalRequirements > 0
        ? Math.round((completedRequirements / totalRequirements) * 100)
        : 0;
      
      console.log('🔧 DEBUG: Completion metrics:', {
        total: totalRequirements,
        completed: completedRequirements,
        percentage: completionPercentage
      });
      
      return {
        user_id: userId,
        role: profile.role as 'AP' | 'IC' | 'IP' | 'IT',
        tier: userTier as 'basic' | 'robust',
        template_name: templateData.template_name,
        description: templateData.description,
        requirements_count: totalRequirements,
        completed_requirements: completedRequirements,
        completion_percentage: completionPercentage,
        ui_config: templateData.ui_config || this.getDefaultUIConfig(),
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
      
      // 2. Create history record - using type assertion for new schema
      const { error: historyError } = await (supabase as any)
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
      
      // 4. Update history with requirements affected count - using type assertion
      const { error: updateHistoryError } = await (supabase as any)
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
      // Get requirements for the role/tier combination - using a different approach
      const { data: template, error: templateError } = await (supabase as any)
        .from('compliance_templates')
        .select('id')
        .eq('role', role)
        .eq('tier', tier)
        .single();
      
      if (templateError) throw templateError;
      
      // Get requirements linked to this template
      const { data: templateReqs, error: reqError } = await (supabase as any)
        .from('compliance_requirements_templates')
        .select(`
          requirement_id,
          compliance_requirements!inner(
            id,
            name,
            requirement_type,
            is_mandatory,
            due_days_from_assignment
          )
        `)
        .eq('template_id', template.id);
      
      if (reqError) throw reqError;
      
      if (!templateReqs || templateReqs.length === 0) {
        console.warn(`No requirements found for role ${role}, tier ${tier}`);
        return 0;
      }
      
      // Remove existing requirements for this user (clean slate) - using type assertion
      const { error: deleteError } = await (supabase as any)
        .from('user_compliance_records')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;
      
      // Create new compliance records
      const newRecords = templateReqs.map((req: any) => ({
        user_id: userId,
        requirement_id: req.requirement_id,
        status: 'pending',
        submission_data: {},
        ui_state: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      
      const { error: insertError } = await (supabase as any)
        .from('user_compliance_records')
        .insert(newRecords);
      
      if (insertError) throw insertError;
      
      return templateReqs.length;
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
      await (supabase as any)
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

  // Get compliance tier statistics for dashboard
  static async getComplianceTierStatistics(): Promise<any> {
    try {
      // Get tier distribution across all users
      const { data: tierDistribution, error: tierError } = await supabase
        .from('profiles')
        .select('compliance_tier, role')
        .not('compliance_tier', 'is', null);

      if (tierError) throw tierError;

      // Get compliance completion rates - using type assertion for new RPC
      const { data: completionStats, error: completionError } = await (supabase as any)
        .rpc('get_compliance_completion_stats');

      if (completionError) {
        console.warn('Could not fetch completion stats:', completionError);
      }

      // Calculate tier statistics
      const stats = {
        totalUsers: tierDistribution?.length || 0,
        tierDistribution: this.calculateTierDistribution(tierDistribution || []),
        roleDistribution: this.calculateRoleDistribution(tierDistribution || []),
        completionRates: completionStats || [],
        lastUpdated: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      console.error('Error getting compliance tier statistics:', error);
      // Return fallback data instead of throwing
      return {
        totalUsers: 0,
        tierDistribution: { basic: 0, robust: 0 },
        roleDistribution: { AP: 0, IC: 0, IP: 0, IT: 0 },
        completionRates: [],
        lastUpdated: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // Get all users' compliance tier information
  static async getAllUsersComplianceTiers(): Promise<UIComplianceTierInfo[]> {
    try {
      console.log('🔧 DEBUG: Getting all users compliance tiers...');
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, role, compliance_tier, display_name')
        .not('compliance_tier', 'is', null);

      if (error) {
        console.error('🔥 ERROR: Failed to fetch profiles:', error);
        throw error;
      }

      console.log('🔧 DEBUG: Found profiles:', profiles?.length || 0);

      // Get tier info for each user with better error handling
      const userTierInfos = await Promise.all(
        (profiles || []).map(async (profile) => {
          try {
            const tierInfo = await this.getUserTierInfo(profile.id);
            // Ensure tier is properly set
            if (!tierInfo.tier) {
              tierInfo.tier = 'basic';
            }
            return tierInfo;
          } catch (error) {
            console.warn(`🔥 WARN: Failed to get tier info for user ${profile.id}:`, error);
            // Return a fallback object instead of null
            return {
              user_id: profile.id,
              role: profile.role as 'AP' | 'IC' | 'IP' | 'IT',
              tier: (profile.compliance_tier || 'basic') as 'basic' | 'robust',
              template_name: `${profile.role} - ${profile.compliance_tier || 'basic'}`,
              description: 'Fallback tier information',
              requirements_count: 0,
              completed_requirements: 0,
              completion_percentage: 0,
              ui_config: this.getDefaultUIConfig(),
              next_requirement: null,
              can_advance_tier: false
            };
          }
        })
      );

      // Filter out any remaining null values and ensure all have valid tier property
      const validTierInfos = userTierInfos.filter(info => info !== null && info.tier) as UIComplianceTierInfo[];
      
      console.log('🔧 DEBUG: Valid tier infos:', validTierInfos.length);
      
      return validTierInfos;
    } catch (error) {
      console.error('🔥 ERROR: getAllUsersComplianceTiers failed:', error);
      return [];
    }
  }

  // Helper method to calculate tier distribution
  private static calculateTierDistribution(profiles: any[]): Record<string, number> {
    const distribution = { basic: 0, robust: 0 };
    
    profiles.forEach(profile => {
      if (profile.compliance_tier === 'basic') {
        distribution.basic++;
      } else if (profile.compliance_tier === 'robust') {
        distribution.robust++;
      }
    });

    return distribution;
  }

  // Helper method to calculate role distribution
  private static calculateRoleDistribution(profiles: any[]): Record<string, number> {
    const distribution = { AP: 0, IC: 0, IP: 0, IT: 0 };
    
    profiles.forEach(profile => {
      if (profile.role && distribution.hasOwnProperty(profile.role)) {
        distribution[profile.role]++;
      }
    });

    return distribution;
  }
}