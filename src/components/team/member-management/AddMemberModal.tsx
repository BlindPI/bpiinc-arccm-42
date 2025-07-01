
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamMemberService } from '@/services/team/teamMemberService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, X, Search } from 'lucide-react';

interface AddMemberModalProps {
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMemberModal({ teamId, onClose, onSuccess }: AddMemberModalProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .or(`display_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const addMemberMutation = useMutation({
    mutationFn: () => teamMemberService.addTeamMember(teamId, selectedUser, selectedRole),
    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add member');
    }
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    searchUsers(value);
  };

  const handleAddMember = () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }
    addMemberMutation.mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Team Member
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Search */}
          <div className="space-y-2">
            <Label htmlFor="user-search">Search Users</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="user-search"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-8"
              />
              {isSearching && (
                <div className="absolute right-2 top-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className={`p-2 rounded cursor-pointer hover:bg-muted ${
                    selectedUser === user.id ? 'bg-primary/10 border border-primary' : ''
                  }`}
                  onClick={() => setSelectedUser(user.id)}
                >
                  <div className="font-medium">{user.display_name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                </div>
              ))}
            </div>
          )}

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="member-role">Role</Label>
            <Select value={selectedRole} onValueChange={(value: 'ADMIN' | 'MEMBER') => setSelectedRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Team Member</SelectItem>
                <SelectItem value="ADMIN">Team Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-4">
            <Button
              onClick={handleAddMember}
              disabled={!selectedUser || addMemberMutation.isPending}
              className="flex-1"
            >
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
