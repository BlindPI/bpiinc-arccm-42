
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target,
  Filter,
  BarChart3,
  PieChart
} from 'lucide-react';
import { RevenueAnalyticsService } from '@/services/crm/revenueAnalyticsService';
import { formatCurrency } from '@/lib/utils';

export function PipelineAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<string>('30');

  const { data: pipelineData, isLoading, refetch } = useQuery({
    queryKey: ['pipeline-analytics', timeRange],
    queryFn: () => RevenueAnalyticsService.getPipelineAnalytics()
  });

  const { data: conversionFunnel } = useQuery({
    queryKey: ['conversion-funnel'],
    queryFn: () => RevenueAnalyticsService.getConversionFunnelData()
  });

  const totalPipelineValue = pipelineData?.reduce((sum, stage) => sum + stage.total_value, 0) || 0;
  const totalOpportunities = pipelineData?.reduce((sum, stage) => sum + stage.opportunity_count, 0) || 0;
  const avgDealSize = totalOpportunities > 0 ? totalPipelineValue / totalOpportunities : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pipeline Analytics</h2>
          <p className="text-muted-foreground">
            Real-time pipeline performance and conversion metrics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPipelineValue)}</div>
            <p className="text-xs text-muted-foreground">
              Total opportunities value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOpportunities}</div>
            <p className="text-xs text-muted-foreground">
              Open opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deal Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgDealSize)}</div>
            <p className="text-xs text-muted-foreground">
              Average opportunity value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversionFunnel?.conversionRate.leadToOpportunity.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Lead to opportunity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stage Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pipeline Stage Analysis
          </CardTitle>
          <CardDescription>
            Opportunity distribution and performance by pipeline stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipelineData?.map((stage, index) => {
              const stagePercentage = totalPipelineValue > 0 ? (stage.total_value / totalPipelineValue) * 100 : 0;
              const avgDealSizeForStage = stage.opportunity_count > 0 ? stage.total_value / stage.opportunity_count : 0;

              return (
                <div key={stage.stage_name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                        }`} />
                        <span className="font-medium capitalize">
                          {stage.stage_name.replace('_', ' ')}
                        </span>
                      </div>
                      <Badge variant="outline">
                        {stage.opportunity_count} opps
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(stage.total_value)}</div>
                      <div className="text-sm text-muted-foreground">
                        {stagePercentage.toFixed(1)}% of pipeline
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={stagePercentage} className="h-2" />
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Avg probability: {stage.avg_probability.toFixed(1)}%</span>
                    <span>Avg deal size: {formatCurrency(avgDealSizeForStage)}</span>
                  </div>
                </div>
              );
            })}

            {(!pipelineData || pipelineData.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pipeline data available</p>
                <p className="text-sm">Create opportunities to see pipeline analytics</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      {conversionFunnel && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              Lead progression through the sales pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Lead Status Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(conversionFunnel.leadsByStatus).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Opportunity Stage Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(conversionFunnel.oppsByStage).map(([stage, count]) => (
                      <div key={stage} className="flex justify-between items-center">
                        <span className="capitalize">{stage.replace('_', ' ')}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {conversionFunnel.conversionRate.leadToOpportunity.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Lead → Opportunity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {conversionFunnel.conversionRate.opportunityToWon.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Opportunity → Won</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
