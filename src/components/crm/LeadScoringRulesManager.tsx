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
  Target, 
  Settings,
  BarChart3,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { LeadScoringService, LeadScoringRule } from '@/services/crm/leadScoringService';
import { useToast } from '@/hooks/use-toast';

interface LeadScoringRulesManagerProps {
  className?: string;
}

export function LeadScoringRulesManager({ className }: LeadScoringRulesManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadScoringRule | null>(null);
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_description: '',
    field_name: '',
    operator: '',
    field_value: '',
    score_points: 0,
    priority: 1,
    is_active: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scoringRules, isLoading } = useQuery({
    queryKey: ['scoring-rules'],
    queryFn: LeadScoringService.getScoringRules
  });

  const { data: scoringStats } = useQuery({
    queryKey: ['scoring-statistics'],
    queryFn: LeadScoringService.getScoringStatistics
  });

  const createRuleMutation = useMutation({
    mutationFn: LeadScoringService.createScoringRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rules'] });
      queryClient.invalidateQueries({ queryKey: ['scoring-statistics'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Scoring rule created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create scoring rule",
        variant: "destructive",
      });
    }
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<LeadScoringRule> }) =>
      LeadScoringService.updateScoringRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rules'] });
      queryClient.invalidateQueries({ queryKey: ['scoring-statistics'] });
      setIsEditDialogOpen(false);
      setEditingRule(null);
      resetForm();
      toast({
        title: "Success",
        description: "Scoring rule updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update scoring rule",
        variant: "destructive",
      });
    }
  });

  const deleteRuleMutation = useMutation({
    mutationFn: LeadScoringService.deleteScoringRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scoring-rules'] });
      queryClient.invalidateQueries({ queryKey: ['scoring-statistics'] });
      toast({
        title: "Success",
        description: "Scoring rule deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete scoring rule",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      rule_name: '',
      rule_description: '',
      field_name: '',
      operator: '',
      field_value: '',
      score_points: 0,
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

  const handleEditRule = (rule: LeadScoringRule) => {
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
    setIsEditDialogOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this scoring rule?')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const loadDefaultRules = async () => {
    const defaultRules = LeadScoringService.getDefaultScoringRules();
    
    for (const rule of defaultRules) {
      try {
        await LeadScoringService.createScoringRule(rule);
      } catch (error) {
        console.error('Error creating default rule:', error);
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['scoring-rules'] });
    toast({
      title: "Success",
      description: "Default scoring rules loaded successfully",
    });
  };

  const fieldOptions = [
    { value: 'company_size', label: 'Company Size' },
    { value: 'industry', label: 'Industry' },
    { value: 'job_title', label: 'Job Title' },
    { value: 'lead_source', label: 'Lead Source' },
    { value: 'annual_revenue_range', label: 'Annual Revenue Range' },
    { value: 'budget_range', label: 'Budget Range' },
    { value: 'training_urgency', label: 'Training Urgency' },
    { value: 'estimated_participant_count', label: 'Participant Count' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'company_name', label: 'Company Name' }
  ];

  const operatorOptions = [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'in_range', label: 'In Range (min-max)' },
    { value: 'not_empty', label: 'Not Empty' }
  ];

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
          <h2 className="text-2xl font-bold tracking-tight">Lead Scoring Rules</h2>
          <p className="text-muted-foreground">
            Configure automated lead scoring criteria and point values
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Scoring Rule</DialogTitle>
                <DialogDescription>
                  Define a new rule for automatic lead scoring
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rule_name">Rule Name</Label>
                  <Input
                    id="rule_name"
                    value={formData.rule_name}
                    onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                    placeholder="e.g., Enterprise Company Size"
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
                  <Label htmlFor="field_name">Field</Label>
                  <Select value={formData.field_name} onValueChange={(value) => setFormData({ ...formData, field_name: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="operator">Operator</Label>
                  <Select value={formData.operator} onValueChange={(value) => setFormData({ ...formData, operator: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="field_value">Value</Label>
                  <Input
                    id="field_value"
                    value={formData.field_value}
                    onChange={(e) => setFormData({ ...formData, field_value: e.target.value })}
                    placeholder="e.g., enterprise, 50, healthcare"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="score_points">Points</Label>
                    <Input
                      id="score_points"
                      type="number"
                      value={formData.score_points}
                      onChange={(e) => setFormData({ ...formData, score_points: parseInt(e.target.value) || 0 })}
                    />
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
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scoringRules?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {scoringRules?.filter(r => r.is_active).length || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scored Leads</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scoringStats?.total_scored_leads || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {scoringStats?.average_score?.toFixed(1) || 0} points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Score Leads</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scoringStats?.score_distribution.high || 0}</div>
            <p className="text-xs text-muted-foreground">
              80+ points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Score</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scoringStats?.highest_score || 0}</div>
            <p className="text-xs text-muted-foreground">
              Highest lead score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Scoring Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Rules</CardTitle>
          <CardDescription>
            Manage your lead scoring criteria and point values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scoringRules?.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{rule.rule_name}</span>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="outline">
                        {rule.score_points} pts
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {rule.field_name} {rule.operator} "{rule.field_value}"
                    </span>
                    {rule.rule_description && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {rule.rule_description}
                      </span>
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
            
            {(!scoringRules || scoringRules.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scoring rules configured</p>
                <p className="text-sm">Create rules to automatically score your leads</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Scoring Rule</DialogTitle>
            <DialogDescription>
              Modify the scoring rule configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_rule_name">Rule Name</Label>
              <Input
                id="edit_rule_name"
                value={formData.rule_name}
                onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_rule_description">Description</Label>
              <Textarea
                id="edit_rule_description"
                value={formData.rule_description}
                onChange={(e) => setFormData({ ...formData, rule_description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_field_name">Field</Label>
              <Select value={formData.field_name} onValueChange={(value) => setFormData({ ...formData, field_name: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_operator">Operator</Label>
              <Select value={formData.operator} onValueChange={(value) => setFormData({ ...formData, operator: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operatorOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_field_value">Value</Label>
              <Input
                id="edit_field_value"
                value={formData.field_value}
                onChange={(e) => setFormData({ ...formData, field_value: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_score_points">Points</Label>
                <Input
                  id="edit_score_points"
                  type="number"
                  value={formData.score_points}
                  onChange={(e) => setFormData({ ...formData, score_points: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit_priority">Priority</Label>
                <Input
                  id="edit_priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit_is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRule} disabled={updateRuleMutation.isPending}>
              Update Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}