
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizedProviderService, type AuthorizedProvider } from '@/services/provider/authorizedProviderService';
import { Building2, MapPin, Users, TrendingUp, Plus, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { CreateProviderDialog } from './CreateProviderDialog';
import { ProviderPerformanceView } from './ProviderPerformanceView';
import { ProviderLocationDashboard } from './ProviderLocationDashboard';
import { ProviderLocationAssignment } from './ProviderLocationAssignment';

export default function AuthorizedProviderManagement() {
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<AuthorizedProvider | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['authorized-providers'],
    queryFn: () => authorizedProviderService.getAllProviders()
  });

  const approveProviderMutation = useMutation({
    mutationFn: ({ providerId, approvedBy }: { providerId: number; approvedBy: string }) =>
      authorizedProviderService.approveProvider(providerId, approvedBy),
    onSuccess: () => {
      toast.success('Provider approved successfully');
      queryClient.invalidateQueries({ queryKey: ['authorized-providers'] });
    },
    onError: (error) => {
      toast.error(`Failed to approve provider: ${error.message}`);
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
          <h1 className="text-3xl font-bold tracking-tight">Authorized Provider Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage training providers, location assignments, and team operations
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </header>

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
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedProvider?.id === provider.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                }`}
                onClick={() => setSelectedProvider(provider)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium truncate">{provider.name}</h4>
                  <Badge variant={getStatusColor(provider.status || 'PENDING')}>
                    {provider.status || 'PENDING'}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span className="truncate">{provider.provider_type}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {provider.primary_location_id ? 'Location assigned' : 'No location assigned'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Rating: {provider.performance_rating.toFixed(1)}/5.0</span>
                  </div>
                </div>
              </div>
            ))}
            
            {providers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No providers found</p>
                <p className="text-sm">Register your first provider to get started</p>
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
                      {selectedProvider.name}
                      <Badge variant={getStatusColor(selectedProvider.status || 'PENDING')}>
                        {selectedProvider.status || 'PENDING'}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedProvider.description || 'No description provided'}
                    </p>
                  </div>
                  
                  {selectedProvider.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => approveProviderMutation.mutate({ 
                          providerId: selectedProvider.id, 
                          approvedBy: 'current-user-id' // Replace with actual user ID
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
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Team management interface</p>
                    <p className="text-sm">Provider-specific team operations will be available here</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="performance">
                  <ProviderPerformanceView providerId={selectedProvider.id.toString()} />
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

      <CreateProviderDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
