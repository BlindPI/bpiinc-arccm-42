import { supabase } from '@/integrations/supabase/client';
import { 
  CRMRevenueRecord, 
  CRMServiceResponse, 
  PaginatedResponse,
  RevenueMetrics,
  CertificateRevenueAttribution
} from '@/types/crm';

export class CRMRevenueService {
  /**
   * Create a new revenue record
   */
  async createRevenueRecord(revenueData: {
    opportunity_id?: string;
    revenue_type: 'certificate_sale' | 'corporate_contract' | 'ap_setup_fee' | 'recurring_revenue';
    amount: number;
    currency: string;
    revenue_date: string;
    ap_location_id?: number;
    certificate_count?: number;
    participant_count?: number;
    sales_rep_id?: string;
    commission_rate?: number;
    certificate_request_ids?: string[];
    invoice_reference?: string;
  }): Promise<CRMServiceResponse<CRMRevenueRecord>> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User must be authenticated' };
      }

      // Calculate commission amount if rate is provided
      const commission_amount = revenueData.commission_rate ? 
        revenueData.amount * (revenueData.commission_rate / 100) : undefined;

      const { data, error } = await supabase
        .from('crm_revenue_records')
        .insert({
          ...revenueData,
          commission_amount,
          sales_rep_id: revenueData.sales_rep_id || user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating revenue record:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createRevenueRecord:', error);
      return { success: false, error: 'Failed to create revenue record' };
    }
  }

  /**
   * Get revenue records with filtering and pagination
   */
  async getRevenueRecords(
    filters: {
      revenue_type?: 'certificate_sale' | 'corporate_contract' | 'ap_setup_fee' | 'recurring_revenue';
      sales_rep_id?: string;
      ap_location_id?: number;
      date_from?: string;
      date_to?: string;
      min_amount?: number;
      max_amount?: number;
    } = {},
    page: number = 1,
    limit: number = 50
  ): Promise<CRMServiceResponse<PaginatedResponse<CRMRevenueRecord>>> {
    try {
      let query = supabase
        .from('crm_revenue_records')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters.revenue_type) {
        query = query.eq('revenue_type', filters.revenue_type);
      }
      if (filters.sales_rep_id) {
        query = query.eq('sales_rep_id', filters.sales_rep_id);
      }
      if (filters.ap_location_id) {
        query = query.eq('ap_location_id', filters.ap_location_id);
      }
      if (filters.date_from) {
        query = query.gte('revenue_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('revenue_date', filters.date_to);
      }
      if (filters.min_amount !== undefined) {
        query = query.gte('amount', filters.min_amount);
      }
      if (filters.max_amount !== undefined) {
        query = query.lte('amount', filters.max_amount);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query
        .order('revenue_date', { ascending: false })
        .order('amount', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching revenue records:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          data: data || [],
          total: count || 0,
          page,
          limit,
          has_more: (count || 0) > offset + limit
        }
      };
    } catch (error) {
      console.error('Error in getRevenueRecords:', error);
      return { success: false, error: 'Failed to fetch revenue records' };
    }
  }

  /**
   * Get revenue metrics for a period
   */
  async getRevenueMetrics(
    startDate: string,
    endDate: string,
    salesRepId?: string
  ): Promise<CRMServiceResponse<RevenueMetrics>> {
    try {
      let query = supabase
        .from('crm_revenue_records')
        .select('revenue_type, amount')
        .gte('revenue_date', startDate)
        .lte('revenue_date', endDate);

      if (salesRepId) {
        query = query.eq('sales_rep_id', salesRepId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching revenue metrics:', error);
        return { success: false, error: error.message };
      }

      const records = data || [];
      
      const metrics: RevenueMetrics = {
        total_revenue: records.reduce((sum, record) => sum + record.amount, 0),
        certificate_revenue: records
          .filter(r => r.revenue_type === 'certificate_sale')
          .reduce((sum, record) => sum + record.amount, 0),
        corporate_revenue: records
          .filter(r => r.revenue_type === 'corporate_contract')
          .reduce((sum, record) => sum + record.amount, 0),
        ap_setup_revenue: records
          .filter(r => r.revenue_type === 'ap_setup_fee')
          .reduce((sum, record) => sum + record.amount, 0),
        transaction_count: records.length
      };

      return { success: true, data: metrics };
    } catch (error) {
      console.error('Error in getRevenueMetrics:', error);
      return { success: false, error: 'Failed to calculate revenue metrics' };
    }
  }

  /**
   * Get commission summary for a sales rep
   */
  async getCommissionSummary(
    salesRepId: string,
    startDate: string,
    endDate: string
  ): Promise<CRMServiceResponse<{
    total_commission: number;
    total_sales: number;
    avg_commission_rate: number;
    transaction_count: number;
    commission_by_type: Record<string, number>;
  }>> {
    try {
      const { data, error } = await supabase
        .from('crm_revenue_records')
        .select('revenue_type, amount, commission_amount, commission_rate')
        .eq('sales_rep_id', salesRepId)
        .gte('revenue_date', startDate)
        .lte('revenue_date', endDate);

      if (error) {
        console.error('Error fetching commission data:', error);
        return { success: false, error: error.message };
      }

      const records = data || [];
      const total_commission = records.reduce((sum, record) => sum + (record.commission_amount || 0), 0);
      const total_sales = records.reduce((sum, record) => sum + record.amount, 0);
      const transaction_count = records.length;
      
      // Calculate average commission rate
      const recordsWithCommission = records.filter(r => r.commission_rate > 0);
      const avg_commission_rate = recordsWithCommission.length > 0 ?
        recordsWithCommission.reduce((sum, r) => sum + r.commission_rate, 0) / recordsWithCommission.length : 0;

      // Group commission by revenue type
      const commission_by_type = records.reduce((acc, record) => {
        acc[record.revenue_type] = (acc[record.revenue_type] || 0) + (record.commission_amount || 0);
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        data: {
          total_commission,
          total_sales,
          avg_commission_rate,
          transaction_count,
          commission_by_type
        }
      };
    } catch (error) {
      console.error('Error in getCommissionSummary:', error);
      return { success: false, error: 'Failed to calculate commission summary' };
    }
  }

  /**
   * Get revenue by AP location
   */
  async getRevenueByAP(
    startDate: string,
    endDate: string
  ): Promise<CRMServiceResponse<{
    ap_location_id: number;
    total_revenue: number;
    certificate_count: number;
    participant_count: number;
    transaction_count: number;
  }[]>> {
    try {
      const { data, error } = await supabase
        .from('crm_revenue_records')
        .select('ap_location_id, amount, certificate_count, participant_count')
        .gte('revenue_date', startDate)
        .lte('revenue_date', endDate)
        .not('ap_location_id', 'is', null);

      if (error) {
        console.error('Error fetching AP revenue data:', error);
        return { success: false, error: error.message };
      }

      const records = data || [];
      
      // Group by AP location
      const apGroups = records.reduce((acc, record) => {
        const apId = record.ap_location_id!;
        if (!acc[apId]) {
          acc[apId] = {
            ap_location_id: apId,
            total_revenue: 0,
            certificate_count: 0,
            participant_count: 0,
            transaction_count: 0
          };
        }
        
        acc[apId].total_revenue += record.amount;
        acc[apId].certificate_count += record.certificate_count || 0;
        acc[apId].participant_count += record.participant_count || 0;
        acc[apId].transaction_count += 1;
        
        return acc;
      }, {} as Record<number, {
        ap_location_id: number;
        total_revenue: number;
        certificate_count: number;
        participant_count: number;
        transaction_count: number;
      }>);

      const result = (Object.values(apGroups) as {
        ap_location_id: number;
        total_revenue: number;
        certificate_count: number;
        participant_count: number;
        transaction_count: number;
      }[]).sort((a, b) => b.total_revenue - a.total_revenue);

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in getRevenueByAP:', error);
      return { success: false, error: 'Failed to get revenue by AP' };
    }
  }

  /**
   * Attribute certificate revenue to CRM opportunities
   */
  async attributeCertificateRevenue(
    certificateRequestId: string,
    revenueAmount: number,
    apLocationId: number,
    participantCount: number = 1
  ): Promise<CRMServiceResponse<CertificateRevenueAttribution>> {
    try {
      // Try to find matching opportunity based on AP location and timing
      const { data: opportunities, error: oppError } = await supabase
        .from('crm_opportunities')
        .select('id, lead_id, assigned_to, estimated_value, participant_count')
        .eq('preferred_ap_id', apLocationId)
        .eq('status', 'closed_won')
        .gte('actual_close_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
        .order('actual_close_date', { ascending: false });

      if (oppError) {
        console.error('Error finding matching opportunities:', oppError);
      }

      let bestMatch = null;
      let attributionConfidence = 0;

      if (opportunities && opportunities.length > 0) {
        // Find best matching opportunity based on participant count and value
        bestMatch = opportunities.find(opp => 
          Math.abs((opp.participant_count || 1) - participantCount) <= 2 &&
          Math.abs(opp.estimated_value - revenueAmount) <= revenueAmount * 0.2
        ) || opportunities[0];

        // Calculate confidence based on match quality
        if (bestMatch) {
          const participantMatch = Math.abs((bestMatch.participant_count || 1) - participantCount) <= 1;
          const valueMatch = Math.abs(bestMatch.estimated_value - revenueAmount) <= revenueAmount * 0.1;
          const timingMatch = true; // Already filtered by timing
          
          attributionConfidence = (participantMatch ? 40 : 20) + (valueMatch ? 40 : 20) + (timingMatch ? 20 : 0);
        }
      }

      const attribution: CertificateRevenueAttribution = {
        certificate_request_id: certificateRequestId,
        opportunity_id: bestMatch?.id,
        lead_id: bestMatch?.lead_id,
        revenue_amount: revenueAmount,
        ap_location_id: apLocationId,
        sales_rep_id: bestMatch?.assigned_to,
        attribution_confidence: attributionConfidence
      };

      // Create revenue record with attribution
      if (bestMatch) {
        await this.createRevenueRecord({
          opportunity_id: bestMatch.id,
          revenue_type: 'certificate_sale',
          amount: revenueAmount,
          currency: 'CAD',
          revenue_date: new Date().toISOString().split('T')[0],
          ap_location_id: apLocationId,
          certificate_count: 1,
          participant_count: participantCount,
          sales_rep_id: bestMatch.assigned_to,
          certificate_request_ids: [certificateRequestId]
        });
      }

      return { success: true, data: attribution };
    } catch (error) {
      console.error('Error in attributeCertificateRevenue:', error);
      return { success: false, error: 'Failed to attribute certificate revenue' };
    }
  }

  /**
   * Get monthly revenue trend
   */
  async getMonthlyRevenueTrend(
    months: number = 12,
    salesRepId?: string
  ): Promise<CRMServiceResponse<{
    month: string;
    total_revenue: number;
    certificate_revenue: number;
    corporate_revenue: number;
    transaction_count: number;
  }[]>> {
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      let query = supabase
        .from('crm_revenue_records')
        .select('revenue_date, revenue_type, amount')
        .gte('revenue_date', startDate.toISOString().split('T')[0]);

      if (salesRepId) {
        query = query.eq('sales_rep_id', salesRepId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching revenue trend:', error);
        return { success: false, error: error.message };
      }

      const records = data || [];
      
      // Group by month
      const monthlyData = records.reduce((acc, record) => {
        const month = record.revenue_date.substring(0, 7); // YYYY-MM format
        
        if (!acc[month]) {
          acc[month] = {
            month,
            total_revenue: 0,
            certificate_revenue: 0,
            corporate_revenue: 0,
            transaction_count: 0
          };
        }
        
        acc[month].total_revenue += record.amount;
        acc[month].transaction_count += 1;
        
        if (record.revenue_type === 'certificate_sale') {
          acc[month].certificate_revenue += record.amount;
        } else if (record.revenue_type === 'corporate_contract') {
          acc[month].corporate_revenue += record.amount;
        }
        
        return acc;
      }, {} as Record<string, any>);

      const result = (Object.values(monthlyData) as {
        month: string;
        total_revenue: number;
        certificate_revenue: number;
        corporate_revenue: number;
        transaction_count: number;
      }[]).sort((a, b) => a.month.localeCompare(b.month));

      return { success: true, data: result };
    } catch (error) {
      console.error('Error in getMonthlyRevenueTrend:', error);
      return { success: false, error: 'Failed to get monthly revenue trend' };
    }
  }

  /**
   * Update revenue record
   */
  async updateRevenueRecord(
    recordId: string,
    updates: Partial<CRMRevenueRecord>
  ): Promise<CRMServiceResponse<CRMRevenueRecord>> {
    try {
      // Recalculate commission if amount or rate changed
      if (updates.amount !== undefined || updates.commission_rate !== undefined) {
        const { data: current } = await supabase
          .from('crm_revenue_records')
          .select('amount, commission_rate')
          .eq('id', recordId)
          .single();

        if (current) {
          const newAmount = updates.amount ?? current.amount;
          const newRate = updates.commission_rate ?? current.commission_rate;
          updates.commission_amount = newRate ? newAmount * (newRate / 100) : undefined;
        }
      }

      const { data, error } = await supabase
        .from('crm_revenue_records')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        console.error('Error updating revenue record:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateRevenueRecord:', error);
      return { success: false, error: 'Failed to update revenue record' };
    }
  }

  /**
   * Delete revenue record
   */
  async deleteRevenueRecord(recordId: string): Promise<CRMServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('crm_revenue_records')
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Error deleting revenue record:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteRevenueRecord:', error);
      return { success: false, error: 'Failed to delete revenue record' };
    }
  }
}

export const crmRevenueService = new CRMRevenueService();