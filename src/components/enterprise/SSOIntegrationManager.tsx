import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Plus, 
  Settings, 
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface SSOProvider {
  id: string;
  name: string;
  provider_type: 'saml' | 'oauth' | 'oidc';
  is_active: boolean;
  metadata_url?: string;
  client_id?: string;
  created_at: string;
}

interface SSOSession {
  id: string;
  provider_id: string;
  user_id: string;
  session_data: any;
  created_at: string;
  expires_at: string;
}

export function SSOIntegrationManager() {
  const [newProviderName, setNewProviderName] = useState('');
  const [newProviderType, setNewProviderType] = useState<'saml' | 'oauth' | 'oidc'>('saml');

  // Mock data for now - will be replaced when proper tables are available
  const mockProviders: SSOProvider[] = [
    {
      id: '1',
      name: 'Corporate SAML',
      provider_type: 'saml',
      is_active: true,
      metadata_url: 'https://example.com/saml/metadata',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Google OAuth',
      provider_type: 'oauth',
      is_active: false,
      client_id: 'google-client-123',
      created_at: new Date().toISOString()
    }
  ];

  const mockSessions: SSOSession[] = [
    {
      id: '1',
      provider_id: '1',
      user_id: 'user-123',
      session_data: { email: 'user@example.com' },
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const handleCreateProvider = () => {
    // Mock implementation - will be replaced with actual provider creation
    console.log('Creating SSO provider:', { newProviderName, newProviderType });
    setNewProviderName('');
    setNewProviderType('saml');
  };

  const handleToggleProvider = (providerId: string, isActive: boolean) => {
    // Mock implementation - will be replaced with actual provider toggle
    console.log('Toggling provider:', providerId, isActive);
  };

  const handleDeleteProvider = (providerId: string) => {
    // Mock implementation - will be replaced with actual provider deletion
    console.log('Deleting provider:', providerId);
  };

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'saml': return <Shield className="h-4 w-4" />;
      case 'oauth': return <Settings className="h-4 w-4" />;
      case 'oidc': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getProviderBadgeColor = (type: string) => {
    switch (type) {
      case 'saml': return 'bg-blue-100 text-blue-800';
      case 'oauth': return 'bg-green-100 text-green-800';
      case 'oidc': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SSO Integration Manager</h2>
          <p className="text-muted-foreground">
            Manage Single Sign-On providers and authentication methods
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Add New Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add SSO Provider
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider Name</label>
              <Input
                placeholder="Enter provider name"
                value={newProviderName}
                onChange={(e) => setNewProviderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider Type</label>
              <Select value={newProviderType} onValueChange={(value: 'saml' | 'oauth' | 'oidc') => setNewProviderType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saml">SAML 2.0</SelectItem>
                  <SelectItem value="oauth">OAuth 2.0</SelectItem>
                  <SelectItem value="oidc">OpenID Connect</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleCreateProvider} disabled={!newProviderName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Provider
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockProviders.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getProviderIcon(provider.provider_type)}
                  <div>
                    <h3 className="font-medium">{provider.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getProviderBadgeColor(provider.provider_type)}>
                        {provider.provider_type.toUpperCase()}
                      </Badge>
                      <Badge variant={provider.is_active ? "default" : "secondary"}>
                        {provider.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Active</span>
                    <Switch
                      checked={provider.is_active}
                      onCheckedChange={(checked) => handleToggleProvider(provider.id, checked)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteProvider(provider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Active SSO Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockSessions.map((session) => {
              const provider = mockProviders.find(p => p.id === session.provider_id);
              return (
                <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">User ID: {session.user_id}</span>
                      <Badge variant="outline">{provider?.name || 'Unknown Provider'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Expires: {new Date(session.expires_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
