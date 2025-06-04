import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { 
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Users,
  Target,
  TestTube,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Save,
  Play,
  UserCheck,
  MapPin,
  Briefcase,
  RotateCcw
} from 'lucide-react';
import { crmSettingsService } from '@/services/crm/crmSettingsService';
import type { AssignmentRule } from '@/types/crm';

// Validation schema
const assignmentRuleSchema = z.object({
  rule_name: z.string().min(1, 'Rule name is required'),
  rule_description: z.string().optional(),
  criteria: z.record(z.any()),
  assignment_type: z.enum(['round_robin', 'territory_based', 'skill_based', 'workload_based']),
  assigned_users: z.array(z.string()).min(1, 'At least one user must be assigned'),
  priority: z.number().min(1, 'Priority must be at least 1'),
  is_active: z.boolean(),
});

type AssignmentRuleFormData = z.infer<typeof assignmentRuleSchema>;

interface AssignmentRulesManagementProps {
  showHeader?: boolean;
}

export function AssignmentRulesManagement({ showHeader = true }: AssignmentRulesManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [criteriaFields, setCriteriaFields] = useState<Array<{key: string, value: string}>>([]);

  const queryClient = useQueryClient();

  const form = useForm<AssignmentRuleFormData>({
    resolver: zodResolver(assignmentRuleSchema),
    defaultValues: {
      is_active: true,
      priority: 1,
      assignment_type: 'round_robin',
      assigned_users: [],
      criteria: {}
    }
  });

  // Mock users data (in real implementation, this would come from user service)
  const availableUsers = [
    { id: 'user-1', name: 'Sarah Johnson', email: 'sarah.johnson@example.com', role: 'Sales Rep' },
    { id: 'user-2', name: 'Mike Chen', email: 'mike.chen@example.com', role: 'Sales Rep' },
    { id: 'user-3', name: 'Emily Rodriguez', email: 'emily.rodriguez@example.com', role: 'Regional Manager' },
    { id: 'user-4', name: 'David Kim', email: 'david.kim@example.com', role: 'Sales Rep' },
    { id: 'user-5', name: 'Lisa Thompson', email: 'lisa.thompson@example.com', role: 'Account Manager' }
  ];

  // Fetch assignment rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['crm', 'assignment-rules'],
    queryFn: async () => {
      const result = await crmSettingsService.getAssignmentRules();
      return result.success ? result.data : [];
    },
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: AssignmentRuleFormData) => {
      // Ensure all required fields are present
      if (!ruleData.rule_name || !ruleData.assignment_type || !ruleData.assigned_users.length || !ruleData.priority) {
        throw new Error('Missing required rule fields');
      }
      
      const result = await crmSettingsService.createAssignmentRule({
        rule_name: ruleData.rule_name,
        rule_description: ruleData.rule_description,
        criteria: ruleData.criteria,
        assignment_type: ruleData.assignment_type,
        assigned_users: ruleData.assigned_users,
        priority: ruleData.priority,
        is_active: ruleData.is_active,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'assignment-rules'] });
      setIsCreateDialogOpen(false);
      setEditingRule(null);
      form.reset();
      setCriteriaFields([]);
    },
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AssignmentRule> }) => {
      const result = await crmSettingsService.updateAssignmentRule(id, updates);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'assignment-rules'] });
      setEditingRule(null);
      form.reset();
      setCriteriaFields([]);
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const result = await crmSettingsService.deleteAssignmentRule(ruleId);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'assignment-rules'] });
    },
  });

  // Test assignment mutation
  const testAssignmentMutation = useMutation({
    mutationFn: async (leadData: Record<string, any>) => {
      const result = await crmSettingsService.testAssignmentRules(leadData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (results) => {
      setTestResults(results);
    },
  });

  const rules = rulesData || [];

  const onSubmit = (data: AssignmentRuleFormData) => {
    // Convert criteria fields to object
    const criteria = criteriaFields.reduce((acc, field) => {
      if (field.key && field.value) {
        acc[field.key] = field.value;
      }
      return acc;
    }, {} as Record<string, any>);

    const ruleData = { ...data, criteria };

    if (editingRule) {
      updateRuleMutation.mutate({
        id: editingRule.id,
        updates: ruleData
      });
    } else {
      createRuleMutation.mutate(ruleData);
    }
  };

  const handleEdit = (rule: AssignmentRule) => {
    setEditingRule(rule);
    
    // Convert criteria object to fields array
    const fields = Object.entries(rule.criteria || {}).map(([key, value]) => ({
      key,
      value: String(value)
    }));
    setCriteriaFields(fields);

    form.reset({
      rule_name: rule.rule_name,
      rule_description: rule.rule_description || '',
      assignment_type: rule.assignment_type,
      assigned_users: rule.assigned_users,
      priority: rule.priority,
      is_active: rule.is_active,
      criteria: rule.criteria
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this assignment rule? This action cannot be undone.')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const handleTestAssignment = () => {
    testAssignmentMutation.mutate(testData);
  };

  const addCriteriaField = () => {
    setCriteriaFields([...criteriaFields, { key: '', value: '' }]);
  };

  const updateCriteriaField = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...criteriaFields];
    newFields[index][field] = value;
    setCriteriaFields(newFields);
  };

  const removeCriteriaField = (index: number) => {
    setCriteriaFields(criteriaFields.filter((_, i) => i !== index));
  };

  const getAssignmentTypeLabel = (type: string) => {
    const labels = {
      round_robin: 'Round Robin',
      territory_based: 'Territory Based',
      skill_based: 'Skill Based',
      workload_based: 'Workload Based'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAssignmentTypeIcon = (type: string) => {
    const icons = {
      round_robin: RotateCcw,
      territory_based: MapPin,
      skill_based: Briefcase,
      workload_based: Users
    };
    const Icon = icons[type as keyof typeof icons] || Users;
    return <Icon className="h-4 w-4" />;
  };

  const getRuleStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  // Available criteria fields
  const availableCriteriaFields = [
    { value: 'lead_type', label: 'Lead Type' },
    { value: 'lead_source', label: 'Lead Source' },
    { value: 'province', label: 'Province' },
    { value: 'industry', label: 'Industry' },
    { value: 'company_size', label: 'Company Size' },
    { value: 'training_urgency', label: 'Training Urgency' },
    { value: 'estimated_participant_count', label: 'Participant Count' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assignment Rules Management</h2>
            <p className="text-gray-600">Configure rules to automatically assign leads to sales representatives</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Test Assignment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Test Lead Assignment</DialogTitle>
                  <DialogDescription>
                    Enter lead data to test which assignment rule would apply
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Lead Type</Label>
                      <Select onValueChange={(value) => setTestData({...testData, lead_type: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="potential_ap">Potential AP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Province</Label>
                      <Select onValueChange={(value) => setTestData({...testData, province: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ON">Ontario</SelectItem>
                          <SelectItem value="BC">British Columbia</SelectItem>
                          <SelectItem value="AB">Alberta</SelectItem>
                          <SelectItem value="QC">Quebec</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Industry</Label>
                      <Input 
                        placeholder="e.g., Construction"
                        onChange={(e) => setTestData({...testData, industry: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Lead Source</Label>
                      <Input 
                        placeholder="e.g., Website"
                        onChange={(e) => setTestData({...testData, lead_source: e.target.value})}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleTestAssignment}
                    disabled={testAssignmentMutation.isPending}
                    className="w-full"
                  >
                    {testAssignmentMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Test
                      </>
                    )}
                  </Button>

                  {testResults && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-3">Test Results</h4>
                      <div className="space-y-3">
                        {testResults.assigned_user ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-blue-800">Assigned to:</span>
                              <span className="font-bold text-blue-900">
                                {availableUsers.find(u => u.id === testResults.assigned_user)?.name || testResults.assigned_user}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-blue-800">Matched Rule:</span>
                              <span className="font-medium text-blue-900">{testResults.matched_rule}</span>
                            </div>
                            <div className="text-sm text-blue-700">
                              <strong>Reason:</strong> {testResults.reason}
                            </div>
                          </>
                        ) : (
                          <div className="text-orange-700">
                            <strong>No assignment:</strong> {testResults.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Assignment Rule' : 'Create New Assignment Rule'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRule 
                      ? 'Update the assignment rule details and criteria'
                      : 'Add a new rule to automatically assign leads to sales reps'
                    }
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="rule_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rule Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter rule name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="1" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormDescription>
                              Lower numbers = higher priority
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="rule_description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe when this rule should apply..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="assignment_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assignment Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select assignment type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="round_robin">Round Robin</SelectItem>
                              <SelectItem value="territory_based">Territory Based</SelectItem>
                              <SelectItem value="skill_based">Skill Based</SelectItem>
                              <SelectItem value="workload_based">Workload Based</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How leads should be distributed among assigned users
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Criteria Configuration */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Assignment Criteria</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addCriteriaField}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Criteria
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        Define conditions that must be met for this rule to apply
                      </p>
                      
                      {criteriaFields.map((field, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Select 
                            value={field.key} 
                            onValueChange={(value) => updateCriteriaField(index, 'key', value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select field" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableCriteriaFields.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-gray-500">equals</span>
                          <Input 
                            placeholder="Enter value"
                            value={field.value}
                            onChange={(e) => updateCriteriaField(index, 'value', e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeCriteriaField(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {criteriaFields.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500">No criteria defined. This rule will apply to all leads.</p>
                        </div>
                      )}
                    </div>

                    {/* User Assignment */}
                    <FormField
                      control={form.control}
                      name="assigned_users"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned Users *</FormLabel>
                          <FormDescription>
                            Select users who should receive leads when this rule matches
                          </FormDescription>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            {availableUsers.map((user) => (
                              <div key={user.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`user-${user.id}`}
                                  checked={field.value?.includes(user.id)}
                                  onCheckedChange={(checked) => {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, user.id]);
                                    } else {
                                      field.onChange(current.filter(id => id !== user.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={`user-${user.id}`} className="flex-1">
                                  <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.role}</p>
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Rule</FormLabel>
                            <FormDescription>
                              Enable this rule for automatic lead assignment
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          setEditingRule(null);
                          form.reset();
                          setCriteriaFields([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                      >
                        {createRuleMutation.isPending || updateRuleMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            {editingRule ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingRule ? 'Update Rule' : 'Create Rule'}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* Assignment Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assignment Rules
          </CardTitle>
          <CardDescription>
            Configure rules that automatically assign leads to sales representatives based on criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Assignment Type</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Assigned Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules
                .sort((a, b) => a.priority - b.priority)
                .map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <Badge variant="outline">{rule.priority}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAssignmentTypeIcon(rule.assignment_type)}
                        <span className="text-sm">{getAssignmentTypeLabel(rule.assignment_type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {Object.entries(rule.criteria || {}).length > 0 ? (
                          Object.entries(rule.criteria).map(([key, value]) => (
                            <div key={key} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {key} = {String(value)}
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No criteria</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {rule.assigned_users.slice(0, 2).map((userId) => {
                          const user = availableUsers.find(u => u.id === userId);
                          return user ? (
                            <div key={userId} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {user.name}
                            </div>
                          ) : null;
                        })}
                        {rule.assigned_users.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{rule.assigned_users.length - 2} more
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRuleStatusColor(rule.is_active)}>
                        {rule.is_active ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(rule)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(rule.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {rules.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignment rules configured</h3>
              <p className="text-gray-600 mb-4">
                Create your first rule to start automatically assigning leads
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Rule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Assignment Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Rule Configuration Tips</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Order rules by priority (most specific first)</li>
                <li>• Use territory-based assignment for geographic coverage</li>
                <li>• Implement workload balancing for fair distribution</li>
                <li>• Test rules regularly with sample data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Assignment Types</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Round Robin:</strong> Equal distribution among users</li>
                <li>• <strong>Territory:</strong> Based on geographic location</li>
                <li>• <strong>Skill:</strong> Match expertise to lead requirements</li>
                <li>• <strong>Workload:</strong> Balance based on current assignments</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}