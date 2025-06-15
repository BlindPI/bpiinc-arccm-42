
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, BarChart3, PieChart, Download, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CRMAnalyticsService } from '@/services/crm/crmAnalyticsService';
import { PipelineAnalyticsChart } from './PipelineAnalyticsChart';
import { RevenueAnalyticsChart } from './RevenueAnalyticsChart';
import { ConversionFunnelChart } from './ConversionFunnelChart';
import { LeadSourceAnalytics } from './LeadSourceAnalytics';
import { SalesPerformanceMetrics } from './SalesPerformanceMetrics';
import { ForecastingDashboard } from './ForecastingDashboard';

interface DateRange {
  start: Date;
  end: Date;
}

export function AdvancedCRMAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['crm-analytics', selectedPeriod, dateRange],
    queryFn: () => CRMAnalyticsService.getAdvancedAnalytics(dateRange)
  });

  const { data: pipelineMetrics } = useQuery({
    queryKey: ['pipeline-metrics', selectedPeriod],
    queryFn: () => CRMAnalyticsService.getPipelineMetrics(dateRange)
  });

  const { data: revenueMetrics } = useQuery({
    queryKey: ['revenue-metrics', selectedPeriod],
    queryFn: () => CRMAnalyticsService.getRevenueMetrics(dateRange)
  });

  const handleExportReport = () => {
    CRMAnalyticsService.exportAnalyticsReport(dateRange, 'comprehensive');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM Analytics Dashboard</h1>
          <p className="text-muted-foreground">Advanced insights into your sales performance</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <SalesPerformanceMetrics 
        data={analyticsData} 
        period={selectedPeriod}
      />

      {/* Analytics Tabs */}
      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Pipeline Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PipelineAnalyticsChart data={pipelineMetrics} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Pipeline Velocity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Deal Size</span>
                    <span className="text-lg font-bold">${analyticsData?.averageDealSize?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Close Time</span>
                    <span className="text-lg font-bold">{analyticsData?.averageCloseTime || '0'} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Win Rate</span>
                    <span className="text-lg font-bold">{analyticsData?.winRate || '0'}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <RevenueAnalyticsChart data={revenueMetrics} />
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <ConversionFunnelChart data={analyticsData?.conversionFunnel} />
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <LeadSourceAnalytics data={analyticsData?.leadSources} />
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-6">
          <ForecastingDashboard dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Team performance metrics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
