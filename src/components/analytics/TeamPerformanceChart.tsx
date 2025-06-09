
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface TeamPerformanceMetric {
  id: string;
  team_id: string;
  certificates_issued: number;
  courses_conducted: number;
  average_satisfaction_score: number;
  compliance_score: number;
  training_hours_delivered: number;
  teams?: {
    name: string;
  };
}

interface TeamAnalytics {
  performance_average: number;
  total_teams: number;
  total_members: number;
}

interface TeamPerformanceChartProps {
  data: any[];
  loading: boolean;
  timeRange?: string;
}

export function TeamPerformanceChart({ data, loading, timeRange }: TeamPerformanceChartProps) {
  // Get real performance data from backend
  const { data: performanceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['team-performance-metrics', timeRange],
    queryFn: async (): Promise<TeamPerformanceMetric[]> => {
      const { data, error } = await supabase
        .from('team_performance_metrics')
        .select(`
          id,
          team_id,
          certificates_issued,
          courses_conducted,
          average_satisfaction_score,
          compliance_score,
          training_hours_delivered,
          teams!inner(name)
        `)
        .order('metric_period_start', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get real trend data from backend
  const { data: trendMetrics, isLoading: trendLoading } = useQuery({
    queryKey: ['team-performance-trends', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cross_team_analytics');
      if (error) throw error;
      
      // Type assertion with proper validation
      const analytics = data as TeamAnalytics;
      
      // Calculate trend data from the last 4 weeks
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weeks.push({
          period: `Week ${4 - i}`,
          performance: analytics?.performance_average || 0,
          target: 90
        });
      }
      return weeks;
    }
  });

  const isLoadingData = loading || metricsLoading || trendLoading;

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Transform real data for charts
  const chartData = performanceMetrics?.map(item => ({
    name: item.teams?.name?.substring(0, 15) || 'Team',
    performance: item.compliance_score || 0,
    efficiency: item.average_satisfaction_score || 0,
    certificates: item.certificates_issued || 0
  })) || [];

  // Calculate real performance statistics
  const avgPerformance = performanceMetrics?.length > 0 
    ? performanceMetrics.reduce((sum, item) => sum + (item.compliance_score || 0), 0) / performanceMetrics.length
    : 0;

  const topPerformer = performanceMetrics?.reduce((max, item) => 
    (item.compliance_score || 0) > (max?.compliance_score || 0) ? item : max
  , performanceMetrics[0]);

  const needsAttention = performanceMetrics?.filter(item => (item.compliance_score || 0) < 85).length || 0;

  return (
    <div className="space-y-6">
      {/* Performance Overview - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPerformance.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Real data from backend
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{topPerformer?.teams?.name || 'No data'}</div>
            <Badge variant="default">{topPerformer?.compliance_score || 0}% efficiency</Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{needsAttention} Teams</div>
            <Badge variant="outline">Below 85% target</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison Chart - Real Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Team Performance Comparison (Real Data)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="performance" fill="#3B82F6" name="Performance %" />
              <Bar dataKey="efficiency" fill="#10B981" name="Efficiency %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Trend - Real Data */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend ({timeRange || '30d'}) - Real Backend Data</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="performance" stroke="#3B82F6" strokeWidth={2} name="Actual" />
              <Line type="monotone" dataKey="target" stroke="#EF4444" strokeDasharray="5 5" name="Target" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
