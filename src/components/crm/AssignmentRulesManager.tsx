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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Settings,
  BarChart3,
  UserCheck,
  Clock
} from 'lucide-react';
import { LeadAssignmentService, AssignmentRule } from '@/services/crm/leadAssignmentService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AssignmentRulesManagerProps {
  className?: string;
}

export function AssignmentRulesManager({ className }: AssignmentRulesManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_description: '',
    assignment_type: 'round_robin' as 'round_robin' | 'criteria_based' | 'load_balanced',
    criteria: {},
    assigned_users: [] as string[],
    priority: 1,
    is_active: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: assignmentRules, isLoading } = useQuery({
    queryKey: ['assignment-rules'],
    queryFn: LeadAssignmentService.getAssignmentRules
  });

  const { data: assignmentStats } = useQuery({
    queryKey: ['assignment-statistics'],
    queryFn: LeadAssignmentService.getAssignmentStatistics
  });

  const { data: userWorkloads } = useQuery({
    queryKey: ['user-workloads'],
    queryFn: () => LeadAssignmentService.getUserWorkloads()
  });

  const { data: availableUsers } = useQuery({
    queryKey: ['available-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, role')
        .in('role', ['sales_rep', 'sales_manager', 'admin']);
      
      if (error) throw error;
      return data || [];
    }
  });

  const createRuleMutation = useMutation({
    mutationFn: LeadAssignmentService.createAssignmentRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-statistics'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Assignment rule created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create assignment rule",
        variant: "destructive",
      });
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AssignmentRule> }) =>
      LeadAssignmentService.updateAssignmentRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-statistics'] });
      setIsEditDialogOpen(false);
      setEditingRule(null);
      resetForm();
      toast({
        title: "Success",
        description: "Assignment rule updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update assignment rule",
        variant: "destructive",
      });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: LeadAssignmentService.deleteAssignmentRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-statistics'] });
      toast({
        title: "Success",
        description: "Assignment rule deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete assignment rule",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_description: '',
      assignment_type: 'round_robin',
      criteria: {},
      assigned_users: [],
      priority: 1,
      is_active: true
    });
  };

  const handleCreateRule = () => {
    createRuleMutation.mutate(formData);
  };

  const handleUpdateRule = () => {
    if (editingRule) {
      updateRuleMutation.mutate({
        id: editingRule.id,
        updates: formData
      });
    }
  };

  const handleEditRule = (rule: AssignmentRule) => {
    setEditingRule(rule);
    setFormData({
      rule_name: rule.rule_name,
      rule_description: rule.rule_description || '',
      assignment_type: rule.assignment_type,
      criteria: rule.criteria,
      assigned_users: rule.assigned_users,
      priority: rule.priority,
      is_active: rule.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this assignment rule?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const loadDefaultRules = async () => {
    const defaultRules = LeadAssignmentService.getDefaultAssignmentRules();
    
    for (const rule of defaultRules) {
      try {
        await LeadAssignmentService.createAssignmentRule(rule);
      } catch (error) {
        console.error('Error creating default rule:', error);
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
    toast({
      title: "Success",
      description: "Default assignment rules loaded successfully",
    });
  };

  const getAssignmentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'round_robin': 'Round Robin',
      'criteria_based': 'Criteria Based',
      'load_balanced': 'Load Balanced'
    };
    return labels[type] || type;
  };

  const getUserName = (userId: string) => {
    const user = availableUsers?.find(u => u.id === userId);
    return user?.display_name || 'Unknown User';
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assignment Rules</h2>
          <p className="text-muted-foreground">
            Configure automated lead assignment rules and user workload management
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDefaultRules} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Load Defaults
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Assignment Rule</DialogTitle>
                <DialogDescription>
                  Define a new rule for automatic lead assignment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g., High Score Leads"
                  />
                </div>
                <div>
                  <Label htmlFor="rule_description">Description</Label>
                  <Textarea
                    id="rule_description"
                    value={formData.rule_description}
                    onChange={(e) => setFormData({ ...formData, rule_description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div>
                  <Label htmlFor="assignment_type">Assignment Type</Label>
                  <Select 
                    value={formData.assignment_type} 
                    onValueChange={(value: 'round_robin' | 'criteria_based' | 'load_balanced') => 
                      setFormData({ ...formData, assignment_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="criteria_based">Criteria Based</SelectItem>
                      <SelectItem value="load_balanced">Load Balanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assigned Users</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {availableUsers?.map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={formData.assigned_users.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                assigned_users: [...formData.assigned_users, user.id]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                assigned_users: formData.assigned_users.filter(id => id !== user.id)
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`user-${user.id}`} className="text-sm">
                          {user.display_name} ({user.role})
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
                  Create Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentRules?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {assignmentRules?.filter(r => r.is_active).length || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Leads</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentStats?.total_assigned || 0}</div>
            <p className="text-xs text-muted-foreground">
              {assignmentStats?.unassigned_leads || 0} unassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userWorkloads?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available for assignment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Assignments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentStats?.recent_assignments || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Rules</CardTitle>
          <CardDescription>
            Manage your lead assignment rules and priorities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignmentRules?.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{rule.rule_name}</span>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        {getAssignmentTypeLabel(rule.assignment_type)}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {rule.assigned_users.length} users assigned
                    </span>
                    {rule.rule_description && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {rule.rule_description}
                      </span>
                    )}
                    {rule.assigned_users.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {rule.assigned_users.slice(0, 3).map(userId => (
                          <Badge key={userId} variant="secondary" className="text-xs">
                            {getUserName(userId)}
                          </Badge>
                        ))}
                        {rule.assigned_users.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{rule.assigned_users.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    Priority {rule.priority}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {(!assignmentRules || assignmentRules.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No assignment rules configured</p>
                <p className="text-sm">Create rules to automatically assign leads to users</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Workloads */}
      <Card>
        <CardHeader>
          <CardTitle>User Workloads</CardTitle>
          <CardDescription>
            Current lead assignments and availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userWorkloads?.map((workload) => (
              <div key={workload.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{workload.user_name}</span>
                    <span className="text-sm text-muted-foreground">
                      {workload.current_leads} current leads
                      {workload.max_capacity && ` / ${workload.max_capacity} capacity`}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {workload.availability_score.toFixed(0)}% available
                    </div>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          workload.availability_score > 70 ? 'bg-green-500' :
                          workload.availability_score > 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${workload.availability_score}%` }}
                      />
                    </div>
                  </div>
                  <Badge 
                    variant={
                      workload.availability_score > 70 ? "success" :
                      workload.availability_score > 40 ? "warning" :
                      "destructive"
                    }
                  >
                    {workload.availability_score > 70 ? "Available" :
                     workload.availability_score > 40 ? "Busy" :
                     "Overloaded"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}