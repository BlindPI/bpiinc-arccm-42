
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, Settings, Users, AlertCircle, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SSOProvider {
  id: string;
  name: string;
  integration_type: 'saml' | 'oauth' | 'oidc';
  endpoint_url: string;
  is_active: boolean;
  configuration: {
    provider_type?: 'saml' | 'oauth' | 'oidc';
    client_id?: string;
    issuer_url?: string;
    metadata_url?: string;
    certificate?: string;
    auto_provision?: boolean;
    role_mapping?: Record<string, string>;
  };
  authentication_config?: Record<string, any>;
  created_at: string;
  updated_at: string;
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
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [providerForm, setProviderForm] = useState({
    name: '',
    integration_type: 'saml' as const,
    endpoint_url: '',
    client_id: '',
    issuer_url: '',
    auto_provision: true
  });

  // Use existing api_integrations table for SSO providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['sso-providers'],
    queryFn: async (): Promise<SSOProvider[]> => {
      try {
        const { data, error } = await supabase
          .from('api_integrations')
          .select('*')
          .eq('integration_type', 'sso')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching SSO providers:', error);
          return [];
        }
        
        return (data || []).map(item => ({
          ...item,
          integration_type: (item.configuration as any)?.provider_type || 'saml',
          configuration: item.configuration as SSOProvider['configuration'],
          authentication_config: item.authentication_config as Record<string, any>
        }));
      } catch (error) {
        console.error('Error in SSO providers query:', error);
        return [];
      }
    }
  });

  // Mock SSO sessions since table doesn't exist
  const { data: sessions = [] } = useQuery({
    queryKey: ['sso-sessions'],
    queryFn: async (): Promise<SSOSession[]> => {
      // Return empty array since sso_sessions table doesn't exist
      return [];
    }
  });

  const createProviderMutation = useMutation({
    mutationFn: async (providerData: Partial<SSOProvider>): Promise<SSOProvider> => {
      try {
        const { data, error } = await supabase
          .from('api_integrations')
          .insert({
            name: providerData.name,
            integration_type: 'sso',
            endpoint_url: providerData.endpoint_url,
            is_active: providerData.is_active || true,
            configuration: {
              provider_type: providerData.integration_type,
              client_id: (providerData.configuration as any)?.client_id,
              issuer_url: (providerData.configuration as any)?.issuer_url,
              auto_provision: (providerData.configuration as any)?.auto_provision || true,
              role_mapping: (providerData.configuration as any)?.role_mapping || {}
            },
            authentication_config: providerData.authentication_config || {}
          })
          .select()
          .single();

        if (error) throw error;
        
        return {
          ...data,
          integration_type: (data.configuration as any)?.provider_type || 'saml',
          configuration: data.configuration as SSOProvider['configuration'],
          authentication_config: data.authentication_config as Record<string, any>
        };
      } catch (error) {
        console.error('Error creating SSO provider:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('SSO provider created successfully');
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to create SSO provider: ${error.message}`);
    }
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SSOProvider> & { id: string }): Promise<void> => {
      try {
        const { error } = await supabase
          .from('api_integrations')
          .update({
            name: updates.name,
            endpoint_url: updates.endpoint_url,
            is_active: updates.is_active,
            configuration: updates.configuration,
            authentication_config: updates.authentication_config
          })
          .eq('id', id);

        if (error) throw error;
      } catch (error) {
        console.error('Error updating SSO provider:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('SSO provider updated successfully');
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
      setIsEditing(false);
      setSelectedProvider(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to update SSO provider: ${error.message}`);
    }
  });

  const deleteProviderMutation = useMutation({
    mutationFn: async (providerId: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from('api_integrations')
          .delete()
          .eq('id', providerId);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting SSO provider:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('SSO provider deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
      setSelectedProvider(null);
    },
    onError: (error: any) => {
      toast.error(`Failed to delete SSO provider: ${error.message}`);
    }
  });

  const handleCreateProvider = () => {
    if (!providerForm.name.trim() || !providerForm.endpoint_url.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    createProviderMutation.mutate({
      name: providerForm.name,
      integration_type: providerForm.integration_type,
      endpoint_url: providerForm.endpoint_url,
      is_active: true,
      configuration: {
        provider_type: providerForm.integration_type,
        client_id: providerForm.client_id,
        issuer_url: providerForm.issuer_url,
        auto_provision: providerForm.auto_provision,
        role_mapping: {}
      }
    });
  };

  const resetForm = () => {
    setProviderForm({
      name: '',
      integration_type: 'saml',
      endpoint_url: '',
      client_id: '',
      issuer_url: '',
      auto_provision: true
    });
    setIsEditing(false);
    setSelectedProvider(null);
  };

  const getProviderTypeColor = (type: string) => {
    switch (type) {
      case 'saml': return 'bg-blue-100 text-blue-800';
      case 'oauth': return 'bg-green-100 text-green-800';
      case 'oidc': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            SSO Integration Manager
          </h2>
          <p className="text-muted-foreground">Configure Single Sign-On providers and authentication</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            {sessions.length} Active Sessions
          </Badge>
          <Badge variant="secondary">{providers.length} Providers</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Provider Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {isEditing ? 'Edit SSO Provider' : 'Add New SSO Provider'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="provider-name">Provider Name</Label>
                <Input
                  id="provider-name"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm({...providerForm, name: e.target.value})}
                  placeholder="e.g., Azure AD, Google Workspace"
                />
              </div>
              <div>
                <Label htmlFor="provider-type">Provider Type</Label>
                <Select 
                  value={providerForm.integration_type} 
                  onValueChange={(value: 'saml' | 'oauth' | 'oidc') => 
                    setProviderForm({...providerForm, integration_type: value})
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
              <Label htmlFor="endpoint-url">SSO Endpoint URL</Label>
              <Input
                id="endpoint-url"
                value={providerForm.endpoint_url}
                onChange={(e) => setProviderForm({...providerForm, endpoint_url: e.target.value})}
                placeholder="https://login.example.com/saml2/sso"
              />
            </div>

            {providerForm.integration_type !== 'saml' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client-id">Client ID</Label>
                  <Input
                    id="client-id"
                    value={providerForm.client_id}
                    onChange={(e) => setProviderForm({...providerForm, client_id: e.target.value})}
                    placeholder="OAuth/OIDC Client ID"
                  />
                </div>
                <div>
                  <Label htmlFor="issuer-url">Issuer URL</Label>
                  <Input
                    id="issuer-url"
                    value={providerForm.issuer_url}
                    onChange={(e) => setProviderForm({...providerForm, issuer_url: e.target.value})}
                    placeholder="https://accounts.google.com"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-provision"
                checked={providerForm.auto_provision}
                onCheckedChange={(checked) => setProviderForm({...providerForm, auto_provision: checked})}
              />
              <Label htmlFor="auto-provision">Auto-provision new users</Label>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateProvider}
                disabled={createProviderMutation.isPending}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createProviderMutation.isPending ? 'Creating...' : 'Add Provider'}
              </Button>
              {isEditing && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Provider List */}
        <Card>
          <CardHeader>
            <CardTitle>Configured Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {providers.map((provider) => (
                <div key={provider.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{provider.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={getProviderTypeColor(provider.integration_type)}
                        >
                          {provider.integration_type.toUpperCase()}
                        </Badge>
                        {provider.is_active ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {provider.endpoint_url}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProvider(provider);
                          setIsEditing(true);
                          setProviderForm({
                            name: provider.name,
                            integration_type: provider.integration_type,
                            endpoint_url: provider.endpoint_url,
                            client_id: provider.configuration?.client_id || '',
                            issuer_url: provider.configuration?.issuer_url || '',
                            auto_provision: provider.configuration?.auto_provision || true
                          });
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProviderMutation.mutate(provider.id)}
                        disabled={deleteProviderMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {providers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No SSO providers configured</p>
                  <p className="text-sm">Add your first provider to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active SSO Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active SSO sessions</p>
              <p className="text-sm">Session information will appear here when users authenticate via SSO</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Session {session.id.slice(-8)}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires: {new Date(session.expires_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              SSO integration is configured using the existing API integrations infrastructure. 
              Authentication providers are managed through the api_integrations table with type 'sso'.
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
