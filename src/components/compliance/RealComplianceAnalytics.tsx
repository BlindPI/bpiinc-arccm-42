
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ComplianceAnalytics {
  metric_name: string;
  basic_completion_rate: number;
  robust_completion_rate: number;
  total_users: number;
  completed_users: number;
  pending_users: number;
  overdue_users: number;
}

interface TierDistribution {
  tier_name: string;
  user_count: number;
  completion_percentage: number;
  avg_score: number;
}

export function RealComplianceAnalytics() {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['compliance-analytics'],
    queryFn: async (): Promise<ComplianceAnalytics[]> => {
      const { data, error } = await supabase.rpc('get_compliance_analytics');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: tierData, isLoading: tierLoading, error: tierError } = useQuery({
    queryKey: ['tier-distribution'],
    queryFn: async (): Promise<TierDistribution[]> => {
      const { data, error } = await supabase.rpc('get_tier_distribution');
      if (error) throw error;
      return data || [];
    }
  });

  if (analyticsLoading || tierLoading) {
    return <ComplianceAnalyticsSkeleton />;
  }

  if (analyticsError || tierError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Analytics Error:</strong> {analyticsError?.message || tierError?.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate summary statistics
  const totalUsers = tierData?.reduce((sum, tier) => sum + Number(tier.user_count), 0) || 0;
  const overallCompletionRate = totalUsers > 0 
    ? Math.round((analytics?.reduce((sum, metric) => sum + Number(metric.completed_users), 0) || 0) / totalUsers * 100)
    : 0;

  // Prepare chart data
  const tierChartData = tierData?.map(tier => ({
    name: tier.tier_name.charAt(0).toUpperCase() + tier.tier_name.slice(1),
    users: Number(tier.user_count),
    completion: Number(tier.completion_percentage),
    score: Number(tier.avg_score)
  })) || [];

  const metricsChartData = analytics?.slice(0, 5).map(metric => ({
    metric: metric.metric_name,
    basic: Number(metric.basic_completion_rate),
    robust: Number(metric.robust_completion_rate),
    total: Number(metric.total_users)
  })) || [];

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Across all compliance tiers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCompletionRate}%</div>
            <Progress value={overallCompletionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.reduce((sum, metric) => sum + Number(metric.pending_users), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.reduce((sum, metric) => sum + Number(metric.overdue_users), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tier Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Compliance Tier Distribution
            </CardTitle>
            <CardDescription>
              User distribution across compliance tiers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, users, percent }) => 
                      `${name}: ${users} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="users"
                  >
                    {tierChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Users']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Completion Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Completion Rates by Metric
            </CardTitle>
            <CardDescription>
              Comparison of basic vs robust tier completion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="metric" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Completion Rate']} />
                  <Legend />
                  <Bar name="Basic Tier" dataKey="basic" fill="#3B82F6" />
                  <Bar name="Robust Tier" dataKey="robust" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detailed Compliance Metrics
          </CardTitle>
          <CardDescription>
            Comprehensive breakdown of all compliance requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Metric</th>
                  <th className="text-center p-2 font-medium">Total Users</th>
                  <th className="text-center p-2 font-medium">Basic Completion</th>
                  <th className="text-center p-2 font-medium">Robust Completion</th>
                  <th className="text-center p-2 font-medium">Completed</th>
                  <th className="text-center p-2 font-medium">Pending</th>
                  <th className="text-center p-2 font-medium">Overdue</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.map((metric, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{metric.metric_name}</td>
                    <td className="p-2 text-center">{metric.total_users}</td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="bg-blue-50">
                        {metric.basic_completion_rate}%
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <Badge variant="outline" className="bg-purple-50">
                        {metric.robust_completion_rate}%
                      </Badge>
                    </td>
                    <td className="p-2 text-center text-green-600 font-medium">
                      {metric.completed_users}
                    </td>
                    <td className="p-2 text-center text-orange-600 font-medium">
                      {metric.pending_users}
                    </td>
                    <td className="p-2 text-center text-red-600 font-medium">
                      {metric.overdue_users}
                    </td>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
