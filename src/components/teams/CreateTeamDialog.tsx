
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
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const GROUP_TYPES = ['SA_TEAM', 'AD_TEAM', 'AP_GROUP', 'INSTRUCTOR_GROUP'] as const;
type GroupType = typeof GROUP_TYPES[number];
type Step = 'details' | 'review' | 'success';

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState<GroupType>("SA_TEAM");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createTeam = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('team_groups')
        .insert({
          name,
          group_type: groupType,
          leader_id: user!.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setStep('success');
      toast.success("Team created successfully", {
        description: "You can now start adding members and configuring team settings."
      });
    },
    onError: (error: any) => {
      toast.error("Unable to create team", {
        description: "Please verify your permissions and try again."
      });
      console.error("Error:", error);
    },
  });

  const handleClose = () => {
    setOpen(false);
    setStep('details');
    setName("");
    setGroupType("SA_TEAM");
  };

  const renderStepContent = () => {
    switch (step) {
      case 'details':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter a descriptive team name"
                  className="w-full"
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
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <span className="font-medium">Team Name:</span> {name}
              </div>
              <div>
                <span className="font-medium">Team Type:</span> {groupType.replace('_', ' ')}
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4 text-green-700">
              <h4 className="font-semibold">Team Created Successfully!</h4>
              <p className="text-sm mt-2">
                Your team "{name}" has been created. You can now:
              </p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Add team members</li>
                <li>Configure team settings</li>
                <li>Set up team hierarchies</li>
              </ul>
            </div>
          </div>
        );
    }
  };

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
          <DialogTitle>
            {step === 'success' ? 'Team Created' : 'Create New Team'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' && "Configure your new team's basic information."}
            {step === 'review' && "Review your team configuration before creating."}
            {step === 'success' && "Your team has been created successfully."}
          </DialogDescription>
        </DialogHeader>

        {renderStepContent()}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'details' && (
            <Button
              type="button"
              onClick={() => setStep('review')}
              disabled={!name || !groupType}
            >
              Review Team
            </Button>
          )}
          {step === 'review' && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('details')}
              >
                Back to Details
              </Button>
              <Button
                type="button"
                onClick={() => createTeam.mutate()}
                disabled={createTeam.isPending}
              >
                {createTeam.isPending ? "Creating Team..." : "Create Team"}
              </Button>
            </>
          )}
          {step === 'success' && (
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
