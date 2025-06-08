
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { complianceService } from '@/services/compliance/complianceService';

export function TeamComplianceMonitor() {
  const { data: complianceMetrics, isLoading } = useQuery({
    queryKey: ['team-compliance-metrics'],
    queryFn: () => complianceService.getTeamComplianceMetrics()
  });

  const { data: systemOverview } = useQuery({
    queryKey: ['system-compliance-overview'],
    queryFn: () => complianceService.getSystemComplianceOverview()
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const criticalTeams = complianceMetrics?.filter(team => team.status === 'critical') || [];

  return (
    <div className="space-y-6">
      {/* Overall Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Compliance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemOverview?.overallScore || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Compliance</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {systemOverview?.compliantTeams || 0}
              </div>
              <p className="text-sm text-muted-foreground">Compliant Teams</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {systemOverview?.warningTeams || 0}
              </div>
              <p className="text-sm text-muted-foreground">Warning Teams</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {systemOverview?.criticalTeams || 0}
              </div>
              <p className="text-sm text-muted-foreground">Critical Teams</p>
            </div>
          </div>
          
          <Progress value={systemOverview?.overallScore || 0} className="h-3" />
        </CardContent>
      </Card>

      {/* Critical Issues Alert */}
      {criticalTeams.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{criticalTeams.length} teams</strong> require immediate attention due to critical compliance issues.
          </AlertDescription>
        </Alert>
      )}

      {/* Team Compliance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Team Compliance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {complianceMetrics?.map((team) => (
              <div key={team.teamId} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{team.teamName}</h3>
                    <Badge variant={
                      team.status === 'compliant' ? 'default' : 
                      team.status === 'warning' ? 'secondary' : 'destructive'
                    }>
                      {team.status === 'compliant' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {team.status === 'warning' && <Clock className="h-3 w-3 mr-1" />}
                      {team.status === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {team.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{team.complianceScore}%</div>
                    <div className="text-sm text-muted-foreground">{team.memberCount} members</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Critical Issues:</span>
                    <span className={`ml-2 font-medium ${team.criticalIssues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {team.criticalIssues}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pending Actions:</span>
                    <span className={`ml-2 font-medium ${team.pendingActions > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {team.pendingActions}
                    </span>
                  </div>
                </div>
                
                <Progress value={team.complianceScore} className="mt-3" />
                
                {team.lastAssessment && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Last assessment: {new Date(team.lastAssessment).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
            
            {(!complianceMetrics || complianceMetrics.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No compliance data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
