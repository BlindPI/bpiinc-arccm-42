
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiIntegrationService } from '@/services/integration/apiIntegrationService';
import { ApiIntegration, WebhookEvent } from '@/types/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Globe, 
  Plus, 
  TestTube, 
  Trash2, 
  Edit, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

type IntegrationType = 'webhook' | 'oauth' | 'api_key' | 'custom';

interface IntegrationFormData {
  name: string;
  integration_type: IntegrationType;
  endpoint_url: string;
  configuration: Record<string, any>;
  authentication_config?: Record<string, any>;
  is_active: boolean;
  rate_limit: number;
}

export const ApiIntegrationManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<ApiIntegration | null>(null);
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

  const { data: webhookStats } = useQuery({
    queryKey: ['webhook-stats'],
    queryFn: () => ApiIntegrationService.getWebhookStats()
  });

  const createIntegrationMutation = useMutation({
    mutationFn: (integrationData: Omit<ApiIntegration, 'id' | 'created_at' | 'updated_at'>) =>
      ApiIntegrationService.createIntegration(integrationData),
    onSuccess: () => {
      toast.success('Integration created successfully');
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create integration: ' + error.message);
    }
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ApiIntegration> }) =>
      ApiIntegrationService.updateIntegration(id, updates),
    onSuccess: () => {
      toast.success('Integration updated successfully');
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
    },
    onError: (error) => {
      toast.error('Failed to update integration: ' + error.message);
    }
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: (id: string) => ApiIntegrationService.deleteIntegration(id),
    onSuccess: () => {
      toast.success('Integration deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
    },
    onError: (error) => {
      toast.error('Failed to delete integration: ' + error.message);
    }
  });

  const testIntegrationMutation = useMutation({
    mutationFn: (id: string) => ApiIntegrationService.testIntegration(id),
    onSuccess: (success) => {
      if (success) {
        toast.success('Integration test successful');
      } else {
        toast.error('Integration test failed');
      }
      queryClient.invalidateQueries({ queryKey: ['webhook-events'] });
    },
    onError: (error) => {
      toast.error('Test failed: ' + error.message);
    }
  });

  const retryWebhookMutation = useMutation({
    mutationFn: (eventId: string) => ApiIntegrationService.retryWebhookEvent(eventId),
    onSuccess: () => {
      toast.success('Webhook retry initiated');
      queryClient.invalidateQueries({ queryKey: ['webhook-events'] });
    },
    onError: (error) => {
      toast.error('Retry failed: ' + error.message);
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

  const handleCreateIntegration = () => {
    if (!formData.name || !formData.endpoint_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    createIntegrationMutation.mutate(formData);
  };

  const toggleIntegrationStatus = (integration: ApiIntegration) => {
    updateIntegrationMutation.mutate({
      id: integration.id,
      updates: { is_active: !integration.is_active }
    });
  };

  const handleTestIntegration = (integrationId: string) => {
    testIntegrationMutation.mutate(integrationId);
  };

  const handleDeleteIntegration = (integrationId: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      deleteIntegrationMutation.mutate(integrationId);
    }
  };

  const handleRetryWebhook = (eventId: string) => {
    retryWebhookMutation.mutate(eventId);
  };

  const getIntegrationTypeColor = (type: string) => {
    switch (type) {
      case 'webhook':
        return 'bg-blue-100 text-blue-800';
      case 'oauth':
        return 'bg-green-100 text-green-800';
      case 'api_key':
        return 'bg-yellow-100 text-yellow-800';
      case 'custom':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'retrying':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Globe className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              New Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create API Integration</DialogTitle>
              <DialogDescription>
                Set up a new external API integration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Integration Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter integration name"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Integration Type *</Label>
                  <Select 
                    value={formData.integration_type} 
                    onValueChange={(value: IntegrationType) => setFormData({ ...formData, integration_type: value })}
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
              </div>
              <div>
                <Label htmlFor="endpoint">Endpoint URL *</Label>
                <Input
                  id="endpoint"
                  value={formData.endpoint_url}
                  onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                  placeholder="https://api.example.com/webhook"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rate_limit">Rate Limit (per minute)</Label>
                  <Input
                    id="rate_limit"
                    type="number"
                    value={formData.rate_limit}
                    onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) || 100 })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateIntegration} disabled={createIntegrationMutation.isPending}>
                {createIntegrationMutation.isPending ? 'Creating...' : 'Create Integration'}
              </Button>
            </DialogFooter>
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
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations?.filter(i => i.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhook Events</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhookEvents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {webhookStats?.sent && webhookStats?.failed 
                ? Math.round((webhookStats.sent / (webhookStats.sent + webhookStats.failed)) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="integrations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Events</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>API Integrations</CardTitle>
              <CardDescription>
                Manage your external API connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rate Limit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrations?.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <div className="font-medium">{integration.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getIntegrationTypeColor(integration.integration_type)}>
                          {integration.integration_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={integration.endpoint_url}>
                          {integration.endpoint_url}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={integration.is_active ? "default" : "secondary"}>
                          {integration.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{integration.rate_limit}/min</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestIntegration(integration.id)}
                            disabled={testIntegrationMutation.isPending}
                          >
                            <TestTube className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleIntegrationStatus(integration)}
                            disabled={updateIntegrationMutation.isPending}
                          >
                            {integration.is_active ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteIntegration(integration.id)}
                            disabled={deleteIntegrationMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Events</CardTitle>
              <CardDescription>
                Recent webhook event history and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Integration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Retry Count</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhookEvents?.slice(0, 20).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>{event.event_type}</TableCell>
                      <TableCell>
                        {integrations?.find(i => i.id === event.integration_id)?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(event.status)}
                          <span className="capitalize">{event.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{event.retry_count}</TableCell>
                      <TableCell>
                        {new Date(event.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {event.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetryWebhook(event.id)}
                            disabled={retryWebhookMutation.isPending}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Detailed integration activity and performance logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Activity logs will be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
