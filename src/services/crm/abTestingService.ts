
import { supabase } from '@/integrations/supabase/client';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  type: 'email_subject' | 'email_content' | 'landing_page' | 'call_to_action';
  variants: TestVariant[];
  duration_days: number;
  confidence_level: number;
  statistical_significance: boolean;
  winner?: string;
  created_at: string;
}

export interface TestVariant {
  id: string;
  name: string;
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

export class ABTestingService {
  static async getABTests(): Promise<ABTest[]> {
    try {
      // Use analytics_reports table to store A/B tests temporarily
      const { data, error } = await supabase
        .from('analytics_reports')
        .select('*')
        .eq('report_type', 'ab_test')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.name || '',
        status: 'draft' as const,
        type: 'email_subject' as const,
        variants: [],
        duration_days: 7,
        confidence_level: 95,
        statistical_significance: false,
        created_at: item.created_at
      }));
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
      throw error;
    }
  }

  static async createABTest(testData: Partial<ABTest>): Promise<ABTest> {
    try {
      // Store A/B test data in analytics_reports table
      const { data, error } = await supabase
        .from('analytics_reports')
        .insert({
          name: testData.name,
          report_type: 'ab_test',
          configuration: {
            test_type: testData.type,
            variants: testData.variants,
            duration_days: testData.duration_days,
            confidence_level: testData.confidence_level
          } as any,
          is_automated: false
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.name || '',
        status: 'draft',
        type: 'email_subject',
        variants: [],
        duration_days: 7,
        confidence_level: 95,
        statistical_significance: false,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  static async updateABTest(testId: string, updates: Partial<ABTest>): Promise<ABTest> {
    try {
      const { data, error } = await supabase
        .from('analytics_reports')
        .update({
          name: updates.name,
          configuration: {
            test_type: updates.type,
            variants: updates.variants,
            duration_days: updates.duration_days,
            confidence_level: updates.confidence_level
          } as any
        })
        .eq('id', testId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.name || '',
        status: 'draft',
        type: 'email_subject',
        variants: [],
        duration_days: 7,
        confidence_level: 95,
        statistical_significance: false,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error updating A/B test:', error);
      throw error;
    }
  }

  static async deleteABTest(testId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_reports')
        .delete()
        .eq('id', testId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting A/B test:', error);
      throw error;
    }
  }

  static async startTest(testId: string): Promise<void> {
    // Implementation would update test status to 'running'
    console.log('Starting test:', testId);
  }

  static async pauseTest(testId: string): Promise<void> {
    // Implementation would update test status to 'paused'
    console.log('Pausing test:', testId);
  }

  static async getTestResults(testId: string): Promise<any> {
    // Implementation would return test results and statistics
    console.log('Getting results for test:', testId);
    return {};
  }
}
