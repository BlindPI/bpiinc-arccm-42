
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CRMService } from '@/services/crm/crmService';
import { ExecutiveDashboard } from '@/components/crm/analytics/ExecutiveDashboard';
import { AdvancedRevenueAnalytics } from '@/components/crm/analytics/AdvancedRevenueAnalytics';

export default function RevenueAnalytics() {
  const { data: crmStats, isLoading } = useQuery({
    queryKey: ['crm-stats'],
    queryFn: () => CRMService.getCRMStats()
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Revenue Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive revenue analysis and business intelligence
        </p>
      </div>

      <ExecutiveDashboard />
      <AdvancedRevenueAnalytics />
    </div>
  );
}
