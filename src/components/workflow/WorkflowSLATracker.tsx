
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, TrendingUp, Target } from 'lucide-react';
import type { WorkflowInstance } from '@/types/governance';

interface WorkflowSLATrackerProps {
  workflows: WorkflowInstance[];
  isLoading: boolean;
}

export function WorkflowSLATracker({ workflows, isLoading }: WorkflowSLATrackerProps) {
  const calculateSLAStatus = (workflow: WorkflowInstance) => {
    if (!workflow.sla_deadline) return null;
    
    const deadline = new Date(workflow.sla_deadline);
    const initiated = new Date(workflow.initiated_at);
    const now = new Date();
    
    const totalDuration = deadline.getTime() - initiated.getTime();
    const elapsed = now.getTime() - initiated.getTime();
    const remaining = deadline.getTime() - now.getTime();
    
    const percentageElapsed = Math.min((elapsed / totalDuration) * 100, 100);
    const hoursRemaining = remaining / (1000 * 60 * 60);
    
    let status: 'on-track' | 'at-risk' | 'breach' | 'completed' = 'on-track';
    
    if (workflow.workflow_status === 'approved' || workflow.workflow_status === 'rejected') {
      status = 'completed';
    } else if (hoursRemaining < 0) {
      status = 'breach';
    } else if (hoursRemaining < 24 || percentageElapsed > 80) {
      status = 'at-risk';
    }
    
    return {
      percentageElapsed,
      hoursRemaining: Math.max(0, hoursRemaining),
      status,
      deadline: deadline.toLocaleString(),
      isOverdue: hoursRemaining < 0
    };
  };

  const workflowsWithSLA = workflows.filter(w => w.sla_deadline);
  const slaBreaches = workflowsWithSLA.filter(w => {
    const sla = calculateSLAStatus(w);
    return sla?.status === 'breach';
  });
  const atRiskWorkflows = workflowsWithSLA.filter(w => {
    const sla = calculateSLAStatus(w);
    return sla?.status === 'at-risk';
  });

  const getSLABadgeColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-100 text-green-800';
      case 'at-risk': return 'bg-yellow-100 text-yellow-800';
      case 'breach': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSLAIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <Target className="h-4 w-4 text-green-600" />;
      case 'at-risk': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'breach': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'completed': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
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
      {/* SLA Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">On Track</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {workflowsWithSLA.filter(w => calculateSLAStatus(w)?.status === 'on-track').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">At Risk</span>
            </div>
            <p className="text-2xl font-bold mt-1">{atRiskWorkflows.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">SLA Breach</span>
            </div>
            <p className="text-2xl font-bold mt-1">{slaBreaches.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {workflowsWithSLA.filter(w => calculateSLAStatus(w)?.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed SLA Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>SLA Status Details</CardTitle>
        </CardHeader>
        <CardContent>
          {workflowsWithSLA.length > 0 ? (
            <div className="space-y-4">
              {workflowsWithSLA.map((workflow) => {
                const sla = calculateSLAStatus(workflow);
                if (!sla) return null;

                return (
                  <div key={workflow.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getSLAIcon(sla.status)}
                        <div>
                          <h4 className="font-medium">{workflow.instance_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {workflow.entity_type} • Step {workflow.current_step}
                          </p>
                        </div>
                      </div>
                      
                      <Badge className={getSLABadgeColor(sla.status)}>
                        {sla.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    {/* SLA Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>SLA Progress</span>
                        <span>{Math.round(sla.percentageElapsed)}% elapsed</span>
                      </div>
                      <Progress 
                        value={sla.percentageElapsed} 
                        className={`h-2 ${
                          sla.status === 'breach' ? 'bg-red-100' :
                          sla.status === 'at-risk' ? 'bg-yellow-100' :
                          'bg-green-100'
                        }`}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Initiated: {new Date(workflow.initiated_at).toLocaleDateString()}</span>
                        <span>Deadline: {new Date(sla.deadline).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Time Remaining */}
                    <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                      {sla.isOverdue ? (
                        <span className="text-red-600 font-medium">
                          Overdue by {Math.abs(sla.hoursRemaining).toFixed(1)} hours
                        </span>
                      ) : (
                        <span>
                          Time remaining: {sla.hoursRemaining.toFixed(1)} hours
                        </span>
                      )}
                    </div>

                    {/* Escalation Info */}
                    {workflow.escalation_count > 0 && (
                      <div className="mt-2 text-xs text-orange-600">
                        Escalated {workflow.escalation_count} time(s)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No workflows with SLA tracking</p>
              <p className="text-sm">SLA monitoring will appear here when workflows have deadlines</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
