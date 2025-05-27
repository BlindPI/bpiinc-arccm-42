
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
  Zap, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Settings
} from 'lucide-react';
import { AutomationService } from '@/services/automation/automationService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ruleFormSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().optional(),
  rule_type: z.enum(['progression', 'notification', 'compliance', 'certificate']),
  trigger_conditions: z.record(z.any()),
  actions: z.record(z.any()),
  is_active: z.boolean().default(true),
});

type RuleFormData = z.infer<typeof ruleFormSchema>;

export const AutomationRulesManager: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('rules');
  const [editingRule, setEditingRule] = useState<string | null>(null);

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: '',
      description: '',
      rule_type: 'notification',
      trigger_conditions: {},
      actions: {},
      is_active: true,
    },
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => AutomationService.getRules()
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['automation-executions'],
    queryFn: () => AutomationService.getExecutions()
  });

  const { data: stats } = useQuery({
    queryKey: ['automation-stats'],
    queryFn: () => AutomationService.getExecutionStats()
  });

  const createRule = useMutation({
    mutationFn: (data: RuleFormData) => AutomationService.createRule({
      ...data,
      created_by: user?.id || '',
    }),
    onSuccess: () => {
      toast.success('Automation rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    }
  });

  const updateRule = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<RuleFormData> }) => 
      AutomationService.updateRule(id, data),
    onSuccess: () => {
      toast.success('Rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setEditingRule(null);
    }
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => AutomationService.deleteRule(id),
    onSuccess: () => {
      toast.success('Rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    }
  });

  const executeRule = useMutation({
    mutationFn: (ruleId: string) => AutomationService.executeRule(ruleId),
    onSuccess: () => {
      toast.success('Rule executed successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
    }
  });

  const onSubmit = (data: RuleFormData) => {
    if (editingRule) {
      updateRule.mutate({ id: editingRule, data });
    } else {
      createRule.mutate(data);
    }
  };

  const getRuleTypeColor = (type: string) => {
    switch (type) {
      case 'progression': return 'bg-blue-100 text-blue-800';
      case 'notification': return 'bg-green-100 text-green-800';
      case 'compliance': return 'bg-yellow-100 text-yellow-800';
      case 'certificate': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Zap className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Rules</h1>
          <p className="text-muted-foreground">Manage automated workflows and business rules</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Automation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    No automation rules created yet. Start by creating your first rule.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge className={getRuleTypeColor(rule.rule_type)}>
                            {rule.rule_type}
                          </Badge>
                          {rule.is_active && (
                            <Badge variant="outline" className="text-green-600">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => executeRule.mutate(rule.id)}
                            disabled={executeRule.isPending}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingRule(rule.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRule.mutate(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {rule.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Executed {rule.execution_count} times</span>
                        {rule.last_executed && (
                          <span>Last run: {new Date(rule.last_executed).toLocaleDateString()}</span>
                        )}
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
                Create New Automation Rule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Rule Name</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="Enter rule name"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rule_type">Rule Type</Label>
                    <Select
                      value={form.watch('rule_type')}
                      onValueChange={(value) => form.setValue('rule_type', value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="progression">Role Progression</SelectItem>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="compliance">Compliance Check</SelectItem>
                        <SelectItem value="certificate">Certificate Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register('description')}
                    placeholder="Describe what this rule does"
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
                    disabled={createRule.isPending || updateRule.isPending}
                  >
                    {editingRule ? 'Update Rule' : 'Create Rule'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
            </CardHeader>
            <CardContent>
              {executions.length === 0 ? (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    No rule executions yet. Rules will appear here once they start running.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {executions.slice(0, 10).map((execution) => (
                    <div key={execution.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">Execution {execution.id.slice(0, 8)}</div>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Started: {new Date(execution.started_at).toLocaleString()}
                        {execution.completed_at && (
                          <span> | Completed: {new Date(execution.completed_at).toLocaleString()}</span>
                        )}
                      </div>
                      {execution.error_message && (
                        <div className="mt-2 text-sm text-red-600">
                          Error: {execution.error_message}
                        </div>
                      )}
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
                    {rules.filter(r => r.is_active).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Rules</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats?.completed || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful Executions</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats?.failed || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed Executions</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationRulesManager;
