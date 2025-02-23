
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/hooks/useProfile";
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

interface TeamFormData {
  name: string;
  groupType: GroupType;
}

const initialFormData: TeamFormData = {
  name: "",
  groupType: "SA_TEAM"
};

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<TeamFormData>(initialFormData);
  const { data: currentUserProfile } = useProfile();
  const queryClient = useQueryClient();

  const createTeam = useMutation({
    mutationFn: async () => {
      if (!currentUserProfile?.id) {
        throw new Error("User profile not found");
      }

      const { data, error } = await supabase
        .from('team_groups')
        .insert({
          name: formData.name,
          group_type: formData.groupType,
          leader_id: currentUserProfile.id
        })
        .select('*, leader:profiles!team_groups_leader_id_fkey(id, role)')
        .single();

      if (error) {
        console.error('Error creating team:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Team created successfully", {
        description: "You can now add members to your team",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast.error("Failed to create team", {
        description: error.message || "Please verify your permissions and try again."
      });
      console.error("Error creating team:", error);
    },
  });

  const handleClose = () => {
    setOpen(false);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTeam.mutate();
  };

  const canCreateTeam = currentUserProfile?.role && ['SA', 'AD'].includes(currentUserProfile.role);
  const isValid = formData.name.trim() !== "" && formData.groupType !== undefined;

  if (!canCreateTeam) {
    return null;
  }

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
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter team name"
                className="w-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupType">Team Type</Label>
              <Select
                value={formData.groupType}
                onValueChange={(value: GroupType) => 
                  setFormData({ ...formData, groupType: value })
                }
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
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createTeam.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createTeam.isPending}
            >
              {createTeam.isPending ? "Creating Team..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
