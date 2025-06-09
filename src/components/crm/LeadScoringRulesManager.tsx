
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { LeadScoringService } from '@/services/crm/leadScoringService';
import type { LeadScoringRule } from '@/types/crm';
import type { OperatorType } from '@/types/type-fixes';
import { toast } from 'sonner';
import { Trash2, Edit, Plus } from 'lucide-react';

export const LeadScoringRulesManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadScoringRule | null>(null);

  const [formData, setFormData] = useState({
    rule_name: '',
    rule_description: '',
    rule_type: 'demographic' as 'demographic' | 'behavioral' | 'firmographic',
    field_name: '',
    operator: 'equals' as OperatorType,
    field_value: '',
    score_points: 10,
    priority: 1,
    is_active: true
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ['lead-scoring-rules'],
    queryFn: LeadScoringService.getLeadScoringRules
  });

  const createRuleMutation = useMutation({
    mutationFn: LeadScoringService.createLeadScoringRule,
    onSuccess: () => {
      toast.success('Lead scoring rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create lead scoring rule');
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeadScoringRule> }) =>
      LeadScoringService.updateLeadScoringRule(id, data),
    onSuccess: () => {
      toast.success('Lead scoring rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update lead scoring rule');
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: LeadScoringService.deleteLeadScoringRule,
    onSuccess: () => {
      toast.success('Lead scoring rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['lead-scoring-rules'] });
    },
    onError: () => {
      toast.error('Failed to delete lead scoring rule');
    }
  });

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_description: '',
      rule_type: 'demographic',
      field_name: '',
      operator: 'equals',
      field_value: '',
      score_points: 10,
      priority: 1,
      is_active: true
    });
    setIsCreating(false);
    setEditingRule(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const ruleData = {
      rule_name: formData.rule_name,
      rule_description: formData.rule_description,
      rule_type: formData.rule_type,
      field_name: formData.field_name,
      operator: formData.operator,
      field_value: formData.field_value,
      score_points: formData.score_points,
      score_value: formData.score_points, // Map score_points to score_value
      priority: formData.priority,
      is_active: formData.is_active,
      criteria: {
        field_name: formData.field_name,
        operator: formData.operator,
        field_value: formData.field_value
      }
    };

    if (editingRule) {
      updateRuleMutation.mutate({ id: editingRule.id, data: ruleData });
    } else {
      createRuleMutation.mutate(ruleData);
    }
  };

  const handleEdit = (rule: LeadScoringRule) => {
    setFormData({
      rule_name: rule.rule_name,
      rule_description: rule.rule_description || '',
      rule_type: rule.rule_type,
      field_name: rule.field_name || '',
      operator: (rule.operator || 'equals') as OperatorType,
      field_value: rule.field_value || '',
      score_points: rule.score_points || rule.score_value || 10,
      priority: rule.priority || 1,
      is_active: rule.is_active
    });
    setEditingRule(rule);
    setIsCreating(true);
  };

  if (isLoading) {
    return <div>Loading lead scoring rules...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lead Scoring Rules</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRule ? 'Edit' : 'Create'} Lead Scoring Rule</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="Enter rule name"
                    required
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
                      <SelectItem value="demographic">Demographic</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="firmographic">Firmographic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="rule_description">Description</Label>
                <Textarea
                  id="rule_description"
                  value={formData.rule_description}
                  onChange={(e) => setFormData({ ...formData, rule_description: e.target.value })}
                  placeholder="Describe this rule"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="field_name">Field Name</Label>
                  <Select
                    value={formData.field_name}
                    onValueChange={(value) => setFormData({ ...formData, field_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="company_name">Company</SelectItem>
                      <SelectItem value="job_title">Job Title</SelectItem>
                      <SelectItem value="lead_source">Lead Source</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="operator">Operator</Label>
                  <Select
                    value={formData.operator}
                    onValueChange={(value: OperatorType) => setFormData({ ...formData, operator: value })}
                  >
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
                    placeholder="Enter value"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="score_points">Score Points</Label>
                  <Input
                    id="score_points"
                    type="number"
                    value={formData.score_points}
                    onChange={(e) => setFormData({ ...formData, score_points: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                >
                  {createRuleMutation.isPending || updateRuleMutation.isPending 
                    ? 'Saving...' 
                    : editingRule ? 'Update Rule' : 'Create Rule'
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      <div className="grid gap-4">
        {rules?.map((rule) => (
          <Card key={rule.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{rule.rule_name}</h3>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{rule.rule_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rule.rule_description}</p>
                  <div className="text-xs text-muted-foreground">
                    {rule.field_name} {rule.operator} "{rule.field_value}" = +{rule.score_points || rule.score_value} points
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                    disabled={deleteRuleMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
