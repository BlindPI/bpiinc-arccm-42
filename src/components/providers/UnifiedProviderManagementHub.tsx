
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocationProviderTeamWorkflow } from './LocationProviderTeamWorkflow';
import { ProviderLocationAssignments } from './ProviderLocationAssignments';
import { TeamProviderIntegration } from './TeamProviderIntegration';
import { APUserSync } from './APUserSync';
import { supabase } from '@/integrations/supabase/client';
import { UnifiedProviderLocationService } from '@/services/provider/unifiedProviderLocationService';
import {
  Building2,
  Users,
  MapPin,
  ArrowRightLeft,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export function UnifiedProviderManagementHub() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('workflow');

  // Get unified system health data
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => UnifiedProviderLocationService.getSystemHealthReport(),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Get AP users from profiles table
  const { data: apUsers = [] } = useQuery({
    queryKey: ['ap-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'AP')
        .order('display_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get authorized providers
  const { data: authorizedProviders = [] } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select(`
          *,
          primary_location:locations!primary_location_id(*)
        `)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Get locations
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Auto-fix system issues using unified service
  const autoFixMutation = useMutation({
    mutationFn: () => UnifiedProviderLocationService.autoFixAssignmentIssues(),
    onSuccess: (results) => {
      toast.success(`Fixed ${results.apUserAssignments + results.providerRecords} issues automatically`);
      
      if (results.errors.length > 0) {
        toast.error(`${results.errors.length} issues require manual attention`);
        console.warn('Auto-fix errors:', results.errors);
      }
      
      // Refresh all data
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ap-users'] });
    },
    onError: (error: any) => {
      toast.error(`Auto-fix failed: ${error.message}`);
    }
  });

  // Manual sync AP user using unified service
  const syncAPUserMutation = useMutation({
    mutationFn: async ({ apUserId, locationId }: { apUserId: string; locationId?: string }) => {
      if (!locationId) {
        // Find the first available location
        const availableLocation = locations.find(loc =>
          !authorizedProviders.some(prov => prov.primary_location_id === loc.id)
        ) || locations[0];
        
        if (!availableLocation) {
          throw new Error('No locations available for assignment');
        }
        
        locationId = availableLocation.id;
      }
      
      return UnifiedProviderLocationService.ensureAPUserProperAssignment(apUserId, locationId);
    },
    onSuccess: () => {
      toast.success('AP User properly assigned with location and provider record');
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ap-users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to sync AP User: ${error.message}`);
    }
  });

  // Calculate metrics from system health or fallback to legacy approach
  const systemMetrics = systemHealth ? {
    totalAPUsers: systemHealth.summary.totalAPUsers,
    apUsersWithIssues: systemHealth.summary.apUsersWithIssues,
    totalTeams: systemHealth.summary.totalTeams,
    teamsWithIssues: systemHealth.summary.teamsWithIssues,
    overallScore: systemHealth.overallScore
  } : {
    totalAPUsers: apUsers.length,
    apUsersWithIssues: 0,
    totalTeams: 0,
    teamsWithIssues: 0,
    overallScore: 100
  };

  // Find problematic users from system health data
  const problemUsers = systemHealth?.apUserStatus.filter(user => user.issues.length > 0) || [];
  const problemTeams = systemHealth?.teamHealth.filter(team => team.issues.length > 0) || [];

  return (
    <div className="space-y-6">
      {/* Header with System Status */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provider Management Hub</h1>
          <p className="text-muted-foreground mt-2">
            Unified management of AP users, providers, locations, and teams
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              systemMetrics.overallScore >= 90 ? 'bg-green-500' :
              systemMetrics.overallScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">
              System Health: {systemMetrics.overallScore}%
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchHealth()}
            disabled={healthLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${healthLoading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          
          {(problemUsers.length > 0 || problemTeams.length > 0) && (
            <Button
              variant="default"
              size="sm"
              onClick={() => autoFixMutation.mutate()}
              disabled={autoFixMutation.isPending}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${autoFixMutation.isPending ? 'animate-spin' : ''}`} />
              Auto-Fix Issues
            </Button>
          )}
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              AP Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{systemMetrics.totalAPUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {systemMetrics.apUsersWithIssues} with issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemMetrics.totalTeams}</div>
            <p className="text-xs text-gray-500 mt-1">
              {systemMetrics.teamsWithIssues} with issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{locations.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              systemMetrics.overallScore >= 90 ? 'text-green-600' :
              systemMetrics.overallScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {systemMetrics.overallScore}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Overall health</p>
          </CardContent>
        </Card>
      </div>

      {/* System Issues Alert */}
      {(problemUsers.length > 0 || problemTeams.length > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              System Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {problemUsers.length > 0 && (
              <div>
                <h4 className="font-medium text-amber-800 mb-2">
                  AP Users with Issues ({problemUsers.length})
                </h4>
                <div className="space-y-2">
                  {problemUsers.map((user) => (
                    <div key={user.userId} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <span className="font-medium">{user.displayName}</span>
                        <Badge variant="outline" className="ml-2">
                          {user.assignmentStatus}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {user.issues.slice(0, 2).join(', ')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => syncAPUserMutation.mutate({ apUserId: user.userId })}
                        disabled={syncAPUserMutation.isPending}
                      >
                        Fix Assignment
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {problemTeams.length > 0 && (
              <div>
                <h4 className="font-medium text-amber-800 mb-2">
                  Teams with Issues ({problemTeams.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {problemTeams.map((team) => (
                    <div key={team.teamId} className="p-2 bg-white rounded border">
                      <span className="font-medium">{team.teamName}</span>
                      <Badge variant="outline" className="ml-2">
                        {team.assignmentStatus}
                      </Badge>
                      <p className="text-sm text-gray-500">{team.locationName}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {team.issues.slice(0, 1).join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Management Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="sync">AP Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-6">
          <LocationProviderTeamWorkflow />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <ProviderLocationAssignments />
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <TeamProviderIntegration />
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <APUserSync />
        </TabsContent>
      </Tabs>
    </div>
  );
}
