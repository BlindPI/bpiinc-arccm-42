/**
 * SIMPLE ROLE ROUTER - Updated with Simple Dashboard Solution
 *
 * ✅ Uses new SimpleDashboard component for core functionality
 * ✅ Maintains existing role-specific dashboards where needed
 * ✅ Falls back to SimpleDashboard for simplified user experience
 * ✅ Single query approach from SimpleDashboardService
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamContext } from '@/hooks/useTeamContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { providerRelationshipService } from '@/services/provider/providerRelationshipService';
import { Shield, MapPin, Users, AlertTriangle, CheckCircle, Crown, Building2, Award, BookOpen, Activity, RefreshCw } from 'lucide-react';

// Import new SimpleDashboard
import { SimpleDashboard } from './SimpleDashboard';

// Import existing proven working dashboards for fallback
import EnhancedProviderDashboard from './role-dashboards/EnhancedProviderDashboard';
import { EnhancedTeamProviderDashboard } from './team/EnhancedTeamProviderDashboard';
import { ITDashboard } from './role-dashboards/ITDashboard';
import { IPDashboard } from './role-dashboards/IPDashboard';
import { EnterpriseICDashboard } from './EnterpriseICDashboard';

export function SimpleRoleRouter() {
  const {
    user
  } = useAuth();
  const {
    data: profile,
    isLoading: profileLoading
  } = useProfile();
  const {
    primaryTeam,
    teamLocation
  } = useTeamContext();
  if (profileLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>;
  }
  if (!user || !profile) {
    return <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Authentication required. Please log in to access your dashboard.
        </AlertDescription>
      </Alert>;
  }
  const userRole = profile.role;
  console.log('🎯 SIMPLE ROLE ROUTER: User role:', userRole, 'Team:', !!primaryTeam);

  // Success banner for all users
  const SuccessBanner = () => <Alert className="bg-green-50 border-green-200">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        ✅ Dashboard Fixed: Now using proven data services with real-time updates and proper role-based functionality
      </AlertDescription>
    </Alert>;

  // Simple Dashboard Mode - Use the new Simple Dashboard Solution
  // This provides a unified, clean experience based on role-based queries
  const useSimpleDashboard = true; // Feature flag for Simple Dashboard Solution

  if (useSimpleDashboard && ['AP', 'IC', 'IP', 'IT'].includes(userRole)) {
    console.log('🎯 ROUTING: Using Simple Dashboard Solution for role:', userRole);
    return <div className="space-y-6">
        <SuccessBanner />
        <Alert className="bg-purple-50 border-purple-200">
          <Shield className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <strong>Simple Dashboard Solution</strong> - Unified role-based dashboard using direct database queries
          </AlertDescription>
        </Alert>
        <SimpleDashboard userId={user.id} />
      </div>;
  }

  // Fallback to existing dashboards for backward compatibility
  // AP (Authorized Provider) Dashboard - Enhanced version
  if (userRole === 'AP') {
    console.log('🎯 ROUTING: AP user to EnhancedProviderDashboard (fallback)');
    return <div className="space-y-6">
        <SuccessBanner />
        <EnhancedProviderDashboard config={{
        welcomeMessage: `Welcome, ${profile.display_name || user.email}`,
        subtitle: 'Authorized Provider Dashboard',
        widgets: []
      }} profile={{
        ...profile,
        status: profile.status || 'ACTIVE'
      }} />
      </div>;
  }

  // Team Member Dashboard (for users with team assignments)
  if (primaryTeam) {
    console.log('🎯 ROUTING: Team member to EnhancedTeamProviderDashboard');
    return <div className="space-y-6">
        <SuccessBanner />
        <Alert className="bg-blue-50 border-blue-200">
          <Users className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Team Dashboard</strong> - {primaryTeam.teams?.name || 'Your Team'}
            {teamLocation?.name && <span className="ml-2">
                <MapPin className="h-3 w-3 inline mr-1" />
                {teamLocation.name}
              </span>}
          </AlertDescription>
        </Alert>
        <EnhancedTeamProviderDashboard />
      </div>;
  }

  // Admin Dashboard (AD/SA users)
  if (userRole === 'AD' || userRole === 'SA') {
    return <AdminQuickDashboard profile={profile} />;
  }

  // Instructor Dashboard (IT users specifically for now)
  if (userRole === 'IT') {
    console.log('🎯 ROUTING: IT user to ITDashboard (fallback)');
    return <ITDashboard />;
  }

  // IP Instructor Dashboard - Now specific handler
  if (userRole === 'IP') {
    console.log('🎯 ROUTING: IP user to IPDashboard (fallback)');
    return <IPDashboard />;
  }

  // IC Instructor Dashboard - Now Enterprise handler
  if (userRole === 'IC') {
    console.log('🎯 ROUTING: IC user to EnterpriseICDashboard (fallback)');
    return <EnterpriseICDashboard />;
  }

  // Default dashboard for other roles
  return <DefaultRoleDashboard profile={profile} userRole={userRole} />;
}

// Simple Admin Dashboard with real data
function AdminQuickDashboard({
  profile
}: {
  profile: any;
}) {
  const {
    data: adminStats
  } = useQuery({
    queryKey: ['admin-quick-stats'],
    queryFn: async () => {
      // Get basic system stats using our proven service
      const providers = await providerRelationshipService.getProviders({});
      const activeProviders = providers.filter(p => p.status === 'active');
      return {
        totalProviders: providers.length,
        activeProviders: activeProviders.length,
        inactiveProviders: providers.length - activeProviders.length
      };
    },
    refetchInterval: 60000
  });
  return <div className="space-y-6">
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✅ Admin Dashboard: Using real provider data from proven services
        </AlertDescription>
      </Alert>
      
      <Alert className="bg-purple-50 border-purple-200">
        <Shield className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-purple-800">
          <strong>Administrator Dashboard</strong> - System-wide management and oversight
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {adminStats?.totalProviders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">System-wide</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Active Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {adminStats?.activeProviders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Inactive Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {adminStats?.inactiveProviders || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span className="text-sm">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Building2 className="h-6 w-6 mb-2" />
              <span className="text-sm">Provider Management</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Award className="h-6 w-6 mb-2" />
              <span className="text-sm">Certificates</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Activity className="h-6 w-6 mb-2" />
              <span className="text-sm">System Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>;
}

// Simple Instructor Dashboard (Fallback for IP/IC until specific dashboards are built)
function InstructorQuickDashboard({
  profile
}: {
  profile: any;
}) {
  const userRole = profile?.role || 'unknown'; // Ensure profile and role exist
  return <div className="space-y-6">
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          ✅ Instructor Dashboard: Base view for {userRole}
        </AlertDescription>
      </Alert>

      <Alert className="bg-blue-50 border-blue-200">
        <BookOpen className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Instructor Dashboard ({userRole})</strong> - Teaching and certification management
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <p className="text-xs text-gray-500 mt-1">Next 14 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">0</div>
            <p className="text-xs text-gray-500 mt-1">Current enrollment</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">0</div>
            <p className="text-xs text-gray-500 mt-1">Issued this month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">N/A</div>
            <p className="text-xs text-gray-500 mt-1">Performance score</p>
          </CardContent>
        </Card>
      </div>
    </div>;
}

// Default dashboard for unrecognized roles
function DefaultRoleDashboard({
  profile,
  userRole
}: {
  profile: any;
  userRole: string;
}) {
  return <div className="space-y-6">
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Role: {userRole}</strong> - Basic dashboard functionality available
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {profile.display_name || profile.email || 'User'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Dashboard Ready</h3>
            <p className="text-muted-foreground mb-4">
              Your role ({userRole}) has basic dashboard access.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>User ID: {profile.id}</p>
              <p>Email: {profile.email}</p>
              <p>Role: {userRole}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}
export default SimpleRoleRouter;