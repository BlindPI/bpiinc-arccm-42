
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
  TrendingUp
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { PageHeader } from '@/components/ui/PageHeader';

export default function Compliance() {
  const { data: profile } = useProfile();

  const canViewCompliance = profile?.role && ['SA', 'AD', 'AP', 'IC', 'IP', 'IT'].includes(profile.role);

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

  const complianceMetrics = {
    overallScore: 87,
    totalUsers: 124,
    compliantUsers: 108,
    nonCompliantUsers: 16,
    expiringCertificates: 8
  };

  const complianceIssues = [
    {
      id: '1',
      type: 'Certificate Expiry',
      description: 'John Doe - CPR Level C expires in 5 days',
      severity: 'HIGH',
      dueDate: '2025-01-31',
      status: 'OPEN'
    },
    {
      id: '2',
      type: 'Missing Documentation',
      description: 'Jane Smith - Missing audit documentation',
      severity: 'MEDIUM',
      dueDate: '2025-02-15',
      status: 'IN_PROGRESS'
    },
    {
      id: '3',
      type: 'Training Hours',
      description: 'Mike Johnson - Insufficient teaching hours',
      severity: 'MEDIUM',
      dueDate: '2025-02-28',
      status: 'OPEN'
    }
  ];

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
          <Button>
            <FileText className="h-4 w-4 mr-2" />
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
            <div className="text-2xl font-bold mt-2">{complianceMetrics.overallScore}%</div>
            <Progress value={complianceMetrics.overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Compliant Users</span>
            </div>
            <div className="text-2xl font-bold mt-2">{complianceMetrics.compliantUsers}</div>
            <div className="text-sm text-muted-foreground">
              of {complianceMetrics.totalUsers} total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium">Issues</span>
            </div>
            <div className="text-2xl font-bold mt-2">{complianceIssues.length}</div>
            <div className="text-sm text-muted-foreground">Open issues</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Expiring Soon</span>
            </div>
            <div className="text-2xl font-bold mt-2">{complianceMetrics.expiringCertificates}</div>
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
            {complianceIssues.map((issue) => (
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
                      Due: {new Date(issue.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button size="sm">
                    Resolve
                  </Button>
                </div>
              </div>
            ))}
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
            <div className="flex items-center justify-between">
              <span className="text-sm">Certificate Renewals</span>
              <div className="flex items-center gap-2">
                <Progress value={75} className="w-32" />
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Documentation Complete</span>
              <div className="flex items-center gap-2">
                <Progress value={92} className="w-32" />
                <span className="text-sm text-muted-foreground">92%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Training Requirements</span>
              <div className="flex items-center gap-2">
                <Progress value={68} className="w-32" />
                <span className="text-sm text-muted-foreground">68%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Annual Audits</span>
              <div className="flex items-center gap-2">
                <Progress value={84} className="w-32" />
                <span className="text-sm text-muted-foreground">84%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
