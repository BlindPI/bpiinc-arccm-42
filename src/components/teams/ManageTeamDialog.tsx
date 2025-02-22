
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ManageTeamDialogProps } from "./types";
import { useTeamMembers } from "./hooks/useTeamMembers";
import { TeamMembersTable } from "./TeamMembersTable";

export function ManageTeamDialog({ team }: ManageTeamDialogProps) {
  const [open, setOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const { members, isLoading, addMember, removeMember } = useTeamMembers(team.id, open);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemberEmail) {
      addMember.mutate(newMemberEmail);
      setNewMemberEmail('');
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

          <TeamMembersTable
            members={members}
            isLoading={isLoading}
            removeMember={removeMember}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
