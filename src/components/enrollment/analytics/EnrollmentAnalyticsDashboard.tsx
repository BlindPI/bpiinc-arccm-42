import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Users,
  FileText,
  Award,
  RefreshCw,
  BarChart3,
  PieChart,
  Target,
  Zap
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { EnrollmentAnalyticsService } from '@/services/analytics/enrollmentAnalyticsService';
import { ConversionFunnelChart } from './ConversionFunnelChart';
import { WorkflowProgressChart } from './WorkflowProgressChart';
import { PerformanceTrendsChart } from './PerformanceTrendsChart';
import { RealTimeStatusPanel } from './RealTimeStatusPanel';

export function EnrollmentAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: performanceMetrics, isLoading: performanceLoading, refetch: refetchPerformance } = useQuery({
    queryKey: ['enrollment-performance-metrics'],
    queryFn: () => EnrollmentAnalyticsService.getPerformanceMetrics(),
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds if auto-refresh is on
  });

  const { data: realTimeStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
    queryKey: ['enrollment-real-time-status'],
    queryFn: () => EnrollmentAnalyticsService.getRealTimeStatus(),
    refetchInterval: autoRefresh ? 10000 : false, // 10 seconds for real-time data
  });

  const handleRefresh = () => {
    refetchPerformance();
    refetchStatus();
  };

  if (performanceLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const conversionRates = performanceMetrics?.conversionRates;
  const bottlenecks = performanceMetrics?.bottlenecks || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Enrollment Analytics</h2>
          <p className="text-muted-foreground">
            Real-time insights and performance metrics across the enrollment lifecycle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={autoRefresh ? "default" : "secondary"} className="gap-1">
            <Activity className="h-3 w-3" />
            {autoRefresh ? 'Live' : 'Paused'}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <Zap className="h-4 w-4" />
            {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="workflow">Workflow Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="realtime">Real-time Status</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Conversion</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conversionRates?.overallConversion.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Enrollment → Certificate
                </p>
                <Progress value={conversionRates?.overallConversion} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enrollment → Roster</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conversionRates?.enrollmentToRoster.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {conversionRates?.rostersCreated} of {conversionRates?.totalEnrollments} enrolled
                </p>
                <Progress value={conversionRates?.enrollmentToRoster} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Roster → Certificate</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {conversionRates?.rosterToCertificate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {conversionRates?.certificatesIssued} certificates issued
                </p>
                <Progress value={conversionRates?.rosterToCertificate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.timeToCompletion.average.toFixed(1)} days
                </div>
                <p className="text-xs text-muted-foreground">
                  Fastest: {performanceMetrics?.timeToCompletion.fastest} days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bottlenecks and Recommendations */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Workflow Bottlenecks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bottlenecks.map((bottleneck, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{bottleneck.stage}</span>
                      <Badge 
                        variant={
                          bottleneck.impact === 'high' ? 'destructive' : 
                          bottleneck.impact === 'medium' ? 'default' : 'secondary'
                        }
                      >
                        {bottleneck.impact} impact
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{bottleneck.description}</p>
                    <p className="text-sm text-blue-600">{bottleneck.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Status Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {realTimeStatus?.totalActive}
                      </div>
                      <p className="text-sm text-muted-foreground">Active Enrollments</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {realTimeStatus?.pendingApproval}
                      </div>
                      <p className="text-sm text-muted-foreground">Pending Approval</p>
                    </div>
                  </div>
                  
                  {realTimeStatus?.alerts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Recent Alerts</h4>
                      {realTimeStatus.alerts.slice(0, 3).map((alert) => (
                        <div key={alert.id} className="flex items-start gap-2 p-2 bg-muted rounded">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${
                            alert.type === 'error' ? 'bg-red-500' :
                            alert.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                          }`} />
                          <span className="text-sm">{alert.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(realTimeStatus?.lastUpdated || '').toLocaleTimeString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          <ConversionFunnelChart data={performanceMetrics?.conversionRates} />
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <WorkflowProgressChart data={performanceMetrics?.workflowStages} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceTrendsChart data={performanceMetrics?.trendsData} />
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <RealTimeStatusPanel 
            status={realTimeStatus} 
            onRefresh={handleRefresh}
            autoRefresh={autoRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}