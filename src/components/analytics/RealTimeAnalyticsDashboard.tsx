
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  RefreshCw,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CustomizableDashboard } from './CustomizableDashboard';
import { DashboardExportPanel } from './DashboardExportPanel';

interface ExecutiveMetrics {
  totalUsers: number;
  activeInstructors: number;
  totalCertificates: number;
  monthlyGrowth: number;
  complianceScore: number;
  performanceIndex: number;
  revenueMetrics?: any;
  trainingMetrics?: any;
  operationalMetrics?: any;
}

interface TeamAnalytics {
  total_teams: number;
  total_members: number;
  performance_average: number;
  compliance_score: number;
  cross_location_teams: number;
  teamsByLocation?: any;
  performanceByTeamType?: any;
}

interface ComplianceMetrics {
  overall_compliance: number;
  active_issues: number;
  resolved_issues: number;
  compliance_by_location?: any;
}

export function RealTimeAnalyticsDashboard() {
  const [viewMode, setViewMode] = useState<'executive' | 'operational' | 'custom'>('executive');
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Real-time executive metrics using actual backend function
  const { data: executiveMetrics, isLoading: executiveLoading, refetch: refetchExecutive } = useQuery({
    queryKey: ['executive-dashboard-metrics'],
    queryFn: async (): Promise<ExecutiveMetrics> => {
      const { data, error } = await supabase.rpc('get_executive_dashboard_metrics');
      if (error) throw error;
      // Type assertion with proper validation
      return data as ExecutiveMetrics;
    },
    refetchInterval: refreshInterval
  });

  // Real-time team analytics using actual backend function
  const { data: teamAnalytics, isLoading: teamLoading, refetch: refetchTeam } = useQuery({
    queryKey: ['team-analytics-summary'],
    queryFn: async (): Promise<TeamAnalytics> => {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      if (error) throw error;
      // Type assertion with proper validation
      return data as TeamAnalytics;
    },
    refetchInterval: refreshInterval
  });

  // Real-time compliance metrics using actual backend function
  const { data: complianceMetrics, isLoading: complianceLoading, refetch: refetchCompliance } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: async (): Promise<ComplianceMetrics> => {
      const { data, error } = await supabase.rpc('get_compliance_metrics');
      if (error) throw error;
      // Type assertion with proper validation
      return data as ComplianceMetrics;
    },
    refetchInterval: refreshInterval
  });

  // Real-time enterprise team metrics using actual backend function
  const { data: enterpriseMetrics, isLoading: enterpriseLoading, refetch: refetchEnterprise } = useQuery({
    queryKey: ['enterprise-team-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_enterprise_team_metrics');
      if (error) throw error;
      return data;
    },
    refetchInterval: refreshInterval
  });

  const handleManualRefresh = () => {
    refetchExecutive();
    refetchTeam();
    refetchCompliance();
    refetchEnterprise();
    setLastRefresh(new Date());
  };

  const isLoading = executiveLoading || teamLoading || complianceLoading || enterpriseLoading;

  const dashboardData = {
    executive: executiveMetrics,
    teams: teamAnalytics,
    heatmap: enterpriseMetrics,
    risks: complianceMetrics
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Real-Time Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Live enterprise performance metrics and insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={viewMode} onValueChange={(value: 'executive' | 'operational' | 'custom') => setViewMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="executive">Executive View</SelectItem>
              <SelectItem value="operational">Operational View</SelectItem>
              <SelectItem value="custom">Custom View</SelectItem>
            </SelectContent>
          </Select>
          
          <DashboardExportPanel dashboardData={dashboardData} />
          
          <Button variant="outline" onClick={handleManualRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-Time Status Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Data</span>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last updated: {lastRefresh.toLocaleTimeString()}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Auto-refresh: {refreshInterval/1000}s
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Systems Online</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4 text-blue-600" />
                <span>Data Streaming</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Dashboard Content */}
      {viewMode === 'custom' ? (
        <CustomizableDashboard
          teamAnalytics={teamAnalytics}
          executiveData={executiveMetrics}
          heatmapData={enterpriseMetrics}
          riskScores={complianceMetrics}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Executive Metrics Cards - Using Real Data */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {executiveMetrics?.totalUsers || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                {executiveMetrics?.activeInstructors || 0} active instructors
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {executiveMetrics?.totalCertificates || 0}
              </div>
              <div className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                +{executiveMetrics?.monthlyGrowth || 0}% this month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(executiveMetrics?.complianceScore || 0)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {complianceMetrics?.active_issues || 0} active issues
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(executiveMetrics?.performanceIndex || 0)}%
              </div>
              <div className="text-xs text-blue-600">
                System optimized
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-Time Team Analytics */}
      {viewMode !== 'custom' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Live Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {teamAnalytics?.total_teams || 0}
                </div>
                <div className="text-sm text-muted-foreground">Active Teams</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {teamAnalytics?.total_members || 0}
                </div>
                <div className="text-sm text-muted-foreground">Team Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {Math.round(teamAnalytics?.performance_average || 0)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Performance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
