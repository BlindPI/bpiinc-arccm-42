import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Settings,
  TestTube,
  BarChart3,
  Webhook,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useNotifications } from '@/hooks/integration/useNotifications';
import { formatDistanceToNow } from 'date-fns';

const NOTIFICATION_TYPES = [
  { value: 'availability_change', label: 'Availability Changes', description: 'When your availability is modified' },
  { value: 'calendar_conflict', label: 'Calendar Conflicts', description: 'When conflicts are detected' },
  { value: 'team_update', label: 'Team Updates', description: 'Team availability and scheduling changes' },
  { value: 'booking_reminder', label: 'Booking Reminders', description: 'Upcoming training session reminders' },
  { value: 'system_alert', label: 'System Alerts', description: 'Important system notifications' }
];

const DELIVERY_METHODS = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'push', label: 'Push Notification', icon: Smartphone },
  { value: 'webhook', label: 'Webhook', icon: Webhook }
];

export function NotificationCenter() {
  const {
    preferences,
    deliveryLogs,
    stats,
    webhooks,
    preferencesLoading,
    updatePreference,
    deletePreference,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    sendTestNotification,
    setDefaultPreferences,
    isUpdating,
    isCreatingWebhook,
    isTestingWebhook,
    isSendingTest,
    getPreferenceByType,
    isNotificationEnabled,
    getRecentLogs,
    getFailedNotifications
  } = useNotifications();

  const [newWebhook, setNewWebhook] = useState({
    webhook_name: '',
    webhook_url: '',
    event_types: [] as string[],
    is_active: true
  });

  const [newPreference, setNewPreference] = useState({
    notification_type: '',
    delivery_method: '',
    delivery_address: '',
    enabled: true
  });

  const handleUpdatePreference = async (
    type: string, 
    method: string, 
    updates: { enabled?: boolean; delivery_address?: string; settings?: any }
  ) => {
    const existing = getPreferenceByType(type, method);
    if (existing) {
      await updatePreference({
        id: existing.id,
        ...updates
      });
    } else {
      await updatePreference({
        notification_type: type,
        delivery_method: method,
        enabled: updates.enabled ?? true,
        delivery_address: updates.delivery_address,
        settings: updates.settings ?? {}
      });
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhook.webhook_name || !newWebhook.webhook_url) return;
    
    await createWebhook(newWebhook);
    setNewWebhook({
      webhook_name: '',
      webhook_url: '',
      event_types: [],
      is_active: true
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'failed':
      case 'bounced':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMethodIcon = (method: string) => {
    const methodConfig = DELIVERY_METHODS.find(m => m.value === method);
    if (!methodConfig) return <Bell className="h-4 w-4" />;
    const Icon = methodConfig.icon;
    return <Icon className="h-4 w-4" />;
  };

  if (preferencesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Bell className="h-6 w-6 animate-pulse mr-2" />
          <span>Loading notification settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Center
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications about availability changes and system updates.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {preferences.length === 0 ? (
            <Card>
              <CardContent className="text-center p-8">
                <Bell className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No preferences configured</h3>
                <p className="text-muted-foreground mb-4">
                  Set up your notification preferences to stay informed about important updates.
                </p>
                <Button onClick={() => setDefaultPreferences()}>
                  Set Default Preferences
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {NOTIFICATION_TYPES.map((type) => (
                <Card key={type.value}>
                  <CardHeader>
                    <CardTitle className="text-base">{type.label}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {DELIVERY_METHODS.map((method) => {
                      const preference = getPreferenceByType(type.value, method.value);
                      const isEnabled = isNotificationEnabled(type.value, method.value);
                      const Icon = method.icon;
                      
                      return (
                        <div key={method.value} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4" />
                            <div>
                              <span className="font-medium">{method.label}</span>
                              {preference?.delivery_address && (
                                <p className="text-sm text-muted-foreground">
                                  {preference.delivery_address}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(enabled) => 
                                handleUpdatePreference(type.value, method.value, { enabled })
                              }
                              disabled={isUpdating}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendTestNotification({ deliveryMethod: method.value })}
                              disabled={isSendingTest || !isEnabled}
                            >
                              <TestTube className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          {/* Create New Webhook */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Webhook
              </CardTitle>
              <CardDescription>
                Configure webhooks to receive notifications in external systems.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="webhook-name">Webhook Name</Label>
                  <Input
                    id="webhook-name"
                    value={newWebhook.webhook_name}
                    onChange={(e) => setNewWebhook({ ...newWebhook, webhook_name: e.target.value })}
                    placeholder="e.g., Slack Notifications"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={newWebhook.webhook_url}
                    onChange={(e) => setNewWebhook({ ...newWebhook, webhook_url: e.target.value })}
                    placeholder="https://your-webhook-url.com"
                  />
                </div>
              </div>
              
              <div>
                <Label>Event Types</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {NOTIFICATION_TYPES.map((type) => (
                    <label key={type.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newWebhook.event_types.includes(type.value)}
                        onChange={(e) => {
                          const eventTypes = e.target.checked
                            ? [...newWebhook.event_types, type.value]
                            : newWebhook.event_types.filter(t => t !== type.value);
                          setNewWebhook({ ...newWebhook, event_types: eventTypes });
                        }}
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <Button onClick={handleCreateWebhook} disabled={isCreatingWebhook}>
                <Plus className="h-4 w-4 mr-2" />
                Create Webhook
              </Button>
            </CardContent>
          </Card>

          {/* Existing Webhooks */}
          {webhooks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configured Webhooks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{webhook.webhook_name}</h4>
                        <p className="text-sm text-muted-foreground">{webhook.webhook_url}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={webhook.is_active ? "default" : "secondary"}>
                          {webhook.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={(active) => 
                            updateWebhook({ webhookId: webhook.id, updates: { is_active: active } })
                          }
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {webhook.event_types.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {NOTIFICATION_TYPES.find(t => t.value === type)?.label || type}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testWebhook(webhook.id)}
                        disabled={isTestingWebhook}
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteWebhook(webhook.id)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Delivery Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                Track the delivery status of your notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getRecentLogs(20).length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No notification logs found.
                </div>
              ) : (
                <div className="space-y-3">
                  {getRecentLogs(20).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        {getMethodIcon(log.delivery_method)}
                        <div>
                          <p className="font-medium">{log.notification_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={log.status === 'delivered' ? 'default' : 
                                  log.status === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {log.status}
                        </Badge>
                        {log.delivery_address && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.delivery_address}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats?.total || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Delivered</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats?.delivered || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Failed</span>
                </div>
                <p className="text-2xl font-bold mt-2">{stats?.failed || 0}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Success Rate</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {stats?.total ? Math.round((stats.delivered / stats.total) * 100) : 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {stats?.byMethod && Object.keys(stats.byMethod).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byMethod).map(([method, count]) => (
                    <div key={method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(method)}
                        <span className="capitalize">{method}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
