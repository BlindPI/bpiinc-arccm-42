
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
import { 
  Building2, 
  Users, 
  MapPin, 
  ArrowRightLeft,
  UserCheck,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export function UnifiedProviderManagementHub() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('workflow');

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

  // Sync AP user to authorized provider
  const syncAPUserMutation = useMutation({
    mutationFn: async ({ apUserId, locationId }: { apUserId: string; locationId?: string }) => {
      // Get AP user details
      const { data: apUser, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', apUserId)
        .single();
      
      if (userError) throw userError;

      // Create or update authorized provider record
      const { data: provider, error: providerError } = await supabase
        .from('authorized_providers')
        .upsert({
          id: apUserId, // Use the same UUID as the user
          name: apUser.display_name || `Provider ${apUser.email}`,
          provider_type: 'authorized_partner',
          status: 'active',
          primary_location_id: locationId,
          contact_email: apUser.email,
          description: `Authorized Provider for ${apUser.display_name}`,
          performance_rating: 4.5,
          compliance_score: 95.0
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (providerError) throw providerError;
      return provider;
    },
    onSuccess: () => {
      toast.success('AP User synced to Authorized Provider successfully');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
      queryClient.invalidateQueries({ queryKey: ['ap-users'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to sync AP User: ${error.message}`);
    }
  });

  // Find unsynced AP users (those without corresponding authorized provider records)
  const unsyncedAPUsers = apUsers.filter(apUser => 
    !authorizedProviders.some(provider => provider.id === apUser.id)
  );

  // Find locations without providers
  const unassignedLocations = locations.filter(location =>
    !authorizedProviders.some(provider => provider.primary_location_id === location.id)
  );

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
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm">System Active</span>
          </div>
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
            <div className="text-2xl font-bold text-blue-600">{apUsers.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {unsyncedAPUsers.length} unsynced
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Authorized Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{authorizedProviders.length}</div>
            <p className="text-xs text-gray-500 mt-1">Active providers</p>
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
            <p className="text-xs text-gray-500 mt-1">
              {unassignedLocations.length} unassigned
            </p>
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
            <div className="text-2xl font-bold text-amber-600">
              {unsyncedAPUsers.length === 0 && unassignedLocations.length === 0 ? 'Healthy' : 'Attention'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {unsyncedAPUsers.length + unassignedLocations.length} issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Issues Alert */}
      {(unsyncedAPUsers.length > 0 || unassignedLocations.length > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              System Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {unsyncedAPUsers.length > 0 && (
              <div>
                <h4 className="font-medium text-amber-800 mb-2">
                  Unsynced AP Users ({unsyncedAPUsers.length})
                </h4>
                <div className="space-y-2">
                  {unsyncedAPUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div>
                        <span className="font-medium">{user.display_name || user.email}</span>
                        <Badge variant="outline" className="ml-2">AP</Badge>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => syncAPUserMutation.mutate({ apUserId: user.id })}
                        disabled={syncAPUserMutation.isPending}
                      >
                        Sync to Provider
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unassignedLocations.length > 0 && (
              <div>
                <h4 className="font-medium text-amber-800 mb-2">
                  Unassigned Locations ({unassignedLocations.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {unassignedLocations.map((location) => (
                    <div key={location.id} className="p-2 bg-white rounded border">
                      <span className="font-medium">{location.name}</span>
                      <p className="text-sm text-gray-500">{location.city}, {location.state}</p>
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
