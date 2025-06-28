
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DatabaseAdapters } from '@/utils/database-adapters';
import type { WorkflowApproval } from '@/types/unified-crm';

export function WorkflowApprovalDashboard() {
  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ['workflow-approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_approvals')
        .select(`
          *,
          workflow_instances:workflow_instance_id (
            id,
            workflow_name,
            status,
            created_at
          )
        `)
        .limit(50);

      if (error) throw error;
      
      // Transform database results to match our interface
      return data.map(approval => DatabaseAdapters.adaptWorkflowApproval(approval)) as WorkflowApproval[];
    }
  });

  const pendingApprovals = approvals.filter(approval => approval.approval_status === 'pending');
  const completedApprovals = approvals.filter(approval => approval.approval_status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvals.filter(a => a.approval_status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {approvals.filter(a => a.approval_status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading approvals...</div>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No pending approvals</div>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">
                      Workflow Approval - Step {approval.step_number}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      ID: {approval.workflow_instance_id}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {approval.approval_status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Method: {approval.approval_method}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="default">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive">
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
