
import { supabase } from '@/integrations/supabase/client';
import { ComplianceTierInfo, adaptTierInfoFromDatabase } from '@/types/compliance-tier-standardized';
import { DatabaseAdapters } from '@/utils/database-adapters';

export interface UIComplianceTierInfo extends ComplianceTierInfo {
  // Additional UI-specific properties if needed
}

export interface TierSwitchResult {
  success: boolean;
  message?: string;
  data?: any;
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
            status
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
    return tierInfo as UIComplianceTierInfo;
  }

  // Switch tier with proper return type
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

  // Get user tier info (alias for backward compatibility)
  static async getUserTierInfo(userId: string): Promise<ComplianceTierInfo | null> {
    return this.getUserComplianceTierInfo(userId);
  }
}
