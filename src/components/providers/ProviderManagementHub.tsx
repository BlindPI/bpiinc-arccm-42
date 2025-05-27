
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from '@tanstack/react-query';
import { useProviderAccess } from '@/hooks/useProviderAccess';
import { authorizedProviderService } from '@/services/provider/authorizedProviderService';
import { teamManagementService } from '@/services/team/teamManagementService';
import { Building2, Users, MapPin, TrendingUp, Plus, Settings, Workflow } from 'lucide-react';
import { CreateProviderTeamWizard } from './CreateProviderTeamWizard';
import { EnterpriseProviderDashboard } from './dashboards/EnterpriseProviderDashboard';
import { LocationTeamManager } from './LocationTeamManager';
import { ProviderTeamList } from './ProviderTeamList';
import { WorkflowEngine } from './workflows/WorkflowEngine';
import { ContextualHelp } from './help/ContextualHelp';

export function ProviderManagementHub() {
  const { provider, isProvider, canManageLocation } = useProviderAccess();
  const [selectedView, setSelectedView] = useState('dashboard');
  const [showCreateWizard, setShowCreateWizard] = useState(false);

  const { data: providers = [] } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => authorizedProviderService.getAllProviders(),
    enabled: !isProvider
  });

  const { data: providerTeams = [] } = useQuery({
    queryKey: ['provider-teams', provider?.id],
    queryFn: () => provider ? teamManagementService.getProviderTeams(provider.id) : [],
    enabled: !!provider?.id
  });

  // Mock workflow data for demonstration
  const mockWorkflows = [
    {
      id: '1',
      title: 'New Team Onboarding - Alpha Squad',
      type: 'team_creation' as const,
      status: 'active' as const,
      progress: 60,
      currentStep: 2,
      steps: [
        {
          id: '1',
          title: 'Team Registration',
          description: 'Basic team information and setup',
          status: 'completed' as const
        },
        {
          id: '2',
          title: 'Location Assignment',
          description: 'Assign team to operational location',
          status: 'completed' as const
        },
        {
          id: '3',
          title: 'Provider Approval',
          description: 'Awaiting provider management approval',
          status: 'in_progress' as const,
          assignee: 'Provider Manager'
        },
        {
          id: '4',
          title: 'Final Setup',
          description: 'Complete team configuration and activation',
          status: 'pending' as const
        }
      ],
      createdBy: 'system',
      createdAt: new Date('2024-01-15')
    }
  ];

  const handleWorkflowApprove = (processId: string, stepId: string) => {
    console.log('Approving step:', stepId, 'for process:', processId);
  };

  const handleWorkflowReject = (processId: string, stepId: string, reason: string) => {
    console.log('Rejecting step:', stepId, 'for process:', processId, 'reason:', reason);
  };

  const handleWorkflowAssign = (processId: string, stepId: string, assignee: string) => {
    console.log('Assigning step:', stepId, 'to:', assignee, 'for process:', processId);
  };

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

  const availableViews = isProvider 
    ? ['dashboard', 'teams', 'locations', 'workflows'] 
    : ['overview', 'providers', 'teams', 'analytics', 'workflows'];

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Help */}
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
          <ContextualHelp context="provider_management" />
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

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Active Providers</p>
                <p className="text-2xl font-bold text-blue-900">{isProvider ? 1 : providers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Teams</p>
                <p className="text-2xl font-bold text-green-900">{providerTeams.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MapPin className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Locations</p>
                <p className="text-2xl font-bold text-purple-900">{provider?.primary_location_id ? 1 : '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Performance</p>
                <p className="text-2xl font-bold text-orange-900">{provider?.performance_rating.toFixed(1) || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Enhanced Tabs */}
      <Card className="border-2">
        <Tabs value={selectedView} onValueChange={setSelectedView}>
          <CardHeader className="border-b bg-muted/30">
            <TabsList className="w-full justify-start bg-transparent">
              {availableViews.map((view) => (
                <TabsTrigger 
                  key={view} 
                  value={view} 
                  className="capitalize data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {view === 'workflows' && <Workflow className="h-4 w-4 mr-2" />}
                  {view}
                </TabsTrigger>
              ))}
            </TabsList>
          </CardHeader>

          <CardContent className="p-6">
            {isProvider ? (
              <>
                <TabsContent value="dashboard">
                  <EnterpriseProviderDashboard provider={provider!} />
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

                <TabsContent value="workflows">
                  <WorkflowEngine
                    processes={mockWorkflows}
                    onApprove={handleWorkflowApprove}
                    onReject={handleWorkflowReject}
                    onAssign={handleWorkflowAssign}
                  />
                </TabsContent>
              </>
            ) : (
              <>
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {providers.map((prov) => (
                      <Card key={prov.id} className="p-4 hover:shadow-md transition-shadow">
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
                    <p>Global provider management interface</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="teams">
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Global team management interface</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="analytics">
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Analytics dashboard</p>
                  </div>
                </TabsContent>

                <TabsContent value="workflows">
                  <WorkflowEngine
                    processes={mockWorkflows}
                    onApprove={handleWorkflowApprove}
                    onReject={handleWorkflowReject}
                    onAssign={handleWorkflowAssign}
                  />
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
          }}
        />
      )}
    </div>
  );
}
