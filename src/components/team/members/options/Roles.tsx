
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { TeamMemberWithProfile } from "@/services/team/types";

interface RoleSelectorProps {
  selected: "ADMIN" | "MEMBER";
  member: TeamMemberWithProfile;
}

export function RoleSelector({ selected, member }: RoleSelectorProps) {
  const queryClient = useQueryClient();

  const handleRoleChange = async (newRole: "ADMIN" | "MEMBER") => {
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ role: newRole })
        .eq("id", member.id);

      if (error) throw error;

      toast.success(`Role updated to ${newRole}`);
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  return (
    <Select value={selected} onValueChange={handleRoleChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="MEMBER">Member</SelectItem>
        <SelectItem value="ADMIN">Admin</SelectItem>
      </SelectContent>
    </Select>
  );
}
