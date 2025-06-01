
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, Crown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { simplifiedTeamService } from '@/services/team/simplifiedTeamService';
import { SimplifiedMemberTable } from './SimplifiedMemberTable';
import type { SimpleTeam } from '@/types/simplified-team-management';

interface SimplifiedTeamMemberDialogProps {
  team: SimpleTeam;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamUpdated?: () => void;
}

export function SimplifiedTeamMemberDialog({ 
  team, 
  open, 
  onOpenChange, 
  onTeamUpdated 
}: SimplifiedTeamMemberDialogProps) {
  const [activeTab, setActiveTab] = useState('members');
  const [searchEmail, setSearchEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const queryClient = useQueryClient();

  // Get available users who aren't team members
  const { data: availableUsers = [] } = useQuery({
    queryKey: ['available-users', team.id],
    queryFn: async () => {
      const existingMemberIds = team.members?.map(m => m.user_id) || [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .not('id', 'in', existingMemberIds.length > 0 ? `(${existingMemberIds.join(',')})` : '()')
        .order('display_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'MEMBER' | 'ADMIN' }) => {
      await simplifiedTeamService.addTeamMember(team.id, userId, role);
    },
    onSuccess: () => {
      toast.success('Member added successfully');
      queryClient.invalidateQueries({ queryKey: ['simplified-teams'] });
      onTeamUpdated?.();
      setSearchEmail('');
    },
    onError: (error) => {
      toast.error(`Failed to add member: ${error.message}`);
    }
  });

  const handleAddMember = () => {
    const user = availableUsers.find(u => u.email === searchEmail);
    if (!user) {
      toast.error('User not found');
      return;
    }
    
    addMemberMutation.mutate({ userId: user.id, role: newMemberRole });
  };

  const filteredUsers = availableUsers.filter(user =>
    user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    user.display_name.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Team: {team.name}
            <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
              {team.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Member Management
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Members
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Team Administration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="flex-1 overflow-hidden">
            <SimplifiedMemberTable 
              teamId={team.id} 
              members={team.members || []}
              onMemberUpdated={() => {
                queryClient.invalidateQueries({ queryKey: ['simplified-teams'] });
                onTeamUpdated?.();
              }}
            />
          </TabsContent>

          <TabsContent value="add" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Add New Team Members</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search by Email or Name</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team Role</label>
                  <Select value={newMemberRole} onValueChange={(value: 'MEMBER' | 'ADMIN') => setNewMemberRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">&nbsp;</label>
                  <Button 
                    onClick={handleAddMember} 
                    disabled={!searchEmail || addMemberMutation.isPending}
                    className="w-full"
                  >
                    {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                  </Button>
                </div>
              </div>

              {searchEmail && (
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  <h4 className="font-medium mb-3">Available Users</h4>
                  {filteredUsers.length > 0 ? (
                    <div className="space-y-2">
                      {filteredUsers.slice(0, 10).map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                          <div>
                            <p className="font-medium">{user.display_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <Badge variant="outline" className="text-xs">{user.role}</Badge>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSearchEmail(user.email);
                              handleAddMember();
                            }}
                            disabled={addMemberMutation.isPending}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No users found matching your search.</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Team Administration</h3>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Team Role Management</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Team roles are independent of system roles. Any user can be assigned MEMBER or ADMIN role within the team.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge>ADMIN</Badge>
                    <span className="text-sm">Can manage members, edit settings, and view reports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">MEMBER</Badge>
                    <span className="text-sm">Can view reports only</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
