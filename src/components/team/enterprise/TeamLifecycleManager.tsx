
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Archive, UserPlus, Settings, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enterpriseTeamService } from '@/services/team/enterpriseTeamService';
import { teamManagementService } from '@/services/team/teamManagementService';
import { toast } from 'sonner';
import type { EnhancedTeam } from '@/types/team-management';

interface TeamLifecycleManagerProps {
  team: EnhancedTeam;
  canManage: boolean;
}

export function TeamLifecycleManager({ team, canManage }: TeamLifecycleManagerProps) {
  const queryClient = useQueryClient();
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const archiveTeamMutation = useMutation({
    mutationFn: async ({ reason }: { reason?: string }) => {
      const result = await enterpriseTeamService.archiveTeam(team.id, 'current-user', reason);
      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Team archived successfully');
        queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
        setShowArchiveConfirm(false);
      } else {
        toast.error(result.message || 'Failed to archive team');
      }
    },
    onError: (error) => {
      toast.error('Failed to archive team');
      console.error('Archive error:', error);
    }
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: async ({ newOwnerId, reason }: { newOwnerId: string; reason?: string }) => {
      return enterpriseTeamService.transferTeamOwnership(team.id, newOwnerId, 'current-user', reason);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Ownership transferred successfully');
        queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      } else {
        toast.error(result.message || 'Failed to transfer ownership');
      }
    }
  });

  const handleArchiveTeam = () => {
    archiveTeamMutation.mutate({ reason: 'Administrative decision' });
  };

  const handleTransferOwnership = () => {
    // In a real implementation, this would open a modal to select new owner
    const newOwnerId = 'placeholder-user-id';
    transferOwnershipMutation.mutate({ 
      newOwnerId, 
      reason: 'Leadership transition' 
    });
  };

  if (!canManage) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Team Lifecycle Management</h3>
          <p className="text-muted-foreground">
            You don't have permission to manage this team's lifecycle
          </p>
        </CardContent>
      </Card>
    );
  }

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
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">{team.name}</h3>
              <p className="text-sm text-muted-foreground">
                Created {new Date(team.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
              {team.status}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-2">Team Members</h4>
              <p className="text-2xl font-bold">{team.members?.length || 0}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Performance Score</h4>
              <p className="text-2xl font-bold">{team.performance_score || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Archive Team */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Archive className="h-5 w-5 text-orange-500" />
              <div>
                <h4 className="font-medium">Archive Team</h4>
                <p className="text-sm text-muted-foreground">
                  Deactivate team while preserving historical data
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowArchiveConfirm(true)}
              disabled={archiveTeamMutation.isPending}
            >
              Archive
            </Button>
          </div>

          {/* Transfer Ownership */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-blue-500" />
              <div>
                <h4 className="font-medium">Transfer Ownership</h4>
                <p className="text-sm text-muted-foreground">
                  Transfer team ownership to another user
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleTransferOwnership}
              disabled={transferOwnershipMutation.isPending}
            >
              Transfer
            </Button>
          </div>

          {/* Delete Team (Danger Zone) */}
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-red-500" />
              <div>
                <h4 className="font-medium text-red-900">Delete Team</h4>
                <p className="text-sm text-red-700">
                  Permanently delete team and all associated data
                </p>
              </div>
            </div>
            <Button variant="destructive" disabled>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Archive Confirmation */}
      {showArchiveConfirm && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h3 className="font-medium text-orange-900">Confirm Team Archive</h3>
            </div>
            <p className="text-sm text-orange-800 mb-4">
              Are you sure you want to archive "{team.name}"? This will deactivate the team 
              but preserve all historical data. This action can be reversed.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleArchiveTeam}
                disabled={archiveTeamMutation.isPending}
              >
                {archiveTeamMutation.isPending ? 'Archiving...' : 'Confirm Archive'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowArchiveConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
