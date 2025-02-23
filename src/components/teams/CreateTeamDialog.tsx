
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
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createTeam = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('team_groups')
        .insert({
          name: formData.name,
          group_type: formData.groupType,
          leader_id: user!.id
        })
        .select('*, leader:profiles!team_groups_leader_id_fkey(role)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success("Team created successfully", {
        description: "Configure your team settings and start adding members.",
        action: {
          label: "Manage Team",
          onClick: () => {
            // This will be handled by the TeamList component's ManageTeamDialog
            console.log("Opening manage team dialog for:", data.id);
          }
        }
      });
      handleClose();
    },
    onError: (error: any) => {
      toast.error("Unable to create team", {
        description: error.message || "Please verify your permissions and try again."
      });
      console.error("Error:", error);
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

  const isValid = formData.name.trim() !== "" && formData.groupType !== undefined;

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
                placeholder="Enter a descriptive team name"
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
