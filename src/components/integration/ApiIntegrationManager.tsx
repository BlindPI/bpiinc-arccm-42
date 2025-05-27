
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiIntegrationService } from '@/services/integration/apiIntegrationService';
import { ApiIntegration } from '@/types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, TestTube, Trash2, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationFormData {
  name: string;
  integration_type: 'webhook' | 'oauth' | 'api_key' | 'custom';
  endpoint_url: string;
  configuration: Record<string, any>;
  authentication_config: Record<string, any>;
  is_active: boolean;
  rate_limit: number;
}

export const ApiIntegrationManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<IntegrationFormData>({
    name: '',
    integration_type: 'webhook',
    endpoint_url: '',
    configuration: {},
    authentication_config: {},
    is_active: true,
    rate_limit: 100
  });

  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['api-integrations'],
    queryFn: () => ApiIntegrationService.getIntegrations()
  });

  const { data: webhookEvents } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: () => ApiIntegrationService.getWebhookEvents()
  });

  const { data: stats } = useQuery({
    queryKey: ['webhook-stats'],
    queryFn: () => ApiIntegrationService.getWebhookStats()
  });

  const createIntegrationMutation = useMutation({
    mutationFn: (integrationData: IntegrationFormData) => ApiIntegrationService.createIntegration({
      ...integrationData,
      created_by: 'current-user-id' // This should come from auth context
    }),
    onSuccess: () => {
      toast.success('Integration created successfully');
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to create integration: ' + error.message);
    }
  });

  const testIntegrationMutation = useMutation({
    mutationFn: (id: string) => ApiIntegrationService.testIntegration(id),
    onSuccess: (success) => {
      toast.success(success ? 'Integration test successful' : 'Integration test failed');
    }
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: (id: string) => ApiIntegrationService.deleteIntegration(id),
    onSuccess: () => {
      toast.success('Integration deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      integration_type: 'webhook',
      endpoint_url: '',
      configuration: {},
      authentication_config: {},
      is_active: true,
      rate_limit: 100
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.endpoint_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    createIntegrationMutation.mutate(formData);
  };

  const handleTestIntegration = (id: string) => {
    testIntegrationMutation.mutate(id);
  };

  const handleDeleteIntegration = (id: string) => {
    if (window.confirm('Are you sure you want to delete this integration?')) {
      deleteIntegrationMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Integrations</h1>
          <p className="text-muted-foreground">
            Manage external API connections and webhooks
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create API Integration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Integration Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter integration name"
                />
              </div>
              
              <div>
                <Label htmlFor="integration_type">Type</Label>
                <Select
                  value={formData.integration_type}
                  onValueChange={(value: any) => setFormData({ ...formData, integration_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="oauth">OAuth</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="endpoint_url">Endpoint URL</Label>
                <Input
                  id="endpoint_url"
                  value={formData.endpoint_url}
                  onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                  placeholder="https://api.example.com/webhook"
                />
              </div>
              
              <div>
                <Label htmlFor="rate_limit">Rate Limit (per minute)</Label>
                <Input
                  id="rate_limit"
                  type="number"
                  value={formData.rate_limit}
                  onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) || 100 })}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={createIntegrationMutation.isPending}>
                  {createIntegrationMutation.isPending ? 'Creating...' : 'Create Integration'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations?.filter(integration => integration.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhook Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhookEvents?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.delivered ? Math.round((stats.delivered / (stats.delivered + (stats.failed || 0))) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations List */}
      <Card>
        <CardHeader>
          <CardTitle>API Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations?.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{integration.name}</h3>
                    <Badge variant={integration.is_active ? "default" : "secondary"}>
                      {integration.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{integration.integration_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {integration.endpoint_url}
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Rate limit: {integration.rate_limit}/min
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestIntegration(integration.id)}
                    disabled={!integration.is_active}
                  >
                    <TestTube className="h-4 w-4" />
                    Test
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteIntegration(integration.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {(!integrations || integrations.length === 0) && (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No integrations</h3>
                <p className="text-muted-foreground">
                  Create your first API integration to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
