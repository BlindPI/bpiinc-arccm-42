
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EnterpriseTeamService } from '@/services/team/enterpriseTeamService';
import { toast } from 'sonner';
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, Users } from 'lucide-react';

interface TeamGovernanceManagerProps {
  teamId?: string;
  userRole: string;
}

export function TeamGovernanceManager({ teamId, userRole }: TeamGovernanceManagerProps) {
  const queryClient = useQueryClient();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data: pendingApprovals = [], isLoading } = useQuery({
    queryKey: ['pending-approvals', teamId],
    queryFn: () => EnterpriseTeamService.getPendingApprovals(teamId)
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => EnterpriseTeamService.approveRequest(requestId, 'current-user-id'),
    onSuccess: () => {
      toast.success('Request approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    },
    onError: () => {
      toast.error('Failed to approve request');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      EnterpriseTeamService.rejectRequest(requestId, 'current-user-id', reason),
    onSuccess: () => {
      toast.success('Request rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      setShowRejectModal(false);
      setRejectionReason('');
    },
    onError: () => {
      toast.error('Failed to reject request');
    }
  });

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'role_change': return <Users className="h-4 w-4" />;
      case 'team_transfer': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case 'role_change': return 'default';
      case 'team_transfer': return 'secondary';
      default: return 'outline';
    }
  };

  const canApproveRequests = ['SA', 'AD', 'OWNER', 'LEAD'].includes(userRole);

  if (!canApproveRequests) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>You don't have permission to manage governance approvals.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Team Governance Manager
          </h2>
          <p className="text-muted-foreground">
            Review and approve team governance requests and role changes
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {pendingApprovals.length} Pending
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending approval requests</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request Type</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingApprovals.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRequestTypeIcon(request.type)}
                        <Badge variant={getRequestTypeBadge(request.type)}>
                          {request.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{request.requestedBy}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {request.type === 'role_change' && request.data && (
                          <span>
                            Change role from {request.data.fromRole} to {request.data.toRole}
                          </span>
                        )}
                        {request.type === 'team_transfer' && request.data && (
                          <span>
                            Transfer team to {request.data.newOwnerId}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(request.id)}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        
                        <Dialog open={showRejectModal && selectedRequest?.id === request.id} onOpenChange={setShowRejectModal}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Request</DialogTitle>
                              <DialogDescription>
                                Please provide a reason for rejecting this request.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Rejection Reason</Label>
                                <Textarea
                                  placeholder="Explain why this request is being rejected..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => rejectMutation.mutate({
                                    requestId: request.id,
                                    reason: rejectionReason
                                  })}
                                  disabled={!rejectionReason.trim() || rejectMutation.isPending}
                                >
                                  Reject Request
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
