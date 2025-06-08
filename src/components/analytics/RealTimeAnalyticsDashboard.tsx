
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Shield, 
  MapPin, 
  AlertTriangle,
  Activity,
  BarChart3
} from 'lucide-react';
import { realTimeAnalyticsService } from '@/services/analytics/realTimeAnalyticsService';
import { LocationHeatmap } from './LocationHeatmap';
import { ComplianceRiskMatrix } from './ComplianceRiskMatrix';
import { TeamPerformanceChart } from './TeamPerformanceChart';

export const RealTimeAnalyticsDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: executiveData, isLoading: loadingExecutive } = useQuery({
    queryKey: ['executive-dashboard'],
    queryFn: () => realTimeAnalyticsService.getExecutiveDashboardData(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: heatmapData, isLoading: loadingHeatmap } = useQuery({
    queryKey: ['location-heatmap'],
    queryFn: () => realTimeAnalyticsService.getLocationHeatmapData(),
    refetchInterval: 60000 // Refresh every minute
  });

  const { data: riskScores, isLoading: loadingRisks } = useQuery({
    queryKey: ['compliance-risks'],
    queryFn: () => realTimeAnalyticsService.getComplianceRiskScores(),
    refetchInterval: 300000 // Refresh every 5 minutes
  });

  const { data: teamMetrics, isLoading: loadingTeamMetrics } = useQuery({
    queryKey: ['team-metrics', selectedTimeRange],
    queryFn: () => {
      const endDate = new Date();
      const startDate = new Date();
      const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : 90;
      startDate.setDate(startDate.getDate() - days);
      
      return realTimeAnalyticsService.getTeamPerformanceMetrics(undefined, startDate, endDate);
    }
  });

  const generateLocationHeatmap = async () => {
    await realTimeAnalyticsService.generateLocationHeatmap();
    // Trigger refresh of heatmap data
    window.location.reload();
  };

  if (loadingExecutive) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executiveData?.totalTeams || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active enterprise teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executiveData?.activeMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(executiveData?.complianceScore || 0)}%
            </div>
            <Progress 
              value={executiveData?.complianceScore || 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Index</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(executiveData?.performanceIndex || 0)}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-2">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +2.5% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {executiveData?.riskAlerts && executiveData.riskAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Critical Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {executiveData.riskAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <span className="font-medium">{alert.entity_name}</span>
                    <Badge variant="destructive" className="ml-2">
                      {alert.risk_level}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-600">
                    Risk Score: {alert.risk_score}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Team Performance</TabsTrigger>
          <TabsTrigger value="heatmap">Location Heatmap</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Matrix</TabsTrigger>
          <TabsTrigger value="trends">Predictive Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Team Performance Analytics</h3>
            <div className="flex gap-2">
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

          <TeamPerformanceChart 
            data={teamMetrics || []} 
            loading={loadingTeamMetrics} 
          />
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Location Performance Heatmap</h3>
            <Button onClick={generateLocationHeatmap} disabled={loadingHeatmap}>
              <MapPin className="h-4 w-4 mr-2" />
              Refresh Heatmap
            </Button>
          </div>

          <LocationHeatmap 
            data={heatmapData || []} 
            loading={loadingHeatmap} 
          />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Compliance Risk Matrix</h3>
          </div>

          <ComplianceRiskMatrix 
            data={riskScores || []} 
            loading={loadingRisks} 
          />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">
                  Predictive models are being trained with your data.
                  Advanced forecasting will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
