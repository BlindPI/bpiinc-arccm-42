
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
import { Play, Pause, Plus, Edit, Trash2, Settings, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AutomationService } from '@/services/automation/automationService';
import { AutomationRule } from '@/types/analytics';
import { toast } from 'sonner';

export const AutomationRulesManager: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
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
    queryKey: ['automation-execution-stats'],
    queryFn: () => AutomationService.getExecutionStats()
  });

  const createRule = useMutation({
    mutationFn: (rule: Partial<AutomationRule>) => AutomationService.createRule(rule),
    onSuccess: () => {
      toast.success('Automation rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setShowCreateDialog(false);
    }
  });

  const updateRule = useMutation({
    mutationFn: ({ id, ...updates }: Partial<AutomationRule> & { id: string }) =>
      AutomationService.updateRule(id, updates),
    onSuccess: () => {
      toast.success('Automation rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setSelectedRule(null);
    }
  });

  const deleteRule = useMutation({
    mutationFn: (id: string) => AutomationService.deleteRule(id),
    onSuccess: () => {
      toast.success('Automation rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    }
  });

  const executeRule = useMutation({
    mutationFn: (ruleId: string) => AutomationService.executeRule(ruleId),
    onSuccess: () => {
      toast.success('Automation rule executed successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
      queryClient.invalidateQueries({ queryKey: ['automation-execution-stats'] });
    }
  });

  const handleToggleRule = (rule: AutomationRule) => {
    updateRule.mutate({
      id: rule.id,
      is_active: !rule.is_active
    });
  };

  const getRuleStatusColor = (rule: AutomationRule) => {
    if (!rule.is_active) return 'secondary';
    if (rule.execution_count === 0) return 'outline';
    return 'default';
  };

  const formatRuleType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Rules</h1>
          <p className="text-muted-foreground">
            Manage automated workflows and business rules
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
            </DialogHeader>
            <AutomationRuleForm
              onSubmit={(data) => createRule.mutate(data)}
              isLoading={createRule.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          {/* Execution Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{rules?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rules?.filter(r => r.is_active).length || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {executionStats?.completed || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {executionStats?.failed || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rules List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rules?.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRuleStatusColor(rule)}>
                        {formatRuleType(rule.rule_type)}
                      </Badge>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => handleToggleRule(rule)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {rule.description || 'No description provided'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Executions: {rule.execution_count}</span>
                      <span>
                        {rule.last_executed 
                          ? `Last: ${new Date(rule.last_executed).toLocaleDateString()}`
                          : 'Never executed'
                        }
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => executeRule.mutate(rule.id)}
                        disabled={!rule.is_active || executeRule.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Execute
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRule(rule)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteRule.mutate(rule.id)}
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

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {executions?.slice(0, 20).map((execution) => (
                  <div key={execution.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        Rule ID: {execution.rule_id.slice(0, 8)}...
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Started: {new Date(execution.started_at).toLocaleString()}
                      </div>
                      {execution.completed_at && (
                        <div className="text-sm text-muted-foreground">
                          Completed: {new Date(execution.completed_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={
                        execution.status === 'completed' ? 'default' :
                        execution.status === 'failed' ? 'destructive' :
                        execution.status === 'running' ? 'secondary' : 'outline'
                      }>
                        {execution.status}
                      </Badge>
                      {execution.error_message && (
                        <div className="text-xs text-red-600 mt-1 max-w-48 truncate">
                          {execution.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AutomationTemplateCard
              title="Role Progression"
              description="Automatically evaluate and process role progression requests"
              icon={<Zap className="h-6 w-6" />}
              onUse={() => {
                createRule.mutate({
                  name: "Auto Role Progression",
                  description: "Automatically evaluate role progression eligibility",
                  rule_type: "progression",
                  trigger_conditions: { type: "role_progression_check" },
                  actions: { type: "evaluate_progression", notify: true }
                });
              }}
            />
            
            <AutomationTemplateCard
              title="Certificate Expiry"
              description="Send notifications before certificates expire"
              icon={<Settings className="h-6 w-6" />}
              onUse={() => {
                createRule.mutate({
                  name: "Certificate Expiry Notification",
                  description: "Notify users of expiring certificates",
                  rule_type: "certificate",
                  trigger_conditions: { days_before_expiry: 30 },
                  actions: { type: "send_notification", template: "expiry_warning" }
                });
              }}
            />

            <AutomationTemplateCard
              title="Compliance Check"
              description="Automated compliance monitoring and alerts"
              icon={<Settings className="h-6 w-6" />}
              onUse={() => {
                createRule.mutate({
                  name: "Compliance Monitoring",
                  description: "Monitor and alert on compliance issues",
                  rule_type: "compliance",
                  trigger_conditions: { compliance_threshold: 80 },
                  actions: { type: "compliance_alert", escalate: true }
                });
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Rule Dialog */}
      {selectedRule && (
        <Dialog open={true} onOpenChange={() => setSelectedRule(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Automation Rule</DialogTitle>
            </DialogHeader>
            <AutomationRuleForm
              rule={selectedRule}
              onSubmit={(data) => updateRule.mutate({ id: selectedRule.id, ...data })}
              isLoading={updateRule.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

interface AutomationRuleFormProps {
  rule?: AutomationRule;
  onSubmit: (data: Partial<AutomationRule>) => void;
  isLoading: boolean;
}

const AutomationRuleForm: React.FC<AutomationRuleFormProps> = ({
  rule,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    rule_type: rule?.rule_type || 'notification',
    trigger_conditions: JSON.stringify(rule?.trigger_conditions || {}, null, 2),
    actions: JSON.stringify(rule?.actions || {}, null, 2),
    is_active: rule?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        trigger_conditions: JSON.parse(formData.trigger_conditions),
        actions: JSON.parse(formData.actions)
      };
      onSubmit(data);
    } catch (error) {
      toast.error('Invalid JSON in conditions or actions');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="rule_type">Rule Type</Label>
        <Select value={formData.rule_type} onValueChange={(value) => setFormData({ ...formData, rule_type: value })}>
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

      <div>
        <Label htmlFor="trigger_conditions">Trigger Conditions (JSON)</Label>
        <Textarea
          id="trigger_conditions"
          value={formData.trigger_conditions}
          onChange={(e) => setFormData({ ...formData, trigger_conditions: e.target.value })}
          className="font-mono text-sm"
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="actions">Actions (JSON)</Label>
        <Textarea
          id="actions"
          value={formData.actions}
          onChange={(e) => setFormData({ ...formData, actions: e.target.value })}
          className="font-mono text-sm"
          rows={4}
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
          {isLoading ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
        </Button>
      </div>
    </form>
  );
};

interface AutomationTemplateCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onUse: () => void;
}

const AutomationTemplateCard: React.FC<AutomationTemplateCardProps> = ({
  title,
  description,
  icon,
  onUse
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Button onClick={onUse} className="w-full">
        Use Template
      </Button>
    </CardContent>
  </Card>
);
