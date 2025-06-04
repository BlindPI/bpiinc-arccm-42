import { useQuery } from '@tanstack/react-query';
import { crmDashboardService, crmRevenueService } from '@/services/crm';
import type { CRMDashboardMetrics } from '@/types/crm';

export interface CRMDashboardData {
  metrics: CRMDashboardMetrics;
  recentActivities: any[];
  pipelineData: any[];
  revenueData: any[];
  topAPs: any[];
}

export const useCRMDashboard = () => {
  return useQuery({
    queryKey: ['crm', 'dashboard'],
    queryFn: async (): Promise<CRMDashboardData> => {
      const [
        metricsResponse,
        pipelineResponse,
        activityResponse,
        topAPsResponse,
        completeDashboardResponse
      ] = await Promise.all([
        crmDashboardService.getDashboardMetrics(),
        crmDashboardService.getPipelineHealth(),
        crmDashboardService.getActivitySummary(30),
        crmDashboardService.getTopPerformingAPs(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          new Date().toISOString().split('T')[0],
          5
        ),
        crmDashboardService.getCompleteDashboardData()
      ]);

      if (!metricsResponse.success) {
        throw new Error(metricsResponse.error || 'Failed to fetch dashboard metrics');
      }

      return {
        metrics: metricsResponse.data || {
          monthly_revenue: 0,
          monthly_revenue_change: 0,
          active_opportunities: 0,
          active_opportunities_change: 0,
          conversion_rate: 0,
          conversion_rate_change: 0,
          avg_deal_size: 0,
          avg_deal_size_change: 0,
          pipeline_value: 0,
          leads_this_month: 0,
          tasks_due_today: 0,
          follow_ups_overdue: 0
        },
        recentActivities: completeDashboardResponse.success ? completeDashboardResponse.data?.recent_leads || [] : [],
        pipelineData: pipelineResponse.success ? pipelineResponse.data?.opportunities_by_stage || [] : [],
        revenueData: completeDashboardResponse.success ? completeDashboardResponse.data?.revenue_trend || [] : [],
        topAPs: topAPsResponse.success ? topAPsResponse.data || [] : []
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCRMMetrics = () => {
  return useQuery({
    queryKey: ['crm', 'metrics'],
    queryFn: async () => {
      const response = await crmDashboardService.getDashboardMetrics();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch CRM metrics');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCRMRecentActivities = (limit: number = 10) => {
  return useQuery({
    queryKey: ['crm', 'recent-activities', limit],
    queryFn: async () => {
      const response = await crmDashboardService.getActivitySummary(30);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch recent activities');
      }
      return response.data || {};
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });
};

export const useCRMPipelineOverview = () => {
  return useQuery({
    queryKey: ['crm', 'pipeline-overview'],
    queryFn: async () => {
      const response = await crmDashboardService.getPipelineHealth();
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch pipeline overview');
      }
      return response.data || {};
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCRMRevenueMetrics = (months: number = 6) => {
  return useQuery({
    queryKey: ['crm', 'revenue-trend', months],
    queryFn: async () => {
      const response = await crmRevenueService.getMonthlyRevenueTrend(months);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch revenue trend');
      }
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCRMTopPerformingAPs = (limit: number = 5) => {
  return useQuery({
    queryKey: ['crm', 'top-performing-aps', limit],
    queryFn: async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      const response = await crmDashboardService.getTopPerformingAPs(startDate, endDate, limit);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch top performing APs');
      }
      return response.data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  });
};