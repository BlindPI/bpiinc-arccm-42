
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Search, Mail, Check, X } from 'lucide-react';

interface MemberInvitationModalProps {
  teamId: string;
  teamName: string;
  onClose: () => void;
  onMembersAdded: () => void;
}

interface UserSearchResult {
  id: string;
  display_name: string;
  email: string;
  role: string;
  isAlreadyMember: boolean;
}

export function MemberInvitationModal({ teamId, teamName, onClose, onMembersAdded }: MemberInvitationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [defaultRole, setDefaultRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [invitationMessage, setInvitationMessage] = useState('');

  // Search for users
  const { data: searchResults = [], isLoading: searchLoading } = useQuery({
    queryKey: ['user-search', searchQuery, teamId],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];

      // Search users by name or email
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .or(`display_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) throw error;

      // Check which users are already team members
      const { data: existingMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .in('user_id', users?.map(u => u.id) || []);

      const existingMemberIds = new Set(existingMembers?.map(m => m.user_id) || []);

      return (users || []).map(user => ({
        ...user,
        isAlreadyMember: existingMemberIds.has(user.id)
      })) as UserSearchResult[];
    },
    enabled: searchQuery.length >= 2
  });

  // Add members mutation
  const addMembersMutation = useMutation({
    mutationFn: async () => {
      if (selectedUsers.length === 0) {
        throw new Error('No users selected');
      }

      const membersToAdd = selectedUsers.map(userId => ({
        team_id: teamId,
        user_id: userId,
        role: defaultRole,
        status: 'active',
        permissions: {},
        joined_at: new Date().toISOString()
      }));

      const { data, error } = await supabase
        .from('team_members')
        .insert(membersToAdd)
        .select();

      if (error) throw error;

      // TODO: Send invitation emails if needed
      // This would typically involve calling an edge function or email service

      return data;
    },
    onSuccess: (data) => {
      toast.success(`Successfully added ${data.length} member(s) to ${teamName}`);
      onMembersAdded();
    },
    onError: (error: any) => {
      toast.error('Failed to add members: ' + error.message);
    }
  });

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = () => {
    addMembersMutation.mutate();
  };

  const availableUsers = searchResults.filter(user => !user.isAlreadyMember);
  const selectedUserDetails = searchResults.filter(user => selectedUsers.includes(user.id));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Members to {teamName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Search */}
          <div>
            <Label>Search Users</Label>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery.length >= 2 && (
            <div>
              <Label>Search Results</Label>
              <div className="mt-2 max-h-60 overflow-y-auto border rounded-md">
                {searchLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Searching...
                  </div>
                ) : availableUsers.length > 0 ? (
                  <div className="divide-y">
                    {availableUsers.map((user) => (
                      <div 
                        key={user.id}
                        className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedUsers.includes(user.id) ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleUserToggle(user.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user.display_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.display_name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{user.role}</Badge>
                            {selectedUsers.includes(user.id) ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <div className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length > 0 && availableUsers.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    All found users are already team members
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    No users found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div>
              <Label>Selected Members ({selectedUsers.length})</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedUserDetails.map((user) => (
                  <Badge 
                    key={user.id} 
                    variant="secondary" 
                    className="flex items-center gap-2 px-3 py-1"
                  >
                    {user.display_name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleUserToggle(user.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Default Role */}
          <div>
            <Label>Default Role for New Members</Label>
            <Select value={defaultRole} onValueChange={(value: 'MEMBER' | 'ADMIN') => setDefaultRole(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invitation Message */}
          <div>
            <Label>Invitation Message (Optional)</Label>
            <Textarea
              value={invitationMessage}
              onChange={(e) => setInvitationMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <Button 
              onClick={handleSubmit}
              disabled={selectedUsers.length === 0 || addMembersMutation.isPending}
            >
              {addMembersMutation.isPending 
                ? 'Adding Members...' 
                : `Add ${selectedUsers.length} Member${selectedUsers.length !== 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
