
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, Clock, AlertCircle, User, FileText, 
  ArrowRight, MessageSquare, Settings, Bell 
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignee?: string;
  dueDate?: Date;
  requirements?: string[];
  approvers?: string[];
}

interface WorkflowProcess {
  id: string;
  title: string;
  type: 'team_creation' | 'provider_onboarding' | 'location_assignment';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress: number;
  steps: WorkflowStep[];
  currentStep: number;
  createdBy: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

interface WorkflowEngineProps {
  processes: WorkflowProcess[];
  onApprove: (processId: string, stepId: string) => void;
  onReject: (processId: string, stepId: string, reason: string) => void;
  onAssign: (processId: string, stepId: string, assignee: string) => void;
}

export function WorkflowEngine({ processes, onApprove, onReject, onAssign }: WorkflowEngineProps) {
  const [selectedProcess, setSelectedProcess] = useState<WorkflowProcess | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'blocked':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: WorkflowProcess['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Process List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Active Workflows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {processes.map((process) => (
            <div
              key={process.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedProcess?.id === process.id 
                  ? 'border-primary bg-primary/10' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedProcess(process)}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{process.title}</h4>
                <Badge className={getStatusColor(process.status)}>
                  {process.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Progress value={process.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Step {process.currentStep + 1} of {process.steps.length}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Process Details */}
      <Card className="lg:col-span-2">
        {selectedProcess ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedProcess.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Created {selectedProcess.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <Badge className={getStatusColor(selectedProcess.status)}>
                  {selectedProcess.status}
                </Badge>
              </div>
              
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="steps">Steps</TabsTrigger>
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="p-6">
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">{selectedProcess.progress}%</p>
                      <p className="text-sm text-muted-foreground">Complete</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">
                        {selectedProcess.steps.filter(s => s.status === 'completed').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Steps Done</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold">
                        {selectedProcess.steps.filter(s => s.status === 'blocked').length}
                      </p>
                      <p className="text-sm text-muted-foreground">Blocked</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Current Step</h4>
                  <p className="text-blue-800">
                    {selectedProcess.steps[selectedProcess.currentStep]?.title}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="steps" className="space-y-4">
                {selectedProcess.steps.map((step, index) => (
                  <Card key={step.id} className={`${
                    index === selectedProcess.currentStep ? 'border-primary' : ''
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(step.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{step.title}</h4>
                            {step.assignee && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                {step.assignee}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {step.description}
                          </p>
                          
                          {step.requirements && step.requirements.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Requirements:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {step.requirements.map((req, i) => (
                                  <li key={i} className="flex items-center gap-2">
                                    <FileText className="h-3 w-3" />
                                    {req}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {step.status === 'in_progress' && (
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => onApprove(selectedProcess.id, step.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onReject(selectedProcess.id, step.id, 'Rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="approvals">
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Approval management interface</p>
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Workflow history and audit trail</p>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        ) : (
          <CardContent className="p-8 text-center">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Select a Workflow</h3>
            <p className="text-muted-foreground">
              Choose a workflow process to view details and manage approvals
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
