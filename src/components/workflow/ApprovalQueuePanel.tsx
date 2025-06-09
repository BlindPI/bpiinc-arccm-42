
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface ApprovalQueuePanelProps {
  approvals?: any[];
}

export function ApprovalQueuePanel({ approvals = [] }: ApprovalQueuePanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Approval Queue ({approvals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {approvals.length > 0 ? (
            approvals.slice(0, 5).map((approval) => (
              <div key={approval.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">
                    {approval.workflow_instances?.instance_name}
                  </h4>
                  <Badge variant="outline">Step {approval.step_number}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Assigned to: {approval.profiles?.display_name}
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline">
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-4 text-muted-foreground">No pending approvals</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
