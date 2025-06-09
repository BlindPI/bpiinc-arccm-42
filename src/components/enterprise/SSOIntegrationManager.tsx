
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Plus, Edit, Trash2, Key, Shield } from 'lucide-react';

interface SSOConfiguration {
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  issuer?: string;
  metadata_url?: string;
}

interface SSOProvider {
  id: string;
  name: string;
  integration_type: 'saml' | 'oauth' | 'oidc';
  endpoint_url: string;
  is_active: boolean;
  configuration: SSOConfiguration;
  created_at: string;
}

// Type guard to safely transform database configuration JSON to SSOConfiguration
function transformSSOConfiguration(config: any): SSOConfiguration {
  if (!config || typeof config !== 'object') {
    return {};
  }
  
  return {
    client_id: typeof config.client_id === 'string' ? config.client_id : undefined,
    client_secret: typeof config.client_secret === 'string' ? config.client_secret : undefined,
    redirect_uri: typeof config.redirect_uri === 'string' ? config.redirect_uri : undefined,
    issuer: typeof config.issuer === 'string' ? config.issuer : undefined,
    metadata_url: typeof config.metadata_url === 'string' ? config.metadata_url : undefined,
  };
}

export function SSOIntegrationManager() {
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<SSOProvider | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    integration_type: 'saml' as 'saml' | 'oauth' | 'oidc',
    endpoint_url: '',
    is_active: true,
    configuration: {
      client_id: '',
      client_secret: '',
      redirect_uri: '',
      issuer: '',
      metadata_url: '',
    }
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const { data, error } = await supabase
        .from('api_integrations')
        .select('*')
        .in('integration_type', ['saml', 'oauth', 'oidc'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform database response to match SSOProvider interface
      const transformedProviders: SSOProvider[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        integration_type: item.integration_type as 'saml' | 'oauth' | 'oidc',
        endpoint_url: item.endpoint_url,
        is_active: item.is_active,
        configuration: transformSSOConfiguration(item.configuration),
        created_at: item.created_at,
      }));

      setProviders(transformedProviders);
    } catch (error) {
      console.error('Error fetching SSO providers:', error);
      toast.error('Failed to load SSO providers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        integration_type: formData.integration_type,
        endpoint_url: formData.endpoint_url,
        is_active: formData.is_active,
        configuration: formData.configuration
      };

      if (editingProvider) {
        const { error } = await supabase
          .from('api_integrations')
          .update(payload)
          .eq('id', editingProvider.id);

        if (error) throw error;
        toast.success('SSO provider updated successfully');
      } else {
        const { error } = await supabase
          .from('api_integrations')
          .insert([payload]);

        if (error) throw error;
        toast.success('SSO provider created successfully');
      }

      setShowForm(false);
      setEditingProvider(null);
      resetForm();
      fetchProviders();
    } catch (error) {
      console.error('Error saving SSO provider:', error);
      toast.error('Failed to save SSO provider');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (provider: SSOProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      integration_type: provider.integration_type,
      endpoint_url: provider.endpoint_url,
      is_active: provider.is_active,
      configuration: provider.configuration
    });
    setShowForm(true);
  };

  const handleDelete = async (providerId: string) => {
    if (!confirm('Are you sure you want to delete this SSO provider?')) return;

    try {
      const { error } = await supabase
        .from('api_integrations')
        .delete()
        .eq('id', providerId);

      if (error) throw error;
      toast.success('SSO provider deleted successfully');
      fetchProviders();
    } catch (error) {
      console.error('Error deleting SSO provider:', error);
      toast.error('Failed to delete SSO provider');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      integration_type: 'saml',
      endpoint_url: '',
      is_active: true,
      configuration: {
        client_id: '',
        client_secret: '',
        redirect_uri: '',
        issuer: '',
        metadata_url: '',
      }
    });
  };

  const handleToggleActive = async (provider: SSOProvider) => {
    try {
      const { error } = await supabase
        .from('api_integrations')
        .update({ is_active: !provider.is_active })
        .eq('id', provider.id);

      if (error) throw error;
      toast.success(`SSO provider ${!provider.is_active ? 'activated' : 'deactivated'}`);
      fetchProviders();
    } catch (error) {
      console.error('Error toggling SSO provider:', error);
      toast.error('Failed to update SSO provider');
    }
  };

  if (loading && providers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            SSO Integration Management
          </h2>
          <p className="text-muted-foreground">
            Configure SAML, OAuth, and OpenID Connect providers for enterprise authentication
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={showForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add SSO Provider
        </Button>
      </div>

      {/* Provider Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProvider ? 'Edit SSO Provider' : 'Add New SSO Provider'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Provider Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="integration_type">Integration Type</Label>
                  <Select 
                    value={formData.integration_type} 
                    onValueChange={(value: 'saml' | 'oauth' | 'oidc') => 
                      setFormData({...formData, integration_type: value})
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
                <Label htmlFor="endpoint_url">Endpoint URL</Label>
                <Input
                  id="endpoint_url"
                  type="url"
                  value={formData.endpoint_url}
                  onChange={(e) => setFormData({...formData, endpoint_url: e.target.value})}
                  required
                />
              </div>

              {/* Configuration Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_id">Client ID</Label>
                    <Input
                      id="client_id"
                      value={formData.configuration.client_id}
                      onChange={(e) => setFormData({
                        ...formData, 
                        configuration: {...formData.configuration, client_id: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_secret">Client Secret</Label>
                    <Input
                      id="client_secret"
                      type="password"
                      value={formData.configuration.client_secret}
                      onChange={(e) => setFormData({
                        ...formData, 
                        configuration: {...formData.configuration, client_secret: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="redirect_uri">Redirect URI</Label>
                    <Input
                      id="redirect_uri"
                      value={formData.configuration.redirect_uri}
                      onChange={(e) => setFormData({
                        ...formData, 
                        configuration: {...formData.configuration, redirect_uri: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="issuer">Issuer</Label>
                    <Input
                      id="issuer"
                      value={formData.configuration.issuer}
                      onChange={(e) => setFormData({
                        ...formData, 
                        configuration: {...formData.configuration, issuer: e.target.value}
                      })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="metadata_url">Metadata URL</Label>
                    <Input
                      id="metadata_url"
                      type="url"
                      value={formData.configuration.metadata_url}
                      onChange={(e) => setFormData({
                        ...formData, 
                        configuration: {...formData.configuration, metadata_url: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {editingProvider ? 'Update Provider' : 'Create Provider'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingProvider(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Providers List */}
      <div className="grid gap-4">
        {providers.map((provider) => (
          <Card key={provider.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-medium">{provider.name}</h3>
                    <p className="text-sm text-muted-foreground">{provider.endpoint_url}</p>
                  </div>
                  <Badge variant={provider.integration_type === 'saml' ? 'default' : 'secondary'}>
                    {provider.integration_type.toUpperCase()}
                  </Badge>
                  <Badge variant={provider.is_active ? 'default' : 'secondary'}>
                    {provider.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(provider)}
                  >
                    {provider.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(provider)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {providers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No SSO Providers</h3>
            <p className="text-muted-foreground">Get started by adding your first SSO provider.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
