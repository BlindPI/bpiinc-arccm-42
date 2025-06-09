
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { CRMService } from '@/services/crm/crmService';
import { safeAssignmentType } from '@/types/supabase-schema';
import type { AssignmentRule } from '@/types/crm';
import { toast } from 'sonner';
import { Column } from '@/components/ui/data-table';

export const AssignmentRulesManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    rule_description: '',
    assignment_type: 'round_robin' as const,
    assigned_user_id: '',
    priority: 1,
    is_active: true
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['assignment-rules'],
    queryFn: () => CRMService.getAssignmentRules()
  });

  const createRuleMutation = useMutation({
    mutationFn: CRMService.createAssignmentRule,
    onSuccess: () => {
      toast.success('Assignment rule created successfully!');
      queryClient.invalidateQueries({ queryKey: ['assignment-rules'] });
      setIsCreating(false);
      setFormData({
        rule_name: '',
        rule_description: '',
        assignment_type: 'round_robin',
        assigned_user_id: '',
        priority: 1,
        is_active: true
      });
    },
    onError: () => {
      toast.error('Failed to create assignment rule');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use safeAssignmentType to ensure valid type
    const safeType = safeAssignmentType(formData.assignment_type);
    
    const ruleData = {
      rule_name: formData.rule_name,
      rule_description: formData.rule_description,
      criteria: {},
      assignment_type: safeType,
      assigned_user_id: formData.assigned_user_id,
      is_active: formData.is_active,
      priority: formData.priority,
      working_hours: {},
      escalation_rules: {},
      automation_enabled: true
    };
    
    createRuleMutation.mutate(ruleData);
  };

  const columns: Column<AssignmentRule>[] = [
    {
      accessorKey: 'rule_name',
      header: 'Rule Name',
    },
    {
      accessorKey: 'assignment_type',
      header: 'Type',
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <span className={row.original.is_active ? 'text-green-600' : 'text-red-600'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assignment Rules</h2>
          <p className="text-muted-foreground">Manage lead assignment automation rules</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          Create Rule
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create Assignment Rule</CardTitle>
            <CardDescription>Define how leads should be automatically assigned</CardDescription>
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
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="assignment_type">Assignment Type</Label>
                  <Select
                    value={formData.assignment_type}
                    onValueChange={(value) => setFormData({ ...formData, assignment_type: safeAssignmentType(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="load_based">Load Based</SelectItem>
                      <SelectItem value="territory">Territory</SelectItem>
                      <SelectItem value="skills">Skills Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="rule_description">Description</Label>
                <Input
                  id="rule_description"
                  value={formData.rule_description}
                  onChange={(e) => setFormData({ ...formData, rule_description: e.target.value })}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createRuleMutation.isPending}>
                  {createRuleMutation.isPending ? 'Creating...' : 'Create Rule'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assignment Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={rules}
            loading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
};
