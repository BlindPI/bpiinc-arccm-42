
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Remove } from "./Remove";
import type { TeamMemberWithProfile } from "@/services/team/types";

interface OptionsProps {
  member: TeamMemberWithProfile;
}

export function Options({ member }: OptionsProps) {
  const [showRemoveDialog, setShowRemoveDialog] = React.useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setShowRemoveDialog(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove from team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Remove
        member={member}
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
      />
    </>
  );
}
