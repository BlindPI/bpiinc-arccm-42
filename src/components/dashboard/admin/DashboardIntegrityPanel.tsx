import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DashboardIntegrityService, 
  type IntegrityReport, 
  type IntegrityIssue 
} from '@/services/audit/dashboardIntegrityService';
import { Shield, AlertTriangle, CheckCircle, Users, Building2, RefreshCw, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DashboardIntegrityPanel() {
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();

  const { data: integrityReport, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-integrity'],
    queryFn: () => DashboardIntegrityService.generateIntegrityReport(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { mutate: runAutoFix } = useMutation({
    mutationFn: () => DashboardIntegrityService.autoFixIssues(),
    onMutate: () => {
      setIsFixing(true);
    },
    onSuccess: (result) => {
      toast({
        title: "Auto-fix completed",
        description: `Fixed ${result.fixesApplied} issues successfully.`,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Auto-fix failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsFixing(false);
    }
  });

  const { mutate: fixAPAssignments } = useMutation({
    mutationFn: () => DashboardIntegrityService.fixAPUserAssignments(),
    onSuccess: (result) => {
      toast({
        title: "AP assignments fixed",
        description: `Updated ${result.updated} AP user assignments.`,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Failed to fix AP assignments",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const { mutate: fixTeamProviders } = useMutation({
    mutationFn: () => DashboardIntegrityService.fixTeamProviderRelationships(),
    onSuccess: (result) => {
      toast({
        title: "Team-provider relationships fixed",
        description: `Updated ${result.updated} team assignments.`,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Failed to fix team-provider relationships",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 animate-spin" />
          <span>Analyzing dashboard integrity...</span>
        </div>
      </div>
    );
  }

  if (!integrityReport) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load integrity report. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const overallScore = integrityReport.overallScore;
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-semibold">Dashboard Integrity Monitor</h2>
            <p className="text-muted-foreground">
              Monitor and fix data relationship issues affecting dashboard accuracy
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getScoreBadgeVariant(overallScore)} className="text-sm">
            {overallScore}% Healthy
          </Badge>
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
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Integrity Score</span>
              <span className={getScoreColor(overallScore)}>{overallScore}%</span>
            </div>
            <Progress value={overallScore} className="h-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">AP Users</span>
              </div>
              <div className="text-2xl font-bold">
                {integrityReport.apUserStats.totalUsers}
              </div>
              <div className="text-xs text-muted-foreground">
                {integrityReport.apUserStats.usersWithIssues} with issues
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Teams</span>
              </div>
              <div className="text-2xl font-bold">
                {integrityReport.teamStats.totalTeams}
              </div>
              <div className="text-xs text-muted-foreground">
                {integrityReport.teamStats.teamsWithIssues} with issues
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Critical Issues</span>
              </div>
              <div className="text-2xl font-bold">
                {integrityReport.issues.filter(i => i.severity === 'critical').length}
              </div>
              <div className="text-xs text-muted-foreground">
                Require immediate attention
              </div>
            </div>
          </div>

          {integrityReport.issues.length > 0 && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => runAutoFix()}
                disabled={isFixing}
                className="w-full"
              >
                {isFixing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Applying Fixes...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 mr-2" />
                    Auto-Fix All Issues
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Issues */}
      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">Issues ({integrityReport.issues.length})</TabsTrigger>
          <TabsTrigger value="ap-users">AP Users</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          {integrityReport.issues.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-medium">No Issues Found</h3>
                  <p className="text-muted-foreground">
                    All dashboard relationships are properly configured.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {integrityReport.issues.map((issue, index) => (
                <IssueCard key={index} issue={issue} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ap-users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AP User Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Total AP Users</span>
                  <div className="text-2xl font-bold">{integrityReport.apUserStats.totalUsers}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Without Assignments</span>
                  <div className="text-2xl font-bold text-red-600">
                    {integrityReport.apUserStats.usersWithIssues}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => fixAPAssignments()}
                variant="outline"
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Fix AP User Assignments
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team-Provider Relationships</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">Total Teams</span>
                  <div className="text-2xl font-bold">{integrityReport.teamStats.totalTeams}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium">Without Providers</span>
                  <div className="text-2xl font-bold text-red-600">
                    {integrityReport.teamStats.teamsWithIssues}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => fixTeamProviders()}
                variant="outline"
                className="w-full"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Fix Team-Provider Relationships
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface IssueCardProps {
  issue: IntegrityIssue;
}

function IssueCard({ issue }: IssueCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'info': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={`border-l-4 ${getSeverityColor(issue.severity)}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {getSeverityIcon(issue.severity)}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{issue.title}</h4>
              <Badge variant="outline" className="text-xs">
                {issue.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{issue.description}</p>
            {issue.affectedEntities && issue.affectedEntities.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Affects: {issue.affectedEntities.join(', ')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
