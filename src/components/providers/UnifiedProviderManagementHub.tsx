
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { 
  Building2, 
  Users, 
  UserCheck, 
  MapPin, 
  Plus,
  BarChart3,
  Settings,
  Crown
} from 'lucide-react';
import { APProviderAssignmentWorkflow } from './APProviderAssignmentWorkflow';
import { AuthorizedProviderManagement } from './AuthorizedProviderManagement';
import { APUserManagement } from './APUserManagement';
import { ProviderRelationshipManager } from './ProviderRelationshipManager';
import { ProviderAnalyticsDashboard } from './ProviderAnalyticsDashboard';
import type { DatabaseUserRole } from '@/types/database-roles';
import { hasEnterpriseAccess } from '@/types/database-roles';

export function UnifiedProviderManagementHub() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [activeTab, setActiveTab] = useState('overview');
  const [showWorkflow, setShowWorkflow] = useState(false);

  const userRole = profile?.role as DatabaseUserRole;
  const hasEnterprise = userRole ? hasEnterpriseAccess(userRole) : false;
  const isAdmin = userRole === 'SA' || userRole === 'AD';

  // Get summary statistics
  const { data: stats } = useQuery({
    queryKey: ['provider-management-stats'],
    queryFn: async () => {
      // This would typically call the backend for aggregated stats
      return {
        totalProviders: 12,
        activeProviders: 10,
        totalAPUsers: 15,
        assignedAPUsers: 8,
        totalLocations: 25,
        assignedLocations: 12,
        totalTeams: 18
      };
    }
  });

  if (showWorkflow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Provider Assignment Workflow</h1>
            <p className="text-muted-foreground">Create new AP user to provider relationships</p>
          </div>
          <Button variant="outline" onClick={() => setShowWorkflow(false)}>
            Back to Overview
          </Button>
        </div>
        
        <APProviderAssignmentWorkflow />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Provider Management
            {hasEnterprise && <Crown className="h-5 w-5 text-yellow-600" />}
          </h1>
          <p className="text-muted-foreground">
            Manage authorized providers, AP users, and location assignments
          </p>
        </div>
        
        {isAdmin && (
          <Button onClick={() => setShowWorkflow(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Assign AP User to Location
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Authorized Providers</p>
                <p className="text-2xl font-bold">{stats?.activeProviders || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalProviders || 0} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">AP Users</p>
                <p className="text-2xl font-bold">{stats?.assignedAPUsers || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalAPUsers || 0} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned Locations</p>
                <p className="text-2xl font-bold">{stats?.assignedLocations || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalLocations || 0} total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Provider Teams</p>
                <p className="text-2xl font-bold">{stats?.totalTeams || 0}</p>
                <p className="text-xs text-muted-foreground">Active teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="ap-users" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            AP Users
          </TabsTrigger>
          <TabsTrigger value="relationships" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ProviderAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <AuthorizedProviderManagement />
        </TabsContent>

        <TabsContent value="ap-users" className="space-y-6">
          <APUserManagement />
        </TabsContent>

        <TabsContent value="relationships" className="space-y-6">
          <ProviderRelationshipManager />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Provider Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Advanced analytics dashboard coming soon</p>
                <p className="text-sm">Performance metrics, compliance scores, and trend analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
