
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TeamMemberWithProfile } from "@/types/team-management";

interface RemoveProps {
  member: TeamMemberWithProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Remove({ member, open, onOpenChange }: RemoveProps) {
  const queryClient = useQueryClient();

  const removeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", member.id);

      if (error) throw error;
    },
    onSuccess: () => {
      const memberName = member.display_name || member.profile?.display_name || 'Member';
      toast.success(`${memberName} removed from team`);
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error removing member:", error);
      toast.error("Failed to remove team member");
    }
  });

  const memberName = member.display_name || member.profile?.display_name || 'this member';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {memberName} from the team? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => removeMutation.mutate()}
            disabled={removeMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {removeMutation.isPending ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
