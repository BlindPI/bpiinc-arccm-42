
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { useProviderAccess } from '@/hooks/useProviderAccess';
import { authorizedProviderService } from '@/services/provider/authorizedProviderService';
import { teamManagementService } from '@/services/team/teamManagementService';
import { Building2, Users, MapPin, TrendingUp, Plus, Settings } from 'lucide-react';
import { CreateProviderTeamWizard } from './CreateProviderTeamWizard';
import { ProviderDashboard } from './ProviderDashboard';
import { LocationTeamManager } from './LocationTeamManager';
import { ProviderTeamList } from './ProviderTeamList';

export function ProviderManagementHub() {
  const { provider, isProvider, canManageLocation } = useProviderAccess();
  const [selectedView, setSelectedView] = useState('dashboard');
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  const { data: providers = [] } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => authorizedProviderService.getAllProviders(),
    enabled: !isProvider // Only load all providers if user is not a provider
  });

  const { data: providerTeams = [] } = useQuery({
    queryKey: ['provider-teams', provider?.id],
    queryFn: () => provider ? teamManagementService.getProviderTeams(provider.id) : [],
    enabled: !!provider?.id
  });

  if (isProvider && !provider) {
    return (
      <div className="p-8 text-center">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">Provider Access Required</h3>
        <p className="text-muted-foreground">
          You need to be assigned as an authorized provider to access this section.
        </p>
      </div>
    );
  }

  const availableViews = isProvider ? ['dashboard', 'teams', 'locations'] : ['overview', 'providers', 'teams', 'analytics'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isProvider ? `${provider?.name} Management` : 'Provider Management Hub'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isProvider 
              ? 'Manage your teams, locations, and performance metrics'
              : 'Comprehensive provider and team management system'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isProvider && provider?.primary_location_id && canManageLocation(provider.primary_location_id) && (
            <Button onClick={() => setShowCreateWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Providers</p>
                <p className="text-2xl font-bold">{isProvider ? 1 : providers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Teams</p>
                <p className="text-2xl font-bold">{providerTeams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Locations</p>
                <p className="text-2xl font-bold">{provider?.primary_location_id ? 1 : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="text-2xl font-bold">{provider?.performance_rating.toFixed(1) || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <CardHeader className="border-b">
            <TabsList className="w-full justify-start">
              {availableViews.map((view) => (
                <TabsTrigger key={view} value={view} className="capitalize">
                  {view}
                </TabsTrigger>
              ))}
            </TabsList>
          </CardHeader>

          <CardContent className="p-6">
            {isProvider ? (
              <>
                <TabsContent value="dashboard">
                  <ProviderDashboard provider={provider!} />
                </TabsContent>
                
                <TabsContent value="teams">
                  <ProviderTeamList 
                    teams={providerTeams} 
                    providerId={provider!.id}
                    canManage={canManageLocation(provider?.primary_location_id)}
                  />
                </TabsContent>
                
                <TabsContent value="locations">
                  <LocationTeamManager 
                    locationId={provider!.primary_location_id!}
                    providerId={provider!.id}
                  />
                </TabsContent>
              </>
            ) : (
              <>
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {providers.map((prov) => (
                      <Card key={prov.id} className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium">{prov.name}</h3>
                          <Badge variant={prov.status === 'APPROVED' ? 'default' : 'secondary'}>
                            {prov.status}
                          </Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>Type: {prov.provider_type}</p>
                          <p>Location: {prov.primary_location?.name || 'Not assigned'}</p>
                          <p>Rating: {prov.performance_rating.toFixed(1)}/5.0</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="providers">
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Provider management interface will be implemented here</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="teams">
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Global team management interface will be implemented here</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="analytics">
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Analytics dashboard will be implemented here</p>
                  </div>
                </TabsContent>
              </>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Create Team Wizard */}
      {showCreateWizard && (
        <CreateProviderTeamWizard 
          provider={provider!}
          onClose={() => setShowCreateWizard(false)}
          onSuccess={() => {
            setShowCreateWizard(false);
            // Refresh teams data
          }}
        />
      )}
    </div>
  );
}
