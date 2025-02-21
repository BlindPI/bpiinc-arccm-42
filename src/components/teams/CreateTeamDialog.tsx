
import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState("");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createTeam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('team_groups')
        .insert({
          name,
          group_type: groupType,
          leader_id: user!.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setOpen(false);
      setName("");
      setGroupType("");
      toast.success("Team created successfully");
    },
    onError: (error) => {
      toast.error("Failed to create team");
      console.error("Error:", error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTeam.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupType">Group Type</Label>
            <Input
              id="groupType"
              value={groupType}
              onChange={(e) => setGroupType(e.target.value)}
              placeholder="Enter group type"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={createTeam.isPending}>
            {createTeam.isPending ? (
              <>Creating...</>
            ) : (
              <>Create Team</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
