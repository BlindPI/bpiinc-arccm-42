
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, MoreVertical, UserMinus, Settings } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { simplifiedTeamService } from '@/services/team/simplifiedTeamService';
import { toast } from 'sonner';
import type { SimpleTeamMember } from '@/types/simplified-team-management';

interface SimplifiedMemberTableProps {
  teamId: string;
  members: SimpleTeamMember[];
  onMemberUpdated: () => void;
}

export function SimplifiedMemberTable({ 
  teamId, 
  members, 
  onMemberUpdated 
}: SimplifiedMemberTableProps) {
  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, newRole }: { memberId: string; newRole: 'MEMBER' | 'ADMIN' }) =>
      simplifiedTeamService.updateMemberRole(memberId, newRole),
    onSuccess: () => {
      toast.success('Member role updated successfully');
      onMemberUpdated();
    },
    onError: (error) => {
      toast.error(`Failed to update role: ${error.message}`);
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => simplifiedTeamService.removeMember(memberId),
    onSuccess: () => {
      toast.success('Member removed successfully');
      onMemberUpdated();
    },
    onError: (error) => {
      toast.error(`Failed to remove member: ${error.message}`);
    }
  });

  const handleRoleChange = (memberId: string, newRole: 'MEMBER' | 'ADMIN') => {
    updateRoleMutation.mutate({ memberId, newRole });
  };

  const handleRemoveMember = (memberId: string) => {
    if (confirm('Are you sure you want to remove this member from the team?')) {
      removeMemberMutation.mutate(memberId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members ({members.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length > 0 ? (
          <div className="space-y-4">
            {members.map((member) => {
              const initials = member.display_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

              return (
                <div key={member.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-medium">{member.display_name}</h4>
                          {member.profile?.role && (
                            <Badge variant="secondary" className="text-xs">
                              System: {member.profile.role}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          {member.profile?.email && (
                            <span>{member.profile.email}</span>
                          )}
                          {member.assignment_start_date && (
                            <span>Joined: {new Date(member.assignment_start_date).toLocaleDateString()}</span>
                          )}
                          {member.team_position && (
                            <span>Position: {member.team_position}</span>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground">
                          <span>Permissions: </span>
                          {member.permissions.can_manage_members && <span className="mr-2">Manage Members</span>}
                          {member.permissions.can_edit_settings && <span className="mr-2">Edit Settings</span>}
                          {member.permissions.can_view_reports && <span className="mr-2">View Reports</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="min-w-[120px]">
                        <Select 
                          value={member.role} 
                          onValueChange={(value: 'MEMBER' | 'ADMIN') => handleRoleChange(member.id, value)}
                          disabled={updateRoleMutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Member Settings
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-destructive"
                            disabled={removeMemberMutation.isPending}
                          >
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Team Members</h3>
            <p className="text-muted-foreground">
              Add members to this team to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
