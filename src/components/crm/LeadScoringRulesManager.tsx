
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
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { LeadScoringService } from '@/services/crm/leadScoringService';
import type { LeadScoringRule } from '@/types/crm';
import { toast } from 'sonner';

export const LeadScoringRulesManager: React.FC = () => {
  const [editingRule, setEditingRule] = useState<LeadScoringRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_description: '',
    field_name: '',
    operator: 'equals' as const,
    field_value: '',
    score_points: 0,
    priority: 1,
    is_active: true
  });

  const queryClient = useQueryClient();

  const { data: rules, isLoading } = useQuery({
    queryKey: ['lead-scoring-rules'],
    queryFn: LeadScoringService.getLeadScoringRules
  });

  const { mutate: createRule } = useMutation({
    mutationFn: LeadScoringService.createLeadScoringRule,
    onSuccess: () => {
      toast.success('Lead scoring rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      setIsCreating(false);
      resetForm();
    }
  });

  const { mutate: updateRule } = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<LeadScoringRule> }) =>
      LeadScoringService.updateLeadScoringRule(id, updates),
    onSuccess: () => {
      toast.success('Lead scoring rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      setEditingRule(null);
      resetForm();
    }
  });

  const { mutate: deleteRule } = useMutation({
    mutationFn: LeadScoringService.deleteLeadScoringRule,
    onSuccess: () => {
      toast.success('Lead scoring rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
    }
  });

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_description: '',
      field_name: '',
      operator: 'equals' as const,
      field_value: '',
      score_points: 0,
      priority: 1,
      is_active: true
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

  const handleEdit = (rule: LeadScoringRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_description: rule.rule_description || '',
      field_name: rule.field_name,
      operator: rule.operator,
      field_value: rule.field_value,
      score_points: rule.score_points,
      priority: rule.priority,
      is_active: rule.is_active
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
          <p className="mt-2 text-muted-foreground">Loading lead scoring rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lead Scoring Rules</h2>
          <p className="text-muted-foreground">
            Configure automated lead scoring criteria
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating || editingRule}>
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {(isCreating || editingRule) && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRule ? 'Edit' : 'Create'} Lead Scoring Rule</CardTitle>
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
                  <Label htmlFor="field_name">Field Name</Label>
                  <Select value={formData.field_name} onValueChange={(value) => setFormData({ ...formData, field_name: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead_source">Lead Source</SelectItem>
                      <SelectItem value="training_urgency">Training Urgency</SelectItem>
                      <SelectItem value="estimated_participant_count">Participant Count</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="company_name">Company Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="operator">Operator</Label>
                  <Select value={formData.operator} onValueChange={(value: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_list') => setFormData({ ...formData, operator: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="greater_than">Greater Than</SelectItem>
                      <SelectItem value="less_than">Less Than</SelectItem>
                      <SelectItem value="in_list">In List</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="field_value">Field Value</Label>
                  <Input
                    id="field_value"
                    value={formData.field_value}
                    onChange={(e) => setFormData({ ...formData, field_value: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="score_points">Score Points</Label>
                  <Input
                    id="score_points"
                    type="number"
                    value={formData.score_points}
                    onChange={(e) => setFormData({ ...formData, score_points: parseInt(e.target.value) })}
                    required
                  />
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit">
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
            Current lead scoring rules configuration
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
                      {rule.score_points} points
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rule.field_name} {rule.operator} "{rule.field_value}"
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
                    disabled={isCreating || editingRule}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                    disabled={isCreating || editingRule}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {(!rules || rules.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                No lead scoring rules found. Create your first rule to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
