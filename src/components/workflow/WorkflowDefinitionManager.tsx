
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WorkflowAutomationService } from '@/services/governance/workflowAutomationService';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  FileText,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import type { WorkflowDefinition } from '@/types/governance';

export function WorkflowDefinitionManager() {
  const queryClient = useQueryClient();
  const [selectedDefinition, setSelectedDefinition] = useState<WorkflowDefinition | null>(null);

  const { data: definitions = [], isLoading } = useQuery({
    queryKey: ['workflow-definitions'],
    queryFn: () => WorkflowAutomationService.getWorkflowDefinitions()
  });

  const createDefinitionMutation = useMutation({
    mutationFn: (definition: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at'>) =>
      WorkflowAutomationService.createWorkflowDefinition(definition),
    onSuccess: () => {
      toast.success('Workflow definition created successfully');
      queryClient.invalidateQueries({ queryKey: ['workflow-definitions'] });
    },
    onError: (error) => {
      toast.error(`Failed to create workflow definition: ${error.message}`);
    }
  });

  const sampleDefinitions = [
    {
      workflow_name: 'Team Creation Approval',
      workflow_type: 'team_creation',
      description: 'Approval process for creating new teams',
      workflow_steps: {
        step1: { approver_role: 'SA', required: true },
        step2: { approver_role: 'AD', required: false }
      },
      conditional_routing: {},
      escalation_rules: { timeout_hours: 48 },
      sla_config: { default_hours: 72 },
      is_active: true,
      version: 1
    },
    {
      workflow_name: 'Member Role Change',
      workflow_type: 'role_change',
      description: 'Approval process for changing member roles',
      workflow_steps: {
        step1: { approver_role: 'ADMIN', required: true }
      },
      conditional_routing: {},
      escalation_rules: { timeout_hours: 24 },
      sla_config: { default_hours: 48 },
      is_active: true,
      version: 1
    }
  ];

  const handleCreateSampleDefinition = (sample: any) => {
    createDefinitionMutation.mutate(sample);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Definitions</h2>
          <p className="text-muted-foreground">Manage workflow templates and approval processes</p>
        </div>
        <Button onClick={() => {}} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Definition
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Definitions List */}
        <Card>
          <CardHeader>
            <CardTitle>Available Definitions ({definitions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {definitions.length > 0 ? (
              <div className="space-y-4">
                {definitions.map((definition) => (
                  <div 
                    key={definition.id} 
                    className={`border rounded-lg p-4 cursor-pointer hover:bg-muted/50 ${
                      selectedDefinition?.id === definition.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setSelectedDefinition(definition)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4 text-blue-600" />
                        <div>
                          <h4 className="font-medium">{definition.workflow_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {definition.workflow_type} • v{definition.version}
                          </p>
                          {definition.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {definition.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={definition.is_active ? "default" : "secondary"}>
                          {definition.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No workflow definitions found</p>
                <p className="text-sm">Create your first workflow definition below</p>
                
                <div className="mt-6 space-y-2">
                  <p className="text-sm font-medium">Quick Start Templates:</p>
                  {sampleDefinitions.map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateSampleDefinition(sample)}
                      disabled={createDefinitionMutation.isPending}
                      className="w-full"
                    >
                      Create "{sample.workflow_name}"
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Definition Details */}
        <Card>
          <CardHeader>
            <CardTitle>Definition Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDefinition ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">{selectedDefinition.workflow_name}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Type:</span>
                      <p>{selectedDefinition.workflow_type}</p>
                    </div>
                    <div>
                      <span className="font-medium">Version:</span>
                      <p>v{selectedDefinition.version}</p>
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge variant={selectedDefinition.is_active ? "default" : "secondary"}>
                        {selectedDefinition.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <p>{new Date(selectedDefinition.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {selectedDefinition.description && (
                  <div>
                    <span className="font-medium text-sm">Description:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedDefinition.description}
                    </p>
                  </div>
                )}

                <div>
                  <span className="font-medium text-sm">Workflow Steps:</span>
                  <div className="mt-2 p-3 bg-muted rounded text-sm">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(selectedDefinition.workflow_steps, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-sm">SLA Configuration:</span>
                  <div className="mt-2 p-3 bg-muted rounded text-sm">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(selectedDefinition.sla_config, null, 2)}
                    </pre>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-sm">Escalation Rules:</span>
                  <div className="mt-2 p-3 bg-muted rounded text-sm">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(selectedDefinition.escalation_rules, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant={selectedDefinition.is_active ? "secondary" : "default"}
                    size="sm"
                  >
                    {selectedDefinition.is_active ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a definition to view details</p>
                <p className="text-sm">Choose from the definitions list</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
