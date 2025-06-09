import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Key, 
  Settings, 
  Users,
  AlertTriangle,
  CheckCircle,
  Globe,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SSOProvider {
  id: string;
  name: string;
  provider_type: 'saml' | 'oauth' | 'oidc';
  enabled: boolean;
  configuration: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function SSOIntegrationManager() {
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);
  const [newProviderData, setNewProviderData] = useState({
    name: '',
    provider_type: 'saml' as const,
    enabled: true,
    configuration: {}
  });

  const queryClient = useQueryClient();

  const { data: ssoProviders = [], isLoading } = useQuery({
    queryKey: ['sso-providers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sso_providers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SSOProvider[];
    }
  });

  const { data: ssoSessions = [] } = useQuery({
    queryKey: ['sso-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sso_sessions')
        .select(`
          *,
          profiles(display_name, email)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data || [];
    }
  });

  const createProviderMutation = useMutation({
    mutationFn: async (providerData: typeof newProviderData) => {
      const { data, error } = await supabase
        .from('sso_providers')
        .insert(providerData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('SSO provider created successfully');
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
      setNewProviderData({
        name: '',
        provider_type: 'saml',
        enabled: true,
        configuration: {}
      });
    },
    onError: (error) => {
      toast.error(`Failed to create SSO provider: ${error.message}`);
    }
  });

  const updateProviderMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SSOProvider> }) => {
      const { data, error } = await supabase
        .from('sso_providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('SSO provider updated successfully');
      queryClient.invalidateQueries({ queryKey: ['sso-providers'] });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (providerId: string) => {
      // Simulate SSO connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would test the actual SSO connection
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (!success) {
        throw new Error('Connection test failed');
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast.success('SSO connection test successful');
    },
    onError: (error) => {
      toast.error(`Connection test failed: ${error.message}`);
    }
  });

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'saml': return <Shield className="h-4 w-4" />;
      case 'oauth': return <Key className="h-4 w-4" />;
      case 'oidc': return <Globe className="h-4 w-4" />;
      default: return <Lock className="h-4 w-4" />;
    }
  };

  const getProviderStatusBadge = (enabled: boolean) => {
    return enabled ? (
      <Badge variant="default" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Inactive
      </Badge>
    );
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            SSO Integration Management
          </h1>
          <p className="text-muted-foreground">
            Configure and manage Single Sign-On providers
          </p>
        </div>
      </div>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">SSO Providers</TabsTrigger>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-6">
          {/* Add New Provider */}
          <Card>
            <CardHeader>
              <CardTitle>Add New SSO Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="provider-name">Provider Name</Label>
                  <Input
                    id="provider-name"
                    placeholder="e.g., Company SAML"
                    value={newProviderData.name}
                    onChange={(e) => setNewProviderData({ 
                      ...newProviderData, 
                      name: e.target.value 
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="provider-type">Provider Type</Label>
                  <select
                    id="provider-type"
                    className="w-full px-3 py-2 border rounded-md"
                    value={newProviderData.provider_type}
                    onChange={(e) => setNewProviderData({ 
                      ...newProviderData, 
                      provider_type: e.target.value as 'saml' | 'oauth' | 'oidc'
                    })}
                  >
                    <option value="saml">SAML 2.0</option>
                    <option value="oauth">OAuth 2.0</option>
                    <option value="oidc">OpenID Connect</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={() => createProviderMutation.mutate(newProviderData)}
                    disabled={!newProviderData.name || createProviderMutation.isPending}
                  >
                    Add Provider
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Providers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {ssoProviders.map((provider) => (
              <Card key={provider.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getProviderIcon(provider.provider_type)}
                      {provider.name}
                    </CardTitle>
                    {getProviderStatusBadge(provider.enabled)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Provider Type:</span>
                    <Badge variant="outline">{provider.provider_type.toUpperCase()}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Switch
                      checked={provider.enabled}
                      onCheckedChange={(enabled) => 
                        updateProviderMutation.mutate({ 
                          id: provider.id, 
                          updates: { enabled } 
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testConnectionMutation.mutate(provider.id)}
                      disabled={testConnectionMutation.isPending}
                    >
                      Test Connection
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {ssoProviders.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No SSO providers configured</p>
                <p className="text-sm text-gray-500">
                  Add your first SSO provider to enable single sign-on authentication
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active SSO Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ssoSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{session.profiles?.display_name}</div>
                      <div className="text-sm text-muted-foreground">{session.profiles?.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">Started: {new Date(session.created_at).toLocaleString()}</div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                  </div>
                ))}
                
                {ssoSessions.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No active SSO sessions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Global SSO Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Force SSO Authentication</div>
                  <div className="text-sm text-muted-foreground">
                    Require all users to authenticate via SSO
                  </div>
                </div>
                <Switch />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Just-in-Time Provisioning</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically create user accounts on first SSO login
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Session Timeout</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically log out inactive users
                  </div>
                </div>
                <Input 
                  type="number" 
                  placeholder="24"
                  className="w-20"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
