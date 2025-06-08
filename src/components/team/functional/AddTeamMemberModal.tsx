
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, Search } from 'lucide-react';
import { realTeamDataService } from '@/services/team/realTeamDataService';
import { toast } from 'sonner';

interface AddTeamMemberModalProps {
  teamId: string;
  onClose: () => void;
}

interface AvailableUser {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

export function AddTeamMemberModal({ teamId, onClose }: AddTeamMemberModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: availableUsers = [], isLoading } = useQuery({
    queryKey: ['available-users', teamId],
    queryFn: async () => {
      // Get current team members to exclude them
      const { data: currentMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      const excludeIds = currentMembers?.map(m => m.user_id) || [];

      // Get all users not in this team
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('display_name');

      if (error) throw error;
      return users as AvailableUser[];
    }
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'MEMBER' | 'ADMIN' }) => {
      await realTeamDataService.addTeamMember(teamId, userId, role);
    },
    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['user-teams'] });
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to add member');
      console.error('Add member error:', error);
    }
  });

  const filteredUsers = availableUsers.filter(user =>
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId && selectedRole) {
      addMemberMutation.mutate({ userId: selectedUserId, role: selectedRole });
    }
  };

  const selectedUser = availableUsers.find(user => user.id === selectedUserId);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Team Member
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Users</Label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* User Selection */}
          <div className="space-y-2">
            <Label>Select User</Label>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {searchTerm ? 'No users found matching your search' : 'No available users to add'}
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                      selectedUserId === user.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {user.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{user.display_name}</div>
                        <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                        <div className="text-xs text-muted-foreground">{user.role}</div>
                      </div>
                      {selectedUserId === user.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role Selection */}
          {selectedUser && (
            <div className="space-y-2">
              <Label htmlFor="role">Team Role</Label>
              <Select value={selectedRole} onValueChange={(value: 'MEMBER' | 'ADMIN') => setSelectedRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected User Preview */}
          {selectedUser && (
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium">Adding:</div>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {selectedUser.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{selectedUser.display_name}</span>
                <span className="text-xs text-muted-foreground">as {selectedRole}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedUserId || addMemberMutation.isPending}
            >
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
