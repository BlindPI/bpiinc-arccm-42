
import { supabase } from '@/integrations/supabase/client';
import { ComplianceTierInfo, adaptTierInfoFromDatabase } from '@/types/compliance-tier-standardized';
import { DatabaseAdapters } from '@/utils/database-adapters';

export interface UIComplianceTierInfo extends ComplianceTierInfo {
  role?: string;
  template_name?: string;
  requirements_count?: number;
  advancement_blocked_reason?: string;
}

export interface TierSwitchResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface TierStatistics {
  basic_tier_users: number;
  robust_tier_users: number;
  avg_completion_basic: number;
  avg_completion_robust: number;
  total_requirements: number;
}

export class ComplianceTierService {
  // Get user compliance tier info with proper return type
  static async getUserComplianceTierInfo(userId: string): Promise<ComplianceTierInfo | null> {
    try {
      const { data, error } = await supabase
        .from('user_compliance_records')
        .select(`
          *,
          compliance_requirements (
            id,
            name,
            description,
            category,
            tier,
            requirement_type,
            validation_rules,
            due_date,
            current_status
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching tier info:', error);
        return null;
      }

      return adaptTierInfoFromDatabase(data);
    } catch (error) {
      console.error('Service error:', error);
      return null;
    }
  }

  // Get UI-optimized compliance tier info
  static async getUIComplianceTierInfo(userId: string): Promise<UIComplianceTierInfo | null> {
    const tierInfo = await this.getUserComplianceTierInfo(userId);
    if (!tierInfo) return null;

    // Get additional UI-specific data
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, compliance_tier')
      .eq('id', userId)
      .single();

    return {
      ...tierInfo,
      role: profile?.role || 'Unknown',
      template_name: `${profile?.role || 'Unknown'} - ${tierInfo.tier} Tier`,
      requirements_count: tierInfo.totalRequirements,
      advancement_blocked_reason: tierInfo.can_advance_tier ? null : 'Complete more requirements to advance'
    };
  }

  // NEW: Get compliance tier statistics
  static async getComplianceTierStatistics(): Promise<TierStatistics> {
    try {
      const { data, error } = await supabase.rpc('get_compliance_completion_stats');

      if (error) {
        console.error('Error fetching tier statistics:', error);
        return {
          basic_tier_users: 0,
          robust_tier_users: 0,
          avg_completion_basic: 0,
          avg_completion_robust: 0,
          total_requirements: 0
        };
      }

      const basicStats = data?.find((stat: any) => stat.tier === 'basic') || {};
      const robustStats = data?.find((stat: any) => stat.tier === 'robust') || {};

      return {
        basic_tier_users: basicStats.total_users || 0,
        robust_tier_users: robustStats.total_users || 0,
        avg_completion_basic: basicStats.avg_completion_percentage || 0,
        avg_completion_robust: robustStats.avg_completion_percentage || 0,
        total_requirements: (basicStats.total_requirements || 0) + (robustStats.total_requirements || 0)
      };
    } catch (error) {
      console.error('Error in getComplianceTierStatistics:', error);
      return {
        basic_tier_users: 0,
        robust_tier_users: 0,
        avg_completion_basic: 0,
        avg_completion_robust: 0,
        total_requirements: 0
      };
    }
  }

  // NEW: Get all users compliance tiers
  static async getAllUsersComplianceTiers(): Promise<UIComplianceTierInfo[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          role,
          compliance_tier,
          user_compliance_records (
            completion_percentage,
            tier,
            can_advance_tier,
            completed_requirements,
            created_at,
            updated_at
          )
        `)
        .not('compliance_tier', 'is', null);

      if (error) {
        console.error('Error fetching all users tiers:', error);
        return [];
      }

      return data?.map(user => ({
        id: user.id,
        userId: user.id,
        tier: user.compliance_tier as 'basic' | 'robust',
        role: user.role,
        template_name: `${user.role} - ${user.compliance_tier} Tier`,
        completion_percentage: user.user_compliance_records?.[0]?.completion_percentage || 0,
        can_advance_tier: user.user_compliance_records?.[0]?.can_advance_tier || false,
        completed_requirements: user.user_compliance_records?.[0]?.completed_requirements || 0,
        totalRequirements: 0,
        requirements: [],
        requirements_count: 0,
        created_at: user.user_compliance_records?.[0]?.created_at || new Date().toISOString(),
        updated_at: user.user_compliance_records?.[0]?.updated_at || new Date().toISOString()
      })) || [];
    } catch (error) {
      console.error('Error in getAllUsersComplianceTiers:', error);
      return [];
    }
  }

  // Switch tier with proper return type (fix signature)
  static async switchTier(userId: string, newTier: 'basic' | 'robust'): Promise<TierSwitchResult> {
    try {
      const { error } = await supabase
        .from('user_compliance_records')
        .update({ 
          tier: newTier,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        return {
          success: false,
          message: error.message
        };
      }

      return {
        success: true,
        message: `Successfully switched to ${newTier} tier`
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Unknown error occurred'
      };
    }
  }

  // Subscribe to tier changes
  static subscribeToTierChanges(userId: string, callback: (update: UIComplianceTierInfo) => void) {
    const subscription = supabase
      .channel(`tier-changes-${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_compliance_records',
          filter: `user_id=eq.${userId}`
        }, 
        async (payload) => {
          const tierInfo = await this.getUIComplianceTierInfo(userId);
          if (tierInfo) {
            callback(tierInfo);
          }
        }
      )
      .subscribe();

    return subscription;
  }

  // Backward compatibility aliases
  static async getUserTierInfo(userId: string): Promise<ComplianceTierInfo | null> {
    return this.getUserComplianceTierInfo(userId);
  }

  static async getUserComplianceTier(userId: string): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const tierInfo = await this.getUserComplianceTierInfo(userId);
      return {
        success: true,
        data: tierInfo
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}
