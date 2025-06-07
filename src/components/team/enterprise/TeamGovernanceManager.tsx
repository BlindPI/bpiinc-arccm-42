
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Gavel, 
  Workflow, 
  Clock, 
  Users, 
  Settings,
  Plus,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enterpriseTeamService } from '@/services/team/enterpriseTeamService';
import { toast } from 'sonner';
import type { ApprovalWorkflow, TeamGovernanceRule } from '@/types/enterprise-team-roles';

interface TeamGovernanceManagerProps {
  teamId: string;
  currentUserRole: string;
}

export function TeamGovernanceManager({ teamId, currentUserRole }: TeamGovernanceManagerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('workflows');
  const [showWorkflowDialog, setShowWorkflowDialog] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState<Partial<ApprovalWorkflow>>({
    workflow_name: '',
    trigger_conditions: {},
    approval_steps: [],
    is_active: true
  });

  const { data: workflows = [] } = useQuery({
    queryKey: ['team-workflows', teamId],
    queryFn: () => {
      // Mock data for now
      return [
        {
          id: '1',
          team_id: teamId,
          workflow_name: 'Member Role Changes',
          trigger_conditions: { action: 'role_change', target_roles: ['LEAD', 'OWNER'] },
          approval_steps: [
            { step_order: 1, required_role: 'LEAD', required_permissions: ['modify_member_roles'], approver_count: 1 }
          ],
          is_active: true
        },
        {
          id: '2',
          team_id: teamId,
          workflow_name: 'Budget Approvals',
          trigger_conditions: { action: 'budget_change', amount_threshold: 1000 },
          approval_steps: [
            { step_order: 1, required_role: 'ADMIN', required_permissions: ['approve_expenses'], approver_count: 1 },
            { step_order: 2, required_role: 'OWNER', required_permissions: ['manage_team_budget'], approver_count: 1 }
          ],
          is_active: true
        }
      ];
    }
  });

  const { data: governanceRules = [] } = useQuery({
    queryKey: ['team-governance-rules', teamId],
    queryFn: () => {
      // Mock data for now
      return [
        {
          id: '1',
          team_id: teamId,
          rule_type: 'approval_workflow',
          conditions: { min_approval_count: 2, max_approval_time: 48 },
          actions: { auto_escalate: true, notify_stakeholders: true },
          is_active: true,
          created_by: 'system',
          created_at: new Date().toISOString()
        }
      ];
    }
  });

  const createWorkflowMutation = useMutation({
    mutationFn: (workflow: Omit<ApprovalWorkflow, 'id'>) =>
      enterpriseTeamService.createApprovalWorkflow(workflow),
    onSuccess: () => {
      toast.success('Approval workflow created successfully');
      setShowWorkflowDialog(false);
      setNewWorkflow({ workflow_name: '', trigger_conditions: {}, approval_steps: [], is_active: true });
      queryClient.invalidateQueries(['team-workflows', teamId]);
    },
    onError: (error) => {
      toast.error(`Failed to create workflow: ${error.message}`);
    }
  });

  const handleCreateWorkflow = () => {
    if (!newWorkflow.workflow_name) {
      toast.error('Please enter a workflow name');
      return;
    }

    createWorkflowMutation.mutate({
      team_id: teamId,
      workflow_name: newWorkflow.workflow_name,
      trigger_conditions: newWorkflow.trigger_conditions || {},
      approval_steps: newWorkflow.approval_steps || [],
      is_active: newWorkflow.is_active || true
    });
  };

  const canManageGovernance = ['OWNER', 'LEAD'].includes(currentUserRole);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          Team Governance & Workflows
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="workflows">Approval Workflows</TabsTrigger>
            <TabsTrigger value="rules">Governance Rules</TabsTrigger>
            <TabsTrigger value="delegation">Delegation</TabsTrigger>
          </TabsList>

          <TabsContent value="workflows" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Approval Workflows</h3>
              {canManageGovernance && (
                <Dialog open={showWorkflowDialog} onOpenChange={setShowWorkflowDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Workflow
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Approval Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="workflow-name">Workflow Name</Label>
                        <Input
                          id="workflow-name"
                          value={newWorkflow.workflow_name}
                          onChange={(e) => setNewWorkflow({
                            ...newWorkflow,
                            workflow_name: e.target.value
                          })}
                          placeholder="Enter workflow name"
                        />
                      </div>
                      
                      <div>
                        <Label>Trigger Conditions</Label>
                        <Select onValueChange={(value) => setNewWorkflow({
                          ...newWorkflow,
                          trigger_conditions: { action: value }
                        })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trigger action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="role_change">Role Changes</SelectItem>
                            <SelectItem value="member_add">Add Members</SelectItem>
                            <SelectItem value="member_remove">Remove Members</SelectItem>
                            <SelectItem value="budget_change">Budget Changes</SelectItem>
                            <SelectItem value="team_settings">Team Settings</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={newWorkflow.is_active}
                          onCheckedChange={(checked) => setNewWorkflow({
                            ...newWorkflow,
                            is_active: checked
                          })}
                        />
                        <Label>Active</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          onClick={handleCreateWorkflow}
                          disabled={createWorkflowMutation.isPending}
                        >
                          Create Workflow
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowWorkflowDialog(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Workflow className="h-4 w-4" />
                      <span className="font-medium">{workflow.workflow_name}</span>
                      <Badge variant={workflow.is_active ? "default" : "secondary"}>
                        {workflow.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {workflow.approval_steps.length} step{workflow.approval_steps.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Triggers on: {workflow.trigger_conditions.action}
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-sm font-medium mb-1">Approval Steps:</div>
                    {workflow.approval_steps.map((step, index) => (
                      <div key={index} className="text-sm text-muted-foreground ml-4">
                        Step {step.step_order}: {step.required_role} ({step.approver_count} approver{step.approver_count !== 1 ? 's' : ''})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rules" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Governance Rules</h3>
              {canManageGovernance && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {governanceRules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium capitalize">{rule.rule_type.replace('_', ' ')}</span>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Configuration: {JSON.stringify(rule.conditions)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="delegation" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Permission Delegation</h3>
              {canManageGovernance && (
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Delegate Permission
                </Button>
              )}
            </div>

            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active delegations found.</p>
              <p className="text-sm">Delegate permissions to team members to enable temporary access.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
