
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, TestTube, Webhook, Key, Globe, Activity } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiIntegrationService } from '@/services/integration/apiIntegrationService';
import { ApiIntegration, WebhookEvent } from '@/types/analytics';
import { toast } from 'sonner';

export const ApiIntegrationManager: React.FC = () => {
  const [selectedIntegration, setSelectedIntegration] = useState<ApiIntegration | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
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

  const createIntegration = useMutation({
    mutationFn: (integration: Partial<ApiIntegration>) => 
      ApiIntegrationService.createIntegration(integration),
    onSuccess: () => {
      toast.success('Integration created successfully');
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
      setShowCreateDialog(false);
    }
  });

  const updateIntegration = useMutation({
    mutationFn: ({ id, ...updates }: Partial<ApiIntegration> & { id: string }) =>
      ApiIntegrationService.updateIntegration(id, updates),
    onSuccess: () => {
      toast.success('Integration updated successfully');
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
      setSelectedIntegration(null);
    }
  });

  const deleteIntegration = useMutation({
    mutationFn: (id: string) => ApiIntegrationService.deleteIntegration(id),
    onSuccess: () => {
      toast.success('Integration deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
    }
  });

  const testIntegration = useMutation({
    mutationFn: (id: string) => ApiIntegrationService.testIntegration(id),
    onSuccess: (success) => {
      if (success) {
        toast.success('Integration test successful');
      } else {
        toast.error('Integration test failed');
      }
      queryClient.invalidateQueries({ queryKey: ['webhook-events'] });
    }
  });

  const retryWebhookEvent = useMutation({
    mutationFn: (eventId: string) => ApiIntegrationService.retryWebhookEvent(eventId),
    onSuccess: () => {
      toast.success('Webhook event queued for retry');
      queryClient.invalidateQueries({ queryKey: ['webhook-events'] });
    }
  });

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'webhook': return <Webhook className="h-5 w-5" />;
      case 'api_key': return <Key className="h-5 w-5" />;
      case 'oauth': return <Globe className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'retrying': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Integrations</h1>
          <p className="text-muted-foreground">
            Manage external API connections and webhooks
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
            <IntegrationForm
              onSubmit={(data) => createIntegration.mutate(data)}
              isLoading={createIntegration.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Events</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{integrations?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {integrations?.filter(i => i.is_active).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Webhooks Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {webhookStats?.sent || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {webhookStats?.failed || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Integrations List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {integrations?.map((integration) => (
              <Card key={integration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getIntegrationIcon(integration.integration_type)}
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                        {integration.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {integration.integration_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Endpoint</Label>
                      <p className="text-sm text-muted-foreground truncate">
                        {integration.endpoint_url}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Rate Limit</Label>
                      <p className="text-sm text-muted-foreground">
                        {integration.rate_limit} requests/hour
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testIntegration.mutate(integration.id)}
                        disabled={testIntegration.isPending}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedIntegration(integration)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteIntegration.mutate(integration.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Webhook Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhookEvents?.slice(0, 20).map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{event.event_type}</span>
                        <Badge variant={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(event.created_at).toLocaleString()}
                      </div>
                      {event.sent_at && (
                        <div className="text-sm text-muted-foreground">
                          Sent: {new Date(event.sent_at).toLocaleString()}
                        </div>
                      )}
                      {event.response_status && (
                        <div className="text-sm text-muted-foreground">
                          Response: {event.response_status}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Retries: {event.retry_count}
                      </span>
                      {event.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryWebhookEvent.mutate(event.id)}
                        >
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
            </CardHeader>
            <CardContent className="prose max-w-none">
              <h3>Webhook Events</h3>
              <p>The following webhook events are available:</p>
              
              <h4>Certificate Events</h4>
              <ul>
                <li><code>certificate.created</code> - Triggered when a new certificate is issued</li>
                <li><code>certificate.updated</code> - Triggered when certificate details are modified</li>
                <li><code>certificate.expired</code> - Triggered when a certificate expires</li>
                <li><code>certificate.revoked</code> - Triggered when a certificate is revoked</li>
              </ul>

              <h4>User Events</h4>
              <ul>
                <li><code>user.created</code> - Triggered when a new user is created</li>
                <li><code>user.updated</code> - Triggered when user details are modified</li>
                <li><code>user.role_changed</code> - Triggered when user role is updated</li>
              </ul>

              <h4>Course Events</h4>
              <ul>
                <li><code>course.enrolled</code> - Triggered when a user enrolls in a course</li>
                <li><code>course.completed</code> - Triggered when a user completes a course</li>
              </ul>

              <h3>Webhook Payload Format</h3>
              <pre className="bg-gray-100 p-4 rounded">
{`{
  "event_type": "certificate.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "certificate_id": "uuid",
    "recipient_name": "John Doe",
    "course_name": "First Aid",
    "issue_date": "2024-01-15",
    "expiry_date": "2026-01-15"
  }
}`}
              </pre>

              <h3>Authentication</h3>
              <p>All webhook requests include the following headers:</p>
              <ul>
                <li><code>X-Webhook-Signature</code> - HMAC signature for verification</li>
                <li><code>X-Event-Type</code> - The type of event being sent</li>
                <li><code>User-Agent</code> - Training Management System Webhook</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Integration Dialog */}
      {selectedIntegration && (
        <Dialog open={true} onOpenChange={() => setSelectedIntegration(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Integration</DialogTitle>
            </DialogHeader>
            <IntegrationForm
              integration={selectedIntegration}
              onSubmit={(data) => updateIntegration.mutate({ id: selectedIntegration.id, ...data })}
              isLoading={updateIntegration.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface IntegrationFormProps {
  integration?: ApiIntegration;
  onSubmit: (data: Partial<ApiIntegration>) => void;
  isLoading: boolean;
}

const IntegrationForm: React.FC<IntegrationFormProps> = ({
  integration,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: integration?.name || '',
    integration_type: integration?.integration_type || 'webhook',
    endpoint_url: integration?.endpoint_url || '',
    configuration: JSON.stringify(integration?.configuration || {}, null, 2),
    authentication_config: JSON.stringify(integration?.authentication_config || {}, null, 2),
    is_active: integration?.is_active ?? true,
    rate_limit: integration?.rate_limit || 100
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        configuration: JSON.parse(formData.configuration),
        authentication_config: JSON.parse(formData.authentication_config)
      };
      onSubmit(data);
    } catch (error) {
      toast.error('Invalid JSON in configuration');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Integration Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="integration_type">Type</Label>
        <Select value={formData.integration_type} onValueChange={(value) => setFormData({ ...formData, integration_type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="api_key">API Key</SelectItem>
            <SelectItem value="oauth">OAuth</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="endpoint_url">Endpoint URL</Label>
        <Input
          id="endpoint_url"
          type="url"
          value={formData.endpoint_url}
          onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="rate_limit">Rate Limit (requests/hour)</Label>
        <Input
          id="rate_limit"
          type="number"
          value={formData.rate_limit}
          onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) })}
          min="1"
          max="10000"
        />
      </div>

      <div>
        <Label htmlFor="configuration">Configuration (JSON)</Label>
        <Textarea
          id="configuration"
          value={formData.configuration}
          onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
          className="font-mono text-sm"
          rows={4}
          placeholder='{"events": ["certificate.*", "user.*"]}'
        />
      </div>

      <div>
        <Label htmlFor="authentication_config">Authentication Config (JSON)</Label>
        <Textarea
          id="authentication_config"
          value={formData.authentication_config}
          onChange={(e) => setFormData({ ...formData, authentication_config: e.target.value })}
          className="font-mono text-sm"
          rows={3}
          placeholder='{"type": "bearer", "token": "your-token"}'
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

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : integration ? 'Update Integration' : 'Create Integration'}
        </Button>
      </div>
    </form>
  );
};
