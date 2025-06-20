
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DashboardIntegrityService,
  type DashboardIntegrityReport 
} from '@/services/audit/dashboardIntegrityService';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Building2,
  RefreshCw,
  Wrench
} from 'lucide-react';
import toast from 'react-hot-toast';

export function DashboardIntegrityPanel() {
  const [activeTab, setActiveTab] = useState('summary');
  const queryClient = useQueryClient();

  const { data: integrityReport, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-integrity-report'],
    queryFn: () => DashboardIntegrityService.generateIntegrityReport(),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { mutate: autoFixAPAssignments, isPending: fixingAP } = useMutation({
    mutationFn: () => DashboardIntegrityService.autoFixAPUserAssignments(),
    onSuccess: (result) => {
      toast.success(`Auto-fixed ${result.fixed} AP user assignments`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred during auto-fix`);
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard-integrity-report'] });
    },
    onError: (error: any) => {
      toast.error(`Auto-fix failed: ${error.message}`);
    }
  });

  const { mutate: autoFixTeamProviders, isPending: fixingTeams } = useMutation({
    mutationFn: () => DashboardIntegrityService.autoFixTeamProviderRelationships(),
    onSuccess: (result) => {
      toast.success(`Auto-fixed ${result.fixed} team provider relationships`);
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} errors occurred during auto-fix`);
      }
      queryClient.invalidateQueries({ queryKey: ['dashboard-integrity-report'] });
    },
    onError: (error: any) => {
      toast.error(`Auto-fix failed: ${error.message}`);
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!integrityReport) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Unable to load integrity report</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { systemSummary } = integrityReport;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dashboard Integrity Report
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Issues</p>
                  <p className="text-2xl font-bold text-red-600">{systemSummary.criticalIssues}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Warning Issues</p>
                  <p className="text-2xl font-bold text-yellow-600">{systemSummary.warningIssues}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AP Users w/ Issues</p>
                  <p className="text-2xl font-bold">{systemSummary.apUsersWithIssues}</p>
                  <p className="text-xs text-muted-foreground">of {systemSummary.totalAPUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Teams w/ Issues</p>
                  <p className="text-2xl font-bold">{systemSummary.teamsWithIssues}</p>
                  <p className="text-xs text-muted-foreground">of {systemSummary.totalTeams}</p>
                </div>
                <Building2 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fix Recommendations */}
        {integrityReport.fixRecommendations.length > 0 && (
          <Alert className="mb-6">
            <Wrench className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">System Recommendations:</div>
                <ul className="list-disc list-inside space-y-1">
                  {integrityReport.fixRecommendations.map((rec, index) => (
                    <li key={index} className="text-sm">{rec}</li>
                  ))}
                </ul>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => autoFixAPAssignments()}
                    disabled={fixingAP}
                    size="sm"
                  >
                    {fixingAP ? 'Fixing...' : 'Auto-Fix AP Assignments'}
                  </Button>
                  <Button
                    onClick={() => autoFixTeamProviders()}
                    disabled={fixingTeams}
                    size="sm"
                    variant="outline"
                  >
                    {fixingTeams ? 'Fixing...' : 'Auto-Fix Team Providers'}
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ap-users">AP Users</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="ap-users" className="space-y-4">
            <div className="space-y-3">
              {integrityReport.apUserAudit.map((user) => (
                <Card key={user.userId} className={user.issues.length > 0 ? 'border-red-200' : 'border-green-200'}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{user.displayName}</h4>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.hasLocationAssignment && (
                          <Badge variant="outline">Location Assigned</Badge>
                        )}
                        {user.hasTeamMembership && (
                          <Badge variant="outline">Team Member</Badge>
                        )}
                        {user.isDualRole && (
                          <Badge variant="destructive">Dual Role</Badge>
                        )}
                        {user.issues.length === 0 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    {user.issues.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-red-600">Issues:</span>
                          <ul className="list-disc list-inside ml-4">
                            {user.issues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">Recommendations:</span>
                          <ul className="list-disc list-inside ml-4">
                            {user.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <div className="space-y-3">
              {integrityReport.teamProviderAudit.map((team) => (
                <Card key={team.teamId} className={team.issues.length > 0 ? 'border-red-200' : 'border-green-200'}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{team.teamName}</h4>
                        <p className="text-sm text-muted-foreground">{team.memberCount} members</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {team.hasProvider && (
                          <Badge variant="outline">Provider Assigned</Badge>
                        )}
                        {team.hasLocation && (
                          <Badge variant="outline">Location Assigned</Badge>
                        )}
                        {team.issues.length === 0 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    {team.issues.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium text-red-600">Issues:</span>
                          <ul className="list-disc list-inside ml-4">
                            {team.issues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-blue-600">Recommendations:</span>
                          <ul className="list-disc list-inside ml-4">
                            {team.recommendations.map((rec, idx) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
