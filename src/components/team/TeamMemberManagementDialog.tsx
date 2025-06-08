import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { UserCog } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { TeamMemberWithProfile } from "@/types/team-management";

interface TeamMemberManagementDialogProps {
  teamId: string;
  member?: TeamMemberWithProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamMemberManagementDialog({ teamId, member, open, onOpenChange }: TeamMemberManagementDialogProps) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<"MEMBER" | "ADMIN">(member?.role || "MEMBER");
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    admin: member?.permissions?.admin || false,
    manage_members: member?.permissions?.manage_members || false,
    manage_team: member?.permissions?.manage_team || false,
    view_analytics: member?.permissions?.view_analytics || false,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (!member) {
        // Add new member
        const { data, error } = await supabase
          .from("team_members")
          .insert([
            {
              team_id: teamId,
              user_id: "new-user-id", // Replace with actual user selection
              role: role,
              permissions: permissions,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Update existing member
        const { data, error } = await supabase
          .from("team_members")
          .update({
            role: role,
            permissions: permissions,
          })
          .eq("id", member.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success(`Team member ${member ? 'updated' : 'added'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['enhanced-teams'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error upserting team member:", error);
      toast.error("Failed to save team member");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </DialogTitle>
          <DialogDescription>
            {member ? `Manage ${member.profiles?.display_name || 'team member'}'s role and permissions` : 'Add a new member to the team'}
          </DialogDescription>
        </DialogHeader>

        
        <div className="space-y-6">
          {member && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Member Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Display Name</Label>
                    <p className="text-sm font-medium">{member.profiles?.display_name || 'Not available'}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground">{member.profiles?.email || 'Not available'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          
          <Card>
            <CardHeader>
              <CardTitle>Role & Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Team Role</Label>
                <div className="flex gap-4">
                  <Button
                    variant={role === "MEMBER" ? "default" : "outline"}
                    onClick={() => setRole("MEMBER")}
                  >
                    Member
                  </Button>
                  <Button
                    variant={role === "ADMIN" ? "default" : "outline"}
                    onClick={() => setRole("ADMIN")}
                  >
                    Admin
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="admin-switch">Admin</Label>
                    <Switch
                      id="admin-switch"
                      checked={permissions.admin}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, admin: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-members-switch">Manage Members</Label>
                    <Switch
                      id="manage-members-switch"
                      checked={permissions.manage_members}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, manage_members: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="manage-team-switch">Manage Team</Label>
                    <Switch
                      id="manage-team-switch"
                      checked={permissions.manage_team}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, manage_team: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="view-analytics-switch">View Analytics</Label>
                    <Switch
                      id="view-analytics-switch"
                      checked={permissions.view_analytics}
                      onCheckedChange={(checked) =>
                        setPermissions({ ...permissions, view_analytics: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => upsertMutation.mutate()} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
