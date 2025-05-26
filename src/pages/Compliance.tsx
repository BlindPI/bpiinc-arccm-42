
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  Calendar,
  Users,
  TrendingUp,
  Download,
  RefreshCw
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useComplianceData } from '@/hooks/useComplianceData';
import { ComplianceService } from '@/services/compliance/complianceService';
import { PageHeader } from '@/components/ui/PageHeader';
import { InlineLoader } from '@/components/ui/LoadingStates';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function Compliance() {
  const { data: profile } = useProfile();
  const { metrics, issues, trends, isLoading, error } = useComplianceData();
  const queryClient = useQueryClient();

  const canViewCompliance = profile?.role && ['SA', 'AD', 'AP', 'IC', 'IP', 'IT'].includes(profile.role);

  // Mutation for resolving issues
  const { mutate: resolveIssue, isPending: isResolving } = useMutation({
    mutationFn: ({ issueId, notes }: { issueId: string; notes?: string }) =>
      ComplianceService.resolveIssue(issueId, profile?.id || '', notes),
    onSuccess: () => {
      toast.success('Issue resolved successfully');
      queryClient.invalidateQueries({ queryKey: ['compliance-issues'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-metrics'] });
    },
    onError: (error) => {
      toast.error('Failed to resolve issue: ' + error.message);
    }
  });

  // Mutation for updating issue status
  const { mutate: updateIssueStatus } = useMutation({
    mutationFn: ({ issueId, status }: { issueId: string; status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' }) =>
      ComplianceService.updateIssueStatus(issueId, status),
    onSuccess: () => {
      toast.success('Issue status updated');
      queryClient.invalidateQueries({ queryKey: ['compliance-issues'] });
    },
    onError: (error) => {
      toast.error('Failed to update issue: ' + error.message);
    }
  });

  // Generate and download report
  const { mutate: generateReport, isPending: isGeneratingReport } = useMutation({
    mutationFn: () => ComplianceService.exportComplianceData(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Compliance report downloaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to generate report: ' + error.message);
    }
  });

  if (!canViewCompliance) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You don't have permission to access compliance management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<ShieldCheck className="h-7 w-7 text-primary" />}
          title="Compliance Management"
          subtitle="Monitor and manage system compliance requirements"
        />
        <InlineLoader message="Loading compliance data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          icon={<ShieldCheck className="h-7 w-7 text-primary" />}
          title="Compliance Management"
          subtitle="Monitor and manage system compliance requirements"
        />
        <Card>
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">
              Failed to load compliance data. Please try again.
            </p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['compliance-metrics'] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'destructive';
      case 'MEDIUM': return 'default';
      case 'LOW': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'RESOLVED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ShieldCheck className="h-7 w-7 text-primary" />}
        title="Compliance Management"
        subtitle="Monitor and manage system compliance requirements"
        actions={
          <Button onClick={() => generateReport()} disabled={isGeneratingReport}>
            {isGeneratingReport ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generate Report
          </Button>
        }
      />

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="font-medium">Overall Score</span>
            </div>
            <div className="text-2xl font-bold mt-2">{metrics?.overallScore || 0}%</div>
            <Progress value={metrics?.overallScore || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Compliant Users</span>
            </div>
            <div className="text-2xl font-bold mt-2">{metrics?.compliantUsers || 0}</div>
            <div className="text-sm text-muted-foreground">
              of {metrics?.totalUsers || 0} total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium">Issues</span>
            </div>
            <div className="text-2xl font-bold mt-2">{issues.length}</div>
            <div className="text-sm text-muted-foreground">Open issues</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Expiring Soon</span>
            </div>
            <div className="text-2xl font-bold mt-2">{metrics?.expiringCertificates || 0}</div>
            <div className="text-sm text-muted-foreground">Next 30 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Active Compliance Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Compliance Issues</h3>
                <p className="text-muted-foreground">All users are currently in compliance.</p>
              </div>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(issue.status)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{issue.type}</h4>
                        <Badge variant={getSeverityColor(issue.severity) as any}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        User: {issue.userName} • Due: {new Date(issue.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateIssueStatus({ issueId: issue.id, status: 'IN_PROGRESS' })}
                      disabled={issue.status === 'RESOLVED'}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => resolveIssue({ issueId: issue.id })}
                      disabled={issue.status === 'RESOLVED' || isResolving}
                    >
                      {issue.status === 'RESOLVED' ? 'Resolved' : 'Resolve'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compliance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{trend.category}</span>
                <div className="flex items-center gap-2">
                  <Progress value={trend.percentage} className="w-32" />
                  <span className="text-sm text-muted-foreground">{trend.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
