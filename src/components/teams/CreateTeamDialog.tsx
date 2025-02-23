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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GROUP_TYPES = ['SA_TEAM', 'AD_TEAM', 'AP_GROUP', 'INSTRUCTOR_GROUP'] as const;
type GroupType = typeof GROUP_TYPES[number];

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState<GroupType>("SA_TEAM");
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
      setGroupType("SA_TEAM");
      toast.success("Team created successfully. You can now add members and configure team settings.");
    },
    onError: (error: any) => {
      toast.error("Unable to create team. Please verify your permissions and try again.");
      console.error("Error:", error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Create New Team
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Configure a new team for your organization. Teams help organize members and manage permissions efficiently.
          </DialogDescription>
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
              placeholder="Enter a descriptive team name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupType">Team Type</Label>
            <Select
              value={groupType}
              onValueChange={(value: GroupType) => setGroupType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent>
                {GROUP_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={createTeam.isPending}>
            {createTeam.isPending ? (
              <>Creating Team...</>
            ) : (
              <>Create Team</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
