
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { safeConvertTeamAnalytics } from '@/utils/typeGuards';
import type { TeamAnalytics } from '@/types/team-management';

export function TeamPerformanceChart() {
  const { data: teamAnalytics, isLoading } = useQuery({
    queryKey: ['team-performance-chart'],
    queryFn: async (): Promise<TeamAnalytics> => {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      if (error) throw error;
      return safeConvertTeamAnalytics(data);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse">Loading chart...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock chart data based on team analytics
  const chartData = [
    { month: 'Jan', performance: teamAnalytics?.performance_average || 0 },
    { month: 'Feb', performance: (teamAnalytics?.performance_average || 0) + 2 },
    { month: 'Mar', performance: (teamAnalytics?.performance_average || 0) + 4 },
    { month: 'Apr', performance: (teamAnalytics?.performance_average || 0) + 1 },
    { month: 'May', performance: (teamAnalytics?.performance_average || 0) + 6 },
    { month: 'Jun', performance: (teamAnalytics?.performance_average || 0) + 3 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="performance" 
              stroke="#8884d8" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-gray-600">
          Current average performance: {teamAnalytics?.performance_average || 0}%
        </div>
      </CardContent>
    </Card>
  );
}
