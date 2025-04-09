
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Options } from "./options";
import { RoleSelector } from "./options/Roles";
import type { TeamMember } from "@/types/user-management";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const columns: ColumnDef<TeamMember>[] = [
  {
    accessorKey: "profile",
    header: "Member",
    cell: ({ row }) => {
      const member = row.original;
      const displayName = member.display_name || member.user_id;
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
      return <RoleSelector selected={member.role as "MEMBER" | "ADMIN"} member={member} />;
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
