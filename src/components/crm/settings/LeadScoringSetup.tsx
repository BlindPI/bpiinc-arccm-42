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
  Calculator,
  Target,
  TestTube,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Save,
  Play,
  TrendingUp
} from 'lucide-react';
import { crmSettingsService } from '@/services/crm/crmSettingsService';
import type { LeadScoringRule } from '@/types/crm';

// Validation schema
const leadScoringRuleSchema = z.object({
  rule_name: z.string().min(1, 'Rule name is required'),
  rule_description: z.string().optional(),
  field_name: z.string().min(1, 'Field name is required'),
  operator: z.enum(['equals', 'contains', 'greater_than', 'less_than', 'in_range']),
  field_value: z.string().min(1, 'Field value is required'),
  score_points: z.number().min(-100).max(100, 'Score points must be between -100 and 100'),
  priority: z.number().min(1, 'Priority must be at least 1'),
  is_active: z.boolean(),
});

type LeadScoringRuleFormData = z.infer<typeof leadScoringRuleSchema>;

interface LeadScoringSetupProps {
  showHeader?: boolean;
}

export function LeadScoringSetup({ showHeader = true }: LeadScoringSetupProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<LeadScoringRule | null>(null);
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [testResults, setTestResults] = useState<any>(null);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const form = useForm<LeadScoringRuleFormData>({
    resolver: zodResolver(leadScoringRuleSchema),
    defaultValues: {
      is_active: true,
      priority: 1,
      score_points: 10,
      operator: 'equals'
    }
  });

  // Fetch lead scoring rules
  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['crm', 'lead-scoring-rules'],
    queryFn: async () => {
      const result = await crmSettingsService.getLeadScoringRules();
      return result.success ? result.data : [];
    },
  });

  // Create rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: LeadScoringRuleFormData) => {
      const result = await crmSettingsService.createLeadScoringRule(ruleData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'lead-scoring-rules'] });
      setIsCreateDialogOpen(false);
      setEditingRule(null);
      form.reset();
    },
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<LeadScoringRule> }) => {
      const result = await crmSettingsService.updateLeadScoringRule(id, updates);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'lead-scoring-rules'] });
      setEditingRule(null);
      form.reset();
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const result = await crmSettingsService.deleteLeadScoringRule(ruleId);
      if (!result.success) {
        throw new Error(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'lead-scoring-rules'] });
    },
  });

  // Test scoring mutation
  const testScoringMutation = useMutation({
    mutationFn: async (leadData: Record<string, any>) => {
      const result = await crmSettingsService.testLeadScoring(leadData);
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

  const onSubmit = (data: LeadScoringRuleFormData) => {
    if (editingRule) {
      updateRuleMutation.mutate({
        id: editingRule.id,
        updates: data
      });
    } else {
      createRuleMutation.mutate(data);
    }
  };

  const handleEdit = (rule: LeadScoringRule) => {
    setEditingRule(rule);
    form.reset({
      rule_name: rule.rule_name,
      rule_description: rule.rule_description || '',
      field_name: rule.field_name,
      operator: rule.operator,
      field_value: rule.field_value,
      score_points: rule.score_points,
      priority: rule.priority,
      is_active: rule.is_active
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this scoring rule? This action cannot be undone.')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const handleTestScoring = () => {
    testScoringMutation.mutate(testData);
  };

  const getOperatorLabel = (operator: string) => {
    const labels = {
      equals: 'Equals',
      contains: 'Contains',
      greater_than: 'Greater Than',
      less_than: 'Less Than',
      in_range: 'In Range'
    };
    return labels[operator as keyof typeof labels] || operator;
  };

  const getRuleStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getScoreColor = (points: number) => {
    if (points > 0) return 'text-green-600';
    if (points < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  // Available fields for scoring
  const availableFields = [
    { value: 'lead_type', label: 'Lead Type' },
    { value: 'lead_source', label: 'Lead Source' },
    { value: 'company_size', label: 'Company Size' },
    { value: 'industry', label: 'Industry' },
    { value: 'training_urgency', label: 'Training Urgency' },
    { value: 'estimated_participant_count', label: 'Participant Count' },
    { value: 'budget_range', label: 'Budget Range' },
    { value: 'province', label: 'Province' },
    { value: 'job_title', label: 'Job Title' }
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
            <h2 className="text-2xl font-bold text-gray-900">Lead Scoring Setup</h2>
            <p className="text-gray-600">Configure rules to automatically score leads based on their attributes</p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Test Scoring
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Test Lead Scoring</DialogTitle>
                  <DialogDescription>
                    Enter lead data to test how your scoring rules would apply
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
                      <Label>Industry</Label>
                      <Input 
                        placeholder="e.g., Construction"
                        onChange={(e) => setTestData({...testData, industry: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Company Size</Label>
                      <Select onValueChange={(value) => setTestData({...testData, company_size: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10</SelectItem>
                          <SelectItem value="11-50">11-50</SelectItem>
                          <SelectItem value="51-200">51-200</SelectItem>
                          <SelectItem value="201-500">201-500</SelectItem>
                          <SelectItem value="500+">500+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Training Urgency</Label>
                      <Select onValueChange={(value) => setTestData({...testData, training_urgency: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="within_month">Within Month</SelectItem>
                          <SelectItem value="within_quarter">Within Quarter</SelectItem>
                          <SelectItem value="planning">Planning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleTestScoring}
                    disabled={testScoringMutation.isPending}
                    className="w-full"
                  >
                    {testScoringMutation.isPending ? (
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
                        <div className="flex items-center justify-between">
                          <span className="text-blue-800">Total Score:</span>
                          <span className="font-bold text-blue-900 text-lg">{testResults.total_score}</span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-blue-800">Applied Rules:</p>
                          {testResults.applied_rules.map((rule: any, index: number) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <span className="text-blue-700">{rule.rule_name}</span>
                              <span className={`font-medium ${getScoreColor(rule.points)}`}>
                                {rule.points > 0 ? '+' : ''}{rule.points}
                              </span>
                            </div>
                          ))}
                        </div>
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
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Scoring Rule' : 'Create New Scoring Rule'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingRule 
                      ? 'Update the lead scoring rule details'
                      : 'Add a new rule to automatically score leads'
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
                              placeholder="Describe what this rule evaluates..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="field_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Field to Evaluate *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select field" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableFields.map((fieldOption) => (
                                  <SelectItem key={fieldOption.value} value={fieldOption.value}>
                                    {fieldOption.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="operator"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Operator *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select operator" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="greater_than">Greater Than</SelectItem>
                                <SelectItem value="less_than">Less Than</SelectItem>
                                <SelectItem value="in_range">In Range</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="field_value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter value to match" {...field} />
                            </FormControl>
                            <FormDescription>
                              For ranges, use "min,max" format
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="score_points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Score Points *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="-100" 
                              max="100" 
                              placeholder="10" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Points to add (positive) or subtract (negative) when rule matches
                          </FormDescription>
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
                              Enable this rule for lead scoring calculations
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

      {/* Scoring Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Lead Scoring Rules
          </CardTitle>
          <CardDescription>
            Configure rules that automatically assign scores to leads based on their attributes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Priority</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Points</TableHead>
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
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {rule.field_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="text-gray-600">{getOperatorLabel(rule.operator)}</span>
                        <span className="ml-1 font-medium">"{rule.field_value}"</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-bold ${getScoreColor(rule.score_points)}`}>
                        {rule.score_points > 0 ? '+' : ''}{rule.score_points}
                      </span>
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
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No scoring rules configured</h3>
              <p className="text-gray-600 mb-4">
                Create your first rule to start automatically scoring leads
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Rule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scoring Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Lead Scoring Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Scoring Guidelines</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Use positive scores for desirable attributes</li>
                <li>• Use negative scores for undesirable traits</li>
                <li>• Keep total possible score under 100</li>
                <li>• Prioritize rules by business impact</li>
                <li>• Test rules regularly with real data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recommended Point Values</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• High urgency training: +20 points</li>
                <li>• Large company size: +15 points</li>
                <li>• High-value industry: +10 points</li>
                <li>• Complete contact info: +5 points</li>
                <li>• Low budget/urgency: -10 points</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}