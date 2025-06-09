
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Target, 
  Users, 
  Clock,
  BarChart3,
  Settings
} from 'lucide-react';
import { LeadAssignmentService, type AssignmentRule } from '@/services/crm/leadAssignmentService';
import { toast } from 'sonner';

export function AssignmentRulesManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const queryClient = useQueryClient();

  // Form state for creating/editing rules
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_description: '',
    assignment_type: 'round_robin' as const,
    criteria: {},
    assigned_user_id: '',
    priority: 1,
    is_active: true,
    automation_enabled: true,
    escalation_rules: {},
    working_hours: {}
  });

  // Fetch assignment rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['assignment-rules'],
    queryFn: () => LeadAssignmentService.getAssignmentRules()
  });

  // Fetch assignment statistics
  const { data: statistics } = useQuery({
    queryKey: ['assignment-statistics'],
    queryFn: () => LeadAssignmentService.getAssignmentStatistics()
  });

  // Fetch user workloads
  const { data: workloads } = useQuery({
    queryKey: ['user-workloads'],
    queryFn: () => LeadAssignmentService.getUserWorkloads()
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: (rule: Omit<AssignmentRule, 'id' | 'created_at' | 'updated_at'>) =>
      LeadAssignmentService.createAssignmentRule(rule),
    onSuccess: () => {
      toast.success('Assignment rule created successfully');
      queryClient.invalidateQueries(['assignment-rules']);
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create assignment rule');
    }
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AssignmentRule> }) =>
      LeadAssignmentService.updateAssignmentRule(id, updates),
    onSuccess: () => {
      toast.success('Assignment rule updated successfully');
      queryClient.invalidateQueries(['assignment-rules']);
      setEditingRule(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update assignment rule');
    }
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => LeadAssignmentService.deleteAssignmentRule(id),
    onSuccess: () => {
      toast.success('Assignment rule deleted successfully');
      queryClient.invalidateQueries(['assignment-rules']);
    },
    onError: () => {
      toast.error('Failed to delete assignment rule');
    }
  });

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_description: '',
      assignment_type: 'round_robin',
      criteria: {},
      assigned_user_id: '',
      priority: 1,
      is_active: true,
      automation_enabled: true,
      escalation_rules: {},
      working_hours: {}
    });
  };

  const handleSubmit = () => {
    if (editingRule) {
      updateRuleMutation.mutate({
        id: editingRule.id,
        updates: formData
      });
    } else {
      createRuleMutation.mutate(formData);
    }
  };

  const handleEdit = (rule: AssignmentRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_description: rule.rule_description || '',
      assignment_type: rule.assignment_type,
      criteria: rule.criteria,
      assigned_user_id: rule.assigned_user_id || '',
      priority: rule.priority,
      is_active: rule.is_active,
      automation_enabled: rule.automation_enabled,
      escalation_rules: rule.escalation_rules || {},
      working_hours: rule.working_hours || {}
    });
    setIsCreateDialogOpen(true);
  };

  const getAssignmentTypeLabel = (type: string) => {
    switch (type) {
      case 'round_robin':
        return 'Round Robin';
      case 'load_balanced':
        return 'Load Balanced';
      case 'skill_based':
        return 'Skill Based';
      case 'geographic':
        return 'Geographic';
      default:
        return type;
    }
  };

  if (rulesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assignment Rules</h2>
          <p className="text-muted-foreground">
            Configure intelligent lead assignment rules and monitor performance
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingRule(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingRule ? 'Edit Assignment Rule' : 'Create Assignment Rule'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input
                    value={formData.rule_name}
                    onChange={(e) => setFormData({...formData, rule_name: e.target.value})}
                    placeholder="Enter rule name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Assignment Type</Label>
                  <Select 
                    value={formData.assignment_type} 
                    onValueChange={(value: any) => setFormData({...formData, assignment_type: value})}
                  >
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
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.rule_description}
                  onChange={(e) => setFormData({...formData, rule_description: e.target.value})}
                  placeholder="Describe when this rule should be applied"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                    min="1"
                    max="10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Assigned User (Optional)</Label>
                  <Select 
                    value={formData.assigned_user_id} 
                    onValueChange={(value) => setFormData({...formData, assigned_user_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {workloads?.map((workload) => (
                        <SelectItem key={workload.user_id} value={workload.user_id}>
                          {workload.user_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                  />
                  <Label>Active</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.automation_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, automation_enabled: checked})}
                  />
                  <Label>Automation Enabled</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                >
                  {editingRule ? 'Update' : 'Create'} Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total_assigned || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leads assigned by rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.unassigned_leads || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules?.filter(r => r.is_active).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workloads?.length ? 
                Math.round(workloads.reduce((acc, w) => acc + w.availability_score, 0) / workloads.length) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average availability
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Rules</CardTitle>
          <CardDescription>
            Manage rules that control how leads are automatically assigned
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules?.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{rule.rule_name}</h4>
                    <Badge variant={rule.is_active ? "default" : "secondary"}>
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {getAssignmentTypeLabel(rule.assignment_type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                {rule.rule_description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {rule.rule_description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Priority: {rule.priority}</span>
                  <span>Automation: {rule.automation_enabled ? 'Enabled' : 'Disabled'}</span>
                  <span>Created: {new Date(rule.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}

            {(!rules || rules.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No assignment rules configured</p>
                <p className="text-sm">Create your first rule to automate lead assignment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Workloads */}
      <Card>
        <CardHeader>
          <CardTitle>Team Workloads</CardTitle>
          <CardDescription>
            Current assignment distribution and capacity utilization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workloads?.map((workload) => (
              <div key={workload.user_id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{workload.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {workload.current_leads} / {workload.max_capacity || 50} leads
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min((workload.current_leads / (workload.max_capacity || 50)) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{workload.availability_score.toFixed(0)}%</div>
                    <div className="text-xs text-muted-foreground">Available</div>
                  </div>
                </div>
              </div>
            ))}

            {(!workloads || workloads.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workload data available</p>
                <p className="text-sm">Workload information will appear once leads are assigned</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
