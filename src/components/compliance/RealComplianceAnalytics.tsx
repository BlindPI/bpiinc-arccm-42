
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Users, Shield } from 'lucide-react';

interface ComplianceAnalyticsData {
  metric_name: string;
  basic_completion_rate: number;
  robust_completion_rate: number;
  total_users_basic: number;
  total_users_robust: number;
  completed_basic: number;
  completed_robust: number;
  pending_users: number;
  overdue_users: number;
}

interface TierDistributionData {
  tier_name: string;
  user_count: number;
  completion_percentage: number;
}

export function RealComplianceAnalytics() {
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['real-compliance-analytics'],
    queryFn: async (): Promise<ComplianceAnalyticsData[]> => {
      const { data, error } = await supabase.rpc('get_compliance_analytics');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: tierData, isLoading: tierLoading } = useQuery({
    queryKey: ['tier-distribution'],
    queryFn: async (): Promise<TierDistributionData[]> => {
      const { data, error } = await supabase.rpc('get_tier_distribution');
      if (error) throw error;
      return data || [];
    }
  });

  if (analyticsLoading || tierLoading) {
    return <ComplianceAnalyticsSkeleton />;
  }

  if (!analyticsData || !tierData) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load compliance analytics data
        </AlertDescription>
      </Alert>
    );
  }

  // Transform data for charts
  const comparisonData = analyticsData.map(item => ({
    name: item.metric_name,
    basic: Number(item.basic_completion_rate),
    robust: Number(item.robust_completion_rate)
  }));

  const tierDistributionChart = tierData.filter(t => t.tier_name !== 'unassigned').map(tier => ({
    name: tier.tier_name === 'basic' ? 'Basic Tier' : 'Robust Tier',
    value: Number(tier.user_count),
    completion: Number(tier.completion_percentage)
  }));

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tierData.reduce((sum, tier) => sum + Number(tier.user_count), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.reduce((sum, item) => sum + Number(item.pending_users), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(tierData.reduce((sum, tier) => sum + Number(tier.completion_percentage), 0) / tierData.length)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.reduce((sum, item) => sum + Number(item.overdue_users), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tier Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                <Bar dataKey="basic" name="Basic Tier" fill="#3B82F6" />
                <Bar dataKey="robust" name="Robust Tier" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Distribution by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierDistributionChart}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierDistributionChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Compliance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-center py-2">Basic Tier</th>
                  <th className="text-center py-2">Robust Tier</th>
                  <th className="text-center py-2">Pending</th>
                  <th className="text-center py-2">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {analyticsData.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{item.metric_name}</td>
                    <td className="text-center py-2">
                      {Number(item.basic_completion_rate).toFixed(1)}%
                      <span className="text-xs text-muted-foreground ml-1">
                        ({item.completed_basic}/{item.total_users_basic})
                      </span>
                    </td>
                    <td className="text-center py-2">
                      {Number(item.robust_completion_rate).toFixed(1)}%
                      <span className="text-xs text-muted-foreground ml-1">
                        ({item.completed_robust}/{item.total_users_robust})
                      </span>
                    </td>
                    <td className="text-center py-2">{item.pending_users}</td>
                    <td className="text-center py-2">{item.overdue_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ComplianceAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
