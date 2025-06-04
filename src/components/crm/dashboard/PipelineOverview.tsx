import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useCRMPipelineOverview } from '@/hooks/crm/useCRMDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';

export const PipelineOverview: React.FC = () => {
  const { data: pipelineData, isLoading, error } = useCRMPipelineOverview();

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-4" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center text-muted-foreground">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            Failed to load pipeline data
          </div>
        </CardContent>
      </Card>
    );
  }

  const pipeline = pipelineData || {
    total_pipeline_value: 0,
    weighted_pipeline_value: 0,
    opportunities_by_stage: [],
    stalled_opportunities: 0,
    closing_this_month: 0,
    average_deal_age: 0
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pipeline.total_pipeline_value)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weighted Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pipeline.weighted_pipeline_value)}
            </div>
            <p className="text-xs text-muted-foreground">
              Probability adjusted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closing This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipeline.closing_this_month}</div>
            <p className="text-xs text-muted-foreground">
              Expected to close
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stalled Deals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {pipeline.stalled_opportunities}
            </div>
            <p className="text-xs text-muted-foreground">
              No activity 14+ days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline by Stage */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline by Stage</CardTitle>
          <CardDescription>
            Opportunities distribution across sales stages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pipeline.opportunities_by_stage.map((stage, index) => {
              const percentage = pipeline.total_pipeline_value > 0 
                ? (stage.total_value / pipeline.total_pipeline_value) * 100 
                : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{stage.stage_name}</span>
                      <Badge variant="secondary">
                        {stage.opportunity_count} deals
                      </Badge>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(stage.total_value)}
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}% of pipeline</span>
                    <span>Avg: {stage.avg_probability}% probability</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Health</CardTitle>
          <CardDescription>Key indicators for pipeline performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Deal Age</span>
                <span className="text-sm">{pipeline.average_deal_age} days</span>
              </div>
              <Progress 
                value={Math.min((pipeline.average_deal_age / 90) * 100, 100)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                Target: Under 60 days
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pipeline Velocity</span>
                <Badge variant={pipeline.stalled_opportunities > 5 ? "destructive" : "default"}>
                  {pipeline.stalled_opportunities > 5 ? "Slow" : "Good"}
                </Badge>
              </div>
              <Progress 
                value={Math.max(100 - (pipeline.stalled_opportunities * 10), 0)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {pipeline.stalled_opportunities} stalled opportunities
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};