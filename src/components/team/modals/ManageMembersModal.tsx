
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from '@/integrations/supabase/client';
import { RealTeamService, type RealTeam, type RealTeamMember } from '@/services/team/realTeamService';
import { Search, UserPlus, Trash2, Shield, User } from 'lucide-react';
import { toast } from 'sonner';

interface ManageMembersModalProps {
  team: RealTeam;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageMembersModal({ team, open, onOpenChange }: ManageMembersModalProps) {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');

  // Fetch current team members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', team.id],
    queryFn: () => RealTeamService.getTeamMembers(team.id),
    enabled: open
  });

  // Search for users to add
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['user-search', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .ilike('email', `%${searchEmail}%`)
        .limit(10);
      
      if (error) throw error;
      
      // Filter out users who are already members
      const memberIds = members.map(m => m.user_id);
      return (data || []).filter(user => !memberIds.includes(user.id));
    },
    enabled: searchEmail.length >= 3
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'ADMIN' | 'MEMBER' }) => {
      return RealTeamService.addTeamMember(team.id, userId, role);
    },
    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      setSearchEmail('');
    },
    onError: (error: any) => {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      return RealTeamService.removeTeamMember(team.id, userId);
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
    },
    onError: (error: any) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'ADMIN' | 'MEMBER' }) => {
      return RealTeamService.updateTeamMemberRole(team.id, userId, newRole);
    },
    onSuccess: () => {
      toast.success('Member role updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
    },
    onError: (error: any) => {
      console.error('Error updating role:', error);
      toast.error('Failed to update member role');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Team Members - {team.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add Members Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Add New Members</h3>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="search-email">Search by email</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search-email"
                    type="email"
                    placeholder="Type email to search users..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div>
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={(value: 'ADMIN' | 'MEMBER') => setSelectedRole(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Search Results */}
            {searchLoading && (
              <div className="text-sm text-muted-foreground">Searching...</div>
            )}
            
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Search Results</Label>
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <Badge variant="outline" className="text-xs">{user.role}</Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addMemberMutation.mutate({ userId: user.id, role: selectedRole })}
                      disabled={addMemberMutation.isPending}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add as {selectedRole}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchEmail.length >= 3 && searchResults.length === 0 && !searchLoading && (
              <div className="text-sm text-muted-foreground">No users found matching "{searchEmail}"</div>
            )}
          </div>

          <Separator />

          {/* Current Members Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Current Members ({members.length})</h3>
            
            {membersLoading ? (
              <div className="text-sm text-muted-foreground">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="text-sm text-muted-foreground">No members in this team yet.</div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{member.profiles?.display_name || 'Unknown User'}</div>
                      <div className="text-sm text-muted-foreground">{member.profiles?.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {member.role === 'ADMIN' ? (
                            <><Shield className="h-3 w-3 mr-1" />Admin</>
                          ) : (
                            <><User className="h-3 w-3 mr-1" />Member</>
                          )}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {member.profiles?.role}
                        </Badge>
                        <Badge variant={member.status === 'active' ? 'default' : 'outline'} className="text-xs">
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(newRole: 'ADMIN' | 'MEMBER') => 
                          updateRoleMutation.mutate({ userId: member.user_id, newRole })
                        }
                        disabled={updateRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.user_id)}
                        disabled={removeMemberMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
