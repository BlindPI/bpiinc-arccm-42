
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { DashboardIntegrityService } from '@/services/audit/dashboardIntegrityService';
import { Shield, AlertTriangle, CheckCircle, Users, Building2, RefreshCw, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DashboardIntegrityPanel() {
  const [auditResults, setAuditResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const { toast } = useToast();

  const handleRunAudit = async () => {
    setIsLoading(true);
    try {
      console.log('Starting dashboard integrity audit...');
      const service = new DashboardIntegrityService();
      const results = await service.performFullAudit();
      console.log('Audit results:', results);
      setAuditResults(results);
      
      toast({
        title: "Audit Complete",
        description: "Dashboard integrity check completed successfully.",
      });
    } catch (error) {
      console.error('Failed to perform dashboard integrity check:', error);
      toast({
        title: "Audit Failed",
        description: `Failed to perform dashboard integrity check: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoFix = async () => {
    if (!auditResults) return;
    
    setIsFixing(true);
    try {
      console.log('Starting auto-fix process...');
      const service = new DashboardIntegrityService();
      const fixResults = await service.autoFixIssues();
      console.log('Fix results:', fixResults);
      
      toast({
        title: "Auto-Fix Complete",
        description: `Fixed ${fixResults.totalFixed || 0} issues automatically.`,
      });
      
      // Re-run audit to get updated results
      await handleRunAudit();
    } catch (error) {
      console.error('Failed to auto-fix issues:', error);
      toast({
        title: "Auto-Fix Failed",
        description: `Failed to auto-fix issues: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsFixing(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthStatus = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Dashboard Integrity Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Control Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleRunAudit} 
            disabled={isLoading || isFixing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Running Audit...' : 'Run Integrity Check'}
          </Button>
          
          {auditResults && (
            <Button 
              onClick={handleAutoFix} 
              disabled={isLoading || isFixing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Wrench className={`h-4 w-4 ${isFixing ? 'animate-pulse' : ''}`} />
              {isFixing ? 'Fixing Issues...' : 'Auto-Fix Issues'}
            </Button>
          )}
        </div>

        {/* Audit Results */}
        {auditResults && (
          <div className="space-y-4">
            {/* Overall Health Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overall System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Health Score</span>
                  <span className={`text-lg font-bold ${getHealthColor(auditResults.overallScore || 0)}`}>
                    {auditResults.overallScore || 0}%
                  </span>
                </div>
                <Progress value={auditResults.overallScore || 0} className="mb-2" />
                <Badge variant={auditResults.overallScore >= 70 ? 'default' : 'destructive'}>
                  {getHealthStatus(auditResults.overallScore || 0)}
                </Badge>
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Total Users</span>
                  </div>
                  <p className="text-2xl font-bold">{auditResults.summary?.totalUsers || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Total Teams</span>
                  </div>
                  <p className="text-2xl font-bold">{auditResults.summary?.totalTeams || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Issues Found</span>
                  </div>
                  <p className="text-2xl font-bold">{auditResults.summary?.totalIssues || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Health Score</span>
                  </div>
                  <p className={`text-2xl font-bold ${getHealthColor(auditResults.overallScore || 0)}`}>
                    {auditResults.overallScore || 0}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Issues Breakdown */}
            {auditResults.issues && auditResults.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Issues Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditResults.issues.map((issue, index) => (
                      <Alert key={index} variant={issue.severity === 'critical' ? 'destructive' : 'default'}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="flex items-center justify-between">
                            <div>
                              <strong>{issue.type}:</strong> {issue.description}
                              {issue.count && <span className="ml-2 text-sm">({issue.count} affected)</span>}
                            </div>
                            <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                              {issue.severity}
                            </Badge>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {auditResults.recommendations && auditResults.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {auditResults.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Help Text */}
        {!auditResults && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Run an integrity check to identify and fix issues with AP user assignments, 
              team-provider relationships, and dashboard data consistency.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
