
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AutomationService } from '@/services/automation/automationService';
import { AutomationRule } from '@/types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Zap, Play, Pause, Plus, Edit, Trash2, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface RuleFormData {
  name: string;
  description: string;
  rule_type: 'progression' | 'notification' | 'compliance' | 'certificate';
  trigger_conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
}

export const AutomationRulesManager: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
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

  const { data: stats } = useQuery({
    queryKey: ['automation-stats'],
    queryFn: () => AutomationService.getExecutionStats()
  });

  const createRuleMutation = useMutation({
    mutationFn: (ruleData: RuleFormData) => AutomationService.createRule({
      ...ruleData,
      created_by: '00000000-0000-0000-0000-000000000000' // Default system UUID
    }),
    onSuccess: () => {
      toast.success('Automation rule created successfully');
      setIsCreateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      resetForm();
    },
    onError: (error: any) => {
      toast.error('Failed to create rule: ' + error.message);
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AutomationRule> }) =>
      AutomationService.updateRule(id, updates),
    onSuccess: () => {
      console.log('✅ Rule updated successfully');
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      resetForm();
    },
    onError: (error: any) => {
      console.error('❌ Failed to update rule:', error);
      alert('Failed to update rule: ' + error.message);
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => AutomationService.deleteRule(id),
    onSuccess: () => {
      toast.success('Rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    }
  });

  const executeRuleMutation = useMutation({
    mutationFn: (ruleId: string) => AutomationService.executeRule(ruleId),
    onSuccess: () => {
      toast.success('Rule executed successfully');
      queryClient.invalidateQueries({ queryKey: ['automation-executions'] });
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
    setSelectedRule(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.rule_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (selectedRule) {
      // Update existing rule
      updateRuleMutation.mutate({
        id: selectedRule.id,
        updates: formData
      });
    } else {
      // Create new rule
      createRuleMutation.mutate(formData);
    }
  };

  const handleEditRule = (rule: AutomationRule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      rule_type: rule.rule_type,
      trigger_conditions: rule.trigger_conditions,
      actions: rule.actions,
      is_active: rule.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleToggleActive = (rule: AutomationRule) => {
    updateRuleMutation.mutate({
      id: rule.id,
      updates: { is_active: !rule.is_active }
    });
  };

  const handleExecuteRule = (ruleId: string) => {
    executeRuleMutation.mutate(ruleId);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading automation rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automation Rules</h1>
          <p className="text-muted-foreground">
            Create and manage automated processes for your training system
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
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter rule name"
                />
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
              
              <div>
                <Label htmlFor="rule_type">Rule Type</Label>
                <Select
                  value={formData.rule_type}
                  onValueChange={(value: any) => setFormData({ ...formData, rule_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="progression">Progression</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                  </SelectContent>
                </Select>
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
                <Button onClick={handleSubmit} disabled={createRuleMutation.isPending}>
                  {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
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
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules?.filter(rule => rule.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Executions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executions?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.completed ? Math.round((stats.completed / (stats.completed + (stats.failed || 0))) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules?.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{rule.name}</h3>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline">{rule.rule_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rule.description}
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    Executed {rule.execution_count} times
                    {rule.last_executed && ` • Last: ${new Date(rule.last_executed).toLocaleDateString()}`}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(rule)}
                  >
                    {rule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExecuteRule(rule.id)}
                    disabled={!rule.is_active}
                  >
                    <Zap className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {(!rules || rules.length === 0) && (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No automation rules</h3>
                <p className="text-muted-foreground">
                  Create your first automation rule to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Automation Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Rule Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter rule name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this rule does"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-rule_type">Rule Type</Label>
              <Select
                value={formData.rule_type}
                onValueChange={(value: any) => setFormData({ ...formData, rule_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="progression">Progression</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="certificate">Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit-is_active">Active</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={updateRuleMutation.isPending}>
                {updateRuleMutation.isPending ? 'Updating...' : 'Update Rule'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
