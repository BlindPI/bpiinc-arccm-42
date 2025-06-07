
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Archive, 
  RefreshCw, 
  UserCheck, 
  AlertTriangle, 
  Calendar,
  Users,
  Settings,
  Clock
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { enterpriseTeamService } from '@/services/team/enterpriseTeamService';
import { toast } from 'sonner';

interface TeamLifecycleManagerProps {
  teamId: string;
  teamData: any;
  currentUserRole: string;
}

export function TeamLifecycleManager({ 
  teamId, 
  teamData, 
  currentUserRole 
}: TeamLifecycleManagerProps) {
  const queryClient = useQueryClient();
  const [archivalReason, setArchivalReason] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const archiveTeamMutation = useMutation({
    mutationFn: (reason: string) => 
      enterpriseTeamService.archiveTeam(teamId, 'current-user-id', reason),
    onSuccess: (result) => {
      if (result === 'completed') {
        toast.success('Team archived successfully');
      } else {
        toast.success('Team archival request submitted for approval');
      }
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-approvals', teamId] });
    },
    onError: (error) => {
      toast.error(`Failed to archive team: ${error.message}`);
    }
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: ({ toUserId }: { toUserId: string }) =>
      enterpriseTeamService.transferTeamOwnership(teamId, 'current-user-id', toUserId),
    onSuccess: () => {
      toast.success('Ownership transfer request submitted for approval');
      queryClient.invalidateQueries({ queryKey: ['team-approvals', teamId] });
      setNewOwnerId('');
      setTransferReason('');
    },
    onError: (error) => {
      toast.error(`Failed to transfer ownership: ${error.message}`);
    }
  });

  const handleArchiveTeam = () => {
    if (!archivalReason.trim()) {
      toast.error('Please provide a reason for archiving the team');
      return;
    }
    archiveTeamMutation.mutate(archivalReason);
  };

  const handleTransferOwnership = () => {
    if (!newOwnerId) {
      toast.error('Please select a new owner');
      return;
    }
    transferOwnershipMutation.mutate({ toUserId: newOwnerId });
  };

  const canArchiveTeam = ['OWNER', 'LEAD'].includes(currentUserRole);
  const canTransferOwnership = currentUserRole === 'OWNER';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Team Lifecycle Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getStatusBadge(teamData?.status || 'active')}
              </div>
              <p className="text-sm text-muted-foreground">Current Status</p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="font-medium">{new Date(teamData?.created_at).toLocaleDateString()}</p>
              <p className="text-sm text-muted-foreground">Created</p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="font-medium">{teamData?.member_count || 0}</p>
              <p className="text-sm text-muted-foreground">Members</p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-purple-500" />
              <p className="font-medium">{new Date(teamData?.updated_at).toLocaleDateString()}</p>
              <p className="text-sm text-muted-foreground">Last Updated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Team Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Archive Team */}
            {canArchiveTeam && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Archive Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        Archiving will make this team inactive. This action may require approval.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="archival-reason">Reason for Archival</Label>
                      <Textarea
                        id="archival-reason"
                        value={archivalReason}
                        onChange={(e) => setArchivalReason(e.target.value)}
                        placeholder="Please provide a reason for archiving this team..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleArchiveTeam}
                        disabled={archiveTeamMutation.isPending}
                        variant="destructive"
                      >
                        Archive Team
                      </Button>
                      <Button variant="outline">Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Transfer Ownership */}
            {canTransferOwnership && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Transfer Ownership
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Transfer Team Ownership</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                      <p className="text-sm text-blue-800">
                        This will transfer full ownership of the team to another member.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="new-owner">New Owner</Label>
                      <Select value={newOwnerId} onValueChange={setNewOwnerId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select new owner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {/* This would be populated with eligible team members */}
                          <SelectItem value="user-1">John Doe (LEAD)</SelectItem>
                          <SelectItem value="user-2">Jane Smith (ADMIN)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="transfer-reason">Reason for Transfer</Label>
                      <Textarea
                        id="transfer-reason"
                        value={transferReason}
                        onChange={(e) => setTransferReason(e.target.value)}
                        placeholder="Please provide a reason for transferring ownership..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleTransferOwnership}
                        disabled={transferOwnershipMutation.isPending}
                      >
                        Transfer Ownership
                      </Button>
                      <Button variant="outline">Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Reactivate Team (if archived) */}
            {teamData?.status === 'inactive' && canArchiveTeam && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reactivate Team
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reactivate Team</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will restore the team to active status. Are you sure you want to continue?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => toast.success('Team reactivated successfully')}>
                      Reactivate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
