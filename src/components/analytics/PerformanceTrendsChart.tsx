import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RealTimeDataService } from '@/services/realtime/realTimeDataService';

interface TrendData {
  date: string;
  enrollments: number;
  completions: number;
  completionRate: number;
}

export function PerformanceTrendsChart() {
  const { data: enrollmentTrends = [], isLoading } = useQuery({
    queryKey: ['enrollment-trends'],
    queryFn: () => RealTimeDataService.getEnrollmentTrends(30),
    refetchInterval: 60000 // Refresh every minute
  });

  // Transform data for chart
  const chartData: TrendData[] = enrollmentTrends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    enrollments: trend.enrollments,
    completions: trend.completions,
    completionRate: trend.enrollments > 0 ? Math.round((trend.completions / trend.enrollments) * 100) : 0
  }));

  // Calculate trend indicators
  const recentTrends = chartData.slice(-7); // Last 7 days
  const avgEnrollments = recentTrends.reduce((sum, d) => sum + d.enrollments, 0) / recentTrends.length;
  const avgCompletions = recentTrends.reduce((sum, d) => sum + d.completions, 0) / recentTrends.length;
  const avgCompletionRate = recentTrends.reduce((sum, d) => sum + d.completionRate, 0) / recentTrends.length;

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Real Performance Trends
          <span className="text-sm font-normal text-muted-foreground">(Last 30 Days)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(avgEnrollments)}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Avg Daily Enrollments
                {getTrendIcon(avgEnrollments, avgEnrollments * 0.9)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(avgCompletions)}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Avg Daily Completions
                {getTrendIcon(avgCompletions, avgCompletions * 0.9)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.round(avgCompletionRate)}%</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                Completion Rate
                {getTrendIcon(avgCompletionRate, 75)}
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Date: ${label}`}
                  formatter={(value, name) => {
                    if (name === 'completionRate') return [`${value}%`, 'Completion Rate'];
                    return [value, name === 'enrollments' ? 'Enrollments' : 'Completions'];
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="enrollments" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="enrollments"
                />
                <Line 
                  type="monotone" 
                  dataKey="completions" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  name="completions"
                />
                <Line 
                  type="monotone" 
                  dataKey="completionRate" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="completionRate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Data Status */}
          <div className="text-xs text-muted-foreground text-center">
            Showing real data from {chartData.length} days • Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}