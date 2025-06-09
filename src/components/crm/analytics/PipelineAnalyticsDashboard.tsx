
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, DollarSign, Target, Users } from 'lucide-react';

export function PipelineAnalyticsDashboard() {
  const { data: pipelineData, isLoading } = useQuery({
    queryKey: ['pipeline-analytics'],
    queryFn: () => RevenueAnalyticsService.getPipelineAnalytics()
  });

  const { data: conversionData } = useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: () => RevenueAnalyticsService.getConversionFunnelData()
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const stageColors = {
    prospect: '#8884d8',
    proposal: '#82ca9d',
    negotiation: '#ffc658',
    closed_won: '#00C49F',
    closed_lost: '#FF8042'
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pipelineData?.totalPipelineValue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all stages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineData?.stageDistribution?.reduce((sum, stage) => sum + stage.opportunity_count, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In pipeline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pipelineData?.averageDealSize || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per opportunity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Velocity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineData?.salesVelocity || 0} days
            </div>
            <p className="text-xs text-muted-foreground">
              Average cycle
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline by Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
            <CardDescription>Opportunity value distribution across sales stages</CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineData?.stageDistribution && pipelineData.stageDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineData.stageDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage_name" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Value']} />
                  <Bar dataKey="total_value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-muted-foreground">
                No pipeline data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stage Distribution</CardTitle>
            <CardDescription>Proportion of opportunities by stage</CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineData?.stageDistribution && pipelineData.stageDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pipelineData.stageDistribution}
                    dataKey="opportunity_count"
                    nameKey="stage_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pipelineData.stageDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={stageColors[entry.stage as keyof typeof stageColors] || '#8884d8'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-muted-foreground">
                No stage data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stage Details */}
      <Card>
        <CardHeader>
          <CardTitle>Stage Details</CardTitle>
          <CardDescription>Detailed breakdown of each pipeline stage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelineData?.stageDistribution && pipelineData.stageDistribution.length > 0 ? 
              pipelineData.stageDistribution.map((stage) => (
                <div key={stage.stage} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: stageColors[stage.stage as keyof typeof stageColors] || '#8884d8' }}
                    />
                    <div>
                      <h4 className="font-medium">{stage.stage_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {stage.opportunity_count} opportunities
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(stage.total_value)}</div>
                    <Badge variant="outline">
                      {((stage.total_value / (pipelineData?.totalPipelineValue || 1)) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              )) : (
              <div className="text-center py-8 text-muted-foreground">
                No pipeline stages to display
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
