import { supabase } from '@/integrations/supabase/client';

export interface RevenueMetrics {
  total_revenue: number;
  certificate_revenue: number;
  corporate_revenue: number;
  ap_setup_revenue: number;
  transaction_count: number;
  period_start: string;
  period_end: string;
}

export interface PipelineMetrics {
  stage_name: string;
  opportunity_count: number;
  total_value: number;
  avg_probability: number;
  conversion_rate?: number;
}

export interface RevenueRecord {
  id: string;
  amount: number;
  revenue_date: string;
  revenue_type: string;
  opportunity_id?: string;
  ap_location_id?: number;
  certificate_count?: number;
  participant_count?: number;
  commission_amount?: number;
  commission_rate?: number;
  sales_rep_id?: string;
  created_at: string;
}

export interface RevenueForecast {
  period: string;
  forecasted_amount: number;
  confidence_level: number;
  contributing_opportunities: number;
  weighted_pipeline_value: number;
}

export class RevenueAnalyticsService {
  // Get revenue metrics using existing database function
  static async getRevenueMetrics(startDate?: string, endDate?: string): Promise<RevenueMetrics[]> {
    try {
      const { data, error } = await supabase.rpc('get_revenue_metrics', {
        start_date: startDate || null,
        end_date: endDate || null
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      return [];
    }
  }

  // Get pipeline metrics using existing database function
  static async getPipelineMetrics(pipelineType?: string): Promise<PipelineMetrics[]> {
    try {
      const { data, error } = await supabase.rpc('get_pipeline_metrics', {
        pipeline_type_param: pipelineType || null
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pipeline metrics:', error);
      return [];
    }
  }

  // Time-series revenue tracking
  static async getRevenueTimeSeries(
    startDate: string,
    endDate: string,
    groupBy: 'day' | 'week' | 'month' = 'month'
  ): Promise<RevenueRecord[]> {
    try {
      let query = supabase
        .from('crm_revenue_records')
        .select('*')
        .gte('revenue_date', startDate)
        .lte('revenue_date', endDate)
        .order('revenue_date', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(record => ({
        id: record.id,
        amount: record.amount,
        revenue_date: record.revenue_date,
        revenue_type: record.revenue_type,
        opportunity_id: record.opportunity_id,
        ap_location_id: record.ap_location_id,
        certificate_count: record.certificate_count,
        participant_count: record.participant_count,
        commission_amount: record.commission_amount,
        commission_rate: record.commission_rate,
        sales_rep_id: record.sales_rep_id,
        created_at: record.created_at
      }));
    } catch (error) {
      console.error('Error fetching revenue time series:', error);
      return [];
    }
  }

  // Revenue forecasting based on opportunity probability
  static async getRevenueForecast(
    forecastPeriods: number = 6,
    periodType: 'month' | 'quarter' = 'month'
  ): Promise<RevenueForecast[]> {
    try {
      // Get active opportunities with their probabilities
      const { data: opportunities, error } = await supabase
        .from('crm_opportunities')
        .select('*')
        .in('stage', ['prospect', 'proposal', 'negotiation'])
        .not('expected_close_date', 'is', null);

      if (error) throw error;

      const forecasts: RevenueForecast[] = [];
      const now = new Date();

      for (let i = 0; i < forecastPeriods; i++) {
        const periodStart = new Date(now);
        const periodEnd = new Date(now);

        if (periodType === 'month') {
          periodStart.setMonth(now.getMonth() + i);
          periodEnd.setMonth(now.getMonth() + i + 1);
        } else {
          periodStart.setMonth(now.getMonth() + (i * 3));
          periodEnd.setMonth(now.getMonth() + ((i + 1) * 3));
        }

        // Filter opportunities expected to close in this period
        const periodOpportunities = (opportunities || []).filter(opp => {
          const closeDate = new Date(opp.expected_close_date);
          return closeDate >= periodStart && closeDate < periodEnd;
        });

        const weightedValue = periodOpportunities.reduce((sum, opp) => {
          return sum + (opp.estimated_value * (opp.probability / 100));
        }, 0);

        const avgConfidence = periodOpportunities.length > 0
          ? periodOpportunities.reduce((sum, opp) => sum + opp.probability, 0) / periodOpportunities.length
          : 0;

        forecasts.push({
          period: `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`,
          forecasted_amount: weightedValue,
          confidence_level: avgConfidence,
          contributing_opportunities: periodOpportunities.length,
          weighted_pipeline_value: weightedValue
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Error generating revenue forecast:', error);
      return [];
    }
  }

  // Revenue by source analysis
  static async getRevenueBySource(startDate?: string, endDate?: string) {
    try {
      let query = supabase
        .from('crm_revenue_records')
        .select(`
          revenue_type,
          amount,
          crm_opportunities!inner(
            crm_leads!inner(lead_source)
          )
        `);

      if (startDate) query = query.gte('revenue_date', startDate);
      if (endDate) query = query.lte('revenue_date', endDate);

      const { data, error } = await query;
      if (error) throw error;

      // Group by lead source
      const sourceMap = new Map();
      (data || []).forEach(record => {
        const source = record.crm_opportunities?.crm_leads?.lead_source || 'unknown';
        const current = sourceMap.get(source) || { source, total_revenue: 0, count: 0 };
        current.total_revenue += record.amount;
        current.count += 1;
        sourceMap.set(source, current);
      });

      return Array.from(sourceMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);
    } catch (error) {
      console.error('Error fetching revenue by source:', error);
      return [];
    }
  }

  // Create revenue record
  static async createRevenueRecord(record: Omit<RevenueRecord, 'id' | 'created_at'>): Promise<RevenueRecord | null> {
    try {
      const { data, error } = await supabase
        .from('crm_revenue_records')
        .insert({
          amount: record.amount,
          revenue_date: record.revenue_date,
          revenue_type: record.revenue_type,
          opportunity_id: record.opportunity_id,
          ap_location_id: record.ap_location_id,
          certificate_count: record.certificate_count,
          participant_count: record.participant_count,
          commission_amount: record.commission_amount,
          commission_rate: record.commission_rate,
          sales_rep_id: record.sales_rep_id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        amount: data.amount,
        revenue_date: data.revenue_date,
        revenue_type: data.revenue_type,
        opportunity_id: data.opportunity_id,
        ap_location_id: data.ap_location_id,
        certificate_count: data.certificate_count,
        participant_count: data.participant_count,
        commission_amount: data.commission_amount,
        commission_rate: data.commission_rate,
        sales_rep_id: data.sales_rep_id,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Error creating revenue record:', error);
      return null;
    }
  }

  // Get monthly revenue comparison
  static async getMonthlyRevenueComparison(months: number = 12) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(endDate.getMonth() - months);

      const { data, error } = await supabase
        .from('crm_revenue_records')
        .select('amount, revenue_date, revenue_type')
        .gte('revenue_date', startDate.toISOString().split('T')[0])
        .lte('revenue_date', endDate.toISOString().split('T')[0])
        .order('revenue_date');

      if (error) throw error;

      // Group by month
      const monthlyData = new Map();
      (data || []).forEach(record => {
        const date = new Date(record.revenue_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthKey,
            total_revenue: 0,
            certificate_revenue: 0,
            corporate_revenue: 0,
            transaction_count: 0
          });
        }

        const monthData = monthlyData.get(monthKey);
        monthData.total_revenue += record.amount;
        monthData.transaction_count += 1;

        if (record.revenue_type === 'certificate_fee') {
          monthData.certificate_revenue += record.amount;
        } else if (record.revenue_type === 'corporate_training') {
          monthData.corporate_revenue += record.amount;
        }
      });

      return Array.from(monthlyData.values()).sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
      console.error('Error fetching monthly revenue comparison:', error);
      return [];
    }
  }
}