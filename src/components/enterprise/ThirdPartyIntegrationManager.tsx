
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Zap, 
  Settings, 
  Globe, 
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Key
} from 'lucide-react';

export function ThirdPartyIntegrationManager() {
  const [activeTab, setActiveTab] = useState('active');

  // Mock integration data
  const activeIntegrations = [
    {
      id: '1',
      name: 'Slack',
      type: 'communication',
      status: 'connected',
      lastSync: '2 minutes ago',
      dataSync: true,
      notifications: true,
      description: 'Team communication and notifications'
    },
    {
      id: '2',
      name: 'Microsoft Teams',
      type: 'communication',
      status: 'connected',
      lastSync: '5 minutes ago',
      dataSync: false,
      notifications: true,
      description: 'Video conferencing and collaboration'
    },
    {
      id: '3',
      name: 'Google Workspace',
      type: 'productivity',
      status: 'connected',
      lastSync: '1 hour ago',
      dataSync: true,
      notifications: false,
      description: 'Document collaboration and storage'
    },
    {
      id: '4',
      name: 'Salesforce',
      type: 'crm',
      status: 'error',
      lastSync: '3 hours ago',
      dataSync: false,
      notifications: false,
      description: 'Customer relationship management'
    }
  ];

  const availableIntegrations = [
    {
      name: 'Zoom',
      type: 'communication',
      description: 'Video conferencing and webinars',
      popular: true
    },
    {
      name: 'Jira',
      type: 'project_management',
      description: 'Project tracking and issue management',
      popular: false
    },
    {
      name: 'Asana',
      type: 'project_management',
      description: 'Task and project management',
      popular: true
    },
    {
      name: 'Tableau',
      type: 'analytics',
      description: 'Advanced data visualization',
      popular: false
    },
    {
      name: 'DocuSign',
      type: 'documents',
      description: 'Electronic signature management',
      popular: true
    }
  ];

  const integrationMetrics = {
    totalIntegrations: 4,
    activeConnections: 3,
    dataSync: 2,
    apiCalls: 15420,
    uptime: 99.8
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <XCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'communication': return 'bg-blue-100 text-blue-800';
      case 'productivity': return 'bg-green-100 text-green-800';
      case 'crm': return 'bg-purple-100 text-purple-800';
      case 'project_management': return 'bg-amber-100 text-amber-800';
      case 'analytics': return 'bg-pink-100 text-pink-800';
      case 'documents': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            Third-Party Integration Manager
          </h1>
          <p className="text-muted-foreground mt-2">
            Connect and manage external systems and services
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            API Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Integration Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Total Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {integrationMetrics.totalIntegrations}
            </div>
            <p className="text-xs text-gray-500 mt-1">Connected services</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrationMetrics.activeConnections}
            </div>
            <p className="text-xs text-gray-500 mt-1">Currently online</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Data Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {integrationMetrics.dataSync}
            </div>
            <p className="text-xs text-gray-500 mt-1">Auto-sync enabled</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {integrationMetrics.apiCalls.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {integrationMetrics.uptime}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active">Active Integrations</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid gap-4">
            {activeIntegrations.map((integration) => (
              <Card key={integration.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                        <Globe className="h-6 w-6 text-primary" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold">{integration.name}</h3>
                          <Badge className={getStatusColor(integration.status)}>
                            {integration.status}
                          </Badge>
                          <Badge className={getTypeColor(integration.type)}>
                            {integration.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {integration.description}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Last sync: {integration.lastSync}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Data Sync</span>
                            <Switch checked={integration.dataSync} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">Notifications</span>
                            <Switch checked={integration.notifications} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusIcon(integration.status)}
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                        {integration.status === 'error' && (
                          <Button size="sm">
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reconnect
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="available" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableIntegrations.map((integration, index) => (
                  <Card key={index} className="border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{integration.name}</h4>
                          {integration.popular && (
                            <Badge variant="secondary" className="text-xs">Popular</Badge>
                          )}
                        </div>
                        <Badge className={getTypeColor(integration.type)}>
                          {integration.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {integration.description}
                      </p>
                      <Button className="w-full" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Webhook Management</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">Team Creation Webhook</div>
                      <div className="text-sm text-muted-foreground">
                        https://api.example.com/webhooks/team-created
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Active</Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Triggers: team.created, team.updated, team.deleted
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">Performance Alert Webhook</div>
                      <div className="text-sm text-muted-foreground">
                        https://api.example.com/webhooks/performance-alert
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Paused</Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Triggers: performance.threshold_exceeded
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Integration Activity Logs</CardTitle>
                <div className="flex items-center gap-2">
                  <Input placeholder="Search logs..." className="w-64" />
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-medium">Slack message sent</div>
                      <div className="text-sm text-muted-foreground">Team notification delivered successfully</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">2 minutes ago</div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">Google Workspace sync</div>
                      <div className="text-sm text-muted-foreground">45 team members synchronized</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">15 minutes ago</div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="font-medium">Salesforce API error</div>
                      <div className="text-sm text-muted-foreground">Rate limit exceeded - retrying in 1 hour</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">1 hour ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
