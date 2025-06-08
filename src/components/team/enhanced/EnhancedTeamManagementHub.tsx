
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTeamMemberships } from '@/hooks/useTeamMemberships';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { 
  Users, 
  Shield, 
  BarChart3, 
  Settings,
  AlertTriangle,
  Crown,
  Building2,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { TeamComplianceMonitor } from '../../admin/enterprise/TeamComplianceMonitor';

export function EnhancedTeamManagementHub() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: userTeams = [], isLoading } = useTeamMemberships();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isSystemAdmin = profile?.role === 'SA';
  const hasMultipleTeams = userTeams.length > 1;

  // Mock data for enterprise features
  const enterpriseMetrics = {
    totalTeams: userTeams.length,
    complianceScore: 85,
    activeWorkflows: 3,
    pendingApprovals: 2
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            Enterprise Team Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Advanced team governance, compliance monitoring, and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {profile?.role}
          </Badge>
          {hasMultipleTeams && (
            <Badge variant="outline">
              {userTeams.length} Teams
            </Badge>
          )}
        </div>
      </div>

      {/* Enterprise Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enterpriseMetrics.totalTeams}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all locations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Compliance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {enterpriseMetrics.complianceScore}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              System-wide average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Active Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {enterpriseMetrics.activeWorkflows}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Automated processes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {enterpriseMetrics.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Team Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userTeams.map((teamMembership) => (
              <Card key={teamMembership.team_id} className="border-2">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {teamMembership.teams?.name || 'Team'}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={teamMembership.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {teamMembership.role}
                      </Badge>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {teamMembership.teams?.description || 'No description available'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Location:</span>
                        <div className="font-medium">
                          {teamMembership.teams?.locations?.name || 'None'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="font-medium capitalize">
                          {teamMembership.teams?.status || 'Active'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </Button>
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analytics
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="governance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Team Governance Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Governance Framework</h3>
                <p>Configure approval workflows, delegation policies, and escalation rules.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <TeamComplianceMonitor teams={userTeams.map(tm => tm.teams).filter(Boolean)} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Cross-Team Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
                <p>Performance metrics, trend analysis, and predictive insights across teams.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Automated Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Workflow Automation</h3>
                <p>Configure and monitor automated team processes and approvals.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
