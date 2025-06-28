
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile } from '@/hooks/useProfile';
import { useEnterpriseAccess } from '@/hooks/useEnterpriseAccess';
import { 
  Shield, 
  Users, 
  BarChart3, 
  Activity, 
  Settings,
  AlertTriangle,
  Crown,
  Database,
  FileText
} from 'lucide-react';

// Import existing admin components
import { TeamKPIDashboard } from './TeamKPIDashboard';
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard';
import { RoleBasedTeamManager } from '@/components/team/RoleBasedTeamManager';
import { useSystemAdminDashboardData } from '@/hooks/dashboard/useSystemAdminDashboardData';

export function EnterpriseComplianceAdminDashboard() {
  const { data: profile } = useProfile();
  const { hasEnterpriseAccess, isSystemWideAdmin } = useEnterpriseAccess();
  const { metrics, recentActivity, pendingApprovals, isLoading } = useSystemAdminDashboardData();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user has SA/AD admin access
  const hasAdminAccess = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4">
        <Card className="max-w-md mx-auto border-red-200">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-700">Access Denied</h2>
            <p className="text-red-600">
              This enterprise compliance dashboard is restricted to System Administrators (SA) and Administrative (AD) users only.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30">
      {/* Enterprise Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Crown className="h-6 w-6 md:h-8 w-8 text-blue-600" />
              Enterprise Compliance Administration
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              System-wide compliance oversight and administrative control
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-blue-100 text-blue-800 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {profile?.role} Access
            </Badge>
            {isSystemWideAdmin && (
              <Badge variant="default" className="bg-purple-100 text-purple-800 flex items-center gap-2">
                <Crown className="h-4 w-4" />
                System Admin
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {isLoading ? '...' : metrics?.totalUsers || 0}
                  </p>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-green-600">
                    {isLoading ? '...' : metrics?.activeCourses || 0}
                  </p>
                </div>
                <FileText className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Reviews</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {isLoading ? '...' : pendingApprovals?.length || 0}
                  </p>
                </div>
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">System Health</p>
                  <p className="text-sm font-bold text-purple-600">
                    {metrics?.systemHealth?.status || 'Checking...'}
                  </p>
                </div>
                <Database className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="bg-white rounded-lg border p-2">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-2 text-xs md:text-sm">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs md:text-sm">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 text-xs md:text-sm">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center gap-2 text-xs md:text-sm">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Teams</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2 text-xs md:text-sm">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <Alert className="bg-gradient-to-r from-blue-50 to-white border-blue-200">
              <Crown className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 font-medium">
                Enterprise Compliance Dashboard - Complete administrative oversight of organization-wide compliance
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent System Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-3">
                      {recentActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div>
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(activity.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            System
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activities</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Approvals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Pending Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingApprovals.length > 0 ? (
                    <div className="space-y-3">
                      {pendingApprovals.slice(0, 5).map((approval) => (
                        <div key={approval.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div>
                            <p className="text-sm font-medium">{approval.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {approval.requesterName || 'Unknown'} • {new Date(approval.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No pending approvals</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="space-y-6">
              <TeamKPIDashboard />
              <AdvancedAnalyticsDashboard />
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Alert className="bg-gradient-to-r from-green-50 to-white border-green-200">
              <Users className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">
                User Management - System-wide user oversight and compliance management
              </AlertDescription>
            </Alert>
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">User Management Dashboard</h3>
              <p className="mb-4">Comprehensive user oversight and compliance management</p>
              <Button onClick={() => window.open('/user-management', '_blank')}>
                Open User Management
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <RoleBasedTeamManager />
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Alert className="bg-gradient-to-r from-purple-50 to-white border-purple-200">
              <Settings className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 font-medium">
                System Administration - Advanced system configuration and monitoring
              </AlertDescription>
            </Alert>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Database Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Healthy
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API Services</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Operational
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Background Jobs</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Running
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Compliance Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Security Policies
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      System Reports
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
