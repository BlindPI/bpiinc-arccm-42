
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Settings, Download } from 'lucide-react';
import { RealMemberTable } from '@/components/team/functional/RealMemberTable';
import { BulkMemberOperations } from '@/components/team/bulk/BulkMemberOperations';
import { teamMemberService } from '@/services/team/teamMemberService';
import { enhancedTeamManagementService } from '@/services/team/enhancedTeamManagementService';
import { toast } from 'sonner';

interface EnhancedMemberManagementProps {
  teamId: string;
  userRole?: string;
}

export function EnhancedMemberManagement({ teamId, userRole }: EnhancedMemberManagementProps) {
  const queryClient = useQueryClient();
  const [showBulkOperations, setShowBulkOperations] = useState(false);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => teamMemberService.getTeamMembers(teamId)
  });

  const { data: membershipStats } = useQuery({
    queryKey: ['membership-stats', teamId],
    queryFn: () => enhancedTeamManagementService.getMembershipStatistics(teamId)
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'ADMIN' | 'MEMBER' }) =>
      teamMemberService.addTeamMember(teamId, userId, role),
    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: () => {
      toast.error('Failed to add member');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      teamMemberService.removeTeamMember(teamId, userId),
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: () => {
      toast.error('Failed to remove member');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: 'ADMIN' | 'MEMBER' }) =>
      teamMemberService.updateMemberRole(teamId, userId, newRole),
    onSuccess: () => {
      toast.success('Member role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    },
    onError: () => {
      toast.error('Failed to update member role');
    }
  });

  const canManageMembers = ['SA', 'AD'].includes(userRole || '');

  const handleOperationComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
    queryClient.invalidateQueries({ queryKey: ['membership-stats', teamId] });
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
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-muted-foreground">Manage team membership and roles</p>
        </div>
        <div className="flex items-center gap-2">
          {membershipStats && (
            <>
              <Badge variant="outline">{membershipStats.totalMembers} Total</Badge>
              <Badge variant="default">{membershipStats.activeMembers} Active</Badge>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {canManageMembers && (
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowBulkOperations(!showBulkOperations)}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            Bulk Operations
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Members
          </Button>
        </div>
      )}

      {/* Bulk Operations Panel */}
      {showBulkOperations && canManageMembers && (
        <BulkMemberOperations 
          teamId={teamId}
          members={members}
          onOperationComplete={handleOperationComplete}
          onClose={() => setShowBulkOperations(false)}
        />
      )}

      {/* Members Table */}
      <RealMemberTable teamId={teamId} userRole={userRole} />
    </div>
  );
}
