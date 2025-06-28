
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AutomationRule, RuleFormData } from '@/types/automation';
import { Settings, Plus, Edit, Trash2 } from 'lucide-react';

export function AutomationRulesManager() {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const queryClient = useQueryClient();

  // Fetch automation rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async (): Promise<AutomationRule[]> => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(rule => ({
        ...rule,
        type: rule.rule_type,
        isActive: rule.is_active,
        trigger: { type: 'condition', parameters: rule.trigger_conditions },
        actions: [{ type: 'action', parameters: rule.actions }],
        createdAt: rule.created_at,
        updatedAt: rule.updated_at
      })) || [];
    }
  });

  // Create/Update rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: RuleFormData) => {
      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          name: ruleData.name,
          description: ruleData.description,
          rule_type: ruleData.rule_type,
          trigger_conditions: ruleData.trigger_conditions,
          actions: ruleData.actions,
          is_active: ruleData.is_active,
          created_by: null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      setShowForm(false);
      setEditingRule(null);
    }
  });

  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    description: '',
    rule_type: 'compliance',
    trigger_conditions: {},
    actions: {},
    is_active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRuleMutation.mutate(formData);
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      trigger_conditions: rule.trigger_conditions,
      actions: rule.actions,
      is_active: rule.is_active
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'compliance',
      trigger_conditions: {},
      actions: {},
      is_active: true
    });
    setEditingRule(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Automation Rules</h2>
          <p className="text-muted-foreground">
            Configure automated workflows and compliance rules
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRule ? 'Edit Rule' : 'Create New Rule'}</CardTitle>
          </CardHeader>
          <CardContent>
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
                <Select
                  value={formData.rule_type}
                  onValueChange={(value: 'compliance' | 'certificate' | 'notification' | 'progression') =>
                    setFormData({ ...formData, rule_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="certificate">Certificate</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="progression">Progression</SelectItem>
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
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRuleMutation.isPending}>
                  {createRuleMutation.isPending ? 'Creating...' : editingRule ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No automation rules configured</p>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
