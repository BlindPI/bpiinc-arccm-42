
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamLifecycleService } from '@/services/team/teamLifecycleService';
import { toast } from 'sonner';
import { Archive, GitMerge, GitBranch, ArrowRight, History } from 'lucide-react';
import type { Team } from '@/types/team-management';

interface TeamLifecycleManagerProps {
  team: Team;
  currentUserRole: string;
}

export function TeamLifecycleManager({ team, currentUserRole }: TeamLifecycleManagerProps) {
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [transferUserId, setTransferUserId] = useState('');
  const queryClient = useQueryClient();

  // Get lifecycle events
  const { data: lifecycleEvents = [] } = useQuery({
    queryKey: ['team-lifecycle-events', team.id],
    queryFn: () => teamLifecycleService.getLifecycleEvents(team.id)
  });

  // Archive team mutation
  const archiveTeamMutation = useMutation({
    mutationFn: () => teamLifecycleService.archiveTeam(team.id, archiveReason, 'current-user-id'),
    onSuccess: () => {
      toast.success('Team archived successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      setActiveOperation(null);
      setArchiveReason('');
    },
    onError: (error) => {
      toast.error(`Failed to archive team: ${error.message}`);
    }
  });

  // Split team mutation
  const splitTeamMutation = useMutation({
    mutationFn: () => teamLifecycleService.splitTeam(
      team.id,
      {
        name: newTeamName,
        description: newTeamDescription,
        location_id: team.location_id
      },
      [], // Would need member selection UI
      'current-user-id'
    ),
    onSuccess: () => {
      toast.success('Team split successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      setActiveOperation(null);
      setNewTeamName('');
      setNewTeamDescription('');
    },
    onError: (error) => {
      toast.error(`Failed to split team: ${error.message}`);
    }
  });

  // Transfer team mutation
  const transferTeamMutation = useMutation({
    mutationFn: () => teamLifecycleService.transferTeam(team.id, transferUserId, 'current-user-id'),
    onSuccess: () => {
      toast.success('Team transferred successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      setActiveOperation(null);
      setTransferUserId('');
    },
    onError: (error) => {
      toast.error(`Failed to transfer team: ${error.message}`);
    }
  });

  const canManageLifecycle = ['SA', 'AD', 'ADMIN'].includes(currentUserRole);

  if (!canManageLifecycle) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>You don't have permission to manage team lifecycle.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lifecycle Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Team Lifecycle Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Archive Team */}
          {activeOperation === 'archive' ? (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium text-red-800">Archive Team</h4>
              <div className="space-y-2">
                <Label>Reason for archiving</Label>
                <Textarea
                  placeholder="Explain why this team is being archived..."
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => archiveTeamMutation.mutate()}
                  disabled={!archiveReason.trim() || archiveTeamMutation.isPending}
                >
                  {archiveTeamMutation.isPending ? 'Archiving...' : 'Confirm Archive'}
                </Button>
                <Button variant="outline" onClick={() => setActiveOperation(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setActiveOperation('archive')}
              className="w-full justify-start"
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive Team
            </Button>
          )}

          {/* Split Team */}
          {activeOperation === 'split' ? (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Split Team</h4>
              <div className="space-y-2">
                <Label>New Team Name</Label>
                <Input
                  placeholder="Enter new team name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the new team..."
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => splitTeamMutation.mutate()}
                  disabled={!newTeamName.trim() || splitTeamMutation.isPending}
                >
                  {splitTeamMutation.isPending ? 'Splitting...' : 'Create Split Team'}
                </Button>
                <Button variant="outline" onClick={() => setActiveOperation(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setActiveOperation('split')}
              className="w-full justify-start"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              Split Team
            </Button>
          )}

          {/* Transfer Team */}
          {activeOperation === 'transfer' ? (
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-medium">Transfer Team Ownership</h4>
              <div className="space-y-2">
                <Label>New Owner User ID</Label>
                <Input
                  placeholder="Enter user ID of new owner"
                  value={transferUserId}
                  onChange={(e) => setTransferUserId(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => transferTeamMutation.mutate()}
                  disabled={!transferUserId.trim() || transferTeamMutation.isPending}
                >
                  {transferTeamMutation.isPending ? 'Transferring...' : 'Transfer Ownership'}
                </Button>
                <Button variant="outline" onClick={() => setActiveOperation(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setActiveOperation('transfer')}
              className="w-full justify-start"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Transfer Ownership
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Lifecycle History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Lifecycle History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lifecycleEvents.length === 0 ? (
            <p className="text-muted-foreground">No lifecycle events recorded.</p>
          ) : (
            <div className="space-y-4">
              {lifecycleEvents.map((event) => (
                <div key={event.id} className="border-l-2 border-primary pl-4 pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{event.event_type.replace('_', ' ')}</h4>
                    <span className="text-sm text-muted-foreground">
                      {new Date(event.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {JSON.stringify(event.event_data, null, 2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
