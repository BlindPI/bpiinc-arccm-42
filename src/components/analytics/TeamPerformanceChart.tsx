
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { TeamPerformanceMetrics } from '@/types/analytics';

interface TeamPerformanceChartProps {
  data: TeamPerformanceMetrics[];
  loading: boolean;
}

export const TeamPerformanceChart: React.FC<TeamPerformanceChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No performance data available</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data - group by team
  const chartData = data.reduce((acc, metric) => {
    const existingTeam = acc.find(item => item.team_id === metric.team_id);
    
    if (existingTeam) {
      // Update with latest data
      if (new Date(metric.calculated_at) > new Date(existingTeam.calculated_at)) {
        Object.assign(existingTeam, metric);
      }
    } else {
      acc.push({
        ...metric,
        team_name: `Team ${metric.team_id.slice(0, 8)}`
      });
    }
    
    return acc;
  }, [] as any[]);

  const topPerformers = chartData
    .sort((a, b) => b.compliance_score - a.compliance_score)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {chartData.reduce((sum, team) => sum + team.certificates_issued, 0)}
            </div>
            <p className="text-sm text-gray-600">Total Certificates</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {chartData.reduce((sum, team) => sum + team.courses_conducted, 0)}
            </div>
            <p className="text-sm text-gray-600">Courses Conducted</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(chartData.reduce((sum, team) => sum + team.compliance_score, 0) / chartData.length || 0)}%
            </div>
            <p className="text-sm text-gray-600">Avg Compliance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {chartData.reduce((sum, team) => sum + team.training_hours_delivered, 0)}
            </div>
            <p className="text-sm text-gray-600">Training Hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Team Compliance Scores</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPerformers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="team_name" 
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${Math.round(value)}%`, 
                  'Compliance Score'
                ]}
              />
              <Bar 
                dataKey="compliance_score" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={topPerformers.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team_name" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="compliance_score" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Compliance"
              />
              <Line 
                type="monotone" 
                dataKey="member_retention_rate" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Retention"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performers List */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.slice(0, 5).map((team, index) => (
              <div key={team.team_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <div>
                    <p className="font-medium text-sm">{team.team_name}</p>
                    <p className="text-xs text-gray-600">
                      {team.certificates_issued} certificates • {team.courses_conducted} courses
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {Math.round(team.compliance_score)}%
                  </p>
                  <p className="text-xs text-gray-600">Compliance</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
