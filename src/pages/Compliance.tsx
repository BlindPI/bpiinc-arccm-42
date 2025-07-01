
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useComplianceData } from '@/hooks/useComplianceData';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Users,
  AlertCircle
} from 'lucide-react';

export default function Compliance() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { metrics, issues, trends, isLoading } = useComplianceData();

  // Check if user has compliance access
  const hasComplianceAccess = profile?.role && ['SA', 'AD', 'AP'].includes(profile.role);

  if (!hasComplianceAccess) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">You don't have permission to access compliance features.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compliance Management</h1>
          <p className="text-muted-foreground">Monitor and manage compliance across the organization</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Compliance Officer
        </Badge>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
                <p className="text-2xl font-bold text-green-600">{metrics?.overallScore || 0}%</p>
                <p className="text-xs text-muted-foreground">
                  {metrics?.compliantUsers || 0} of {metrics?.totalUsers || 0} compliant
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Non-Compliant</p>
                <p className="text-2xl font-bold text-red-600">{metrics?.nonCompliantUsers || 0}</p>
                <p className="text-xs text-muted-foreground">require attention</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics?.expiringCertificates || 0}</p>
                <p className="text-xs text-muted-foreground">next 30 days</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Issues</p>
                <p className="text-2xl font-bold text-blue-600">{issues?.length || 0}</p>
                <p className="text-xs text-muted-foreground">open items</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Compliance Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trends?.map((trend, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{trend.category}</span>
                      <span>{trend.percentage}%</span>
                    </div>
                    <Progress value={trend.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {issues?.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="flex items-center gap-3 p-2 border rounded">
                      <AlertTriangle className={`h-4 w-4 ${
                        issue.severity === 'HIGH' ? 'text-red-600' :
                        issue.severity === 'MEDIUM' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{issue.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {issue.userName} - {issue.type}
                        </p>
                      </div>
                      <Badge variant={
                        issue.status === 'RESOLVED' ? 'default' :
                        issue.status === 'IN_PROGRESS' ? 'secondary' : 'destructive'
                      }>
                        {issue.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {issues?.map((issue) => (
                  <div key={issue.id} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          issue.severity === 'HIGH' ? 'destructive' :
                          issue.severity === 'MEDIUM' ? 'secondary' : 'outline'
                        }>
                          {issue.severity}
                        </Badge>
                        <span className="font-medium">{issue.type}</span>
                      </div>
                      <Badge variant={
                        issue.status === 'RESOLVED' ? 'default' :
                        issue.status === 'IN_PROGRESS' ? 'secondary' : 'destructive'
                      }>
                        {issue.status}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{issue.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>User: {issue.userName}</span>
                      <span>Due: {new Date(issue.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trends Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trends?.map((trend, index) => (
                  <div key={index} className="p-4 border rounded">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{trend.category}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{trend.percentage}%</span>
                        <TrendingUp className={`h-4 w-4 ${
                          trend.trend === 'up' ? 'text-green-600' :
                          trend.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`} />
                      </div>
                    </div>
                    <Progress value={trend.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Compliance Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Generate Compliance Reports</h3>
                <p className="text-muted-foreground mb-4">
                  Create detailed compliance reports for management and auditing purposes
                </p>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Total Users: {metrics?.totalUsers || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Compliant: {metrics?.compliantUsers || 0} ({metrics?.overallScore || 0}%)
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Non-Compliant: {metrics?.nonCompliantUsers || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Certificates Expiring: {metrics?.expiringCertificates || 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
