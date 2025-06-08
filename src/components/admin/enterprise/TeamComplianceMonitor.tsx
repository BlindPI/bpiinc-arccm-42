
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Users,
  Settings,
  TrendingUp
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { teamManagementService } from '@/services/team/teamManagementService';
import { teamAnalyticsService } from '@/services/team/teamAnalyticsService';

export function TeamComplianceMonitor() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month');

  const { data: allTeams = [] } = useQuery({
    queryKey: ['teams-compliance'],
    queryFn: () => teamManagementService.getAllEnhancedTeams()
  });

  const { data: complianceData = [] } = useQuery({
    queryKey: ['compliance-metrics', allTeams.map(t => t.id)],
    queryFn: async () => {
      if (!allTeams.length) return [];
      
      const compliancePromises = allTeams.map(async (team) => {
        const metrics = await teamAnalyticsService.getTeamComplianceMetrics(team.id);
        return {
          teamId: team.id,
          teamName: team.name,
          location: team.location?.name || 'No Location',
          status: team.status,
          ...metrics
        };
      });
      
      return Promise.all(compliancePromises);
    },
    enabled: allTeams.length > 0
  });

  // Calculate overall compliance statistics
  const totalTeams = complianceData.length;
  const compliantTeams = complianceData.filter(team => team.complianceScore >= 85).length;
  const warningTeams = complianceData.filter(team => team.complianceScore >= 70 && team.complianceScore < 85).length;
  const criticalTeams = complianceData.filter(team => team.complianceScore < 70).length;
  const totalOpenIssues = complianceData.reduce((sum, team) => sum + team.openIssues, 0);
  const averageCompliance = totalTeams > 0 
    ? Math.round(complianceData.reduce((sum, team) => sum + team.complianceScore, 0) / totalTeams)
    : 0;

  const getComplianceStatus = (score: number) => {
    if (score >= 85) return { status: 'compliant', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 70) return { status: 'warning', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'critical', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const getComplianceIcon = (score: number) => {
    if (score >= 85) return <CheckCircle className="h-4 w-4" />;
    if (score >= 70) return <AlertTriangle className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Team Compliance Monitor
          </h2>
          <p className="text-muted-foreground">Monitor team compliance across governance, policies, and standards</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value as any)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
          
          <Button variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Compliance Overview Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Compliant Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{compliantTeams}</div>
            <p className="text-xs text-gray-500 mt-1">
              {totalTeams > 0 ? Math.round((compliantTeams / totalTeams) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Warning Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningTeams}</div>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="h-4 w-4 text-red-600" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalTeams}</div>
            <p className="text-xs text-gray-500 mt-1">Require immediate action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCompliance}%</div>
            <p className="text-xs text-gray-500 mt-1">System-wide compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Compliance Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Team Details</TabsTrigger>
          <TabsTrigger value="issues">Open Issues</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Compliance Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Excellent (90-100%)</span>
                    <span className="text-sm font-medium">
                      {complianceData.filter(t => t.complianceScore >= 90).length} teams
                    </span>
                  </div>
                  <Progress 
                    value={totalTeams > 0 ? (complianceData.filter(t => t.complianceScore >= 90).length / totalTeams) * 100 : 0} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Good (80-89%)</span>
                    <span className="text-sm font-medium">
                      {complianceData.filter(t => t.complianceScore >= 80 && t.complianceScore < 90).length} teams
                    </span>
                  </div>
                  <Progress 
                    value={totalTeams > 0 ? (complianceData.filter(t => t.complianceScore >= 80 && t.complianceScore < 90).length / totalTeams) * 100 : 0} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fair (70-79%)</span>
                    <span className="text-sm font-medium">
                      {complianceData.filter(t => t.complianceScore >= 70 && t.complianceScore < 80).length} teams
                    </span>
                  </div>
                  <Progress 
                    value={totalTeams > 0 ? (complianceData.filter(t => t.complianceScore >= 70 && t.complianceScore < 80).length / totalTeams) * 100 : 0} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Poor (<70%)</span>
                    <span className="text-sm font-medium">
                      {complianceData.filter(t => t.complianceScore < 70).length} teams
                    </span>
                  </div>
                  <Progress 
                    value={totalTeams > 0 ? (complianceData.filter(t => t.complianceScore < 70).length / totalTeams) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Compliance Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Compliance Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complianceData.slice(0, 5).map((team) => {
                    const status = getComplianceStatus(team.complianceScore);
                    return (
                      <div key={team.teamId} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <div className={`p-1 rounded ${status.bgColor}`}>
                            <span className={status.color}>
                              {getComplianceIcon(team.complianceScore)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{team.teamName}</div>
                            <div className="text-xs text-gray-500">{team.location}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{team.complianceScore}%</div>
                          <div className="text-xs text-gray-500">
                            {team.openIssues > 0 ? `${team.openIssues} issues` : 'No issues'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Compliance Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Team</th>
                      <th className="text-left p-3">Location</th>
                      <th className="text-left p-3">Compliance Score</th>
                      <th className="text-left p-3">Open Issues</th>
                      <th className="text-left p-3">Governance Model</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceData.map((team) => {
                      const status = getComplianceStatus(team.complianceScore);
                      return (
                        <tr key={team.teamId} className="border-b hover:bg-gray-50">
                          <td className="p-3">
                            <div className="font-medium">{team.teamName}</div>
                          </td>
                          <td className="p-3">{team.location}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    team.complianceScore >= 85 ? 'bg-green-600' :
                                    team.complianceScore >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                                  }`}
                                  style={{ width: `${team.complianceScore}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">{team.complianceScore}%</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {team.openIssues > 0 ? (
                              <Badge variant="destructive">{team.openIssues}</Badge>
                            ) : (
                              <Badge variant="default">0</Badge>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{team.governanceModel}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={status.bgColor + ' ' + status.color}>
                              {status.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Open Compliance Issues</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                {totalOpenIssues} total open issues across all teams
              </div>
            </CardHeader>
            <CardContent>
              {totalOpenIssues > 0 ? (
                <div className="space-y-4">
                  {complianceData
                    .filter(team => team.openIssues > 0)
                    .map((team) => (
                      <div key={team.teamId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{team.teamName}</h4>
                          <Badge variant="destructive">{team.openIssues} open issues</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{team.location}</p>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            View Issues
                          </Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-medium mb-2">No Open Issues</h3>
                  <p>All teams are currently compliant with no outstanding issues.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="governance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Governance Models Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {['hierarchical', 'democratic', 'consensus', 'hybrid'].map((model) => {
                  const count = complianceData.filter(team => team.governanceModel === model).length;
                  return (
                    <div key={model} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-gray-600 mt-1 capitalize">{model}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
