
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Shield, 
  Plus, 
  Settings, 
  Users, 
  Activity,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';

interface SSOProvider {
  id: string;
  name: string;
  integration_type: 'saml' | 'oauth' | 'oidc';
  endpoint_url: string;
  is_active: boolean;
  configuration: {
    client_id?: string;
    client_secret?: string;
    redirect_uri?: string;
    issuer?: string;
    metadata_url?: string;
  };
  created_at: string;
}

interface SSOSession {
  id: string;
  provider_id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
}

export function SSOIntegrationManager() {
  const [activeTab, setActiveTab] = useState('providers');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  // Fetch SSO providers using api_integrations table
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['sso-providers'],
    queryFn: async (): Promise<SSOProvider[]> => {
      const { data, error } = await supabase
        .from('api_integrations')
        .select('*')
        .in('integration_type', ['saml', 'oauth', 'oidc'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        name: item.name,
        integration_type: item.integration_type as 'saml' | 'oauth' | 'oidc',
        endpoint_url: item.endpoint_url || '',
        is_active: item.is_active || false,
        configuration: item.configuration || {},
        created_at: item.created_at
      }));
    }
  });

  // Mock SSO sessions (since sso_sessions table doesn't exist)
  const { data: sessions = [] } = useQuery({
    queryKey: ['sso-sessions'],
    queryFn: async (): Promise<SSOSession[]> => {
      // Mock data since table doesn't exist
      return [];
    }
  });

  const createProviderMutation = useMutation({
    mutationFn: async (providerData: Omit<SSOProvider, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('api_integrations')
        .insert({
          name: providerData.name,
          integration_type: providerData.integration_type,
          endpoint_url: providerData.endpoint_url,
          is_active: providerData.is_active,
          configuration: providerData.configuration
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('SSO provider created successfully');
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
      setShowCreateForm(false);
    },
    onError: (error) => {
      toast.error(`Failed to create provider: ${error.message}`);
    }
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SSOProvider> }) => {
      const { data, error } = await supabase
        .from('api_integrations')
        .update({
          name: updates.name,
          integration_type: updates.integration_type,
          endpoint_url: updates.endpoint_url,
          is_active: updates.is_active,
          configuration: updates.configuration
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('SSO provider updated successfully');
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
    },
    onError: (error) => {
      toast.error(`Failed to update provider: ${error.message}`);
    }
  });

  const [newProvider, setNewProvider] = useState<Omit<SSOProvider, 'id' | 'created_at'>>({
    name: '',
    integration_type: 'saml',
    endpoint_url: '',
    is_active: false,
    configuration: {}
  });

  const handleCreateProvider = () => {
    if (!newProvider.name || !newProvider.endpoint_url) {
      toast.error('Please fill in all required fields');
      return;
    }
    createProviderMutation.mutate(newProvider);
  };

  const toggleProviderStatus = (provider: SSOProvider) => {
    updateProviderMutation.mutate({
      id: provider.id,
      updates: { ...provider, is_active: !provider.is_active }
    });
  };

  const toggleSecretVisibility = (providerId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const getProviderStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? 'default' : 'secondary'}>
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );

  const getProviderTypeBadge = (type: string) => (
    <Badge variant="outline">{type.toUpperCase()}</Badge>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SSO Integration Manager</h2>
          <p className="text-muted-foreground">
            Manage single sign-on providers and authentication settings
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="providers">SSO Providers</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New SSO Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Provider Name</Label>
                    <Input
                      id="name"
                      value={newProvider.name}
                      onChange={(e) => setNewProvider(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Company Active Directory"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Provider Type</Label>
                    <Select 
                      value={newProvider.integration_type} 
                      onValueChange={(value: 'saml' | 'oauth' | 'oidc') => 
                        setNewProvider(prev => ({ ...prev, integration_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saml">SAML 2.0</SelectItem>
                        <SelectItem value="oauth">OAuth 2.0</SelectItem>
                        <SelectItem value="oidc">OpenID Connect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="endpoint">Endpoint URL</Label>
                  <Input
                    id="endpoint"
                    value={newProvider.endpoint_url}
                    onChange={(e) => setNewProvider(prev => ({ ...prev, endpoint_url: e.target.value }))}
                    placeholder="https://login.company.com/sso"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Button onClick={handleCreateProvider} disabled={createProviderMutation.isPending}>
                    {createProviderMutation.isPending ? 'Creating...' : 'Create Provider'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {providers.map((provider) => (
              <Card key={provider.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Shield className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">{provider.name}</h3>
                        <p className="text-sm text-muted-foreground">{provider.endpoint_url}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getProviderTypeBadge(provider.integration_type)}
                          {getProviderStatusBadge(provider.is_active)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSecretVisibility(provider.id)}
                      >
                        {showSecrets[provider.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProviderStatus(provider)}
                        disabled={updateProviderMutation.isPending}
                      >
                        {provider.is_active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {showSecrets[provider.id] && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Configuration</h4>
                      <pre className="text-sm">{JSON.stringify(provider.configuration, null, 2)}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {providers.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No SSO providers configured</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active SSO Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No active SSO sessions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">Session {session.id.slice(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(session.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SSO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Automatic User Provisioning</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically create user accounts for new SSO users
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Session Timeout</h4>
                  <p className="text-sm text-muted-foreground">
                    Maximum duration for SSO sessions
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Fallback Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Allow local authentication when SSO is unavailable
                  </p>
                </div>
                <Button variant="outline">Configure</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
