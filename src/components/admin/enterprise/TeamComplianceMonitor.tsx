
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Users,
  FileText,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { TeamAnalyticsService } from '@/services/team/teamAnalyticsService';

export function TeamComplianceMonitor() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: systemAnalytics, isLoading } = useQuery({
    queryKey: ['system-compliance-analytics'],
    queryFn: () => Promise.resolve({ totalTeams: 10, averagePerformance: 85 })
  });

  // Mock compliance data - replace with real service calls
  const complianceData = {
    overallScore: 85,
    criticalIssues: 3,
    pendingReviews: 12,
    compliantTeams: Math.floor((systemAnalytics?.totalTeams || 0) * 0.8),
    totalTeams: systemAnalytics?.totalTeams || 0,
    trends: {
      thisMonth: 85,
      lastMonth: 82,
      improvement: 3
    },
    issuesByType: [
      { type: 'Training Requirements', count: 8, severity: 'medium' },
      { type: 'Documentation', count: 5, severity: 'low' },
      { type: 'Certifications', count: 3, severity: 'high' },
      { type: 'Role Compliance', count: 2, severity: 'critical' }
    ]
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compliance Overview Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Shield className="h-6 w-6" />
            Team Compliance Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{complianceData.overallScore}%</div>
              <p className="text-sm text-blue-700 mt-1">Overall Compliance</p>
              <div className="flex items-center justify-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+{complianceData.trends.improvement}%</span>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{complianceData.compliantTeams}</div>
              <p className="text-sm text-gray-600 mt-1">Compliant Teams</p>
              <p className="text-xs text-gray-500">of {complianceData.totalTeams} total</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{complianceData.criticalIssues}</div>
              <p className="text-sm text-gray-600 mt-1">Critical Issues</p>
              <Badge variant="destructive" className="text-xs mt-1">Immediate Action Required</Badge>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{complianceData.pendingReviews}</div>
              <p className="text-sm text-gray-600 mt-1">Pending Reviews</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Clock className="h-3 w-3 text-amber-600" />
                <span className="text-xs text-amber-600">Action Needed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Compliance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance by Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Training Requirements</span>
                    <span className="text-sm text-gray-600">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Documentation</span>
                    <span className="text-sm text-gray-600">88%</span>
                  </div>
                  <Progress value={88} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Certifications</span>
                    <span className="text-sm text-gray-600">76%</span>
                  </div>
                  <Progress value={76} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Role Compliance</span>
                    <span className="text-sm text-gray-600">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Compliance Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Training completed</p>
                      <p className="text-xs text-gray-600">Team Alpha - Safety Training Module</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Documentation update required</p>
                      <p className="text-xs text-gray-600">Team Beta - Policy Acknowledgment</p>
                      <p className="text-xs text-gray-500">4 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Audit completed</p>
                      <p className="text-xs text-gray-600">Team Gamma - Quarterly Review</p>
                      <p className="text-xs text-gray-500">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Issues by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceData.issuesByType.map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        issue.severity === 'critical' ? 'bg-red-600' :
                        issue.severity === 'high' ? 'bg-orange-500' :
                        issue.severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <h4 className="font-medium">{issue.type}</h4>
                        <p className="text-sm text-gray-600">{issue.count} teams affected</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        issue.severity === 'critical' ? 'destructive' :
                        issue.severity === 'high' ? 'destructive' :
                        issue.severity === 'medium' ? 'default' : 'secondary'
                      }>
                        {issue.severity.toUpperCase()}
                      </Badge>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Compliance Trends Chart</h3>
                <p>Historical compliance data and trend analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-red-500 bg-red-50">
                  <h4 className="font-medium text-red-900">Critical: Certification Expiry</h4>
                  <p className="text-sm text-red-700 mt-1">3 team members have certifications expiring within 30 days</p>
                  <Button variant="destructive" size="sm" className="mt-2">
                    Schedule Renewals
                  </Button>
                </div>
                
                <div className="p-4 border-l-4 border-amber-500 bg-amber-50">
                  <h4 className="font-medium text-amber-900">Warning: Training Overdue</h4>
                  <p className="text-sm text-amber-700 mt-1">5 teams have overdue mandatory training requirements</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Send Reminders
                  </Button>
                </div>
                
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
                  <h4 className="font-medium text-blue-900">Info: Documentation Review</h4>
                  <p className="text-sm text-blue-700 mt-1">Quarterly documentation review due for 8 teams</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Schedule Reviews
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
