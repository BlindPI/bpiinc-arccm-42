
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DashboardIntegrityService } from '@/services/audit/dashboardIntegrityService';
import { Shield, AlertTriangle, CheckCircle, Users, Building2, RefreshCw, Wrench } from 'lucide-react';

export function DashboardIntegrityPanel() {
  const { toast } = useToast();

  const { data: auditResults, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-integrity-audit'],
    queryFn: () => DashboardIntegrityService.performFullAudit(),
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000 // Consider stale after 10 seconds
  });

  const handleAutoFix = async () => {
    try {
      toast({
        title: "Starting Auto-Fix",
        description: "Attempting to resolve dashboard integrity issues...",
      });

      const fixResults = await DashboardIntegrityService.autoFixIssues();
      
      toast({
        title: "Auto-Fix Complete",
        description: `Fixed ${fixResults.fixedCount} issues successfully.`,
      });

      // Refresh the audit data
      refetch();
    } catch (error) {
      console.error('Auto-fix failed:', error);
      toast({
        title: "Auto-Fix Failed",
        description: "Failed to automatically fix issues. Please check console for details.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Dashboard Integrity Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Integrity Check Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Failed to perform dashboard integrity check: {error.message}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Check
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Safe access to audit results with defaults
  const safeResults = auditResults || {};
  const apUsers = safeResults.apUsers || {};
  const teams = safeResults.teams || {};
  const locations = safeResults.locations || {};
  const summary = safeResults.summary || {};

  const getHealthStatus = () => {
    const totalIssues = (summary.criticalIssues || 0) + (summary.warningIssues || 0);
    if (totalIssues === 0) return 'healthy';
    if (summary.criticalIssues > 0) return 'critical';
    return 'warning';
  };

  const healthStatus = getHealthStatus();
  const healthIcon = healthStatus === 'healthy' ? CheckCircle : 
                    healthStatus === 'critical' ? AlertTriangle : Shield;
  const healthColor = healthStatus === 'healthy' ? 'text-green-600' : 
                     healthStatus === 'critical' ? 'text-red-600' : 'text-yellow-600';

  return (
    <div className="space-y-6">
      {/* Header Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {React.createElement(healthIcon, { className: `h-5 w-5 ${healthColor}` })}
              Dashboard Integrity Status
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={healthStatus === 'healthy' ? 'default' : 'destructive'}>
                {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
              </Badge>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {summary.criticalIssues || 0}
              </div>
              <div className="text-sm text-muted-foreground">Critical Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {summary.warningIssues || 0}
              </div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.fixedIssues || 0}
              </div>
              <div className="text-sm text-muted-foreground">Auto-Fixed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(summary.totalUsers || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AP Users Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              AP Users ({apUsers.totalUsers || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Without Location:</span>
              <Badge variant={apUsers.withoutLocation > 0 ? "destructive" : "default"}>
                {apUsers.withoutLocation || 0}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">With Team Conflicts:</span>
              <Badge variant={apUsers.withTeamConflicts > 0 ? "destructive" : "default"}>
                {apUsers.withTeamConflicts || 0}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Properly Configured:</span>
              <Badge variant="default">
                {apUsers.properlyConfigured || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Teams Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Teams ({teams.totalTeams || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Without Provider:</span>
              <Badge variant={teams.withoutProvider > 0 ? "destructive" : "default"}>
                {teams.withoutProvider || 0}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Without Location:</span>
              <Badge variant={teams.withoutLocation > 0 ? "destructive" : "default"}>
                {teams.withoutLocation || 0}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Healthy Teams:</span>
              <Badge variant="default">
                {teams.healthyTeams || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Locations Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Locations ({locations.totalLocations || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Orphaned:</span>
              <Badge variant={locations.orphanedLocations > 0 ? "destructive" : "default"}>
                {locations.orphanedLocations || 0}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Active:</span>
              <Badge variant="default">
                {locations.activeLocations || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      {(summary.criticalIssues > 0 || summary.warningIssues > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Available Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={handleAutoFix} variant="default">
                <Wrench className="h-4 w-4 mr-2" />
                Auto-Fix Issues
              </Button>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-run Audit
              </Button>
            </div>
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Auto-fix will attempt to resolve relationship issues automatically. 
                Manual intervention may be required for complex cases.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
