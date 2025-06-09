
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  Target, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { RealTeamDataService } from '@/services/team/realTeamDataService';
import { ComplianceService } from '@/services/team/complianceService';
import { WorkflowService } from '@/services/team/workflowService';

export function TeamAnalyticsDashboard() {
  const { data: teamAnalytics, isLoading } = useQuery({
    queryKey: ['team-analytics'],
    queryFn: () => RealTeamDataService.getTeamAnalytics(),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: crossTeamAnalytics } = useQuery({
    queryKey: ['cross-team-analytics'],
    queryFn: () => RealTeamDataService.getCrossTeamAnalytics(),
    refetchInterval: 300000,
  });

  const { data: complianceMetrics } = useQuery({
    queryKey: ['compliance-metrics'],
    queryFn: () => ComplianceService.getComplianceMetrics(),
    refetchInterval: 300000,
  });

  const { data: workflowStats } = useQuery({
    queryKey: ['workflow-statistics'],
    queryFn: () => WorkflowService.getWorkflowStatistics(),
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Team Analytics Dashboard</h2>
        <p className="text-muted-foreground">
          Real-time system-wide team performance and compliance metrics
        </p>
      </div>

      {/* Overview Metrics */}
      {teamAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Teams</p>
                  <p className="text-3xl font-bold">{teamAnalytics.totalTeams}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Members</p>
                  <p className="text-3xl font-bold">{teamAnalytics.totalMembers}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                  <p className="text-3xl font-bold">{Math.round(teamAnalytics.averagePerformance)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance</p>
                  <p className="text-3xl font-bold">{Math.round(teamAnalytics.averageCompliance)}%</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Statistics */}
      {workflowStats && (
        <Card>
          <CardHeader>
            <CardTitle>Workflow Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-2xl font-bold">{workflowStats.pending}</span>
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold">{workflowStats.approved}</span>
                </div>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold">{workflowStats.rejected}</span>
                </div>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl font-bold">{Math.round(workflowStats.complianceRate)}%</span>
                </div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams by Location */}
      <Card>
        <CardHeader>
          <CardTitle>Teams by Location</CardTitle>
        </CardHeader>
        <CardContent>
          {teamAnalytics?.teamsByLocation && Object.keys(teamAnalytics.teamsByLocation).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(teamAnalytics.teamsByLocation).map(([location, count]) => (
                <div key={location} className="flex justify-between items-center">
                  <span>{location}</span>
                  <Badge variant="outline">{String(count)} teams</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No location data available</p>
          )}
        </CardContent>
      </Card>

      {/* Performance by Team Type */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Team Type</CardTitle>
        </CardHeader>
        <CardContent>
          {teamAnalytics?.performanceByTeamType && Object.keys(teamAnalytics.performanceByTeamType).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(teamAnalytics.performanceByTeamType).map(([type, performance]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                  <Badge variant="outline">{Math.round(Number(performance))}% avg</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No performance data available</p>
          )}
        </CardContent>
      </Card>

      {/* Compliance Overview */}
      {complianceMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{Math.round(complianceMetrics.overall_compliance)}%</p>
                <p className="text-sm text-muted-foreground">Overall Compliance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{complianceMetrics.active_issues}</p>
                <p className="text-sm text-muted-foreground">Active Issues</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{complianceMetrics.resolved_issues}</p>
                <p className="text-sm text-muted-foreground">Resolved Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
