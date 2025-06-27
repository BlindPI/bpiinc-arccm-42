
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceTierInfo {
  tier: 'basic' | 'robust';
  userId: string;
  assignedAt: string;
  canAdvance: boolean;
  requirements: any[];
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
}
