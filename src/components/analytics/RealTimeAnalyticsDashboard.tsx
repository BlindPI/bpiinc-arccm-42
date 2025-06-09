
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { safeConvertExecutiveMetrics, safeConvertTeamAnalytics, safeConvertComplianceMetrics } from '@/utils/typeGuards';
import type { ExecutiveMetrics, ComplianceMetrics } from '@/types/supabase-schema';
import type { TeamAnalytics } from '@/types/team-management';

export function RealTimeAnalyticsDashboard() {
  const { data: executiveMetrics, isLoading: executiveLoading } = useQuery({
    queryKey: ['executive-metrics'],
    queryFn: async (): Promise<ExecutiveMetrics> => {
      const { data, error } = await supabase.rpc('get_executive_dashboard_metrics');
      if (error) throw error;
      return safeConvertExecutiveMetrics(data);
    }
  });

  const { data: teamAnalytics, isLoading: teamLoading } = useQuery({
    queryKey: ['team-analytics'],
    queryFn: async (): Promise<TeamAnalytics> => {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      if (error) throw error;
      return safeConvertTeamAnalytics(data);
    }
  });

  const { data: complianceMetrics, isLoading: complianceLoading } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: async (): Promise<ComplianceMetrics> => {
      const { data, error } = await supabase.rpc('get_compliance_metrics');
      if (error) throw error;
      return safeConvertComplianceMetrics(data);
    }
  });

  if (executiveLoading || teamLoading || complianceLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse h-20 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${executiveMetrics?.totalRevenue?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveMetrics?.totalUsers?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveMetrics?.activeProjects || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executiveMetrics?.complianceScore || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Total Teams: {teamAnalytics?.totalTeams || 0}</div>
              <div>Total Members: {teamAnalytics?.totalMembers || 0}</div>
              <div>Performance Average: {teamAnalytics?.performance_average || 0}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Overall Score: {complianceMetrics?.overall_compliance || 0}%</div>
              <div>Compliant Teams: {complianceMetrics?.compliantTeams || 0}</div>
              <div>Active Issues: {complianceMetrics?.active_issues || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
