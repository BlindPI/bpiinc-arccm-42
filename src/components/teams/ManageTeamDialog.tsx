
import { useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Profile } from "@/types/user-management";

interface ManageTeamDialogProps {
  team: {
    id: string;
    name: string;
    group_type: string;
  };
}

interface TeamMember {
  id: string;
  member_id: string;
  profiles: Pick<Profile, 'id' | 'role'>;
  email: string;
}

export function ManageTeamDialog({ team }: ManageTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: members, isLoading } = useQuery<TeamMember[]>({
    queryKey: ['team-members', team.id],
    queryFn: async () => {
      console.log('Fetching team members for team:', team.id);
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select(`
          id,
          member_id,
          profiles:member_id (
            id,
            role
          )
        `)
        .eq('team_id', team.id);

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }

      // Fetch email addresses for members
      const memberIds = teamMembers.map(member => member.member_id);
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) {
        console.error('Error fetching user emails:', usersError);
        throw usersError;
      }

      // Combine team member data with user emails
      const membersWithEmail = teamMembers.map(member => ({
        ...member,
        email: users.users.find(user => user.id === member.member_id)?.email || 'Unknown'
      }));

      console.log('Team members fetched:', membersWithEmail);
      return membersWithEmail;
    },
    enabled: open,
  });

  // Add new member mutation
  const addMember = useMutation({
    mutationFn: async (email: string) => {
      // First, find the user by email
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;

      const user = users.users.find(u => u.email === email);
      if (!user) throw new Error('User not found');

      // Then add them to the team
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          member_id: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
      setNewMemberEmail('');
      toast.success('Team member added successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add team member');
    },
  });

  // Remove member mutation
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', team.id)
        .eq('member_id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', team.id] });
      toast.success('Team member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove team member');
    },
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberEmail) {
      addMember.mutate(newMemberEmail);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Team: {team.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add new member form */}
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Add Member</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="member@example.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
                <Button type="submit" disabled={addMember.isPending}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </form>

          {/* Team members list */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : members && members.length > 0 ? (
                  members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.profiles?.role}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMember.mutate(member.member_id)}
                          disabled={removeMember.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No team members yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
