import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Save, X, Users } from 'lucide-react';
import { AssignmentRulesService } from '@/services/crm/assignmentRulesService';
import type { AssignmentRule } from '@/types/crm';
import { toast } from 'sonner';

type AssignmentType = 'round_robin' | 'load_balanced' | 'skill_based' | 'geographic';

export const AssignmentRulesManager: React.FC = () => {
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_description: '',
    criteria: {},
    assignment_type: 'round_robin' as AssignmentType,
    assigned_user_id: '',
    is_active: true,
    priority: 1,
    working_hours: {},
    escalation_rules: {},
    automation_enabled: true
  });

  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['assignment-rules'],
    queryFn: AssignmentRulesService.getAssignmentRules
  });

  const { mutate: createRule, isPending: isCreatingRule } = useMutation({
    mutationFn: AssignmentRulesService.createAssignmentRule,
    onSuccess: (result) => {
      if (result) {
        toast.success('Assignment rule created successfully');
        queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
        setIsCreating(false);
        resetForm();
      }
    }
  });

  const { mutate: updateRule, isPending: isUpdatingRule } = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AssignmentRule> }) =>
      AssignmentRulesService.updateAssignmentRule(id, updates),
    onSuccess: (result) => {
      if (result) {
        toast.success('Assignment rule updated successfully');
        queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
        setEditingRule(null);
        resetForm();
      }
    }
  });

  const { mutate: deleteRule, isPending: isDeletingRule } = useMutation({
    mutationFn: AssignmentRulesService.deleteAssignmentRule,
    onSuccess: (success) => {
      if (success) {
        toast.success('Assignment rule deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
      }
    }
  });

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_description: '',
      criteria: {},
      assignment_type: 'round_robin' as AssignmentType,
      assigned_user_id: '',
      is_active: true,
      priority: 1,
      working_hours: {},
      escalation_rules: {},
      automation_enabled: true
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRule) {
      updateRule({ id: editingRule.id, updates: formData });
    } else {
      createRule(formData);
    }
  };

  const handleEdit = (rule: AssignmentRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_description: rule.rule_description || '',
      criteria: rule.criteria,
      assignment_type: rule.assignment_type as AssignmentType,
      assigned_user_id: rule.assigned_user_id || '',
      is_active: rule.is_active,
      priority: rule.priority,
      working_hours: rule.working_hours || {},
      escalation_rules: rule.escalation_rules || {},
      automation_enabled: rule.automation_enabled
    });
    setIsCreating(false);
  };

  const handleCancel = () => {
    setEditingRule(null);
    setIsCreating(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading assignment rules...</p>
        </div>
      </div>
    );
  }

  const isFormBusy = isCreatingRule || isUpdatingRule || isDeletingRule;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assignment Rules</h2>
          <p className="text-muted-foreground">
            Configure automated lead assignment criteria
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating || !!editingRule || isFormBusy}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {(isCreating || editingRule) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRule ? 'Edit' : 'Create'} Assignment Rule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="assignment_type">Assignment Type</Label>
                  <Select value={formData.assignment_type} onValueChange={(value: AssignmentType) => setFormData({ ...formData, assignment_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="load_balanced">Load Balanced</SelectItem>
                      <SelectItem value="skill_based">Skill Based</SelectItem>
                      <SelectItem value="geographic">Geographic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="assigned_user_id">Assigned User (Optional)</Label>
                  <Input
                    id="assigned_user_id"
                    value={formData.assigned_user_id}
                    onChange={(e) => setFormData({ ...formData, assigned_user_id: e.target.value })}
                    placeholder="Leave empty for automatic assignment"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="rule_description">Description</Label>
                <Textarea
                  id="rule_description"
                  value={formData.rule_description}
                  onChange={(e) => setFormData({ ...formData, rule_description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="automation_enabled"
                    checked={formData.automation_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, automation_enabled: checked })}
                  />
                  <Label htmlFor="automation_enabled">Automation Enabled</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isFormBusy}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingRule ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
          <CardDescription>
            Current assignment rules configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules?.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{rule.rule_name}</h3>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {rule.assignment_type.replace('_', ' ')}
                    </Badge>
                    {rule.automation_enabled && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        Auto
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Priority: {rule.priority}
                    {rule.assigned_user_id && ` | Assigned to: ${rule.assigned_user_id}`}
                  </p>
                  {rule.rule_description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {rule.rule_description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                    disabled={isCreating || !!editingRule || isFormBusy}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                    disabled={isCreating || !!editingRule || isFormBusy}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {(!rules || rules.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No assignment rules found. Create your first rule to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
