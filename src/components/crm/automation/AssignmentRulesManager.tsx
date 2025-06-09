
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import { AssignmentRulesService } from '@/services/crm/assignmentRulesService';
import { LeadAssignmentService } from '@/services/crm/leadAssignmentService';
import { toast } from 'sonner';
import type { AssignmentRule } from '@/types/crm';

export function AssignmentRulesManager() {
  const queryClient = useQueryClient();
  const [selectedRule, setSelectedRule] = useState<AssignmentRule | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: assignmentRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['assignment-rules'],
    queryFn: () => AssignmentRulesService.getAssignmentRules()
  });

  const { data: workloads = [], isLoading: workloadsLoading } = useQuery({
    queryKey: ['user-workloads'],
    queryFn: () => LeadAssignmentService.getUserWorkloads()
  });

  const { data: statistics } = useQuery({
    queryKey: ['assignment-statistics'],
    queryFn: () => LeadAssignmentService.getAssignmentStatistics()
  });

  const createRuleMutation = useMutation({
    mutationFn: (rule: Omit<AssignmentRule, 'id' | 'created_at' | 'updated_at'>) =>
      AssignmentRulesService.createAssignmentRule(rule),
    onSuccess: () => {
      toast.success('Assignment rule created successfully');
      queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error('Failed to create assignment rule: ' + error.message);
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AssignmentRule> }) =>
      AssignmentRulesService.updateAssignmentRule(id, updates),
    onSuccess: () => {
      toast.success('Assignment rule updated successfully');
      queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
      setIsEditDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error) => {
      toast.error('Failed to update assignment rule: ' + error.message);
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => AssignmentRulesService.deleteAssignmentRule(id),
    onSuccess: () => {
      toast.success('Assignment rule deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
    },
    onError: (error) => {
      toast.error('Failed to delete assignment rule: ' + error.message);
    }
  });

  const [newRule, setNewRule] = useState<Partial<AssignmentRule>>({
    rule_name: '',
    rule_description: '',
    assignment_type: 'round_robin',
    criteria: {},
    priority: 1,
    is_active: true,
    automation_enabled: true,
    escalation_rules: {},
    working_hours: {}
  });

  const handleCreateRule = () => {
    if (!newRule.rule_name || !newRule.assignment_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    createRuleMutation.mutate(newRule as Omit<AssignmentRule, 'id' | 'created_at' | 'updated_at'>);
  };

  const handleUpdateRule = () => {
    if (!selectedRule) return;

    updateRuleMutation.mutate({
      id: selectedRule.id,
      updates: selectedRule
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this assignment rule?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const handleEditRule = (rule: AssignmentRule) => {
    setSelectedRule(rule);
    setIsEditDialogOpen(true);
  };

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case 'round_robin': return 'bg-blue-100 text-blue-800';
      case 'load_balanced': return 'bg-green-100 text-green-800';
      case 'skill_based': return 'bg-purple-100 text-purple-800';
      case 'manual': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (rulesLoading || workloadsLoading) {
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
          <h2 className="text-2xl font-bold tracking-tight">Assignment Rules Management</h2>
          <p className="text-muted-foreground">
            Configure intelligent lead assignment and workload distribution
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
              <DialogTitle>Create Assignment Rule</DialogTitle>
              <DialogDescription>
                Set up a new rule for automatic lead assignment
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ruleName">Rule Name</Label>
                  <Input
                    id="ruleName"
                    value={newRule.rule_name}
                    onChange={(e) => setNewRule({ ...newRule, rule_name: e.target.value })}
                    placeholder="Enter rule name"
                  />
                </div>
                <div>
                  <Label htmlFor="assignmentType">Assignment Type</Label>
                  <Select
                    value={newRule.assignment_type}
                    onValueChange={(value) => setNewRule({ ...newRule, assignment_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="load_balanced">Load Balanced</SelectItem>
                      <SelectItem value="skill_based">Skill Based</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRule.rule_description}
                  onChange={(e) => setNewRule({ ...newRule, rule_description: e.target.value })}
                  placeholder="Describe this assignment rule"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={newRule.priority}
                    onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newRule.is_active}
                    onCheckedChange={(checked) => setNewRule({ ...newRule, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule}>
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total_assigned || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leads assigned automatically
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Leads</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.unassigned_leads || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need manual assignment
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
              {assignmentRules.filter(r => r.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently enabled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Rules</CardTitle>
          <CardDescription>
            Configure how leads are automatically assigned to team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignmentRules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No assignment rules configured</p>
                <p className="text-sm">Create rules to automate lead assignment</p>
              </div>
            ) : (
              assignmentRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{rule.rule_name}</h3>
                      <Badge className={getAssignmentTypeColor(rule.assignment_type)}>
                        {rule.assignment_type.replace('_', ' ')}
                      </Badge>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{rule.rule_description}</p>
                    <div className="text-xs text-gray-400">
                      Priority: {rule.priority} | Automation: {rule.automation_enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Workloads */}
      <Card>
        <CardHeader>
          <CardTitle>Team Workload Distribution</CardTitle>
          <CardDescription>
            Current assignment workload across team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workloads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workload data available</p>
              </div>
            ) : (
              workloads.map((workload) => (
                <div key={workload.user_id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{workload.user_name}</span>
                    <span className="text-sm text-gray-500">
                      {workload.current_leads}/{workload.max_capacity} leads
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${Math.min((workload.current_leads / (workload.max_capacity || 50)) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Availability Score: {workload.availability_score.toFixed(1)}%
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Rule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assignment Rule</DialogTitle>
            <DialogDescription>
              Modify the assignment rule configuration
            </DialogDescription>
          </DialogHeader>
          {selectedRule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editRuleName">Rule Name</Label>
                  <Input
                    id="editRuleName"
                    value={selectedRule.rule_name}
                    onChange={(e) => setSelectedRule({ ...selectedRule, rule_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editAssignmentType">Assignment Type</Label>
                  <Select
                    value={selectedRule.assignment_type}
                    onValueChange={(value) => setSelectedRule({ ...selectedRule, assignment_type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="load_balanced">Load Balanced</SelectItem>
                      <SelectItem value="skill_based">Skill Based</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={selectedRule.rule_description}
                  onChange={(e) => setSelectedRule({ ...selectedRule, rule_description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editPriority">Priority</Label>
                  <Input
                    id="editPriority"
                    type="number"
                    value={selectedRule.priority}
                    onChange={(e) => setSelectedRule({ ...selectedRule, priority: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedRule.is_active}
                    onCheckedChange={(checked) => setSelectedRule({ ...selectedRule, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRule}>
                  Update Rule
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
