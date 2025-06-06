
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Options } from "./options";
import { RoleSelector } from "./options/Roles";
import type { TeamMemberWithProfile } from "@/services/team/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const columns: ColumnDef<TeamMemberWithProfile>[] = [
  {
    accessorKey: "profile",
    header: "Member",
    cell: ({ row }) => {
      const member = row.original;
      // Use display_name from the member object itself
      const displayName = member.display_name || member.profile?.display_name || 'Unknown';
      
      // Safely handle initials calculation
      const initials = displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{displayName}</span>
            {member.profile?.role && (
              <Badge variant="secondary" className="w-fit">
                {member.profile.role}
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Team Role",
    cell: ({ row }) => {
      const member = row.original;
      return <RoleSelector selected={member.role} member={member} />;
    },
  },
  {
    accessorKey: "created_at",
    header: "Joined",
    cell: ({ row }) => {
      const member = row.original;
      const joinDate = member.assignment_start_date || member.created_at;
      if (!joinDate) return "Unknown";
      
      return new Date(joinDate).toLocaleDateString();
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const member = row.original;
      return <Options member={member} />;
    },
  },
];
