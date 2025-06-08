import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  Mail,
  Phone,
  Settings,
  MoreVertical,
  UserPlus,
  Crown,
  Shield,
  Copy,
  Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MemberInvitationModal } from './MemberInvitationModal';
import { ChangeRoleDialog } from '@/components/user-management/dialogs/ChangeRoleDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { EnhancedTeam, TeamMemberWithProfile } from '@/types/team-management';

interface TeamMemberManagementProps {
  team: EnhancedTeam;
  onTeamUpdated?: () => void;
}

export function TeamMemberManagement({ team, onTeamUpdated }: TeamMemberManagementProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', team.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(
            id,
            display_name,
            email,
            role
          )
        `)
        .eq('team_id', team.id);

      if (error) throw error;

      return (data || []).map(member => ({
        ...member,
        display_name: member.profiles?.display_name || 'Unknown User',
        profile: member.profiles
      })) as TeamMemberWithProfile[];
    },
    enabled: !!team.id
  });

  const handleRoleChange = (role: string) => {
    setNewRole(role);
  };

  const handleChangeRoleConfirm = async () => {
    if (!selectedMemberId || !newRole) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', selectedMemberId);

      if (error) throw error;

      toast.success('Team member role updated successfully');
      setIsChangeRoleDialogOpen(false);
      onTeamUpdated?.();
      queryClient.invalidateQueries(['team-members', team.id]);
    } catch (error: any) {
      toast.error(`Failed to update role: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveMemberConfirm = async () => {
    if (!selectedMemberId) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', selectedMemberId);

      if (error) throw error;

      toast.success('Team member removed successfully');
      setIsRemoveMemberDialogOpen(false);
      onTeamUpdated?.();
      queryClient.invalidateQueries(['team-members', team.id]);
    } catch (error: any) {
      toast.error(`Failed to remove member: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'LEAD': return <Shield className="h-4 w-4 text-blue-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Badge className="bg-yellow-100 text-yellow-800">Admin</Badge>;
      case 'LEAD': return <Badge className="bg-blue-100 text-blue-800">Lead</Badge>;
      default: return <Badge variant="secondary">Member</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{team.name}</h2>
          <p className="text-muted-foreground">{team.description}</p>
        </div>
        <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
          {team.status}
        </Badge>
      </div>

      {/* Team Statistics */}
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Team Type</Label>
            <p className="text-sm text-muted-foreground">{team.team_type}</p>
          </div>
          <div>
            <Label>Location</Label>
            <p className="text-sm text-muted-foreground">{team.location?.name || 'N/A'}</p>
          </div>
          <div>
            <Label>Provider</Label>
            <p className="text-sm text-muted-foreground">{team.provider?.name || 'N/A'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Member Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Members ({members.length})</h3>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Invite Members
          </Button>
          <Button variant="outline" onClick={() => setShowBulkActions(!showBulkActions)}>
            <Users className="h-4 w-4 mr-2" />
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Bulk actions are coming soon. You will be able to perform actions such as
              adding multiple members, changing roles, and more.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Member Table */}
      <Card>
        <CardContent>
          {membersLoading ? (
            <div className="text-center py-8">Loading members...</div>
          ) : members.length === 0 ? (
            <div className="text-center py-8">No members in this team.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>
                              {member.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm font-medium text-gray-900">{member.display_name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(member.role)}
                          {getRoleBadge(member.role)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {member.profile?.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {member.profile.email}
                            </div>
                          )}
                          {member.profile?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {member.profile.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              navigator.clipboard.writeText(member.profile?.email || '');
                              toast.success('Email copied to clipboard');
                            }}>
                              <Mail className="h-4 w-4 mr-2" />
                              Copy Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedMemberId(member.id);
                              setNewRole(member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN');
                              setIsChangeRoleDialogOpen(true);
                            }}>
                              <Settings className="h-4 w-4 mr-2" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => {
                              setSelectedMemberId(member.id);
                              setIsRemoveMemberDialogOpen(true);
                            }}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Invitation Modal */}
      {showInviteModal && (
        <MemberInvitationModal
          teamId={team.id}
          teamName={team.name}
          onClose={() => setShowInviteModal(false)}
          onMembersAdded={() => {
            queryClient.invalidateQueries(['enhanced-teams']);
            onTeamUpdated?.();
            setShowInviteModal(false);
          }}
        />
      )}

      {/* Change Role Dialog */}
      <ChangeRoleDialog
        isChangeRoleDialogOpen={isChangeRoleDialogOpen}
        setIsChangeRoleDialogOpen={setIsChangeRoleDialogOpen}
        handleRoleChange={handleRoleChange}
        handleChangeRoleConfirm={handleChangeRoleConfirm}
        isProcessing={isProcessing}
        newRole={newRole}
      />

      {/* Remove Member Dialog */}
      <AlertDialog open={isRemoveMemberDialogOpen} onOpenChange={setIsRemoveMemberDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsRemoveMemberDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMemberConfirm} disabled={isProcessing}>
              {isProcessing ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
