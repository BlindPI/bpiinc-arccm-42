
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceTierInfo {
  tier: 'basic' | 'robust';
  userId: string;
  assignedAt: string;
  canAdvance: boolean;
  requirements: any[];
}

export interface UIComplianceTierInfo {
  id: string;
  tier: 'basic' | 'robust';
  userId: string;
  assignedAt: string;
  canAdvance: boolean;
  requirements: any[];
  completion_percentage: number;
  next_steps: string[];
}

export class ComplianceTierService {
  static async getUserTier(userId: string): Promise<ComplianceTierInfo | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('compliance_tier, created_at')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      return {
        tier: data.compliance_tier || 'basic',
        userId,
        assignedAt: data.created_at,
        canAdvance: false,
        requirements: []
      };
    } catch (error) {
      console.error('Error fetching user tier:', error);
      return null;
    }
  }

  static async getUserComplianceTierInfo(userId: string): Promise<UIComplianceTierInfo | null> {
    try {
      const basicInfo = await this.getUserTier(userId);
      if (!basicInfo) return null;

      // Get completion percentage from user_compliance_records
      const { data: records } = await supabase
        .from('user_compliance_records')
        .select('compliance_status')
        .eq('user_id', userId);

      const totalRecords = records?.length || 0;
      const completedRecords = records?.filter(r => r.compliance_status === 'approved').length || 0;
      const completion_percentage = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0;

      return {
        id: userId,
        tier: basicInfo.tier,
        userId: basicInfo.userId,
        assignedAt: basicInfo.assignedAt,
        canAdvance: basicInfo.canAdvance,
        requirements: basicInfo.requirements,
        completion_percentage,
        next_steps: completion_percentage < 100 ? ['Complete remaining requirements'] : ['All requirements completed']
      };
    } catch (error) {
      console.error('Error fetching user compliance tier info:', error);
      return null;
    }
  }

  static async getUIComplianceTierInfo(userId: string): Promise<UIComplianceTierInfo | null> {
    return this.getUserComplianceTierInfo(userId);
  }

  static async updateUserComplianceTier(userId: string, tier: 'basic' | 'robust'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ compliance_tier: tier })
        .eq('id', userId);

      if (error) {
        console.error('Error updating compliance tier:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating compliance tier:', error);
      return false;
    }
  }

  static async switchTier(userId: string, targetTier: 'basic' | 'robust'): Promise<boolean> {
    return this.updateUserComplianceTier(userId, targetTier);
  }

  static async validateTierSwitch(userId: string, targetTier: 'basic' | 'robust'): Promise<boolean> {
    // Basic validation - always allow for now
    return true;
  }

  static subscribeToTierChanges(userId: string, callback: (update: UIComplianceTierInfo) => void) {
    const subscription = supabase
      .channel(`compliance_tier_${userId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${userId}`
        }, 
        async () => {
          const updated = await this.getUIComplianceTierInfo(userId);
          if (updated) callback(updated);
        }
      )
      .subscribe();

    return subscription;
  }
}
