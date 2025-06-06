import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert as UIAlert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  Filter, 
  Plus, 
  Settings, 
  Shield, 
  TrendingUp,
  User,
  X,
  Eye,
  AlertCircle
} from 'lucide-react';
import { alertManagementService } from '@/services/monitoring';
import type { Alert, AlertRule } from '@/services/monitoring';

interface AlertCardProps {
  alert: Alert;
  onAcknowledge: (alertId: string) => void;
  onResolve: (alertId: string) => void;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onAcknowledge, onResolve }) => {
  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status: Alert['status']) => {
    switch (status) {
      case 'active': return 'destructive';
      case 'acknowledged': return 'secondary';
      case 'resolved': return 'default';
      case 'suppressed': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: Alert['category']) => {
    switch (category) {
      case 'system': return <Settings className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'business': return <AlertCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`${getSeverityColor(alert.severity)} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getCategoryIcon(alert.category)}
            <CardTitle className="text-lg">{alert.title}</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusColor(alert.status)}>
              {alert.status}
            </Badge>
            <Badge variant="outline">
              {alert.severity}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 mb-4">{alert.message}</p>
        
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-4">
          <div>
            <strong>Source:</strong> {alert.source}
          </div>
          <div>
            <strong>Category:</strong> {alert.category}
          </div>
          <div>
            <strong>Created:</strong> {new Date(alert.created_at).toLocaleString()}
          </div>
          <div>
            <strong>Updated:</strong> {new Date(alert.updated_at).toLocaleString()}
          </div>
        </div>

        {alert.acknowledged_by && (
          <div className="text-xs text-gray-500 mb-2">
            <strong>Acknowledged by:</strong> {alert.acknowledged_by} at {new Date(alert.acknowledged_at!).toLocaleString()}
          </div>
        )}

        {alert.resolved_by && (
          <div className="text-xs text-gray-500 mb-2">
            <strong>Resolved by:</strong> {alert.resolved_by} at {new Date(alert.resolved_at!).toLocaleString()}
          </div>
        )}

        {alert.status === 'active' && (
          <div className="flex space-x-2 mt-4">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onAcknowledge(alert.id)}
            >
              <Eye className="h-4 w-4 mr-1" />
              Acknowledge
            </Button>
            <Button 
              size="sm" 
              variant="default"
              onClick={() => onResolve(alert.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Resolve
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AlertManagementDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    category: '',
    source: ''
  });
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    metric: '',
    operator: 'gt' as const,
    threshold: 0,
    severity: 'medium' as const,
    category: 'system' as const
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alertsData, rulesData, statsData] = await Promise.all([
        alertManagementService.getAlerts(
          Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== '')) as any,
          50
        ),
        alertManagementService.getAlertRules(),
        alertManagementService.getAlertStatistics({
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        })
      ]);

      setAlerts(alertsData);
      setAlertRules(rulesData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Error fetching alert data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await alertManagementService.acknowledgeAlert(alertId, 'current-user-id');
      fetchData();
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await alertManagementService.resolveAlert(alertId, 'current-user-id', 'Resolved from dashboard');
      fetchData();
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const handleCreateRule = async () => {
    try {
      await alertManagementService.createAlertRule({
        ...newRule,
        condition: {
          metric: newRule.metric,
          operator: newRule.operator,
          threshold: newRule.threshold
        },
        enabled: true,
        notification_channels: [],
        created_by: 'current-user-id'
      });
      
      setShowCreateRule(false);
      setNewRule({
        name: '',
        description: '',
        metric: '',
        operator: 'gt',
        threshold: 0,
        severity: 'medium',
        category: 'system'
      });
      fetchData();
    } catch (error) {
      console.error('Error creating alert rule:', error);
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      return alert[key as keyof Alert] === value;
    });
  });

  if (loading) {
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
          <h2 className="text-3xl font-bold tracking-tight">Alert Management</h2>
          <p className="text-muted-foreground">
            Monitor, acknowledge, and resolve system alerts
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={showCreateRule} onOpenChange={setShowCreateRule}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Alert Rule</DialogTitle>
                <DialogDescription>
                  Define conditions that will trigger new alerts
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <Label htmlFor="rule-description">Description</Label>
                  <Input
                    id="rule-description"
                    value={newRule.description}
                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    placeholder="Enter rule description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-metric">Metric</Label>
                    <Input
                      id="rule-metric"
                      value={newRule.metric}
                      onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                      placeholder="e.g., response_time"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rule-operator">Operator</Label>
                    <Select value={newRule.operator} onValueChange={(value: any) => setNewRule({ ...newRule, operator: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gt">Greater than</SelectItem>
                        <SelectItem value="lt">Less than</SelectItem>
                        <SelectItem value="eq">Equal to</SelectItem>
                        <SelectItem value="gte">Greater than or equal</SelectItem>
                        <SelectItem value="lte">Less than or equal</SelectItem>
                        <SelectItem value="ne">Not equal to</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rule-threshold">Threshold</Label>
                    <Input
                      id="rule-threshold"
                      type="number"
                      value={newRule.threshold}
                      onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rule-severity">Severity</Label>
                    <Select value={newRule.severity} onValueChange={(value: any) => setNewRule({ ...newRule, severity: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="rule-category">Category</Label>
                  <Select value={newRule.category} onValueChange={(value: any) => setNewRule({ ...newRule, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateRule(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRule}>
                    Create Rule
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={fetchData} variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.by_severity.critical}</div>
              <p className="text-xs text-muted-foreground">Requires immediate attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.resolution_time_avg}</div>
              <p className="text-xs text-muted-foreground">minutes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Bell className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{statistics.by_status.active}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="suppressed">Suppressed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="severity-filter">Severity</Label>
              <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="source-filter">Source</Label>
              <Select value={filters.source} onValueChange={(value) => setFilters({ ...filters, source: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sources</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="alert_rule">Alert Rule</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts and Rules Tabs */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Alerts ({filteredAlerts.length})</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules ({alertRules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No alerts found</h3>
                  <p className="text-muted-foreground">
                    {Object.values(filters).some(v => v) 
                      ? 'Try adjusting your filters to see more alerts.'
                      : 'All systems are running smoothly!'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledgeAlert}
                  onResolve={handleResolveAlert}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {alertRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{rule.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge variant="outline">{rule.severity}</Badge>
                    </div>
                  </div>
                  {rule.description && (
                    <CardDescription>{rule.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <strong>Metric:</strong> {rule.condition.metric}
                    </div>
                    <div>
                      <strong>Condition:</strong> {rule.condition.operator} {rule.condition.threshold}
                    </div>
                    <div>
                      <strong>Category:</strong> {rule.category}
                    </div>
                    <div>
                      <strong>Created:</strong> {new Date(rule.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertManagementDashboard;