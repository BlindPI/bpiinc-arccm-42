
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  Legend,
  LineChart,
  Line
} from 'recharts';
import { TierComparisonChart } from './TierComparisonChart';
import { Shield, Users, TrendingUp, AlertTriangle, Activity, CheckCircle } from 'lucide-react';

export function RealComplianceAnalytics() {
  const [selectedView, setSelectedView] = useState('overview');

  const { data: analyticsData, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['compliance-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_compliance_analytics');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 300000
  });

  const { data: tierData, isLoading: tierLoading, error: tierError } = useQuery({
    queryKey: ['tier-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_tier_distribution');
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 300000
  });

  const isLoading = analyticsLoading || tierLoading;
  const hasError = analyticsError || tierError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Analytics Error:</strong> Unable to load compliance analytics data. 
          {analyticsError && <span className="block mt-1">Analytics: {analyticsError.message}</span>}
          {tierError && <span className="block mt-1">Tiers: {tierError.message}</span>}
        </AlertDescription>
      </Alert>
    );
  }

  // Calculate summary statistics
  const totalUsers = tierData?.reduce((sum: number, tier: any) => sum + Number(tier.user_count), 0) || 0;
  const basicUsers = tierData?.find((t: any) => t.tier_name === 'basic')?.user_count || 0;
  const robustUsers = tierData?.find((t: any) => t.tier_name === 'robust')?.user_count || 0;
  const unassignedUsers = tierData?.find((t: any) => t.tier_name === 'unassigned')?.user_count || 0;

  const totalPending = analyticsData?.reduce((sum: number, metric: any) => 
    sum + Number(metric.pending_users), 0) || 0;
  const totalOverdue = analyticsData?.reduce((sum: number, metric: any) => 
    sum + Number(metric.overdue_users), 0) || 0;

  const avgBasicCompletion = analyticsData?.length > 0 ? 
    analyticsData.reduce((sum: number, metric: any) => sum + Number(metric.basic_completion_rate), 0) / analyticsData.length : 0;
  const avgRobustCompletion = analyticsData?.length > 0 ? 
    analyticsData.reduce((sum: number, metric: any) => sum + Number(metric.robust_completion_rate), 0) / analyticsData.length : 0;

  // Prepare chart data
  const tierDistributionData = tierData?.map((tier: any) => ({
    name: tier.tier_name === 'unassigned' ? 'Unassigned' : 
          tier.tier_name === 'basic' ? 'Basic Tier' : 'Robust Tier',
    value: Number(tier.user_count),
    completion: Number(tier.completion_percentage)
  })) || [];

  const metricsComparisonData = analyticsData?.map((metric: any) => ({
    metric: metric.metric_name,
    basic: Number(metric.basic_completion_rate),
    robust: Number(metric.robust_completion_rate),
    totalBasic: Number(metric.total_users_basic),
    totalRobust: Number(metric.total_users_robust)
  })) || [];

  const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

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
              {basicUsers} basic, {robustUsers} robust
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">
              {totalOverdue} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Basic Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgBasicCompletion)}%</div>
            <p className="text-xs text-muted-foreground">Average across metrics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Robust Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgRobustCompletion)}%</div>
            <p className="text-xs text-muted-foreground">Average across metrics</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={tierDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {tierDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Completion Rates by Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tierDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Completion Rate']} />
                    <Bar dataKey="completion" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Distribution Across Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tierDistributionData.map((tier, index) => (
                  <div key={tier.name} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{tier.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{tier.value} users</div>
                      <div className="text-sm text-muted-foreground">{tier.completion}% complete</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Metrics Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metricsComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="metric" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis label={{ value: 'Completion %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value}%`, 
                      name === 'basic' ? 'Basic Tier' : 'Robust Tier'
                    ]} 
                  />
                  <Legend />
                  <Bar name="basic" dataKey="basic" fill="#3B82F6" />
                  <Bar name="robust" dataKey="robust" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <TierComparisonChart />
        </TabsContent>
      </Tabs>

      {/* Show data status for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <div>Analytics Records: {analyticsData?.length || 0}</div>
            <div>Tier Records: {tierData?.length || 0}</div>
            <div>Total Users: {totalUsers}</div>
            <div>Unassigned Users: {unassignedUsers}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
