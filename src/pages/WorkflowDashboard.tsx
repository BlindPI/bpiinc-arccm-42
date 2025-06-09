
import React from 'react';
import { WorkflowExecutionDashboard } from '@/components/workflow/WorkflowExecutionDashboard';

export default function WorkflowDashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Workflow Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage workflow execution, approvals, and SLA tracking
        </p>
      </div>
      
      <WorkflowExecutionDashboard />
    </div>
  );
}
