
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Globe, 
  TestTube, 
  Trash2, 
  Edit, 
  Plus,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Settings
} from 'lucide-react';
import { ApiIntegrationService } from '@/services/integration/apiIntegrationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const integrationFormSchema = z.object({
  name: z.string().min(1, 'Integration name is required'),
  integration_type: z.enum(['webhook', 'oauth', 'api_key', 'custom']),
  endpoint_url: z.string().url('Must be a valid URL'),
  configuration: z.record(z.any()).default({}),
  authentication_config: z.record(z.any()).optional(),
  is_active: z.boolean().default(true),
  rate_limit: z.number().min(1).default(100),
});

type IntegrationFormData = z.infer<typeof integrationFormSchema>;

export const ApiIntegrationManager: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('integrations');
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null);

  const form = useForm<IntegrationFormData>({
    resolver: zodResolver(integrationFormSchema),
    defaultValues: {
      name: '',
      integration_type: 'webhook',
      endpoint_url: '',
      configuration: {},
      authentication_config: {},
      is_active: true,
      rate_limit: 100,
    },
  });

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['api-integrations'],
    queryFn: () => ApiIntegrationService.getIntegrations()
  });

  const { data: webhookEvents = [] } = useQuery({
    queryKey: ['webhook-events'],
    queryFn: () => ApiIntegrationService.getWebhookEvents()
  });

  const { data: webhookStats } = useQuery({
    queryKey: ['webhook-stats'],
    queryFn: () => ApiIntegrationService.getWebhookStats()
  });

  const createIntegration = useMutation({
    mutationFn: (data: IntegrationFormData) => ApiIntegrationService.createIntegration({
      ...data,
      created_by: user?.id || '',
    }),
    onSuccess: () => {
      toast.success('Integration created successfully');
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create integration: ${error.message}`);
    }
  });

  const updateIntegration = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<IntegrationFormData> }) => 
      ApiIntegrationService.updateIntegration(id, data),
    onSuccess: () => {
      toast.success('Integration updated successfully');
      queryClient.invalidateQueries({ queryKey: ['api-integrations'] });
      setEditingIntegration(null);
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

  const retryWebhook = useMutation({
    mutationFn: (eventId: string) => ApiIntegrationService.retryWebhookEvent(eventId),
    onSuccess: () => {
      toast.success('Webhook event queued for retry');
      queryClient.invalidateQueries({ queryKey: ['webhook-events'] });
    }
  });

  const onSubmit = (data: IntegrationFormData) => {
    if (editingIntegration) {
      updateIntegration.mutate({ id: editingIntegration, data });
    } else {
      createIntegration.mutate(data);
    }
  };

  const getIntegrationTypeColor = (type: string) => {
    switch (type) {
      case 'webhook': return 'bg-blue-100 text-blue-800';
      case 'oauth': return 'bg-green-100 text-green-800';
      case 'api_key': return 'bg-yellow-100 text-yellow-800';
      case 'custom': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Globe className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Integrations</h1>
          <p className="text-muted-foreground">Manage external system integrations and webhooks</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              {integrations.length === 0 ? (
                <Alert>
                  <Globe className="h-4 w-4" />
                  <AlertDescription>
                    No integrations configured yet. Start by creating your first integration.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{integration.name}</h3>
                          <Badge className={getIntegrationTypeColor(integration.integration_type)}>
                            {integration.integration_type}
                          </Badge>
                          {integration.is_active && (
                            <Badge variant="outline" className="text-green-600">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => testIntegration.mutate(integration.id)}
                            disabled={testIntegration.isPending}
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingIntegration(integration.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteIntegration.mutate(integration.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>Endpoint: {integration.endpoint_url}</p>
                        <p>Rate Limit: {integration.rate_limit} req/min</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Integration Name</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="Enter integration name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="integration_type">Integration Type</Label>
                    <Select
                      value={form.watch('integration_type')}
                      onValueChange={(value) => form.setValue('integration_type', value as any)}
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

                <div className="space-y-2">
                  <Label htmlFor="endpoint_url">Endpoint URL</Label>
                  <Input
                    id="endpoint_url"
                    {...form.register('endpoint_url')}
                    placeholder="https://api.example.com/webhook"
                  />
                  {form.formState.errors.endpoint_url && (
                    <p className="text-sm text-red-600">{form.formState.errors.endpoint_url.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rate_limit">Rate Limit (requests per minute)</Label>
                  <Input
                    id="rate_limit"
                    type="number"
                    {...form.register('rate_limit', { valueAsNumber: true })}
                    placeholder="100"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={form.watch('is_active')}
                    onCheckedChange={(checked) => form.setValue('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Clear
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createIntegration.isPending || updateIntegration.isPending}
                  >
                    {editingIntegration ? 'Update Integration' : 'Create Integration'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Webhook Events</CardTitle>
            </CardHeader>
            <CardContent>
              {webhookEvents.length === 0 ? (
                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    No webhook events yet. Events will appear here once integrations start receiving data.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {webhookEvents.slice(0, 10).map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{event.event_type}</div>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status}
                          </Badge>
                        </div>
                        {event.status === 'failed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryWebhook.mutate(event.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(event.created_at).toLocaleString()}
                        {event.sent_at && (
                          <span> | Sent: {new Date(event.sent_at).toLocaleString()}</span>
                        )}
                        <span> | Retries: {event.retry_count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {integrations.filter(i => i.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Integrations</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {webhookStats?.delivered || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful Webhooks</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {webhookStats?.failed || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed Webhooks</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApiIntegrationManager;
