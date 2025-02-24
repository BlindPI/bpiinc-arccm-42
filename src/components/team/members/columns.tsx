
import { Button } from "@/components/ui/button";
import { type ColumnDef } from "@tanstack/react-table";
import { RoleSelector } from "./options/Roles";
import { Options } from "./options";

export type TeamMember = {
  id: string;
  user_id: string;
  team_id: string;
  role: "MEMBER" | "ADMIN";
  display_name?: string | null;
};

export const columns: ColumnDef<TeamMember>[] = [
  {
    accessorKey: "display_name",
    header: "Name",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const member = row.original;
      return <RoleSelector selected={member.role.toLowerCase()} />;
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
