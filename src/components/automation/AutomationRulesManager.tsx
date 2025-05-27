
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AutomationService } from '@/services/automation/automationService';
import { AutomationRule } from '@/types/analytics';
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
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

type RuleType = 'progression' | 'notification' | 'compliance' | 'certificate';

interface RuleFormData {
  name: string;
  description: string;
  rule_type: RuleType;
  trigger_conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
}

export const AutomationRulesManager: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    rule_type: 'notification',
    trigger_conditions: {},
    actions: {},
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => AutomationService.getRules()
  });

  const { data: executions } = useQuery({
    queryKey: ['automation-executions'],
    queryFn: () => AutomationService.getExecutions()
  });

  const { data: executionStats } = useQuery({
    queryKey: ['execution-stats'],
    queryFn: () => AutomationService.getExecutionStats()
  });

  const createRuleMutation = useMutation({
    mutationFn: (ruleData: Omit<AutomationRule, 'id' | 'created_at' | 'updated_at' | 'execution_count' | 'last_executed'>) =>
      AutomationService.createRule(ruleData),
    onSuccess: () => {
      toast.success('Automation rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed to create rule: ' + error.message);
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AutomationRule> }) =>
      AutomationService.updateRule(id, updates),
    onSuccess: () => {
      toast.success('Rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
    onError: (error) => {
      toast.error('Failed to update rule: ' + error.message);
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => AutomationService.deleteRule(id),
    onSuccess: () => {
      toast.success('Rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
    onError: (error) => {
      toast.error('Failed to delete rule: ' + error.message);
    }
  });

  const executeRuleMutation = useMutation({
    mutationFn: (ruleId: string) => AutomationService.executeRule(ruleId),
    onSuccess: () => {
      toast.success('Rule executed successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
    },
    onError: (error) => {
      toast.error('Failed to execute rule: ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'notification',
      trigger_conditions: {},
      actions: {},
      is_active: true
    });
  };

  const handleCreateRule = () => {
    if (!formData.name || !formData.rule_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    createRuleMutation.mutate(formData);
  };

  const toggleRuleStatus = (rule: AutomationRule) => {
    updateRuleMutation.mutate({
      id: rule.id,
      updates: { is_active: !rule.is_active }
    });
  };

  const handleExecuteRule = (ruleId: string) => {
    executeRuleMutation.mutate(ruleId);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'progression':
        return 'bg-blue-100 text-blue-800';
      case 'notification':
        return 'bg-green-100 text-green-800';
      case 'compliance':
        return 'bg-yellow-100 text-yellow-800';
      case 'certificate':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Zap className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading automation rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Rules</h1>
          <p className="text-muted-foreground">
            Manage and monitor automated workflows
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
              <DialogDescription>
                Define conditions and actions for automated workflows
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Rule Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Rule Type *</Label>
                  <Select 
                    value={formData.rule_type} 
                    onValueChange={(value: RuleType) => setFormData({ ...formData, rule_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="progression">Progression</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this rule does"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
                {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules?.filter(rule => rule.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules?.reduce((total, rule) => total + (rule.execution_count || 0), 0) || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executionStats?.completed && executionStats?.failed 
                ? Math.round((executionStats.completed / (executionStats.completed + executionStats.failed)) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="executions">Execution History</TabsTrigger>
          <TabsTrigger value="templates">Rule Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Automation Rules</CardTitle>
              <CardDescription>
                Manage your automated workflow rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Executions</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules?.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRuleTypeColor(rule.rule_type)}>
                          {rule.rule_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{rule.execution_count || 0}</TableCell>
                      <TableCell>
                        {rule.last_executed 
                          ? new Date(rule.last_executed).toLocaleDateString()
                          : "Never"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExecuteRule(rule.id)}
                            disabled={executeRuleMutation.isPending}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRuleStatus(rule)}
                            disabled={updateRuleMutation.isPending}
                          >
                            {rule.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRule(rule)}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id)}
                            disabled={deleteRuleMutation.isPending}
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

        <TabsContent value="executions">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                Recent automation rule executions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions?.slice(0, 20).map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        {rules?.find(r => r.id === execution.rule_id)?.name || 'Unknown Rule'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(execution.status)}
                          <span className="capitalize">{execution.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(execution.started_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {execution.completed_at 
                          ? new Date(execution.completed_at).toLocaleString()
                          : "-"
                        }
                      </TableCell>
                      <TableCell>
                        {execution.error_message ? (
                          <Badge variant="destructive">Error</Badge>
                        ) : execution.result ? (
                          <Badge variant="default">Success</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Rule Templates</CardTitle>
              <CardDescription>
                Pre-configured automation rule templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Template cards would go here */}
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">Certificate Expiry Notification</CardTitle>
                    <CardDescription>
                      Automatically notify users when certificates are about to expire
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-green-100 text-green-800">notification</Badge>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">Role Progression Check</CardTitle>
                    <CardDescription>
                      Evaluate users for role progression based on requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-blue-100 text-blue-800">progression</Badge>
                  </CardContent>
                </Card>
                
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">Compliance Monitoring</CardTitle>
                    <CardDescription>
                      Monitor and alert on compliance status changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge className="bg-yellow-100 text-yellow-800">compliance</Badge>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
