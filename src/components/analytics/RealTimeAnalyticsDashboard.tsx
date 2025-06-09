
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Shield, 
  MapPin, 
  AlertTriangle,
  Activity,
  BarChart3,
  Download,
  Filter,
  Refresh
} from 'lucide-react';
import { RealTimeAnalyticsService } from '@/services/analytics/realTimeAnalyticsService';
import { TeamAnalyticsService } from '@/services/team/teamAnalyticsService';
import { RealTeamAnalyticsService } from '@/services/team/realTeamAnalyticsService';
import { LocationHeatmap } from './LocationHeatmap';
import { ComplianceRiskMatrix } from './ComplianceRiskMatrix';
import { TeamPerformanceChart } from './TeamPerformanceChart';
import { CustomizableDashboard } from './CustomizableDashboard';
import { DashboardExportPanel } from './DashboardExportPanel';

export const RealTimeAnalyticsDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [dashboardView, setDashboardView] = useState<'executive' | 'operational' | 'custom'>('executive');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time executive dashboard data
  const { data: executiveData, isLoading: loadingExecutive, refetch: refetchExecutive } = useQuery({
    queryKey: ['executive-dashboard'],
    queryFn: () => RealTimeAnalyticsService.getExecutiveDashboardData(),
    refetchInterval: autoRefresh ? 30000 : false
  });

  // Real team analytics data
  const { data: teamAnalytics, isLoading: loadingTeamAnalytics } = useQuery({
    queryKey: ['team-analytics-summary'],
    queryFn: () => RealTeamAnalyticsService.getSystemWideAnalytics(),
    refetchInterval: autoRefresh ? 60000 : false
  });

  // Location heatmap data
  const { data: heatmapData, isLoading: loadingHeatmap } = useQuery({
    queryKey: ['location-heatmap'],
    queryFn: () => RealTimeAnalyticsService.getLocationHeatmapData(),
    refetchInterval: autoRefresh ? 300000 : false
  });

  // Compliance risk scores
  const { data: riskScores, isLoading: loadingRisks } = useQuery({
    queryKey: ['compliance-risks'],
    queryFn: () => RealTimeAnalyticsService.getComplianceRiskScores(),
    refetchInterval: autoRefresh ? 300000 : false
  });

  // Team performance metrics with time range
  const { data: teamMetrics, isLoading: loadingTeamMetrics } = useQuery({
    queryKey: ['team-metrics', selectedTimeRange],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      startDate.setDate(startDate.getDate() - days);
      
      return RealTimeAnalyticsService.getTeamPerformanceMetrics(undefined, startDate, endDate);
    },
    refetchInterval: autoRefresh ? 60000 : false
  });

  const handleManualRefresh = () => {
    refetchExecutive();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  if (loadingExecutive || loadingTeamAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Analytics Dashboard</h1>
          <p className="text-muted-foreground">Live enterprise performance insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={dashboardView} onValueChange={setDashboardView}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="executive">Executive View</SelectItem>
              <SelectItem value="operational">Operational View</SelectItem>
              <SelectItem value="custom">Custom View</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={toggleAutoRefresh}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleManualRefresh}>
            <Refresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <DashboardExportPanel 
            dashboardData={{
              executive: executiveData,
              teams: teamAnalytics,
              heatmap: heatmapData,
              risks: riskScores
            }}
          />
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamAnalytics?.totalTeams || 0}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamAnalytics?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(teamAnalytics?.averagePerformance || 0)}%
            </div>
            <Progress 
              value={teamAnalytics?.averagePerformance || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(teamAnalytics?.averageCompliance || 0)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +1.2% from last week
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conditional Dashboard Views */}
      {dashboardView === 'custom' ? (
        <CustomizableDashboard 
          teamAnalytics={teamAnalytics}
          executiveData={executiveData}
          heatmapData={heatmapData}
          riskScores={riskScores}
        />
      ) : (
        /* Analytics Tabs */
        <Tabs defaultValue="performance" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="performance">Team Performance</TabsTrigger>
              <TabsTrigger value="heatmap">Location Heatmap</TabsTrigger>
              <TabsTrigger value="compliance">Compliance Matrix</TabsTrigger>
              <TabsTrigger value="predictive">Predictive Analytics</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Button
                variant={selectedTimeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeRange('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={selectedTimeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeRange('30d')}
              >
                30 Days
              </Button>
              <Button
                variant={selectedTimeRange === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeRange('90d')}
              >
                90 Days
              </Button>
            </div>
          </div>

          <TabsContent value="performance" className="space-y-4">
            <TeamPerformanceChart 
              data={teamMetrics || []} 
              loading={loadingTeamMetrics}
              timeRange={selectedTimeRange}
            />
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-4">
            <LocationHeatmap 
              data={heatmapData || []} 
              loading={loadingHeatmap} 
            />
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <ComplianceRiskMatrix 
              data={riskScores || []} 
              loading={loadingRisks} 
            />
          </TabsContent>

          <TabsContent value="predictive" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Predictive Analytics Engine</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">
                    AI-powered predictive models are analyzing your team performance data.
                  </p>
                  <p className="text-sm text-gray-500">
                    Advanced forecasting and trend analysis will be available soon.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
