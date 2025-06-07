
import { supabase } from '@/integrations/supabase/client';

export interface ABTestVariant {
  id: string;
  name: string;
  content: string;
  traffic_split: number;
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
  };
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  type: 'email_subject' | 'email_content' | 'landing_page' | 'call_to_action';
  variants: ABTestVariant[];
  duration_days: number;
  confidence_level: number;
  statistical_significance: boolean;
  winner?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export class ABTestingService {
  static async getABTests(): Promise<ABTest[]> {
    try {
      const { data, error } = await supabase
        .from('crm_ab_tests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
      throw error;
    }
  }

  static async createABTest(test: Omit<ABTest, 'id' | 'created_at' | 'updated_at'>): Promise<ABTest> {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('crm_ab_tests')
        .insert({
          ...test,
          created_by: user.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  static async updateABTest(id: string, updates: Partial<ABTest>): Promise<ABTest> {
    try {
      const { data, error } = await supabase
        .from('crm_ab_tests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating A/B test:', error);
      throw error;
    }
  }

  static async deleteABTest(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_ab_tests')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting A/B test:', error);
      throw error;
    }
  }

  static async startABTest(id: string): Promise<ABTest> {
    return this.updateABTest(id, { status: 'running' });
  }

  static async pauseABTest(id: string): Promise<ABTest> {
    return this.updateABTest(id, { status: 'paused' });
  }

  static async completeABTest(id: string, winnerId?: string): Promise<ABTest> {
    return this.updateABTest(id, { 
      status: 'completed',
      winner: winnerId 
    });
  }

  static async getABTestMetrics(testId: string): Promise<ABTestVariant[]> {
    try {
      const { data, error } = await supabase
        .from('crm_ab_test_metrics')
        .select('*')
        .eq('test_id', testId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching A/B test metrics:', error);
      throw error;
    }
  }

  static async updateVariantMetrics(
    testId: string, 
    variantId: string, 
    metrics: Partial<ABTestVariant['metrics']>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('crm_ab_test_metrics')
        .upsert({
          test_id: testId,
          variant_id: variantId,
          ...metrics,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating variant metrics:', error);
      throw error;
    }
  }

  static calculateStatisticalSignificance(
    variantA: ABTestVariant['metrics'], 
    variantB: ABTestVariant['metrics'],
    confidenceLevel: number = 95
  ): boolean {
    // Simplified statistical significance calculation
    const totalA = variantA.sent;
    const totalB = variantB.sent;
    const conversionA = variantA.converted / totalA;
    const conversionB = variantB.converted / totalB;
    
    if (totalA < 30 || totalB < 30) return false; // Need minimum sample size
    
    const pooledRate = (variantA.converted + variantB.converted) / (totalA + totalB);
    const standardError = Math.sqrt(pooledRate * (1 - pooledRate) * (1/totalA + 1/totalB));
    const zScore = Math.abs(conversionA - conversionB) / standardError;
    
    // Z-score thresholds for confidence levels
    const thresholds = { 90: 1.645, 95: 1.96, 99: 2.576 };
    const threshold = thresholds[confidenceLevel as keyof typeof thresholds] || 1.96;
    
    return zScore > threshold;
  }
}
