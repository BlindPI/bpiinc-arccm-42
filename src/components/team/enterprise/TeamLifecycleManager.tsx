
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Archive, 
  RotateCcw, 
  UserX, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw
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
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [transferTargetUser, setTransferTargetUser] = useState('');

  const archiveTeamMutation = useMutation({
    mutationFn: ({ reason }: { reason: string }) =>
      enterpriseTeamService.archiveTeam(teamId, 'current-user-id', reason),
    onSuccess: (result) => {
      if (result === 'completed') {
        toast.success('Team archived successfully');
      } else {
        toast.info('Team archival submitted for approval');
      }
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setShowArchiveModal(false);
    },
    onError: () => {
      toast.error('Failed to archive team');
    }
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: ({ toUserId }: { toUserId: string }) =>
      enterpriseTeamService.transferTeamOwnership(teamId, 'current-user-id', toUserId),
    onSuccess: () => {
      toast.info('Ownership transfer submitted for approval');
      setShowTransferModal(false);
    },
    onError: () => {
      toast.error('Failed to initiate ownership transfer');
    }
  });

  const canArchive = ['OWNER'].includes(currentUserRole);
  const canTransferOwnership = ['OWNER'].includes(currentUserRole);

  const getTeamStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Team Lifecycle Management
        </h3>
        <p className="text-sm text-muted-foreground">
          Manage team status, ownership, and lifecycle operations
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Team Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getTeamStatusColor(teamData?.status || 'active')}>
                  {teamData?.status || 'Active'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Members</p>
                <p className="text-lg font-semibold">{teamData?.member_count || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {teamData?.created_at ? new Date(teamData.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {teamData?.updated_at ? new Date(teamData.updated_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Team Archival */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Team Archival
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Archive this team to preserve data while making it inactive. 
              Archived teams can be restored later if needed.
            </p>
            
            {teamData?.status === 'archived' ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  This team is currently archived. Contact an administrator to restore it.
                </AlertDescription>
              </Alert>
            ) : (
              <Dialog open={showArchiveModal} onOpenChange={setShowArchiveModal}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={!canArchive}
                    className="w-full"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Archive Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Archiving this team will make it inactive and move all members to inactive status. 
                        This action may require approval.
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <Label>Reason for Archival</Label>
                      <Textarea
                        placeholder="Explain why this team is being archived..."
                        value={archiveReason}
                        onChange={(e) => setArchiveReason(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowArchiveModal(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => archiveTeamMutation.mutate({ reason: archiveReason })}
                        disabled={!archiveReason.trim() || archiveTeamMutation.isPending}
                      >
                        Archive Team
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>

        {/* Ownership Transfer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Ownership Transfer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Transfer ownership of this team to another member. 
              The new owner will have full control over the team.
            </p>
            
            <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!canTransferOwnership}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Transfer Ownership
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Transfer Team Ownership</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Transferring ownership will give the new owner full control over this team. 
                      This action requires approval and cannot be easily undone.
                    </AlertDescription>
                  </Alert>
                  
                  <div>
                    <Label>New Owner</Label>
                    <Select value={transferTargetUser} onValueChange={setTransferTargetUser}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select team member to transfer ownership to" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user1">John Doe (Team Lead)</SelectItem>
                        <SelectItem value="user2">Jane Smith (Admin)</SelectItem>
                        <SelectItem value="user3">Bob Johnson (Admin)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowTransferModal(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => transferOwnershipMutation.mutate({ toUserId: transferTargetUser })}
                      disabled={!transferTargetUser || transferOwnershipMutation.isPending}
                    >
                      Transfer Ownership
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Recent Lifecycle Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Lifecycle Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Team created</span>
              <Badge variant="outline">System</Badge>
              <span className="text-muted-foreground ml-auto">
                {teamData?.created_at ? new Date(teamData.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Member added</span>
              <Badge variant="outline">Admin Action</Badge>
              <span className="text-muted-foreground ml-auto">2 days ago</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <RefreshCw className="h-4 w-4 text-purple-500" />
              <span>Settings updated</span>
              <Badge variant="outline">Owner Action</Badge>
              <span className="text-muted-foreground ml-auto">1 week ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Notice */}
      {!canArchive && !canTransferOwnership && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have sufficient permissions to perform lifecycle operations on this team. 
            Contact the team owner or an administrator for assistance.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
