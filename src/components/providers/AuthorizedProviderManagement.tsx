import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizedProviderService } from '@/services/provider/authorizedProviderService';
import { apUserService } from '@/services/provider/apUserService';
import type { AuthorizedProvider } from '@/types/provider-management';
import { Building2, MapPin, Users, TrendingUp, Plus, CheckCircle, XCircle, Target } from 'lucide-react';
import { toast } from 'sonner';
import { CreateProviderDialog } from './CreateProviderDialog';
import { ProviderPerformanceView } from './ProviderPerformanceView';
import { ProviderLocationDashboard } from './ProviderLocationDashboard';
import { ProviderLocationAssignment } from './ProviderLocationAssignment';
import { ProviderTeamManagement } from './ProviderTeamManagement';
import { ThreeClickProviderWorkflow } from './ThreeClickProviderWorkflow';
import { APUserSelectionDialog } from './APUserSelectionDialog';
import { APUserManagementDashboard } from './APUserManagementDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

export default function AuthorizedProviderManagement() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showAPUserDialog, setShowAPUserDialog] = useState(false);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => apUserService.getAuthorizedProviders()
  });

  const approveProviderMutation = useMutation({
    mutationFn: ({ providerId }: { providerId: string }) =>
      authorizedProviderService.approveProvider(providerId, user?.id || ''),
    onSuccess: () => {
      toast.success('Provider approved successfully');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
    },
    onError: (error) => {
      toast.error(`Failed to approve provider: ${error.message}`);
    }
  });

  const rejectProviderMutation = useMutation({
    mutationFn: ({ providerId, reason }: { providerId: string; reason?: string }) =>
      authorizedProviderService.rejectProvider(providerId, user?.id || '', reason),
    onSuccess: () => {
      toast.success('Provider rejected successfully');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
    },
    onError: (error) => {
      toast.error(`Failed to reject provider: ${error.message}`);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'default';
      case 'PENDING': return 'secondary';
      case 'REJECTED': return 'destructive';
      default: return 'outline';
    }
  };

  const handleProviderCreated = async () => {
    await queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading authorized providers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provider Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage authorized providers, location assignments, and team operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowWorkflow(true)}
          >
            <Target className="h-4 w-4 mr-2" />
            3-Click Setup
          </Button>
          {/* SA/AD can assign AP users as providers */}
          {['SA', 'AD'].includes(profile?.role || '') && (
            <Button onClick={() => setShowAPUserDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Assign AP User
            </Button>
          )}
          {/* Only show Add Provider Details for AP users */}
          {profile?.role === 'AP' && (
            <Button 
              variant="outline"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Provider Details
            </Button>
          )}
        </div>
      </header>

      <Tabs defaultValue="providers">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="providers">Authorized Providers</TabsTrigger>
          {['SA', 'AD'].includes(profile?.role || '') && (
            <TabsTrigger value="ap-users">AP User Management</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="providers">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Providers List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Providers ({providers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {providers.map((provider: any) => (
                  <div
                    key={provider.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProvider?.id === provider.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium truncate">
                        {provider.profiles?.display_name || provider.name}
                      </h4>
                      <Badge variant={getStatusColor(provider.status || 'PENDING')}>
                        {provider.status || 'PENDING'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">
                          {provider.profiles?.organization || 'Authorized Provider'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {provider.locations?.name || 'No location assigned'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>Rating: {(provider.performance_rating || 0).toFixed(1)}/5.0</span>
                      </div>
                      
                      {provider.profiles?.email && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="truncate">{provider.profiles.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {providers.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No authorized providers found</p>
                    <p className="text-sm">Assign AP users to locations to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Details */}
            <Card className="lg:col-span-3">
              {selectedProvider ? (
                <Tabs defaultValue="dashboard">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {selectedProvider.profiles?.display_name || selectedProvider.name}
                          <Badge variant={getStatusColor(selectedProvider.status || 'PENDING')}>
                            {selectedProvider.status || 'PENDING'}
                          </Badge>
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedProvider.profiles?.organization || selectedProvider.description || 'Authorized Provider'}
                        </p>
                        {selectedProvider.profiles?.job_title && (
                          <p className="text-xs text-muted-foreground">
                            {selectedProvider.profiles.job_title}
                          </p>
                        )}
                      </div>
                      
                      {selectedProvider.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => rejectProviderMutation.mutate({ 
                              providerId: selectedProvider.id,
                              reason: 'Manual rejection by administrator'
                            })}
                            disabled={rejectProviderMutation.isPending}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            {rejectProviderMutation.isPending ? 'Rejecting...' : 'Reject'}
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => approveProviderMutation.mutate({ 
                              providerId: selectedProvider.id
                            })}
                            disabled={approveProviderMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {approveProviderMutation.isPending ? 'Approving...' : 'Approve'}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <TabsList className="w-full justify-start">
                      <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                      <TabsTrigger value="location">Location Assignment</TabsTrigger>
                      <TabsTrigger value="teams">Team Management</TabsTrigger>
                      <TabsTrigger value="performance">Performance</TabsTrigger>
                      <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    </TabsList>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <TabsContent value="dashboard">
                      <ProviderLocationDashboard provider={selectedProvider} />
                    </TabsContent>
                    
                    <TabsContent value="location">
                      <ProviderLocationAssignment 
                        provider={selectedProvider}
                        onLocationAssigned={() => {
                          queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
                        }}
                      />
                    </TabsContent>
                    
                    <TabsContent value="teams">
                      <ProviderTeamManagement
                        providerId={selectedProvider.id}
                        providerName={selectedProvider.profiles?.display_name || selectedProvider.name}
                      />
                    </TabsContent>
                    
                    <TabsContent value="performance">
                      <ProviderPerformanceView providerId={selectedProvider.id} />
                    </TabsContent>
                    
                    <TabsContent value="compliance">
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Compliance tracking feature coming soon</p>
                      </div>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              ) : (
                <CardContent className="p-8 text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a Provider</h3>
                  <p className="text-muted-foreground">
                    Choose a provider from the list to view its dashboard, manage location assignments, teams, performance, and compliance.
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="ap-users">
          <APUserManagementDashboard />
        </TabsContent>
      </Tabs>

      <CreateProviderDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onProviderCreated={handleProviderCreated}
      />

      {showWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Quick Provider Setup</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowWorkflow(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              <ThreeClickProviderWorkflow 
                onComplete={() => {
                  setShowWorkflow(false);
                  queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
                  queryClient.invalidateQueries({ queryKey: ['teams'] });
                  queryClient.invalidateQueries({ queryKey: ['locations'] });
                }}
              />
            </div>
          </div>
        </div>
      )}

      <APUserSelectionDialog 
        open={showAPUserDialog}
        onOpenChange={setShowAPUserDialog}
        onProviderCreated={handleProviderCreated}
      />
    </div>
  );
}
